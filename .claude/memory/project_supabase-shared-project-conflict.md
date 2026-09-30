---
name: project-supabase-shared-project-conflict
description: 홀리윈 2026과 statkit.cms.api가 같은 Supabase 프로젝트(DB)를 공유함 — 다른 앱의 auth.users 트리거가 홀리윈 2026 기능과 충돌한 전례 있음
metadata: 
  node_type: memory
  type: project
  originSessionId: 3dd53893-19af-4039-989f-1c627d9c21fa
  modified: 2026-09-30T06:45:00.000Z
---

홀리윈 2026 앱과 `statkit.cms.api`(이 워크스페이스의 다른 프로젝트, `CLAUDE.md`에 "이 저장소와 무관"이라고 적힌 그 프로젝트)는 **같은 Supabase 프로젝트(project_ref: `lrqqxzlxuilwfumitwmc`)를 실제로 공유한다.** 처음엔 완전히 무관한 다른 프로젝트라고 판단했었으나(`.mcp.json` 조사 결과), 사용자가 URL을 직접 제공하면서 "같은 프로젝트가 맞다"고 명시적으로 확인해줬다(AskUserQuestion으로 재확인까지 거침).

**실제로 터진 문제(전례):** `statkit.cms.api`가 이미 걸어둔 `public.handle_new_user()` 트리거 함수(신규 `auth.users` 생성 시 `public.franchise_users`에 프로필 행을 자동 생성, `email not null` 컬럼에 `new.email`을 그대로 씀)가, 홀리윈 2026이 도입한 Supabase Anonymous Sign-In(이메일이 NULL인 `auth.users` 행을 만듦)과 충돌해 `null value in column "email" ... violates not-null constraint`로 익명 로그인 자체가 막혔다(`Database error creating anonymous user`). `supabase/migrations/0002_fix_anonymous_signin_trigger.sql`에서 그 함수 맨 앞에 `if new.is_anonymous then return new; end if;` 가드를 추가해 해결(`franchise_users` insert 로직 자체는 그대로 보존, `security definer` 함수라 `set search_path = public, pg_temp`도 방어적으로 추가).

**Why:** 두 앱이 같은 DB를 쓰기로 한 건 사용자의 명시적 선택이고, 리소스 절약 등의 이유로 보인다. 다만 그 대가로 한쪽 앱의 스키마/트리거/제약이 다른 쪽 앱의 정상 동작을 막을 수 있다는 게 실제로 증명됐다.

**How to apply:** 앞으로 이 프로젝트에서 `auth.users`/RLS/트리거/함수 관련 작업을 할 때는, "이건 홀리윈 2026만의 설정이 아니라 `statkit.cms.api`도 같이 보는 DB"라는 전제를 깔고 접근할 것. 새 트리거·제약을 추가하기 전에 기존에 걸린 다른 앱 소유 트리거/함수가 있는지(`Database → Functions`/`Database → Triggers`) 먼저 확인하는 습관이 필요하다. `franchise_users` 같은 다른 앱 소유 테이블/함수를 수정할 땐 원본 로직을 절대 건드리지 않고 최소한의 가드만 얹는 방식을 유지할 것(이번에 실제로 그렇게 처리해서 문제없이 넘어갔다). [[project-supabase-crud-migration]] 참고.

**Realtime(Presence/Broadcast)에도 같은 리스크가 있다(2026-09-30 추가):** `mcp__supabase__execute_sql`로 직접 조회한 결과, `realtime.messages` 테이블은 RLS가 `ENABLED`인데 정책이 **0개**다. 이는 Realtime 채널을 `private: true`로 열면(정책이 없어 전원 거부되므로) join 자체가 실패할 가능성이 높다는 뜻이다 — 반대로 `private` 옵션 없이 여는 기본(public) 채널은 이 RLS 체크 경로를 타지 않고 정상 동작한다(Chrome 실측으로 join 성공 확인, [[project-realtime-presence-viewer-count]] 참고). 이 공유 프로젝트에서 Realtime을 새로 쓸 때는 DB 작업과 마찬가지로 "다른 앱이 이미 private 채널 인증 정책을 걸어뒀을 수도 있다"는 가정하에 `get_advisors`/`execute_sql`로 `realtime.messages`의 정책 개수를 먼저 확인할 것.

**CLAUDE.md의 "무관한 프로젝트" 서술은 부분적으로만 맞다(⚠️ 후속 조치 필요):** `CLAUDE.md`의 "`.claude/hooks/session-start.sh`와 `.mcp.json`의 `supabase` 항목이 무관한 프로젝트(statkit.cms.api)를 가리킨다"는 문장은, "그 배너에 적힌 코드 스택(Next.js/Recoil/yarn 등)이 이 저장소에 적용 안 된다"는 의미로는 맞지만, **"실제 연결된 Supabase 프로젝트 자체가 무관하다"는 뜻으로 읽으면 틀렸다** — MCP `supabase` 서버는 실제로 이 앱의 `holywin_entries` 테이블도 조회 가능한 바로 그 공유 프로젝트(`lrqqxzlxuilwfumitwmc`)에 연결되어 있다(이번 세션에서 `list_tables`/`get_advisors`로 직접 확인). 즉 세션 시작 배너는 무시해도 되지만, Supabase MCP 도구 자체는 "무관"하지 않고 오히려 이 앱의 실제 인프라를 조사하는 데 그대로 쓸 수 있다. CLAUDE.md의 해당 문장에 이 구분을 명확히 하는 한 줄을 추가할지 다음 세션에서 검토할 것.
