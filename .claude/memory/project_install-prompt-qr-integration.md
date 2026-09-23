---
name: project-install-prompt-qr-integration
description: PWA "홈 화면에 추가" 기능은 독립 배너가 아니라 QR 공유 시트(#btn-qr-install)에 통합된 버튼으로 최종 구현됨 — 배너 버전은 완전히 폐기됨
metadata:
  node_type: memory
  type: project
  modified: 2026-09-23T00:00:00.000Z
---

PWA 홈 화면 설치 유도 기능은 두 세대를 거쳤다. 1세대(`.install-banner`, `#screen-list` 하단 고정 배너, Android/iOS 두 인스턴스)는 Plan Mode로 설계·구현까지 마쳤지만, code-reviewer 1차 리뷰에서 "배너가 리스트 마지막 카드를 가려 클릭도 막는다"는 Major 레이아웃 버그로 BLOCKED됐다. 사용자는 이 버그를 고치는 대신 배너 개념 자체를 폐기하고, QR 공유 바텀시트(`#qr-sheet-panel`)의 "이미지로 저장"(`#btn-qr-save`) 버튼 오른쪽에 "홈 화면에 추가"(`#btn-qr-install`) 보조 버튼을 넣는 2세대 설계로 완전히 갈아엎을 것을 지시했다. 배너 관련 마크업/CSS(`.install-banner*`)/`docs/07-components.md` 항목은 전부 삭제됐고, 지금 저장소에는 흔적이 없다.

**확정된 현재 구조:**
- 감지/트리거 로직은 `assets/js/install-prompt.js`(신규 파일)에 있다: `isStandaloneDisplay()`, `isIosDevice()`, `canPromptInstall()`, `triggerInstallPrompt()`.
- `entries.js`의 `openQrSheet()`가 시트를 열 때마다 `canPromptInstall()`을 재평가해 `#btn-qr-install`의 `is-hidden` 클래스를 토글한다 — 상시 노출이 아니라 QR 시트를 열 때만 재확인.
- **스크립트 로드 순서가 기능적으로 중요하다**: `index.html`에서 `install-prompt.js`가 반드시 `entries.js`보다 먼저 와야 한다. `entries.js`가 top-level에서 `btnQrInstall.addEventListener('click', triggerInstallPrompt)`처럼 `install-prompt.js`의 함수를 즉시 참조하기 때문 — 순서가 바뀌면 `ReferenceError`로 `entries.js`의 나머지 초기화(다른 이벤트 바인딩, 데이터 로딩 포함)가 전부 멈춘다. 자세한 일반 원칙은 [[project-classic-script-load-order]] 참고.
- **Android**: 설치 후 홈 화면 아이콘으로 열면(`display-mode: standalone`) 버튼이 확실히 사라진다. 브라우저 탭으로 다시 들어와도 이미 설치된 사이트엔 `beforeinstallprompt`가 재발생하지 않아 마찬가지로 안 뜬다.
- **iOS**: standalone으로 열면 안 뜨지만, 설치 후에도 일반 Safari 탭으로 재방문하면 "이미 설치됐는지" 알 방법이 iOS Safari에 없어서(`beforeinstallprompt`/`appinstalled` 자체가 없음) 버튼이 다시 나타난다 — 버그가 아니라 iOS 플랫폼 API 부재로 인한 구조적 한계. 완화하려면 localStorage에 "설치 시도함" 플래그를 남기는 정도가 최선이며, 이 완화책은 아직 구현되지 않았다.
- CSS 스타일링은 여러 차례 사용자 요청으로 뒤집혔다 — 최종 상태만 신뢰할 것: `.qr-actions .cta-btn`은 `flex:1`+`box-shadow:none`(시트 안이라 중복 그림자 안 씀), `.qr-actions .btn-secondary`는 별도 오버라이드가 전혀 없이 `.btn-secondary` 베이스(`flex:1`, `height:52px`, 16px 폰트)만 적용받는다 — 한때 `flex:none`+`white-space:nowrap`으로 줄바꿈을 막는 트릭을 썼지만 사용자가 명시적으로 되돌려달라고 해서 제거됐다. 전역 `.btn-secondary:hover`도 사용자 요청으로 완전히 삭제되어, `#btn-edit-entry`(티켓 수정 버튼)도 이제 hover 효과가 없다.

**Why:** 리뷰가 지적한 버그를 고치기보다 기능의 진입점 자체를 바꾸는 재설계를 사용자가 선택했다 — 자동 팝업 배너보다 QR 공유라는 기존 의도적 행동에 편승시키는 쪽을 선호함. [[feedback-post-approval-redesign-expected]] 참고.

**How to apply:** 이 기능을 다시 만지게 되면, 배너 버전(`.install-banner`)을 되살리려 하지 말고 QR 시트 통합 버전이 최종 상태임을 전제로 시작할 것. `install-prompt.js`/`entries.js` 순서를 바꾸는 리팩터링(번들러 도입 등)을 하기 전엔 반드시 이 로드 순서 의존성을 먼저 제거해야 한다.
