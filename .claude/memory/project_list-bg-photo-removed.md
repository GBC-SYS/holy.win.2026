---
name: project-list-bg-photo-removed
description: assets/imgs/list-bg.jpg 배경 사진을 2026-09-29에 완전히 삭제하고 #screen-list/.ticket-hero를 단색 배경으로 교체함 — 데이터가 늘어날수록 cover 크롭이 배경을 깨뜨리는 문제가 원인
metadata:
  name: project-list-bg-photo-removed
  type: project
---

`assets/imgs/list-bg.jpg`(720×1280, 보케톤 사진)를 `#screen-list`/`.ticket-hero` 배경으로 `background-size: cover`로 써왔는데, 무한 스크롤 기능 테스트로 더미 데이터를 대량으로 넣어보니 `#screen-list`가 데이터 양만큼 계속 길어지는 요소라서 `cover`가 그 늘어난 세로 비율을 맞추려고 사진을 점점 더 확대해, 카드가 많아질수록 배경이 심하게 깨져 보이는 문제가 드러났다.

**Why:** `background-size: cover`는 요소 박스 전체를 이미지로 덮도록 스케일을 정하는데, 이 사진은 원래 9:16(휴대폰 한 화면 분량) 비율로 만들어져 있어 박스가 그보다 훨씬 길어지면(예: 카드 수십~수백 개) 가로 기준 확대율이 극단적으로 커져 사진의 아주 좁은 세로 띠 하나만 거대하게 늘린 것처럼 보인다. `.ticket-hero`는 높이가 고정된 영역이라 이 문제가 없었지만, 사용자는 두 곳 다 같은 문제의 소지를 없애기 위해 사진을 완전히 제거하고 통일하기로 결정했다.

**How to apply:** 사진을 다시 넣지 말 것. 대신 이미 이 앱에 있던 `.ig-story-action`(entries.css)과 같은 레시피 — `background: var(--glass-sheen), rgba(232, 98, 44, 0.82);` — 로 통일했다. 이 레시피는 요소 높이와 무관하게 항상 동일하게 보이므로, 데이터 양에 관계없이 절대 깨지지 않는다. `.ticket-hero`의 `backdrop-filter`도 함께 제거했다 — 사진이 없어지면서 흐리게 비칠 대상이 없어져 무의미해졌기 때문. `docs/02-colors.md`/`06-elevation.md`/`09-shadcn-tokens.md`의 "배경 사진 위에 얹는 유리캡" 설명도 함께 갱신했다. `--glass-*` 토큰 자체는 계속 쓰이므로(카드·칩·탭·버튼 등) 삭제하지 않았다.

과거 이 사진의 cover 크롭 수식과 텍스트 대비 검증 이력은 [[feedback-photo-bg-contrast-needs-pixel-math]] 참고 — 사진 자체는 없어졌지만 "사진(유사) 배경 위 텍스트는 뷰포트 전 구간 픽셀 계산으로 검증한다"는 원칙은 향후 유사 작업에 여전히 유효하다.

**후속 발견(같은 날, 2026-09-29):** 사진 제거 당시 배경만 단색(`rgba(232, 98, 44, 0.82)`, 흰 계열보다 어두운 주황)으로 바꾸고, 그 위에 있던 텍스트 색(`.title`/`.subtitle`/`.group-label`/`.list-empty`/티켓 화면 `.topbar-title`/`.ticket-name`/`.ticket-from` 등)은 예전 사진(어두운 보케톤) 기준으로 맞춰둔 `--paper`(흰색) 그대로 방치되어 있었다. 사용자가 스크린샷 두 장을 보여주며 "검정색으로 바꿔달라"고 한 뒤에야 순차적으로 발견되어 전부 `--ink`로 교체했다(리스트 화면 먼저, 이후 code-reviewer가 "티켓 화면도 같은 배경 레시피인데 아직 안 고쳤다"고 Minor로 지적해서 마저 처리). **배경을 사진→단색으로 바꾸는 작업을 할 때는 그 위에 얹히는 모든 텍스트의 색상도 한 번에 함께 점검할 것** — 배경 밝기가 달라지면 대비가 깨질 수 있는데, 이게 한 파일 안에 흩어져 있어 한 번에 안 잡히고 여러 차례 걸쳐 발견됐다.
