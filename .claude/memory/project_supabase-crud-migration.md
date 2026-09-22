---
name: project-supabase-crud-migration
description: 홀리윈 2026 앱의 로그인 없는 Supabase 기반 CRUD(등록/조회/수정/삭제) 도입 — 2026-09-22 6단계 전부 완료·배포됨
metadata: 
  node_type: memory
  type: project
  originSessionId: 3dd53893-19af-4039-989f-1c627d9c21fa
  modified: 2026-09-22T10:46:51.741Z
---

`assets/data/entries.json` 정적 fetch + localStorage 상태 오버레이 방식을 걷어내고, 로그인/회원가입 없이 Supabase로 실제 CRUD를 구현하는 작업이었다. 계획 전체는 `.claude/plans/crystalline-enchanting-perlis.md`(6단계)에 있다.

**2026-09-22 기준 6단계 전부 완료.** 1~3단계는 커밋 `df1910d`, 4~6단계(상태 토글 UPDATE 전환, 등록 바텀시트 INSERT, 수정/삭제 UI + "내가 쓴 글" 필터)는 커밋 `db5e447`로 `origin/main`에 푸시 완료됨. 이 메모리는 더 이상 "진행 중" 정보가 아니라 앞으로 이 CRUD 기능을 건드릴 때 알아야 할 확정 결정 사항만 남긴다.

**계속 유효한 확정 결정:**
1. **소유권 모델은 Supabase Anonymous Sign-In.** 로그인 UI 없이 `auth.uid()`로 RLS 판별. 한계: 브라우저 데이터를 지우거나 다른 기기로 접속하면 본인 글이라도 재수정/삭제 불가 — 사용자가 이 트레이드오프를 인지하고 승인함.
2. **"이번 주"/"이전" 구분은 `submitted_at` 기준 7일 이내를 클라이언트에서 파생 계산.**
3. **새 Supabase 테이블은 반드시 `holywin_` 접두사를 붙인다**(예: `entries` → `holywin_entries`). 앞으로 추가되는 다른 테이블에도 동일 적용.
4. 소프트 삭제는 일반 `.update()`가 아니라 `security definer` RPC(`holywin_soft_delete_entry`, `supabase/migrations/0003_soft_delete_rpc.sql`)를 통해서만 한다 — PostgREST가 UPDATE에 암묵적으로 구성하는 `RETURNING *`이 SELECT RLS 정책과 충돌해 일반 UPDATE로는 소프트 삭제가 구조적으로 불가능했기 때문(경위는 커밋 메시지 참고).

**Why:** 사용자가 "본인이 작성한 전도 대상자를 따로 보고 수정하고 싶다"며 실제 CRUD를 요청했고, 순수 로컬(localStorage)만으로는 기기 간 공유가 안 되어 명시적으로 거절했다.

**How to apply:** 이 기능을 다시 건드릴 일이 생기면 위 4가지 결정을 전제로 작업할 것. Supabase 프로젝트가 다른 앱(`statkit.cms.api`)과 공유된다는 점은 [[project-supabase-shared-project-conflict]] 참고. 배포 후 PWA/아이콘 관련 후속 작업은 [[project-github-pages-deployment]] 참고.
