-- =============================================================================
-- 0004_reset_seed_entries.sql — 테스트 중 쌓인 데이터를 지우고, 실제 사용 상황에
-- 맞는 시드 5건으로 초기화한다.
-- =============================================================================
--
-- 지우는 대상: holywin_entries의 기존 행 전부 (0001_init.sql의 초기 시드 5건 +
-- 이후 앱 테스트 중 익명 세션으로 등록된 행들, 예: "Tear"/"Shzhsh"/"Susj" 등).
--
-- anon/authenticated role에는 DELETE 권한 자체가 부여돼 있지 않다
-- (0001_init.sql: "DELETE는 어떤 역할에도 부여하지 않는다") — 클라이언트나
-- 익명 세션으로는 이 초기화가 불가능하고, 테이블 소유자(postgres) 권한으로
-- Supabase Dashboard → SQL Editor에서 직접 실행해야 한다. 이 저장소 규칙대로
-- 에이전트가 직접 실행하지 않고 파일로만 작성한다.
--
-- 새로 넣는 5건은 0001_init.sql의 시드와 동일하게 존재하지 않는 sentinel
-- owner_id(00000000-0000-0000-0000-000000000000)를 써서, 어떤 익명 세션의
-- auth.uid()와도 일치하지 않는 "사실상 읽기 전용" 데이터로 만든다(누구도
-- RLS의 owner_id = auth.uid() 조건을 통과할 수 없으므로 앱에서 수정/삭제 불가).
--
-- owner_id는 not null references auth.users(id)이므로, 존재하지 않는 sentinel
-- UUID를 그냥 INSERT하면 FK(참조 무결성) 위반(23503)으로 실패한다
-- (0001_init.sql과 동일한 문제). 그래서 0001_init.sql과 같은 방식으로 INSERT
-- 직전에 FK 제약을 DROP했다가 직후 NOT VALID로 재생성한다 — DROP/ADD
-- CONSTRAINT는 테이블 소유자 권한만으로 가능하고(슈퍼유저 불필요),
-- NOT VALID로 재추가하면 이미 있는 행(이번 sentinel 시드)만 검증에서
-- 면제되고 이후의 모든 실제 INSERT/UPDATE는 여전히 FK 검사를 받는다.
-- =============================================================================

delete from public.holywin_entries;

alter table public.holywin_entries drop constraint if exists holywin_entries_owner_id_fkey;

insert into public.holywin_entries (to_name, from_name, relation, status, submitted_at, owner_id)
values
  ('지원',   '하은', '친구',       '기도 중', '2026-09-22 09:30:00+09', '00000000-0000-0000-0000-000000000000'),
  ('최부장님', '도윤', '직장동료',   '기도 중', '2026-09-21 18:10:00+09', '00000000-0000-0000-0000-000000000000'),
  ('삼촌',   '은서', '가족',       '완료',   '2026-09-20 21:00:00+09', '00000000-0000-0000-0000-000000000000'),
  ('민석',   '유진', '동아리 선배', '기도 중', '2026-09-19 13:45:00+09', '00000000-0000-0000-0000-000000000000'),
  ('하윤',   '채원', '이웃',       '완료',   '2026-09-17 10:20:00+09', '00000000-0000-0000-0000-000000000000');

alter table public.holywin_entries
  add constraint holywin_entries_owner_id_fkey
  foreign key (owner_id) references auth.users(id) on delete set null
  not valid;
