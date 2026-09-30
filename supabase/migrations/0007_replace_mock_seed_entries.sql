-- =============================================================================
-- 0007_replace_mock_seed_entries.sql — 0004의 목(mock) 시드 5건을 지우고
-- 새 목 시드 5건으로 교체한다.
-- =============================================================================
--
-- ⚠️ 데모 전용: 아래 INSERT는 평문 PIN(1111~5555)을 그대로 crypt() 인자로
-- 적어뒀다. sentinel owner_id를 쓰는 목데이터에 한해, 사용자가 명시적으로
-- "비밀번호를 알면 앱에서 수정/삭제를 시연할 수 있게 해달라"고 요청해 넣은
-- 것이다(0006_restrict_pin_hash_select.sql로 pin_hash 컬럼 SELECT 자체가
-- anon/authenticated에 차단돼 있어 이 값이 API로 노출되지는 않는다). 실사용자
-- 데이터나 향후 다른 마이그레이션에 이 "평문 PIN을 파일에 적어두는" 패턴을
-- 재사용하지 말 것 — 실제 사용자의 PIN은 반드시 클라이언트가 런타임에
-- 입력받아 RPC로 전달해야 하며, 마이그레이션 파일에 하드코딩해서는 안 된다.
--
-- 0004_reset_seed_entries.sql이 넣어둔 시드 5건(지원/최부장님/삼촌/민석/하윤)을
-- 전부 지우고, 새 목 시드 5건을 같은 방식으로 넣는다. 새 시드도 이전과 동일하게
-- 존재하지 않는 sentinel owner_id('00000000-0000-0000-0000-000000000000')를
-- 쓴다 — 다만 0005_pin_ownership.sql 이후로는 owner_id/auth.uid()가 더 이상
-- 수정/삭제 권한을 판별하지 않으므로(순수 비밀번호 해시 검증만이 판별), 이
-- sentinel 값 자체는 더 이상 "읽기 전용"을 보장하지 않는다. 대신 이번엔 각
-- 행마다 pin_hash를 pgcrypto로 직접 채워, 데모용으로 비밀번호를 알면 앱에서
-- 정상적으로 수정/삭제·상태변경까지 시연할 수 있게 한다(아래 표 참고).
--
-- anon/authenticated role에는 DELETE 권한 자체가 부여돼 있지 않으므로
-- (0001_init.sql), 테이블 소유자(postgres) 권한으로 Supabase Dashboard →
-- SQL Editor에서 직접 실행해야 한다(이 저장소 규칙대로 에이전트가 직접
-- 실행하지 않고 파일로만 작성한다).
--
-- owner_id 값으로 정확히 타겟팅해 삭제하므로, 혹시 실제 사용자가 등록한
-- 데이터가 섞여 있어도 잘못 지우지 않는다.
--
-- owner_id는 not null references auth.users(id)이므로, 존재하지 않는
-- sentinel UUID를 그냥 INSERT하면 FK 위반(23503)으로 실패한다(0001/0004와
-- 동일한 문제). INSERT 직전에 FK 제약을 DROP했다가 직후 NOT VALID로
-- 재생성해, 이 sentinel 시드만 검증에서 면제하고 이후 실제 INSERT/UPDATE는
-- 여전히 FK 검사를 받도록 한다.
-- =============================================================================

-- 각 행의 비밀번호(데모용, 앱에서 수정/삭제 시 그대로 입력하면 됨):
--   서연   → 1111
--   병훈이형 → 2222
--   예은   → 3333
--   할머니  → 4444
--   태윤   → 5555

delete from public.holywin_entries
where owner_id = '00000000-0000-0000-0000-000000000000';

alter table public.holywin_entries drop constraint if exists holywin_entries_owner_id_fkey;

insert into public.holywin_entries (to_name, from_name, relation, status, submitted_at, owner_id, pin_hash)
values
  ('서연',   '지훈', '대학 동기',   '기도 중', '2026-09-25 08:15:00+09', '00000000-0000-0000-0000-000000000000', extensions.crypt('1111', extensions.gen_salt('bf'))),
  ('병훈이형', '민경', '직장 선배',   '기도 중', '2026-09-24 20:40:00+09', '00000000-0000-0000-0000-000000000000', extensions.crypt('2222', extensions.gen_salt('bf'))),
  ('예은',   '소민', '룸메이트',    '완료',   '2026-09-23 11:05:00+09', '00000000-0000-0000-0000-000000000000', extensions.crypt('3333', extensions.gen_salt('bf'))),
  ('할머니', '정우', '가족',       '기도 중', '2026-09-22 07:50:00+09', '00000000-0000-0000-0000-000000000000', extensions.crypt('4444', extensions.gen_salt('bf'))),
  ('태윤',   '하린', '헬스장 친구', '완료',   '2026-09-21 19:30:00+09', '00000000-0000-0000-0000-000000000000', extensions.crypt('5555', extensions.gen_salt('bf')));

alter table public.holywin_entries
  add constraint holywin_entries_owner_id_fkey
  foreign key (owner_id) references auth.users(id) on delete set null
  not valid;
