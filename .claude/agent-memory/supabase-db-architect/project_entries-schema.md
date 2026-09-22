---
name: project_entries-schema
description: holy.win.2026의 entries 테이블 베이스라인 스키마(0001_init.sql)와 RLS 설계, FK/시드 관련 알려진 이슈
metadata:
  type: project
---

베이스라인 파일: `supabase/migrations/0001_init.sql` (아직 실제 DB에 실행 전,
사용자가 Dashboard SQL Editor에서 직접 실행해야 함 — 이 저장소에는
`supabase/backups/`가 없으므로 statkit.cms.api 프로젝트의 백업 프로토콜은
이 프로젝트엔 적용되지 않는다).

**스키마**: `public.entries(id bigint identity pk, to_name, from_name, relation
text not null <=50자, status text default '기도 중' check in ('기도 중','완료'),
submitted_at timestamptz default now(), owner_id uuid not null default
auth.uid() references auth.users(id) on delete set null, deleted_at timestamptz)`.

**RLS**: SELECT 공개(`deleted_at is null`만), INSERT 공개하되
`with check (owner_id = auth.uid())` 필수(그냥 `default auth.uid()`만으로는
클라이언트가 다른 owner_id를 명시적으로 보내는 것을 못 막음), UPDATE는
`using/with check (owner_id = auth.uid())` 하나로 일반 수정 + soft delete
(deleted_at 채우기)를 모두 커버. 실제 DELETE 권한은 어떤 역할에도 부여 안 함
(GRANT 단계에서부터 제외, 정책도 없음).

**알려진 설계 충돌 (구현은 스펙대로 진행, 캐비어트로만 기록)**: owner_id가
`not null` + `on delete set null`을 동시에 가지면, 실제로 참조된 auth.users
행이 삭제될 때 FK 액션이 owner_id를 NULL로 바꾸려다 not null 제약과
충돌해서 그 auth.users 삭제 자체가 실패(롤백)한다. 사용자 스펙을 그대로
따르되 이 한계를 마이그레이션 파일 주석에 남겨둠. Anonymous Sign-In은
auth.users 행을 자동으로 삭제하지 않으므로 당장 실무에 영향은 없음.

**시드 데이터의 FK 문제와 해결책**: 시드 5건(entries.json에서 이관)은 owner_id를
존재하지 않는 sentinel UUID `00000000-0000-0000-0000-000000000000`로 지정해서
아무도 UPDATE 정책을 통과 못 하는 사실상 읽기 전용 데이터로 만들었다. 하지만
owner_id가 `not null references auth.users(id)`라 그냥 넣으면 FK 위반으로 실패.
해결: FK 제약 자체는 유지하되(평소 클라이언트 INSERT는 항상 유효한
auth.uid()를 가지므로), 시드 INSERT 구간에서만
`ALTER TABLE entries DISABLE TRIGGER ALL` → INSERT → `ENABLE TRIGGER ALL`로
FK 검사(내부적으로 트리거 구현)를 일시적으로 우회했다. RLS는 트리거가 아니라
영향 없음. 시드 INSERT 자체는 `DO $$ ... IF NOT EXISTS (SELECT 1 FROM entries) ...`
로 감싸 idempotent하게 만듦(빈 테이블일 때만 1회 시드).

**Why**: 사용자가 명시적으로 "FK를 두되 시드 INSERT 시점에만 예외적으로
허용되는 방법을 제시하라"고 요청했고, auth.users에 가짜 행을 직접 INSERT하는
방식(Supabase GoTrue 내부 컬럼 요구사항 때문에 깨지기 쉬움)보다 트리거
일시 비활성화가 더 안전하다고 판단했다.

**How to apply**: 향후 마이그레이션에서 auth.users를 참조하는 FK 컬럼에
시드/마이그레이션 데이터를 넣어야 할 때 이 패턴(DISABLE TRIGGER ALL 구간)을
재사용할 수 있다. 스키마를 바꿀 때는 이 파일과 `0001_init.sql`을 함께
갱신해야 한다.
