---
name: postgres-column-revoke-trap
description: 테이블 단위 GRANT SELECT가 있으면 컬럼 단위 REVOKE SELECT (col)은 아무 효과가 없다 — 반드시 테이블 단위 REVOKE 후 컬럼 단위 GRANT로 재작성해야 함(Supabase 프로젝트 실사고 사례)
metadata:
  type: project
  modified: 2026-09-30
---

PostgreSQL에서 `grant select on table t to role`(테이블 전체)이 이미 걸려있는 상태에서 `revoke select (col) on table t from role`(컬럼 단위)만 실행하면, 테이블 단위 권한이 여전히 살아있어 해당 컬럼도 계속 조회된다. `has_column_privilege(role, 'schema.table', 'col', 'select')`로 확인해도 계속 true가 나온다. 올바른 패턴은 Supabase 공식 column-level-security 가이드대로 테이블 단위 권한을 통째로 회수한 뒤 컬럼 단위로 다시 부여하는 것이다:
```sql
revoke select on table schema.t from role;
grant select (안전한_컬럼_목록) on table schema.t to role;
```

**Why:** `holywin_entries.pin_hash` 컬럼을 anon/authenticated로부터 숨기려고 처음에 컬럼 단위 REVOKE만 썼다가, Dashboard SQL Editor에서 "Success" 메시지가 떠도 실제로는 전혀 차단되지 않는 Critical 취약점(2026-09-30)으로 이어졌다. [[verify-db-changes-empirically]] 습관대로 `has_column_privilege`/curl로 직접 재검증하다가 발견했고, 사용자에게 명확히 사과 후 `supabase/migrations/0006_restrict_pin_hash_select.sql`을 "테이블 단위 REVOKE → 컬럼 단위 재GRANT" 패턴으로 재작성해 해결함(curl로 401 차단 확인, `has_column_privilege` false 확인까지 완료).

**How to apply:** 이 프로젝트(또는 다른 Supabase 프로젝트)에서 민감 컬럼을 특정 role로부터 숨겨야 할 때, 컬럼 단위 REVOKE만 쓰지 말고 항상 "테이블 단위 REVOKE → 컬럼 단위 재GRANT" 패턴을 기본으로 쓸 것. 적용 후에는 Dashboard의 "Success" 메시지를 신뢰하지 말고 직접 검증할 것.
