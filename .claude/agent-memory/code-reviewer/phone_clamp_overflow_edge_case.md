---
name: container_margin_scroll_note
description: .container(구 .phone)의 스크롤 사이드이펙트 이력 — 2026-09-22 낮 clamp/max-height 기반 엣지케이스는 완전히 해소됐고, 같은 날 저녁 margin-top:40px 추가로 다른 성격의(상시, 40px 고정) 스크롤이 새로 생김
metadata:
  type: project
---

**1세대 이슈(해소됨, 2026-09-22 낮):** 과거 `.phone`은 `height: clamp(844px, 82vh, 1100px); max-height: 100vh;`였고, 데스크톱 창 높이 768~1030px 구간에서 body의 24px 상하 패딩과 겹쳐 최대 48px까지 페이지 스크롤이 생길 수 있는 조건부 엣지케이스였다(Minor). 이후 스크롤 아키텍처 전체가 고정 박스+내부 스크롤에서 네이티브 document 스크롤로 리팩터링되면서 `clamp`/`max-height`/`overflow` 관련 속성이 `.container`에서 전부 제거되어 이 메커니즘 자체가 사라졌다.

**2세대 이슈(2026-09-22 저녁, 현재 상태):** 리네이밍(`.phone`→`.container`)과 함께 `.container`에 `margin: 40px auto 0`이 추가됨. 현재 `.container`는 `min-height: 100dvh`이고 `body`에는 padding이 없으므로(`init.css`가 `* { margin:0; padding:0 }` 리셋), 문서 전체 높이는 최소 `100dvh + 40px`가 되어 뷰포트 크기·구간과 무관하게 **항상** 약간의(40px) 페이지 스크롤이 생긴다 — 특정 창 높이 구간에서만 재현되던 1세대와 달리 상시 재현되는 대신 폭도 40px로 작고 고정적이라 그레이스풀하다. 사용자가 "떠 있는 카드" 느낌을 위해 의도적으로 요청한 트레이드오프로 확인됨(2026-09-22 리뷰에서 Minor/정보성으로만 지적, BLOCKED 사유 아님).

**Why:** 두 이슈 모두 원인 메커니즘이 다르므로(1세대: clamp+max-height 상호작용, 2세대: margin-top+min-height 상호작용) 혼동하지 말 것. 1세대 메커니즘은 코드에서 완전히 사라졌으니 재발 여부를 확인할 때 `clamp`/`max-height`를 찾는 것은 의미 없다.

**How to apply:** 다음에 `.container`의 `margin`/`min-height`/`padding` 값이 바뀌는 CSS 변경을 리뷰할 때, `margin-top` 값이 늘어나면 상시 스크롤 폭도 그만큼 커진다는 점만 확인하고 Minor로 지적(사용자가 이미 승인한 트레이드오프이므로 재지적은 정보성에 그친다 — 값이 40px보다 눈에 띄게 커지면 그때 격상 고려).
