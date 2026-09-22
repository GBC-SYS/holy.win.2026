---
name: gitignore_supabase_client_bug
description: .gitignore에 assets/js/supabase-client.js가 추가되어 있어 커밋 시 이 파일이 저장소에 포함되지 않는 치명적 버그 — 2026-09-22 Supabase 읽기 전환(3단계) 커밋 전 리뷰에서 발견
metadata:
  type: project
---

`.gitignore` 마지막 줄(147번째 줄)에 `assets/js/supabase-client.js`가 추가되어 있다. 이 파일은 [[project_repo_nature]]에서 다루는 정적 앱의 핵심 스크립트로, `index.html`이 `<script src="./assets/js/supabase-client.js">`로 직접 로드하고 `entries.js`가 이 파일이 만드는 `window.supabaseClient`/`window.supabaseReady`에 의존한다.

`git status`에 이 파일이 `??`(untracked)로조차 뜨지 않은 것으로 보아(2026-09-22 확인), 이미 생성된 상태에서 gitignore 규칙에 걸려 추적 대상에서 빠져 있었다. 이 상태로 커밋하면 그 커밋에는 `supabase-client.js`가 포함되지 않고, 저장소를 새로 clone하거나 배포하는 순간 `index.html`이 참조하는 스크립트가 404가 되어 `entries.js`의 `window.supabaseReady.then(...)` 호출이 `Cannot read properties of undefined` 에러로 죽는다 — 전체 앱(리스트 로딩)이 완전히 깨진다.

**Why:** anon key는 공개 키라 `.env` 처리 없이 코드에 하드코딩하는 것이 이 프로젝트의 명시적 결정([[project_supabase_migration]] 참고, RLS가 실제 접근 제어를 담당)인데, 아마 이 결정과 반대로 "API 키가 든 파일이니 gitignore해야 한다"는 일반적인 반사作용으로 실수로 추가된 것으로 보인다. 프로젝트 결정과 정면으로 모순되는 설정이다.

**How to apply:** 다음 리뷰에서 `.gitignore`에 `assets/js/*.js` 관련 패턴이 다시 나타나는지, 그리고 `supabase-client.js`가 실제로 `git ls-files`/커밋에 포함되는지 반드시 재확인할 것. 재발하면 Critical(BLOCKED)로 즉시 지적.

**해소 확인(2026-09-22, 6단계 완료 후 최종 리뷰):** `.gitignore` 전체를 다시 읽어 `assets/js/supabase-client.js` 줄이 더 이상 없음을 확인함. 같은 커밋에 `.gitignore` 자체도 수정 대상(`M .gitignore`)으로 포함되어 있어, 이번 커밋이 실제로 이 버그를 고친 것으로 보인다. 계속 재발 여부만 추적.
