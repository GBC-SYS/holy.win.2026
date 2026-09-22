-- =============================================================================
-- 0001_init.sql — 홀리윈 2026 전도 명단: holywin_entries 테이블 초기 스키마 + RLS + 시드
-- =============================================================================
--
-- ⚠️ 소유권 모델의 근본적 한계 (반드시 인지할 것)
-- 이 프로젝트는 회원가입/로그인 UI가 없는 "무로그인" 서비스이며, 클라이언트는
-- Supabase Anonymous Sign-In(`supabase.auth.signInAnonymously()`)으로 발급받은
-- 임시 익명 세션의 `auth.uid()`를 글 소유권(owner_id) 판별에 사용한다.
--
-- 이 익명 세션은 진짜 계정이 아니라 "그 브라우저에 저장된 토큰"에 불과하다.
-- 따라서 사용자가 브라우저 저장소(로컬스토리지/쿠키)를 지우거나, 다른 기기·
-- 다른 브라우저로 접속하면 그 순간 새로운 익명 auth.uid()가 발급되고, 예전에
-- 본인이 작성한 글이라도 owner_id가 더 이상 일치하지 않아 두 번 다시 수정/
-- 삭제할 수 없게 된다. 비밀번호 찾기나 계정 복구 같은 개념 자체가 없다.
-- 이는 "회원가입 없이"라는 요구사항이 만들어내는 필연적 트레이드오프이며,
-- 버그가 아니라 설계상 받아들인 제약이다.
--
-- 이 마이그레이션은 Supabase Dashboard → SQL Editor에 직접 붙여넣어 실행한다.
-- (이 저장소 규칙: 쓰기/DDL은 항상 파일로 먼저 작성하고, 에이전트가 직접
-- 실행하지 않는다.) 재실행해도 안전하도록 idempotent하게 작성했다.
--
-- 실행 전제: Dashboard → Authentication → Providers에서
-- "Allow anonymous sign-ins"가 켜져 있어야 클라이언트에서 auth.uid()를
-- 발급받을 수 있다 (이 마이그레이션 자체는 그 설정과 무관하게 실행 가능).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. 테이블: holywin_entries
-- -----------------------------------------------------------------------------
-- 참고: owner_id에 `references auth.users(id) on delete set null`과
-- `not null`을 동시에 걸면 논리적으로 상충하는 지점이 하나 있다 — 만약 실제로
-- 어떤 auth.users 행이 삭제되면, "on delete set null" 액션이 해당 owner_id를
-- NULL로 바꾸려 시도하는데 이는 not null 제약을 위반해 그 auth.users 삭제
-- 트랜잭션 자체가 실패한다(참조 무결성 위반으로 롤백). 즉 "owner가 사라지면
-- 글은 소유자 없는 상태가 된다"는 on delete set null의 의도는 not null과
-- 공존할 수 없다. 요청된 스펙을 그대로 구현하되, 이 캐스케이드 충돌은 알려진
-- 한계로 남겨둔다(현재 Supabase Anonymous Sign-In은 auth.users 행을 자동으로
-- 삭제하지 않으므로 실무에서 당장 문제를 일으키진 않는다).
create table if not exists public.holywin_entries (
  id            bigint generated always as identity primary key,
  to_name       text not null check (length(to_name) <= 50),
  from_name     text not null check (length(from_name) <= 50),
  relation      text not null check (length(relation) <= 50),
  status        text not null default '기도 중' check (status in ('기도 중', '완료')),
  submitted_at  timestamptz not null default now(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete set null,
  deleted_at    timestamptz
);

comment on table public.holywin_entries is
  '전도 대상자 명단. 소유권은 익명 인증(auth.uid())으로 판별하며, 실제 DELETE 없이 deleted_at으로 소프트 삭제만 허용한다.';


-- -----------------------------------------------------------------------------
-- 2. Row-Level Security
-- -----------------------------------------------------------------------------
alter table public.holywin_entries enable row level security;

-- 테이블 소유자(postgres 슈퍼유저)로 실행되는 이 마이그레이션의 시드 INSERT는
-- 기본적으로 RLS를 우회한다(FORCE ROW LEVEL SECURITY를 걸지 않았으므로).
-- 클라이언트(anon/authenticated 역할)만 아래 정책의 적용을 받는다.

-- 테이블 자체 권한: RLS 정책과 별개로 테이블 단위 권한(GRANT)도 명시한다.
-- DELETE는 어떤 역할에도 부여하지 않는다 — 실제 삭제는 UPDATE(deleted_at 채우기)로만 가능.
revoke all on public.holywin_entries from anon, authenticated;
grant select, insert, update on public.holywin_entries to anon, authenticated;
-- identity 컬럼(id)은 시퀀스 USAGE 권한 없이도 INSERT 시 자동 채번되므로 별도 GRANT 불필요.

-- SELECT: 공개, 단 소프트 삭제된 행은 숨긴다.
drop policy if exists "holywin_entries_select_public" on public.holywin_entries;
create policy "holywin_entries_select_public"
  on public.holywin_entries
  for select
  to public
  using (deleted_at is null);

-- INSERT: 공개(익명 세션 포함 누구나 새 글 작성 가능).
-- owner_id는 `default auth.uid()`로 서버가 채워주지만, 그것만으로는 클라이언트가
-- INSERT 페이로드에 다른 사람의 owner_id를 명시적으로 실어 보내는 것까지는
-- 막지 못한다(기본값은 컬럼이 생략됐을 때만 적용되고, 명시적으로 보낸 값은
-- 기본값을 덮어쓴다). 따라서 `with check`로 "보내는 owner_id는 반드시 본인
-- auth.uid()여야 한다"를 강제한다.
drop policy if exists "holywin_entries_insert_own" on public.holywin_entries;
create policy "holywin_entries_insert_own"
  on public.holywin_entries
  for insert
  to public
  with check (owner_id = auth.uid());

-- UPDATE: 본인 글만. 일반 필드 수정과 deleted_at 채우기(소프트 삭제)를 모두
-- 이 정책 하나로 커버한다. using은 "어떤 기존 행을 고를 수 있는지",
-- with check는 "수정 후 결과가 여전히 본인 소유여야 함"을 보장한다
-- (owner_id 자체를 다른 사람 것으로 바꿔치기하는 것도 함께 차단됨).
drop policy if exists "holywin_entries_update_own" on public.holywin_entries;
create policy "holywin_entries_update_own"
  on public.holywin_entries
  for update
  to public
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- DELETE: 의도적으로 정책 없음 + 권한 미부여. 실제 SQL DELETE는 어떤 역할도
-- 수행할 수 없다(복구 가능성을 남기기 위한 soft-delete-only 정책).


-- -----------------------------------------------------------------------------
-- 3. 시드 데이터 (기존 assets/data/entries.json 5건 이관)
-- -----------------------------------------------------------------------------
-- 시드 데이터는 owner_id를 존재하지 않는 고정 sentinel UUID로 지정해, RLS의
-- UPDATE 정책(owner_id = auth.uid())을 그 누구도 통과할 수 없는 "사실상
-- 읽기 전용" 데이터로 만든다.
--
-- 문제: owner_id는 `not null references auth.users(id)`이기 때문에, 존재하지
-- 않는 UUID를 그냥 INSERT하면 FK(참조 무결성) 위반으로 즉시 실패한다.
--
-- 해결(v2 — DISABLE TRIGGER ALL 대신 제약을 드롭/재생성): 처음에는 시드를
-- 넣는 동안만 `alter table ... disable trigger all`로 FK 검사 트리거를 잠깐
-- 끄는 방식을 썼으나, Postgres는 외래키를 내부적으로 구현하는 "시스템
-- 트리거"를 끄는 작업에 슈퍼유저 권한을 요구한다(무결성이 깨지는 걸 막기
-- 위한 의도적 제한). Supabase SQL Editor의 `postgres` 역할은 이 테이블의
-- 소유자이긴 해도 진짜 슈퍼유저는 아니므로 실행 시
-- `permission denied: "RI_ConstraintTrigger_..." is a system trigger`로
-- 항상 실패한다.
--
-- 대신 FK 제약 자체를 시드 INSERT 직전에 DROP했다가 직후 `NOT VALID`로
-- 다시 ADD한다. DROP/ADD CONSTRAINT는 테이블 소유자 권한만으로 가능하다
-- (슈퍼유저 불필요). `NOT VALID`로 재추가하면 "이미 있는 행"(sentinel 시드)만
-- 검증에서 면제되고, 이후의 모든 실제 INSERT와 owner_id를 바꾸는 UPDATE는
-- 여전히 정상적으로 FK 검사를 받는다 — 클라이언트 쓰기에 대한 무결성 보장은
-- 그대로 유지된다. 제약 이름은 `create table`에서 owner_id에 인라인으로
-- 선언했을 때 Postgres가 자동으로 붙이는 기본 이름
-- (`<테이블명>_<컬럼명>_fkey`)을 그대로 사용한다.
-- (RLS는 트리거가 아니라 별도 메커니즘이라 이 작업과 무관하게 항상 적용된다.)
do $$
begin
  if not exists (select 1 from public.holywin_entries) then
    alter table public.holywin_entries drop constraint if exists holywin_entries_owner_id_fkey;

    insert into public.holywin_entries (to_name, from_name, relation, status, submitted_at, owner_id)
    values
      ('민지',   '규리',   '친구',   '기도 중', '2026-09-20 12:00:00+09', '00000000-0000-0000-0000-000000000000'),
      ('박선생님', '재원', '직장동료', '기도 중', '2026-09-19 12:00:00+09', '00000000-0000-0000-0000-000000000000'),
      ('이모',   '태원',   '가족',   '기도 중', '2026-09-19 12:00:00+09', '00000000-0000-0000-0000-000000000000'),
      ('창현',   '소윤호', '친구',   '기도 중', '2026-09-15 12:00:00+09', '00000000-0000-0000-0000-000000000000'),
      ('수진',   '희연',   '친구',   '기도 중', '2026-09-14 12:00:00+09', '00000000-0000-0000-0000-000000000000');

    alter table public.holywin_entries
      add constraint holywin_entries_owner_id_fkey
      foreign key (owner_id) references auth.users(id) on delete set null
      not valid;
  end if;
end;
$$;
