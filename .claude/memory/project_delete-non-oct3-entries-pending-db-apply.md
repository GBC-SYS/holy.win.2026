---
name: delete-non-oct3-entries-pending-db-apply
description: 10월 3일(KST) 외 날짜 레코드 영구 삭제 마이그레이션(0008) 작성됨, DB 미적용
metadata:
  type: project
---

`supabase/migrations/0008_delete_non_oct3_entries.sql` 작성 완료(2026-10-03), 아직 Supabase Dashboard SQL Editor에서 실행되지 않음 — 커밋/작성만 끝난 상태이고 실제 DB의 `holywin_entries` 테이블에는 아직 반영 안 됨.

내용: id 125~130 (서연 9/25, 병소정 9/24, 예은 9/23, 할머니 9/22, 태윤 9/21, 홍길동 10/1 — 전부 submitted_at을 Asia/Seoul로 환산한 날짜 기준) 영구 하드 DELETE. id 131~143(10/3 등록분, 13건)은 보존.

**Why:** 사용자가 "10월 3일 데이터 외 모두 삭제"를 요청. MCP supabase 연결이 `read_only=true`라 에이전트가 직접 DELETE 실행 시 `cannot execute DELETE in a read-only transaction` 에러 발생 — [[project_supabase-crud-migration]]/[[project_mock-seed-v2-pending-db-apply]]와 동일한 저장소 관례(쓰기는 파일로만 작성, Dashboard에서 사용자가 수동 실행)를 다시 따름. 완전 영구 삭제(소프트 삭제 아님) 방식과 KST 기준은 AskUserQuestion으로 사용자가 명시적으로 선택.

**How to apply:** 이후 세션에서 "10월 3일 데이터만 남았는지" 또는 "6건이 안 지워졌다" 같은 질문이 나오면, 먼저 이 마이그레이션이 Dashboard에서 실행됐는지 SQL로 재확인([[feedback_verify-db-changes-empirically]]) — 파일 존재만으로 DB 상태를 단정하지 말 것.
