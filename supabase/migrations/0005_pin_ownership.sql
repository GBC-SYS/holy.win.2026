-- =============================================================================
-- 0005_pin_ownership.sql — 등록 시 입력한 4자리 PIN으로 브라우저 무관 수정/삭제 인증
-- =============================================================================
--
-- 문제 상황(0001_init.sql에서 이미 알려진 한계): 소유권을 Supabase Anonymous
-- Sign-In의 auth.uid()로만 판별하면, 같은 사람이라도 다른 브라우저·기기로
-- 접속하는 순간 새 익명 auth.uid()가 발급되어 본인이 작성한 글을 다시는
-- 수정/삭제할 수 없었다. 사용자가 "어떤 브라우저에서 보든 내가 등록한 글은
-- 똑같이 수정/삭제할 수 있게 해달라"고 명시적으로 요청해 PIN 방식을 도입한다.
--
-- 해결: 등록 시 사용자가 직접 정한 4자리 숫자 PIN을 pgcrypto(crypt/gen_salt)로
-- 해시해 pin_hash 컬럼에 저장한다(평문 저장 없음). 이후 수정/삭제/상태변경은
-- 모두 PIN을 함께 보내야 하고, 서버(security definer 함수) 안에서
-- `pin_hash = crypt(입력PIN, pin_hash)`로 검증한다 — PIN을 아는 사람이면
-- 브라우저·기기와 무관하게 항상 동일하게 인증된다.
--
-- 기존 owner_id(auth.uid()) 기반 RLS 정책(holywin_entries_insert_own/
-- update_own)은 그대로 둔다 — 건드리지 않아도 새 RPC 경로와 충돌하지 않고,
-- 혹시 나중에 누군가 실수로 일반 .update()를 직접 호출해도 "최소한 같은
-- 브라우저 소유자만" 통과시키는 방어선으로 남는다(변경 없음, 삭제하지 않음).
-- 이 마이그레이션이 실제로 바꾸는 건 "클라이언트가 무엇을 호출하는가"이지
-- "기존 RLS가 무엇을 허용하는가"가 아니다.
--
-- pgcrypto는 이 프로젝트에 이미 extensions 스키마에 설치되어 있음을
-- list_extensions로 확인했다(installed_version 1.3) — 별도 설치 불필요.
--
-- 이 마이그레이션은 Supabase Dashboard → SQL Editor에 직접 붙여넣어 실행한다.
-- (이 저장소 규칙: 쓰기/DDL은 항상 파일로 먼저 작성하고, 에이전트가 직접
-- 실행하지 않는다.)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. 컬럼: pin_hash
-- -----------------------------------------------------------------------------
-- nullable로 둔다 — 0001_init.sql의 시드 5건은 owner_id가 존재하지 않는
-- sentinel UUID라 이미 아무도 수정/삭제할 수 없는 사실상 읽기 전용 데이터다.
-- PIN이 없어도(NULL) 문제되지 않으며, 억지로 백필할 이유가 없다.
alter table public.holywin_entries
  add column if not exists pin_hash text;

comment on column public.holywin_entries.pin_hash is
  '수정/삭제/상태변경 시 브라우저 무관 인증에 쓰는 4자리 PIN의 해시(pgcrypto crypt+gen_salt(bf)). 평문 PIN은 저장하지 않는다. holywin_create_entry RPC로만 채워진다.';

comment on table public.holywin_entries is
  '전도 대상자 명단. 수정/삭제 인증은 등록 시 설정한 PIN(pin_hash)으로 판별하며(holywin_update_entry/holywin_update_status/holywin_soft_delete_entry), owner_id/auth.uid() 기반 RLS는 방어선으로만 남아있다. 실제 DELETE 없이 deleted_at으로 소프트 삭제만 허용한다.';


-- -----------------------------------------------------------------------------
-- 2. RPC: holywin_create_entry — INSERT + PIN 해시 저장을 한 번에
-- -----------------------------------------------------------------------------
-- 클라이언트가 평문 PIN을 직접 해시하지 않고 그대로 보내면(HTTPS 구간이므로
-- 전송 중 노출 없음), 이 함수가 pgcrypto로 해시해서만 저장한다. owner_id는
-- 이전과 동일하게 컬럼 기본값(auth.uid())에 맡긴다 — security definer는
-- 함수의 실행 권한만 상승시킬 뿐 request.jwt.claims 같은 요청 스코프 GUC는
-- 그대로 유지되므로, 함수 안에서도 auth.uid()는 호출자의 익명 세션을 그대로
-- 가리킨다.
create or replace function public.holywin_create_entry(
  to_name text,
  from_name text,
  relation text,
  pin text
)
returns public.holywin_entries
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  new_row public.holywin_entries;
begin
  if pin is null or pin !~ '^[0-9]{4}$' then
    raise exception 'PIN은 숫자 4자리여야 합니다.';
  end if;

  insert into public.holywin_entries (to_name, from_name, relation, pin_hash)
  values (to_name, from_name, relation, extensions.crypt(pin, extensions.gen_salt('bf')))
  returning * into new_row;

  return new_row;
end;
$$;

comment on function public.holywin_create_entry(text, text, text, text) is
  '전도 대상자 등록 + PIN 해시 저장을 한 트랜잭션으로 처리한다. owner_id는 기존과 동일하게 컬럼 기본값(auth.uid())을 그대로 쓴다.';

revoke all on function public.holywin_create_entry(text, text, text, text) from public;
grant execute on function public.holywin_create_entry(text, text, text, text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 3. RPC: holywin_update_entry — PIN 검증 후 내용 수정
-- -----------------------------------------------------------------------------
-- 대상이 없거나(잘못된 id) PIN이 틀리면 UPDATE가 0행에 매치되어 NULL을
-- 반환한다 — 클라이언트는 반환값이 null이면 "PIN이 일치하지 않습니다"로
-- 안내한다(0003_soft_delete_rpc.sql의 boolean 반환 패턴과 동일한 사고방식,
-- 다만 여기선 수정된 행 자체를 그대로 돌려줘 클라이언트가 다시 조회할
-- 필요가 없게 한다).
create or replace function public.holywin_update_entry(
  entry_id bigint,
  pin text,
  new_to_name text,
  new_from_name text,
  new_relation text
)
returns public.holywin_entries
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  updated_row public.holywin_entries;
begin
  update public.holywin_entries
  set to_name = new_to_name,
      from_name = new_from_name,
      relation = new_relation
  where id = entry_id
    and deleted_at is null
    and pin_hash is not null
    and pin_hash = extensions.crypt(pin, pin_hash)
  returning * into updated_row;

  return updated_row;
end;
$$;

comment on function public.holywin_update_entry(bigint, text, text, text, text) is
  'PIN이 일치하고 아직 삭제되지 않은 글만 내용을 수정한다. 대상이 없거나 PIN이 틀리면 NULL을 반환한다.';

revoke all on function public.holywin_update_entry(bigint, text, text, text, text) from public;
grant execute on function public.holywin_update_entry(bigint, text, text, text, text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 4. RPC: holywin_update_status — PIN 검증 후 상태 토글
-- -----------------------------------------------------------------------------
-- status 값 자체의 유효성('기도 중'/'완료')은 테이블의 기존 CHECK 제약이
-- 그대로 검증하므로 이 함수에서 다시 검사하지 않는다(잘못된 값이면 UPDATE가
-- CHECK violation으로 에러를 던진다).
create or replace function public.holywin_update_status(
  entry_id bigint,
  pin text,
  new_status text
)
returns public.holywin_entries
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  updated_row public.holywin_entries;
begin
  update public.holywin_entries
  set status = new_status
  where id = entry_id
    and deleted_at is null
    and pin_hash is not null
    and pin_hash = extensions.crypt(pin, pin_hash)
  returning * into updated_row;

  return updated_row;
end;
$$;

comment on function public.holywin_update_status(bigint, text, text) is
  'PIN이 일치하고 아직 삭제되지 않은 글만 상태를 변경한다. 대상이 없거나 PIN이 틀리면 NULL을 반환한다.';

revoke all on function public.holywin_update_status(bigint, text, text) from public;
grant execute on function public.holywin_update_status(bigint, text, text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 5. holywin_soft_delete_entry — PIN 인자를 추가해 재정의
-- -----------------------------------------------------------------------------
-- owner_id/auth.uid() 단독 판별에서 PIN 판별로 완전히 교체한다(오버로드로
-- 두 버전을 공존시키지 않는다 — 이 함수는 holywin 전용이라 다른 앱이 옛
-- 시그니처를 의존할 일이 없고, 두 버전이 같이 남으면 "어느 쪽을 써야
-- 하는지" 혼란만 남긴다). 기존 1-인자 버전은 명시적으로 drop한다.
drop function if exists public.holywin_soft_delete_entry(bigint);

create or replace function public.holywin_soft_delete_entry(entry_id bigint, pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  affected int;
begin
  update public.holywin_entries
  set deleted_at = now()
  where id = entry_id
    and deleted_at is null
    and pin_hash is not null
    and pin_hash = extensions.crypt(pin, pin_hash)
  ;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

comment on function public.holywin_soft_delete_entry(bigint, text) is
  'PIN이 일치하고 아직 삭제되지 않은 글만 소프트 삭제한다. security definer로 RLS RETURNING 가시성 문제를 우회하되, 인증은 PIN 해시 비교로 함수 내부에서 직접 수행한다.';

revoke all on function public.holywin_soft_delete_entry(bigint, text) from public;
grant execute on function public.holywin_soft_delete_entry(bigint, text) to anon, authenticated;
