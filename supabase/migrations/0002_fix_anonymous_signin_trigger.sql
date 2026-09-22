-- =============================================================================
-- 0002_fix_anonymous_signin_trigger.sql — 익명 로그인이 franchise_users 트리거와
-- 충돌하는 문제 수정
-- =============================================================================
--
-- 문제 상황: 이 Supabase 프로젝트는 홀리윈 2026 앱과 statkit.cms.api가 공유한다
-- (사용자가 명시적으로 확인함). statkit.cms.api 쪽에서 신규 auth.users 생성 시
-- public.franchise_users에 프로필 행을 자동 생성하는 트리거 함수
-- `public.handle_new_user()`가 이미 걸려 있었는데, 이 함수가 `new.email`을
-- `franchise_users.email`(not null)에 그대로 넣는다. 홀리윈 2026이 도입한
-- Supabase Anonymous Sign-In(`signInAnonymously()`)은 이메일이 없는(NULL)
-- auth.users 행을 만들기 때문에, 이 트리거가 매번
-- `null value in column "email" of relation "franchise_users" violates
-- not-null constraint`로 실패하고, 그 결과 트랜잭션 전체가 롤백되어 익명 유저
-- 생성 자체가 "Database error creating anonymous user"로 막혔다
-- (Postgres Logs에서 직접 확인, 에러 코드 23502).
--
-- 해결: `public.handle_new_user()` 맨 앞에 `new.is_anonymous`가 true면 즉시
-- return하는 가드를 추가한다. 이렇게 하면:
--   - statkit.cms.api의 실제 회원가입(이메일 있는 진짜 계정) 흐름은 단 한 줄도
--     바뀌지 않는다 — franchise_users insert 로직 원문 그대로 유지.
--   - 홀리윈 2026의 익명 사용자만 이 franchise_users 프로필 생성을 건너뛴다.
--     franchise_users는 holywin_entries와 무관한 다른 앱의 테이블이므로,
--     익명 세션이 거기에 행을 만들 필요도, 만들 수도 없어야 정상이다.
--
-- 이 패턴은 Supabase 공식 문서(Authentication > Anonymous Sign-Ins > Access
-- control)가 권장하는 `is_anonymous` 체크와 동일하다. `auth.users`에는
-- `is_anonymous` boolean 컬럼이 이미 존재하므로 별도 JWT 파싱 없이
-- `new.is_anonymous`로 바로 참조 가능하다.
--
-- 주의: 이 함수는 홀리윈 2026 소유가 아니라 statkit.cms.api가 원래 만든
-- 공유 인프라다. 이 파일은 그 함수를 대체(create or replace)하는 것이므로,
-- 실행 전에 아래 본문이 Dashboard의 원본과 (가드 추가 부분 제외하고) 동일한지
-- 한 번 더 대조할 것을 권장한다. 실제로 Dashboard의 Functions 편집 화면에는
-- search_path/Security를 설정하는 UI 자체가 없어(Definition 텍스트만 편집),
-- 원본도 search_path가 없었을 가능성이 높다고 판단했다.
--
-- security definer 함수는 search_path를 명시하지 않으면 이론적으로
-- search_path 하이재킹(권한 상승) 경로가 될 수 있어, 코드 리뷰 권고에 따라
-- `set search_path = public, pg_temp`를 방어적으로 추가했다. 이 함수 본문은
-- 이미 `public.franchise_users`처럼 스키마를 전부 명시하고 있어 동작에는
-- 영향이 없다.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.is_anonymous then
    return new;
  end if;

  insert into public.franchise_users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
