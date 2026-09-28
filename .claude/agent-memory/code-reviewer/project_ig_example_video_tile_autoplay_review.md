---
name: project_ig_example_video_tile_autoplay_review
description: IG 공유 시트 예시 캐러셀에 실제 mp4(holywin_15s.mp4) 썸네일 재생 추가 — 1차 BLOCKED(2026-09-28), 페이지 로드 시 시트 미개방 상태에서도 10MB 영상 무조건 자동재생/다운로드
metadata:
  type: project
---

2026-09-28, [[project_ig_story_share_feature_review]]에서 자리표시(placeholder)였던 캐러셀 2번째 타일을 실제 영상(`assets/video/holywin_15s.mp4`, ~10MB)으로 교체하는 diff(`entries.js`의 `createExampleTile`, `IG_EXAMPLE_ITEMS.splice`)를 리뷰. 1차 결과: **BLOCKED** — Critical 1건 + Major 2건.

**2026-09-28 재검토 결과: APPROVED (조건부).** Critical·Major 3건 모두 코드에 정확히 반영됨 확인:
- `createExampleTile`(entries.js:615-630)에서 `video.autoplay`/즉시 `play()` 제거, `preload: 'metadata'`로 하향.
- `openIgSheet()`(563행)에서 `igExampleWrapper.querySelectorAll('video').forEach(v => v.play().catch(() => {}))`, `closeIgSheet()`(570행)에서 동일 셀렉터로 `pause()` — 시트 open/close 생명주기에 재생을 정확히 묶음.
- `item.video` 분기(623행)에 `btn.setAttribute('aria-label', item.label)` 추가.
- `igExampleWrapper`(72행 const)는 함수 선언보다 먼저 평가되고 실제 호출은 830행 이후 이벤트 리스너 등록 시점이라 TDZ/undefined 참조 문제 없음.
- `openIgLightbox`(680-694행)는 별도 컨테이너(`igLightboxContent`)에 새 `<video>`(unmuted)를 만들고, 캐러셀 배경 비디오(muted)는 멈추지 않아 동시 재생되지만 배경 쪽이 muted라 오디오 겹침 없음 — 리소스 낭비(이중 디코딩)는 있으나 신규 회귀 아니고 비차단.

**Critical — 시트를 열지 않은 방문자에게도 무조건 자동재생/전체 다운로드:**
`renderExampleCarousel()`이 `openIgSheet()`가 아니라 스크립트 최상위(`entries.js` 837행)에서 무조건 즉시 호출됨 — 이유는 Swiper가 슬라이드 폭을 계산하려면 DOM에 슬라이드가 이미 있어야 하고, `.sheet-panel--hidden`이 `display:none`이 아니라 `transform: translate(-50%,100%)` + `pointer-events:none`(entries.css 850~853행)이라 페이지 로드 시점에 만들어도 폭이 0으로 안 잡히기 때문(주석에 명시). 그런데 이 구조 때문에 `createExampleTile`(610~625행)에서 만든 `<video muted loop autoplay preload="auto">`가 시트를 한 번도 열지 않은 모든 방문자 브라우저에서 페이지 로드 즉시 `play()`까지 명시 호출되어 재생 시작 + `preload="auto"`로 ~10MB 전체를 즉시 내려받음. 모바일 데이터/배터리 낭비가 전체 방문자에게 발생(교회 행사 앱 특성상 모바일 데이터 사용자 다수 예상).
- **해결책**: `video.autoplay`/명시적 `video.play()` 호출을 타일 생성 시점(`createExampleTile`)에서 제거하고, `openIgSheet()`에서 시트가 실제로 열릴 때 `.ig-example-tile--photo video`를 찾아 `play()`하도록 옮길 것. `preload`도 `'auto'` 대신 `'metadata'`나 `'none'`으로 낮추고, 열릴 때 명시적 `play()`가 필요한 데이터를 그때 받아오게 하면 원래 버그리포트(“`preload=metadata`+`autoplay` 속성만으로는 재생 안 됨”)도 여전히 우회 가능 — 그 버그는 애초에 화면 밖(transform) 상태에서 발생한 것이라, 시트가 실제로 보이는 시점에 `play()`하면 재현되지 않을 가능성이 높음.

**Major — `closeIgSheet()`에 video pause 없음:**
`closeIgLightbox()`(707~712행)는 라이트박스 닫을 때 명시적으로 `video.pause()`를 호출하는데, `closeIgSheet()`(562~566행)는 그 패턴이 없음 — 시트를 열었다 닫아도 썸네일 영상이 세션 내내 백그라운드에서 계속 루프. 같은 파일 안에 이미 올바른 선례(`closeIgLightbox`)가 있으므로 그대로 미러링하면 됨.

**Major — 접근성: video 타일 버튼에 접근 가능한 이름 없음:**
`createExampleTile`의 세 분기 중 `item.src`(이미지, img alt 제공)와 else(자리표시, 아이콘+텍스트 label 제공)는 접근 가능한 이름이 있지만, `else if (item.video)` 분기(610~621행)는 `<video>` 엘리먼트만 append하고 `item.label`을 어디에도 안 붙임 — 스크린리더 사용자에게 빈 버튼으로 노출됨. `btn.setAttribute('aria-label', item.label)` 추가 필요.

**Minor:**
- `video.play().catch(() => {})`는 브라우저 자동재생 정책(`NotAllowedError`) 대응으로는 표준적인 패턴이라 그 자체는 문제 아님(MDN 권장 패턴) — 다만 다른 원인(네트워크 실패 등)까지 조용히 삼켜서 디버깅 단서가 없어짐. `Swiper` 로드 실패 시 `console.error`를 남기는 기존 관례(657행)와 일관되게 최소 `console.warn`은 남기는 편이 나음.
- Swiper `freeMode`/스와이프로 타일이 화면 밖으로 나가도 재생을 멈추는 로직 없음(IntersectionObserver나 `slideChange` 리스너 부재) — 이번 스코프 요구사항은 아니었음, 지적만.
- `poster` 속성 없어 최초 디코드 전 검은 박스가 잠깐 보일 수 있음 — 사소.
- docs/08-guidelines.md에 "무음 배경 자동재생 video는 실제로 보이는 시점(뷰포트/열린 시트)에만 play()하라"는 DON'T 라인을 추가할 만한 사례 — 아직 미등재.

재검토 시 확인할 것: `renderExampleCarousel()`을 여전히 무조건 즉시 호출하는지(레이아웃 계산 목적은 유지해도 됨), `video.autoplay`/`play()` 호출이 `openIgSheet()` 쪽으로 옮겨졌는지, `closeIgSheet()`에 pause 추가됐는지, video 분기에 aria-label 추가됐는지.
