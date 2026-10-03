---
name: postgrest-rpc-null-object-quirk
description: returns table_type(단일 행) RPC 함수가 SQL에서 진짜 NULL을 반환해도 PostgREST REST 응답은 모든 필드가 null인 객체로 온다 — 클라이언트는 !data가 아니라 !data?.id로 체크해야 함
metadata:
  type: project
  modified: 2026-09-30
---

`returns public.table_type`(단일 행)로 선언된 Postgres 함수가 매치 실패 등으로 SQL 레벨에서 실제 `NULL`을 반환해도, Supabase PostgREST가 감싸는 REST 응답 JSON은 `null`이 아니라 `{"id":null, "to_name":null, ...}`처럼 모든 필드가 null인 객체로 온다. 클라이언트에서 `if (!data)`로 체크하면 이 객체가 truthy라서 실패 케이스를 성공으로 오판한다.

**Why:** `holywin_update_status`/`holywin_update_entry`가 잘못된 비밀번호 입력 시 SQL에서는 NULL을 반환하는데, `assets/js/entries.js`가 `if (!data)`로 체크해서 실패를 성공처럼 처리해버렸다(UI에 "완료"로 잘못 표시됐다가 새로고침 후 실제로는 "기도 중"임이 드러나 발견됨, 2026-09-30). curl로 `rpc/holywin_update_status`를 직접 호출해 원인을 확정함.

**How to apply:** 이 프로젝트에서 `returns <table_type>`(단일 행) RPC를 새로 추가하거나 호출부를 작성할 때, 항상 `if (!data?.id)` 같은 필드 단위 체크를 쓸 것 — `!data`만으로는 실패 케이스를 못 잡는다. [[postgres-column-revoke-trap]]과 함께 "화면상 성공처럼 보여도 실제 DB 반영을 직접 재검증해야 한다"는 같은 교훈의 다른 사례.
