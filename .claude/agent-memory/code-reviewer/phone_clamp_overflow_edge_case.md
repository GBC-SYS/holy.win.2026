---
name: phone_clamp_overflow_edge_case
description: .phone의 height:clamp(844px,82vh,1100px)+max-height:100vh 조합이 데스크톱 창 높이가 768px~1030px 사이(모바일 미디어쿼리 미적용 구간)일 때 body의 24px 상하 패딩과 충돌해 스크롤이 생길 수 있음 — 2026-09-22 리뷰에서 발견, Minor로 판정(그레이스풀 디그레이드, 클리핑 아님)
metadata:
  type: project
---

`assets/css/entries.css`의 `.phone`은 `height: clamp(844px, 82vh, 1100px); max-height: 100vh;`로 반응형화되어 있다. 뷰포트 너비가 768px 초과(모바일 미디어쿼리 미적용)이면서 높이가 대략 1030px 미만이면, `82vh`가 844px보다 작아 clamp의 하한(844px)이 강제되고, 그 값이 다시 `max-height: 100vh`로 잘려 사실상 `.phone` 높이 = 100vh가 된다. 여기에 `body { padding: 24px }`(상하 48px)가 더해지므로 `.phone` + body 패딩의 총 높이가 뷰포트를 최대 48px 초과할 수 있다.

**Why:** `body`는 `min-height: 100vh`이고 `overflow` 제어가 따로 없어 실제로는 body 자체가 자라며 페이지 스크롤이 생기는 정도로 그친다(콘텐츠 잘림/깨짐은 아님) — 그래서 2026-09-22 리뷰에서는 Minor로만 지적하고 BLOCKED 사유로 삼지 않았다. 다만 흔한 데스크톱 창 크기(예: 1440×800)에서 재현 가능한 조건이라 완전히 무시할 이슈는 아니다.

**How to apply:** 다음에 `.phone`/`body`의 padding·clamp·max-height 값이 바뀌는 CSS 변경을 리뷰할 때, `max-height: calc(100vh - 48px)` 또는 body padding을 고려한 계산식으로 고쳐졌는지 확인하고, 여전히 안 고쳐졌다면 Minor로 재지적(단, 누적 지적 시 Major로 격상 고려).
