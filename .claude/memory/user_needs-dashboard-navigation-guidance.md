---
name: user-needs-dashboard-navigation-guidance
description: "사용자는 Supabase Dashboard, DevTools 등 개발 도구 UI 탐색에 익숙하지 않음 — 클릭 단위로 구체적인 경로/버튼명을 짚어줘야 함"
metadata: 
  node_type: memory
  type: user
  originSessionId: 3dd53893-19af-4039-989f-1c627d9c21fa
  modified: 2026-09-22T08:20:34.893Z
---

사용자는 SQL을 직접 실행할 줄 알고 코드/UI 요청은 정확하게 하지만, Supabase Dashboard나 브라우저 DevTools처럼 익숙하지 않은 도구의 화면 탐색에는 어려움을 겪는다. 세션 중 실제로 있었던 일들:
- "DevTools Console 어디야?"라고 직접 물어봄 — 메뉴 위치나 단축키를 미리 안내하지 않으면 막힘
- Dashboard의 "Allow anonymous sign-ins" 경고 문구(익명 사용자가 `authenticated` role을 쓴다는 안내)를 보고 무엇을 해야 할지 몰라 캡처해서 물어봄
- Supabase 공식 문서의 `is_anonymous` RLS 예시 코드를 보고 "이것을 수정해서 넣으려고 하는데 어떻게 수정해?"라며 프로젝트에 안 맞는 예시를 그대로 적용하려 시도함
- Database → Functions 편집 화면에서 어느 부분이 "Definition"이고 어디를 더 스크롤해야 하는지 여러 차례 캡처를 주고받으며 확인함

**Why:** 코드 작성/요청 자체는 명확하지만, 백엔드 대시보드·브라우저 개발자 도구처럼 비개발 업무에서 잘 안 쓰는 UI의 이름/위치/의미는 낯설어 보인다. [[feedback-ambiguous-visual-requests]]와 마찬가지로 Chrome 자동화가 연결되지 않아, 사용자가 직접 화면을 조작하고 캡처를 보내주는 것이 유일한 상호작용 경로라는 점도 겹친다.

**How to apply:** Supabase Dashboard, DevTools, 터미널 등 GUI/도구 조작이 필요한 안내를 할 때는 "어디를 클릭"/"몇 번째 항목"까지 구체적으로 짚어줄 것(예: "Dashboard 왼쪽 메뉴 → Database → Functions"). 사용자가 스크린샷을 보내면 그 화면에서 정확히 다음에 뭘 눌러야 하는지까지 이어서 안내한다. 공식 문서나 예시 코드를 보여줄 때는 "이게 왜 지금 프로젝트에 필요 없는지/필요한지"를 먼저 판단해서 알려주고, 그대로 적용해도 되는지 여부를 사용자가 판단하게 두지 않는다(수정 없이 그대로 실행하려다 문법 에러를 낸 전례 있음).
