---
name: supabase_migration_review_notes
description: Supabase 무로그인 CRUD 도입 1~3단계(2026-09-22) 커밋 전 리뷰에서 나온 반복 확인 포인트 — 0002 마이그레이션의 CREATE OR REPLACE 위험, entries.js 에러 UX, status-badge CSS 중복
metadata:
  type: project
---

전체 계획은 [[project_repo_nature]]와 `.claude/plans/crystalline-enchanting-perlis.md`(6단계) 참고. 2026-09-22 기준 1~3단계(스키마+RLS, 클라이언트 연결, 읽기 전환)가 커밋 대기 상태였다. 이 리뷰에서 확인한 반복 점검 포인트:

1. **`supabase/migrations/0002_fix_anonymous_signin_trigger.sql`의 `create or replace function public.handle_new_user()`**는 이 프로젝트(holywin) 소유가 아니라 공유 Supabase 프로젝트의 다른 앱(`statkit.cms.api`) 소유 함수를 덮어쓴다. 파일 자체에 "실행 전 Dashboard 원본과 대조" 경고 주석이 있어 위험을 인지하고는 있으나, `CREATE OR REPLACE FUNCTION`은 함수 소유권/GRANT는 보존해도 `ALTER FUNCTION ... SET search_path=...` 같은 별도 설정은 새 정의에 명시하지 않으면 유실될 수 있다(SECURITY DEFINER 함수라 search_path 하이재킹 이슈와 직결). 이 파일의 새 정의엔 `set search_path` 절이 없다 — 원본에 있었다면 유실됨. **다음에 이 파일이 다시 등장하거나 유사한 `create or replace function`이 공유 인프라를 건드리면, search_path 등 원본의 `ALTER FUNCTION` 설정이 재반영됐는지 항상 확인할 것(Major).**
2. **`entries.js`의 Supabase select 에러 처리**가 `console.error` + 빈 배열 렌더로 끝나, "아직 명단이 없음"과 "네트워크/쿼리 실패"를 사용자가 구분할 수 없다. 4~6단계 진행 시 최소한의 에러 상태 UI(재시도 버튼/안내 문구)를 추가할 필요가 있는지 계속 지적할 것(Major, 다만 프로토타입 초기 단계라 BLOCKED까지는 아님).
3. **`.entry-status--praying`/`--done`(리스트 카드)과 `.status-badge--praying`/`--done`(티켓 상세)이 완전히 동일한 색상 규칙을 두 번 정의**하고 있다(entries.css). `docs/07-components.md`는 "상태 배지(status-badge)"를 "티켓 상세 화면 전용"이라고만 적어, 리스트 카드에도 같은 배지가 쓰인다는 사실이 문서에 빠져 있다 — [[color_doc_sync_rule]]과 같은 종류의 문서-코드 드리프트. 다음에 상태 배지 관련 CSS/문서가 바뀌면 이 중복/문서 누락이 정리됐는지 확인할 것(Minor~Major).
4. **anon key 하드코딩은 이 프로젝트에서 타당한 결정**(공개 키 + RLS가 실접근 제어)임을 재확인함 — 이 판단 자체는 앞으로 문제 삼지 말 것. 다만 실제로 이 파일이 커밋되는지는 별도 확인 필요([[gitignore_supabase_client_bug]] 참고).

**How to apply:** 4단계(상태 토글 실제 UPDATE 전환) 이후 리뷰 시 위 2~3번이 해소됐는지 우선 확인하고, 1번은 해당 마이그레이션 파일이 재실행되거나 유사 파일이 추가될 때마다 재확인.
