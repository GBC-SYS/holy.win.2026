---
name: project-img-max-width-reset-trap
description: init.css의 전역 img{max-width:100%} 리셋이 100% 초과 확대 레이아웃을 조용히 깨뜨림 — 원인 파악에 시간이 걸리는 함정
metadata:
  type: project
---

`assets/css/init.css`에 `img, picture, video, canvas, svg { max-width: 100%; ... }` 전역 리셋이 있다. `<img>` 요소에 CSS로 `width: 182.55%`처럼 부모(100%) 초과 값을 줘도, 이 리셋이 계산된 폭을 100%로 강제로 눌러버린다.

**Why:** 2026-09-29, `assets/data/holywin_slim.json`(Lottie 애니메이션 JSON)을 참고해 인트로 화면을 순수 CSS로 재현하면서 발견했다. Lottie 레이어 하나를 `width:182.55%; transform:scale(0.4865)`로 배치해야 했는데(스케일 전 큰 박스를 그린 뒤 축소하는 방식), 실제 렌더링 크기가 계산값과 다르게 나왔다. `getBoundingClientRect()`로 여러 차례 실측한 끝에 `computed transform`이 `none`으로 나오는 것과 `width`가 100%로 눌린 것을 확인했고, 이 전역 리셋이 원인임을 특정했다. `.intro-layer { max-width: none; }`로 override해서 해결했다(이후 이 인트로 기능 자체는 사용자 요청으로 전면 삭제됐지만 — [[feedback-post-approval-redesign-expected]] 참고 — 이 CSS 함정 자체는 여전히 유효한 구조적 사실이다).

**How to apply:** 앞으로 `<img>` 요소를 100% 초과 크기로 배치·확대해야 하는 새 기능(캐러셀 확대, 애니메이션 레이어, 줌 효과 등)을 만들 때는 처음부터 해당 요소에 `max-width: none`을 함께 넣을 것. 이미지가 CSS로 지정한 값보다 눈에 띄게 작게 렌더링되면 이 리셋부터 의심하고 `getComputedStyle`로 `max-width`/실제 `width`를 확인할 것 — 스케일/transform 계산이 틀렸다고 오판하고 좌표 수식부터 다시 검산하는 것은 시간 낭비다.
