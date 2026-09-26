---
name: project-list-bg-cover-crop-math
description: assets/imgs/list-bg.jpg는 720×1280의 부드러운 보케 톤 사진(선명한 모래언덕 능선 없음)이며, #screen-list/.ticket-hero의 background-size:cover center top 크롭 결과는 뷰포트 폭에 따라 위쪽만 보이는지 전체 높이가 보이는지가 갈린다
metadata:
  name: project-list-bg-cover-crop-math
  type: project
---

`assets/imgs/list-bg.jpg`는 720×1280(세로가 긴, 종횡비 1.778) 크기의 따뜻한 톤 사진으로, 실제로 열어보면 선명한 모래언덕/능선 텍스처가 아니라 부드럽게 블러된 보케(bokeh)풍 그라디언트다 — 크림/피치색 밝은 블롭 몇 개가 흩어져 있는 정도. `#screen-list`와 `.ticket-hero` 둘 다 이 사진을 `center top / cover no-repeat`로 쓴다.

**Why:** `background-size:cover`의 실제 동작은 `scale = max(box_w/img_w, box_h/img_h)`로 정해지는데, 이 프로젝트는 `.container{width:100%; max-width:430px}`라 실제 렌더링 폭이 320~430px 사이에서 계속 바뀌고, 두 배경이 걸리는 박스의 종횡비(높이/폭)가 이미지 종횡비 1.778보다 큰지 작은지에 따라 완전히 다른 부분이 크롭된다:
- `.ticket-hero`: 박스 종횡비가 항상 1.778보다 훨씬 작음(고정 높이 ~254px, 폭 288~398px) → 항상 **폭 기준**으로 스케일 결정, 사진 상단부만 잘려서 보임(좌우 크롭 없음). 폭이 좁아질수록 스케일이 작아져 사진의 더 아래쪽까지 노출된다.
- `#screen-list`: `.screen{min-height:100vh}`라 박스 높이가 뷰포트 높이(리스트가 짧으면 뷰포트 높이 그대로)인데, 최근 스마트폰 종횡비(예: 390×844 → 2.16)는 이미지 종횡비(1.778)보다 크므로 **높이 기준**으로 스케일이 결정될 수 있다 — 이 경우 사진 전체 높이가 보이고 대신 좌우가 크롭된다. 두 경우 모두 헤더 텍스트(`.title`/`.subtitle`/`.group-label`)가 실제로 어떤 사진 픽셀 위에 놓이는지가 뷰포트마다 달라진다.

**How to apply:** 이 사진의 배치(포지션, 크롭, 틴트/스크림 알파)를 다시 조정할 일이 생기면, "예전에 확인했던 폭에서는 괜찮았다"는 근거를 재사용하지 말고 [[feedback-photo-bg-contrast-needs-pixel-math]]의 절차대로 320~430px 전 구간을 다시 계산할 것. 현재(2026-09-25 기준) 코드에는 오렌지 틴트(`rgba(232,98,44,.5)`)만 있고 대비 보정용 무채색 스크림은 사용자가 명시적으로 삭제 요청해 제거된 상태다(트레이드오프를 안내한 뒤 사용자가 사진 노출도를 우선시하기로 결정) — 즉 현재 상태는 WCAG 마진이 타이트하거나 일부 뷰포트에서 기준 미달일 수 있음을 알고 있는 채로 유지 중이다.
