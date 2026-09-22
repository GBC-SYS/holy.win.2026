-- =============================================================================
-- 0003_soft_delete_rpc.sql — 소프트 삭제가 RLS RETURNING 가시성 문제로
-- 항상 403(42501)에 걸리던 문제를 RPC 함수로 우회
-- =============================================================================
--
-- 문제 상황: `holywin_entries_update_own` 정책은 정상이다
-- (using/with check 모두 `owner_id = auth.uid()`). 그런데 클라이언트에서
-- `update({ deleted_at: now() }).eq('id', ...)`를 실행하면 본인 글이어도
-- 매번 `42501 new row violates row-level security policy`로 실패했다.
--
-- 실제 원인(curl로 직접 재현해 확정): PostgREST는 `.select()`를 호출하지
-- 않아도(Prefer: return=minimal이어도) 내부적으로 항상
-- `UPDATE ... RETURNING *`로 SQL을 구성한다. 이 RETURNING 결과에도
-- holywin_entries_select_public 정책(`using (deleted_at is null)`)이 그대로
-- 적용되는데, 소프트 삭제는 정의상 그 행을 이 SELECT 정책에서 더 이상 보이지
-- 않게 만드는 동작이다. Postgres는 이 경우 RETURNING 결과를 조용히 생략하는
-- 게 아니라 곧바로 에러를 던진다. 즉 "deleted_at is null"인 SELECT 정책과
-- 일반 UPDATE 경로를 통한 소프트 삭제는 구조적으로 함께 쓸 수 없다
-- (owner_id를 바꾸지 않는 다른 필드 수정이나, status 토글은 deleted_at을
-- 안 건드리므로 이 문제가 없다 — 실제로 curl 테스트에서 relation 수정은
-- 항상 성공했고 deleted_at을 null이 아닌 값으로 바꾸는 시도만 매번 실패했다).
--
-- 해결: 소프트 삭제 전용 `security definer` 함수를 만든다. 이 함수는 소유자
-- 권한(RLS를 원천적으로 우회하는 권한)으로 실행되므로, 내부 UPDATE가
-- RETURNING·SELECT 정책의 영향을 받지 않는다. 대신 RLS가 원래 하던 소유권
-- 검증(owner_id = auth.uid())을 함수 본문에서 직접 재현해, 다른 사람의 글을
-- 지울 수 없도록 보장한다 — RLS 우회 함수는 그 책임을 함수 스스로 져야 한다.
--
-- 이 마이그레이션은 Supabase Dashboard → SQL Editor에 직접 붙여넣어 실행한다.
-- =============================================================================

create or replace function public.holywin_soft_delete_entry(entry_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected int;
begin
  update public.holywin_entries
  set deleted_at = now()
  where id = entry_id
    and owner_id = auth.uid()
    and deleted_at is null;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

comment on function public.holywin_soft_delete_entry(bigint) is
  '본인 소유(owner_id = auth.uid())이고 아직 삭제되지 않은 글만 소프트 삭제한다. security definer로 RLS RETURNING 가시성 문제를 우회하되, 소유권 검증은 함수 내부에서 직접 수행한다.';

-- 일반 테이블 권한과 별개로, 함수 실행 권한은 명시적으로 부여해야 한다.
revoke all on function public.holywin_soft_delete_entry(bigint) from public;
grant execute on function public.holywin_soft_delete_entry(bigint) to anon, authenticated;
