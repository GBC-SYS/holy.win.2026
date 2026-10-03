---
name: count-chip-entrance-animation
description: count-chip(접속자 배지)이 접속 후 2.5초 고정 지연 뒤 아래→위 슬라이드업+페이드인으로 노출됨, 순수 CSS keyframe
metadata:
  type: project
---

`.count-chip`(`♡ N명이 보고 있어요` 배지)이 페이지 접속 직후에는 `opacity:0; transform:translateY(10px)`로 숨어 있다가, 2.5초 뒤 `@keyframes count-chip-reveal`로 `opacity:1; translateY(0)`까지 320ms 동안 전환되며 나타난다(`assets/css/entries.css`). `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`를 이 작업에서 `:root`에 처음 추가했다 — 이 코드베이스 최초의 커스텀 easing 토큰이므로, 다음에 진입/퇴장 애니메이션을 또 추가할 때는 새로 발명하지 말고 이 토큰을 재사용할 것.

**Why:** 사용자가 스크린샷으로 이 배지를 지목하며 "처음 접속하면 안 보였다가 2~3초 후 아래에서 위로 올라오며 노출"을 요청. 1차 구현은 `assets/js/presence.js`의 Realtime Presence 첫 `sync` 이벤트(실제 접속자 수 데이터 도착 시점)에 JS로 `.is-visible` 클래스를 붙이는 방식이었으나, 로컬 테스트에서 sync가 거의 즉시(수백ms) 도착해 "2~3초 숨김" 체감이 거의 없었다. 사용자가 재차 "약 2초~3초 있다가 나오도록"이라고 요청해 고정 딜레이 방식으로 전환했다 — 자세한 교훈은 [[feedback_fixed-delay-over-data-driven-timing]] 참고.

**How to apply:** `presence.js`는 더 이상 이 배지의 가시성(opacity/transform)에 관여하지 않는다 — `countTextEl.textContent`와 `aria-label`만 갱신한다([[project_realtime-presence-viewer-count]]가 설명하는 단독 소유권은 "텍스트 내용"에 한정되고, "노출 타이밍"은 이제 순수 CSS가 소유). 이 배지의 등장 타이밍을 또 바꿔달라는 요청이 오면 `entries.css`의 `animation-delay`/`duration` 값만 조정하면 되고, JS를 건드릴 필요 없다.
