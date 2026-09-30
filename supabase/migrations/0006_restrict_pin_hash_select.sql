-- =============================================================================
-- 0006_restrict_pin_hash_select.sql — pin_hash 컬럼 전체 공개 노출 긴급 차단
-- =============================================================================
--
-- 문제(code-reviewer 2026-09-30 리뷰에서 Critical로 지적, curl로 직접 재현해
-- 확정): 0005에서 추가한 pin_hash 컬럼이 0001의 테이블 단위
-- `grant select on public.holywin_entries to anon, authenticated`를 그대로
-- 물려받았다. RLS(holywin_entries_select_public)는 "어떤 행을 볼 수 있는지"만
-- 걸러낼 뿐 "행 안의 어떤 컬럼을 볼 수 있는지"는 전혀 막지 못하므로, 앱을
-- 거치지 않고 anon key로 REST 엔드포인트를 직접 호출해도
-- `?select=id,to_name,pin_hash`처럼 pin_hash를 그대로 받을 수 있었다.
-- PIN이 숫자 4자리(10,000가지)뿐이라 유출된 bcrypt 해시의 오프라인 대조는
-- 수십 초 내에 끝나므로, 이 노출 하나가 0005가 도입한 PIN 기반 인증
-- (브라우저 무관 수정/삭제 권한 판별)을 통째로 무력화한다.
--
-- 이 마이그레이션 적용 전까지 등록된 모든 글의 PIN은 이미 유출 가능한
-- 상태였다는 뜻이므로, 이 파일은 다른 마이그레이션보다 우선 적용한다.
--
-- 해결 1: 컬럼 단위 REVOKE로 pin_hash만 좁혀 차단한다. 0001의 테이블 단위
-- SELECT grant는 그대로 두고 이 컬럼 하나만 제외 — Postgres는 테이블 단위
-- grant 위에 컬럼 단위 revoke를 얹으면 해당 컬럼만 정상적으로 좁혀진다.
revoke select (pin_hash) on public.holywin_entries from anon, authenticated;

-- 해결 2(심층 방어): holywin_create_entry/holywin_update_entry/
-- holywin_update_status는 `returns public.holywin_entries`(단일 행 전체)라
-- 응답 JSON에 pin_hash가 그대로 실린다. 이 RPC들은 SECURITY DEFINER라 위
-- REVOKE의 영향을 받지 않으므로(함수 내부 실행은 함수 소유자 권한으로
-- 동작), 반환 직전 pin_hash 필드를 명시적으로 null로 지워 "응답에 해시를
-- 절대 담지 않는다"는 원칙을 함수 차원에서도 지킨다. 함수를 호출한 그
-- 당사자는 이미 자신이 입력한 평문 PIN을 알고 있어 원래도 실질적인 추가
-- 노출은 아니었지만, 원칙을 일관되게 지키기 위해 3곳 모두 patch한다.
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

  new_row.pin_hash := null;
  return new_row;
end;
$$;

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

  if updated_row.id is not null then
    updated_row.pin_hash := null;
  end if;
  return updated_row;
end;
$$;

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

  if updated_row.id is not null then
    updated_row.pin_hash := null;
  end if;
  return updated_row;
end;
$$;
