---
name: project-ig-example-carousel-media-lifecycle
description: IG 공유 시트 예시 캐러셀에 실제 사진/영상을 연결하며 얻은 교훈 — 자동재생 미디어는 DOM 생성 시점이 아니라 시트 open/close 생명주기에 묶어야 함
metadata:
  type: project
  modified: 2026-09-28T00:00:00.000Z
---

2026-09-28, 인스타그램 공유 시트(`#ig-sheet-panel`)의 예시 캐러셀(`IG_EXAMPLE_ITEMS`, `assets/js/entries.js`)에 실제 미디어를 연결했다: 사진 9장(`assets/imgs/holywin_reference/`)과 영상 1개(`assets/video/holywin_15s.mp4`, ~10MB, 캐러셀 2번째 항목).

**핵심 버그와 교훈:** 영상 타일에 `video.autoplay=true`+생성 직후 `video.play()`를 걸었더니, 시트를 한 번도 열지 않은 방문자에게도 페이지 로드 즉시 10MB 영상이 전체 다운로드·재생되는 문제가 code-reviewer 1차 리뷰에서 Critical로 BLOCKED됐다. 원인은 이 사이트 바텀시트 전체가 공유하는 구조적 특징 두 가지가 겹친 것이다: (1) `.sheet-panel--hidden`이 `display:none`이 아니라 `transform`+`pointer-events:none`으로만 화면 밖에 있다([[project-scroll-architecture-refactor]] 참고), (2) Swiper가 슬라이드 폭을 계산하려면 DOM에 슬라이드가 미리 있어야 해서 `renderExampleCarousel()`을 시트를 열기 전, 스크립트 로드 시점에 무조건 호출한다. 즉 "DOM에 만들어지는 시점"과 "사용자 눈에 실제로 보이는 시점"이 이 사이트에서는 분리되어 있는데, 자동재생 로직을 전자에 걸어서 문제가 생겼다.

**해결책(반영 완료, 재검토 APPROVED):** 재생/정지를 `openIgSheet()`/`closeIgSheet()`로 옮겼다 — 시트를 열 때 `igExampleWrapper.querySelectorAll('video').forEach(v => v.play().catch(() => {}))`, 닫을 때 같은 셀렉터로 `pause()`. `preload`도 `'auto'`에서 `'metadata'`로 낮췄다. video 타일에는 `btn.setAttribute('aria-label', item.label)`도 추가해 접근성 결함(스크린리더에 빈 버튼으로 노출되던 문제)도 같이 고쳤다.

**Why:** 이 사이트의 모든 바텀시트(`#ig-sheet-panel`/`#qr-sheet-panel`/`#edit-sheet-panel` 등)가 동일한 transform-hidden 패턴을 쓰므로, 앞으로 어떤 시트에 자동재생 영상·IntersectionObserver·타이머처럼 "화면에 보일 때만 실행돼야 하는 부수효과"를 추가하든 똑같은 버그가 재현될 수 있다.

**How to apply:** 새 시트/모달에 "보일 때만 실행돼야 하는" 부수효과를 넣을 때는 절대 컴포넌트/타일을 만드는 함수(예: `createExampleTile` 같은 팩토리)에 걸지 말고, 반드시 해당 시트의 open 함수에서 시작하고 close 함수에서 정지시킬 것. 이번 리뷰의 상세 기록(Critical/Major 항목별 위치, 재검토 체크리스트)은 `.claude/agent-memory/code-reviewer/project_ig_example_video_tile_autoplay_review.md`에 남아있다.

**남은 미정리(Minor, 아직 안 고침):**
- `video.play().catch(() => {})`가 에러를 전부 삼킴 — `console.warn` 정도는 남기는 게 `Swiper` 로드 실패 시 `console.error`를 남기는 기존 관례와 일관적.
- Swiper `freeMode`로 타일이 화면 밖으로 스와이프되어 나가도 재생을 멈추는 로직 없음(`IntersectionObserver`/`slideChange` 리스너 부재).
- `poster` 속성이 없어 최초 프레임 디코드 전 검은 박스가 잠깐 보일 수 있음.
- `docs/08-guidelines.md`에 "무음 자동재생 video는 실제로 보이는 시점(열린 시트)에만 play()하라"는 DON'T 라인 미등재.

**이미지 최적화 선례:** 같은 캐러셀의 사진 9장은 사용자가 직접 PNG(총 ~20MB)를 AVIF(총 ~1.1MB)로 변환해 교체했다(`entries.js`의 경로도 `.avif`로 갱신, code-reviewer APPROVED). 이 저장소는 빌드 파이프라인이 없어 이미지/영상 최적화가 전부 수동이다 — 같은 캐러셀의 `holywin_15s.mp4`(~10MB)는 아직 압축 전 원본 상태로 남아있으니, 다음에 이 영상을 다시 만질 일이 있으면 압축(예: 해상도/비트레이트 낮추기)을 함께 검토할 것.
