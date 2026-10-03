---
name: verify-db-changes-empirically
description: 사용자가 "적용했어/실행했어"라고 말해도, DB 권한·데이터 변경은 has_column_privilege/curl 등으로 직접 재검증할 것 — Dashboard의 "Success" 메시지는 실제 효과를 보장하지 않음
metadata:
  type: feedback
  modified: 2026-09-30
---

Supabase Dashboard SQL Editor가 "Success. No rows returned"를 띄워도, 그 SQL 자체가 의도한 효과를 내지 못했을 수 있다(예: [[postgres-column-revoke-trap]]). 사용자가 마이그레이션을 실행했다고 여러 차례(스크린샷 포함) 확인해줘도, 코드를 작성한 쪽이 직접 `has_column_privilege()`/`has_table_privilege()`/curl로 재검증하는 습관이 실제 Critical 버그(컬럼 단위 REVOKE 무효)를 잡아냈다.

**Why:** 2026-09-30, `pin_hash` 컬럼 차단 마이그레이션을 사용자가 여러 번 "실행했다"고 확인해줬음에도 `has_column_privilege('anon', ..., 'pin_hash', 'select')`가 계속 true로 나와 재검토했고, 그 결과 사용자 잘못이 아니라 작성한 SQL 자체의 구조적 결함이었음을 발견했다.

**How to apply:** 권한(GRANT/REVOKE), RLS 정책, 데이터 마이그레이션처럼 "화면에 성공 메시지가 뜨는 것"과 "실제 효과"가 분리될 수 있는 작업은, 사용자의 확인만으로 끝내지 말고 항상 직접 쿼리(has_*_privilege, curl로 REST 응답 확인 등)로 재검증한 뒤 완료 보고할 것.
