---
name: mock-seed-v2-pending-db-apply
description: 목데이터가 서연/병훈이형/예은/할머니/태윤 5건(비밀번호 1111~5555)으로 교체하는 마이그레이션(0007)을 작성·커밋했으나, 2026-09-30 기준 실제 Supabase DB에는 아직 미적용
metadata:
  type: project
  modified: 2026-09-30
---

`supabase/migrations/0007_replace_mock_seed_entries.sql`(커밋 f09c3a0)이 0004가 넣은 목데이터 5건(지원/최부장님/삼촌/민석/하윤)을 지우고 새 5건(서연/병훈이형/예은/할머니/태윤)을 sentinel owner_id로 다시 넣는다. 사용자가 "목데이터라도 비밀번호는 만들어달라"고 요청해서, 각 행에 pgcrypto bcrypt로 비밀번호(순서대로 1111/2222/3333/4444/5555)를 채워 앱에서 직접 수정/삭제/상태변경 시연이 가능하게 해뒀다.

**Why:** 처음엔 단순 삭제 요청이었다가 "5가지 목데이터를 만들고 싶어"로 전환됐고, AskUserQuestion으로 "내용은 Claude가 자유롭게 생성 + 삭제 후 교체"를 확정받음. 평문 비밀번호가 마이그레이션 파일에 남는 것은 [[postgres-column-revoke-trap]] 수정(0006) 덕에 API로 노출되지 않는다는 이유로 code-reviewer가 조건부 APPROVED함(데모 전용 경고 주석 추가 권고를 반영해 파일 상단에 명시함).

**How to apply:** 이 파일은 코드/git에는 이미 반영됐지만, DDL은 이 저장소 컨벤션상 에이전트가 직접 실행하지 않으므로(mcp__supabase__execute_sql도 read-only) 사용자가 Dashboard SQL Editor에서 직접 실행해야 실제 DB가 바뀐다. 다음 세션에서 이 목데이터 관련 작업을 이어가기 전에, 먼저 실제 DB에 0007이 적용됐는지(예: `select to_name from holywin_entries`) 확인할 것 — 이 메모리가 "적용됨"을 보장하지 않는다.
