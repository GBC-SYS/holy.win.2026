---
name: project_pin_ownership_migration_review
description: auth.uid() 기반 소유권을 4자리 PIN(pgcrypto crypt) 기반으로 전환한 0005_pin_ownership.sql + entries.js 리뷰 — pin_hash 컬럼이 select('*')로 전체 노출되는 Critical 이슈 발견(1차 BLOCKED, 2026-09-30)
metadata:
  type: project
---

## 배경
"다른 브라우저에서도 내 글을 수정/삭제하고 싶다"는 요청으로, 브라우저별 `auth.uid()` 소유권 판별([[supabase_migration_review_notes]] 참고)을 4자리 숫자 PIN(pgcrypto `crypt`+`gen_salt('bf')` 해시, `pin_hash` 컬럼)으로 교체. `holywin_create_entry`/`holywin_update_entry`/`holywin_update_status`/`holywin_soft_delete_entry(bigint,text)` 4개 `security definer` RPC가 PIN 해시 비교로 인증한다. **0005_pin_ownership.sql은 리뷰 시점에 이미 Supabase 프로덕션에 직접 적용 완료된 상태였다** — 발견된 취약점은 리뷰 시점 기준 이미 라이브였음.

## 1차 리뷰 결과: BLOCKED (2026-09-30)

**Critical — `pin_hash` 컬럼이 `select('*')`로 전체 공개 노출됨.**
- `0001_init.sql`의 `grant select, insert, update on public.holywin_entries to anon, authenticated`(테이블 전체 컬럼 권한)가 0005에서도 손대지 않은 채 유지됨. RLS는 행(row) 단위 필터만 하지 컬럼을 가리지 못한다.
- `entries.js`의 `loadEntries()`가 `.from('holywin_entries').select('*')`로 리스트를 불러오므로, 방문자 전원이 모든 글의 `pin_hash`(bcrypt 해시)를 네트워크 응답으로 그대로 받는다. PostgREST anon key로 직접 REST 호출해도 동일하게 노출됨(앱 코드와 무관).
- PIN 자체가 4자리(10,000가지) 숫자뿐이라, 유출된 bcrypt 해시를 오프라인으로 10,000개 후보와 대조하는 건 수 초~수십 초면 끝난다 — PIN 인증 도입의 목적(브라우저 무관 소유권 보호) 자체가 사실상 무력화됨. RPC 쪽 brute-force 속도 제한 여부보다 이 경로가 근본적으로 더 치명적(네트워크 왕복 없이 즉시 오프라인 크랙 가능).
- **수정 방법(권장, DB 레벨 우선):** `revoke select (pin_hash) on public.holywin_entries from anon, authenticated, public;` — 이미 테이블 단위로 grant된 뒤에도 컬럼 단위 revoke가 정상 동작함(Postgres 표준 동작). 클라이언트 쪽도 `select('*')` 대신 명시적 컬럼 목록(`id, to_name, from_name, relation, status, submitted_at, owner_id`)으로 바꿔 defense-in-depth 적용 권장. RPC 3개(`holywin_create_entry`/`update_entry`/`update_status`)가 `returning *`으로 pin_hash까지 응답에 포함시키는 것도 부차적으로 정리 권장(본인 소유 행만 받는 경로라 우선순위는 낮음).
- **이미 프로덕션에 라이브 중이므로 시급.** 지금까지 등록된 모든 글의 PIN이 이미 유출 가능한 상태 — 패치 후에도 과거 PIN들은 크랙 시도가 있었을 가능성을 배제 못 함(로그 확인 불가 시 그냥 향후 위험만 차단).

**Major — `docs/07-components.md` 두 곳이 여전히 "본인 글일 때만 노출"이라고 서술.**
- L11(보조 버튼/수정), L18(위험 버튼/삭제) 둘 다 옛 `entry.isMine` 기반 hidden 토글 시절 문구. 실제로는 `#ticket-owner-actions`에서 hidden 클래스 자체가 삭제되어 모든 글에서 항상 노출되고, 실제 권한은 RPC 내부 PIN 비교가 담당(`renderTicket`의 주석은 정확히 갱신됨 — 07번 문서만 누락).
- CSS에도 `.ticket-owner-actions--hidden { display: none; }`가 죽은 클래스로 남아있고 바로 위 주석("본인 글일 때만 노출되는...")도 stale — JS/HTML 어디서도 이 클래스를 더 이상 참조하지 않음(grep 확인). Minor(죽은 코드)지만 문서 드리프트와 같은 원인.

**질문에 대한 답(사용자가 특히 봐달라고 한 4가지):**
1. `data?.id` null 체크 — 안전함. `holywin_update_entry`/`holywin_update_status`는 `returns public.holywin_entries`(단일 row)라 PostgREST가 매치 실패 시 "모든 필드가 null인 객체"를 반환하는데(`!data`로 안 걸러짐, curl로 재현 확정), `id`는 bigint identity라 성공 시 falsy가 될 수 없어 `data?.id`로 정확히 구분됨.
2. `promptPin`의 리스너 제거/재등록 패턴 — `showDialog`와 동일 패턴(기존에 Minor로 확인된 패턴, [[showdialog_promise_reuse_pattern]]). 동시 호출 시 이전 Promise 미해결 leak 가능성은 이론상 남아있지만, PIN 다이얼로그를 여는 트리거(상태 배지/삭제 버튼)가 백드롭에 가려져 다이얼로그가 떠 있는 동안 재호출 경로가 없어 실무 영향 없음.
3. PIN을 평문으로 RPC 인자로 보내는 것 — HTTPS 구간 자체는 문제 아님(위협은 pin_hash 노출 쪽이 훨씬 큼). 이 앱 위협 모델에서 전송 자체는 허용 가능.
4. `required-mark` 빈 span(`aria-hidden`) — 문제 없음. 실제 필수 여부는 input의 `required` 속성이 전달하고, 점은 순수 시각 장식이라 aria-hidden 처리가 맞음.

## 2차 리뷰: APPROVED (2026-09-30, `revoke select (pin_hash)`만 적용된 버전)
`entries.js`가 명시적 컬럼 목록(`id, to_name, from_name, relation, status, submitted_at, owner_id`)으로 바뀐 것과 `revoke select (pin_hash) on public.holywin_entries from anon, authenticated;`를 확인하고 APPROVED 처리함.

**⚠️ 이 2차 APPROVED 판정은 틀렸다 — 컬럼 단위 revoke는 프로덕션에서 실효가 없었음.**
사용자가 실제 프로덕션에 여러 차례 적용(Dashboard SQL Editor "Success" 메시지까지 확인)해도 `has_column_privilege('anon', ..., 'pin_hash', 'select')`가 계속 `true`로 나옴을 발견. Supabase 공식 column-level-security 가이드 재확인 결과: **테이블 단위 SELECT grant와 컬럼 단위 SELECT grant/revoke가 공존하면, 테이블 단위 권한이 계속 우선 적용되어 컬럼 단위 revoke는 아무 효과가 없다.** `0001_init.sql`이 이미 `grant select on public.holywin_entries to anon, authenticated`(테이블 전체)를 걸어뒀기 때문에, `revoke select (pin_hash) ...`만으로는 이를 좁힐 수 없었다(SQL 문법은 유효해 에러 없이 "성공"하지만 실질적 효과가 0).

**올바른 패턴(공식 문서 예시 그대로):**
```sql
revoke select on public.holywin_entries from anon, authenticated;  -- 테이블 단위 권한을 통째로 걷어낸다
grant select (id, to_name, from_name, relation, status, submitted_at, owner_id, deleted_at)
  on public.holywin_entries to anon, authenticated;                -- 원하는 컬럼만 다시 컬럼 단위로 grant
```
테이블 단위 grant를 먼저 제거하지 않으면 어떤 컬럼 단위 revoke도 무의미하다.

## 3차 리뷰: APPROVED (2026-09-30, 위 올바른 패턴으로 교체된 버전)
`revoke select on table` → `grant select (컬럼목록) on table`로 교체된 버전을 실제 프로덕션에서 검증(`has_column_privilege` false, REST `?select=*`/`?select=...,pin_hash` 모두 401 42501, entries.js가 쓰는 컬럼 목록은 200 OK, insert/update 권한 불변, 브라우저 렌더링 정상)한 결과와 함께 재확인 — APPROVED. 이 패턴이 이 프로젝트의 정답이며, 앞으로 이 테이블에 새 민감 컬럼을 추가할 때도 반드시 "table-level REVOKE + column-level GRANT" 형태를 따를 것(컬럼 단위 REVOKE만 쓰면 안 됨).

## 향후 리뷰 시 일반 원칙 (Postgres GRANT/REVOKE 리뷰 시 항상 확인)
컬럼 단위 SELECT를 제한하는 마이그레이션을 리뷰할 때, "컬럼 단위 revoke만" 쓰고 있다면 그 테이블에 이미 테이블 단위 SELECT grant가 걸려있는지(다른 마이그레이션 파일 포함) 반드시 함께 확인할 것 — 걸려있다면 그 revoke는 SQL 에러 없이 조용히 무효가 된다. 이는 이 리포지토리에 국한되지 않는 일반적인 Postgres 함정이라 다른 프로젝트 리뷰에도 적용.

## 남은 문서 드리프트 (미해결, 차단 대상 아님)
- `docs/07-components.md` L11/L18의 "본인 글일 때만 노출" 문구 미수정.
- `.ticket-owner-actions--hidden` 죽은 CSS/주석 정리 여부 미확인.
