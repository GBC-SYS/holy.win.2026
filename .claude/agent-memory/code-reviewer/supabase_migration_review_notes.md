---
name: supabase_migration_review_notes
description: Supabase 무로그인 CRUD 도입 1~6단계(2026-09-22 완료) 커밋 전 리뷰에서 나온 반복 확인 포인트 — search_path, RLS 소프트삭제 RPC 우회, status-badge CSS 중복, confirm()→showDialog() 문서 드리프트
metadata:
  type: project
---

전체 계획은 [[project_repo_nature]]와 `.claude/plans/crystalline-enchanting-perlis.md`(6단계) 참고. **2026-09-22 기준 6단계(등록/조회/수정/삭제/상태토글/내 글 필터) 전부 완료, alert()/confirm() 10곳 전량 커스텀 다이얼로그(showDialog)로 교체 완료** — 최종 커밋 전 리뷰까지 마침. 이 리뷰들에서 확인한 반복 점검 포인트:

1. **`search_path` 미설정 문제는 재발하지 않고 두 번 다 올바르게 대응됨.** `0002_fix_anonymous_signin_trigger.sql`(공유 인프라 함수 덮어쓰기, statkit.cms.api 소유)과 `0003_soft_delete_rpc.sql`(신규 `holywin_soft_delete_entry`) 둘 다 `security definer` + `set search_path = public, pg_temp`를 명시함. **다음에 새 `security definer` 함수가 추가되면 이 관례(search_path 명시)가 유지되는지 확인할 것(Critical 후보 — 빠지면 즉시 지적).**
2. **소프트 삭제는 일반 `.update({deleted_at}).eq('id',...)`가 아니라 반드시 `rpc('holywin_soft_delete_entry', {entry_id})`를 호출해야 한다.** 원인: PostgREST가 `.select()` 없이도 내부적으로 `UPDATE ... RETURNING *`를 구성하는데, `deleted_at`을 null→값 있음으로 바꾸는 순간 그 행이 SELECT 정책(`deleted_at is null`)을 통과 못 해 42501 에러가 난다(curl로 재현 확정). RPC(`security definer`)가 이를 우회하되, 함수 본문에서 `owner_id = auth.uid() and deleted_at is null` 조건으로 소유권을 직접 재검증한다. **`entries.js`의 `handleDeleteEntry`에 `.update()` 방식이 다시 등장하면 이 근본 원인을 잊은 회귀이니 Critical로 지적할 것.**
3. **`.entry-status--praying`/`--done`(리스트 카드)과 `.status-badge--praying`/`--done`(티켓 상세)이 완전히 동일한 색상 규칙을 두 번 정의**하고 있다(entries.css, 2026-09-22 최종 리뷰 시점에도 미해결). `docs/07-components.md`의 "상태 배지" 항목 자체는 정확하지만(서로 다른 클래스임을 구분해 설명), 두 CSS 블록의 중복 자체는 리팩터링 기회로 남아있다(Minor, 기능상 문제 없음 — 급하지 않으면 계속 이월 가능).
4. **`confirm()`/`window.confirm()` → `showDialog()` 교체가 코드에서는 완전했지만 문서 3곳이 동기화 안 됨(2026-09-22 최종 리뷰에서 발견).** `docs/02-colors.md`(L35, "confirm() 확인 단계를 거친 뒤에만 호출된다"), `docs/09-shadcn-tokens.md`(L78, "window.confirm() 확인 단계"), `assets/css/entries.css`(L557 주석, "confirm()으로 확인 단계를 거친 뒤에만 호출된다") 세 곳 모두 옛 네이티브 API를 언급한다. 반면 `docs/07-components.md`의 다이얼로그 항목과 `.claude/agent-memory/js-component-architect/project_context.md`는 정확히 동기화되어 있었다 — **일부 문서만 갱신하고 나머지를 놓치는 패턴이 반복될 수 있으니, alert/confirm 관련 기능이 또 바뀌면 02/07/09 세 문서와 관련 CSS 주석을 전부 grep해서 대조할 것(Major).**
5. **anon key 하드코딩은 이 프로젝트에서 타당한 결정**(공개 키 + RLS가 실접근 제어)임을 재확인함 — 이 판단 자체는 앞으로 문제 삼지 말 것. `.gitignore`가 `assets/js/supabase-client.js`를 다시 제외하지 않는지는 매번 재확인([[gitignore_supabase_client_bug]] 참고, 2026-09-22 최종 리뷰 시점 재확인 결과 해소 유지됨).

**How to apply:** 이후 Supabase 관련 diff 리뷰 시 1~2번(search_path, RPC 우회 패턴)을 최우선으로 재확인하고, 3~4번은 관련 CSS/문서가 다시 바뀔 때만 재점검.
