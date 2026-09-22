---
name: project-supabase-shared-project-conflict
description: 홀리윈 2026과 statkit.cms.api가 같은 Supabase 프로젝트(DB)를 공유함 — 다른 앱의 auth.users 트리거가 홀리윈 2026 기능과 충돌한 전례 있음
metadata: 
  node_type: memory
  type: project
  originSessionId: 3dd53893-19af-4039-989f-1c627d9c21fa
  modified: 2026-09-22T08:20:21.633Z
---

홀리윈 2026 앱과 `statkit.cms.api`(이 워크스페이스의 다른 프로젝트, `CLAUDE.md`에 "이 저장소와 무관"이라고 적힌 그 프로젝트)는 **같은 Supabase 프로젝트(project_ref: `lrqqxzlxuilwfumitwmc`)를 실제로 공유한다.** 처음엔 완전히 무관한 다른 프로젝트라고 판단했었으나(`.mcp.json` 조사 결과), 사용자가 URL을 직접 제공하면서 "같은 프로젝트가 맞다"고 명시적으로 확인해줬다(AskUserQuestion으로 재확인까지 거침).

**실제로 터진 문제(전례):** `statkit.cms.api`가 이미 걸어둔 `public.handle_new_user()` 트리거 함수(신규 `auth.users` 생성 시 `public.franchise_users`에 프로필 행을 자동 생성, `email not null` 컬럼에 `new.email`을 그대로 씀)가, 홀리윈 2026이 도입한 Supabase Anonymous Sign-In(이메일이 NULL인 `auth.users` 행을 만듦)과 충돌해 `null value in column "email" ... violates not-null constraint`로 익명 로그인 자체가 막혔다(`Database error creating anonymous user`). `supabase/migrations/0002_fix_anonymous_signin_trigger.sql`에서 그 함수 맨 앞에 `if new.is_anonymous then return new; end if;` 가드를 추가해 해결(`franchise_users` insert 로직 자체는 그대로 보존, `security definer` 함수라 `set search_path = public, pg_temp`도 방어적으로 추가).

**Why:** 두 앱이 같은 DB를 쓰기로 한 건 사용자의 명시적 선택이고, 리소스 절약 등의 이유로 보인다. 다만 그 대가로 한쪽 앱의 스키마/트리거/제약이 다른 쪽 앱의 정상 동작을 막을 수 있다는 게 실제로 증명됐다.

**How to apply:** 앞으로 이 프로젝트에서 `auth.users`/RLS/트리거/함수 관련 작업을 할 때는, "이건 홀리윈 2026만의 설정이 아니라 `statkit.cms.api`도 같이 보는 DB"라는 전제를 깔고 접근할 것. 새 트리거·제약을 추가하기 전에 기존에 걸린 다른 앱 소유 트리거/함수가 있는지(`Database → Functions`/`Database → Triggers`) 먼저 확인하는 습관이 필요하다. `franchise_users` 같은 다른 앱 소유 테이블/함수를 수정할 땐 원본 로직을 절대 건드리지 않고 최소한의 가드만 얹는 방식을 유지할 것(이번에 실제로 그렇게 처리해서 문제없이 넘어갔다). [[project-supabase-crud-migration]] 참고.
