---
name: install_prompt_feature_review
description: PWA "홈 화면에 추가하기" 기능 — 독립 배너(1차, BLOCKED) → QR 시트 통합 버튼(2차, APPROVED 조건부) 전환 이력과 스크립트 로드 순서 해법
metadata:
  type: project
---

`assets/js/install-banner.js`(리스트 화면 하단 고정 배너, Android/iOS 2개 인스턴스)가 1차 리뷰에서 BLOCKED됨 — 배너가 `#screen-list` 마지막 카드를 가리는 문제(Major).

**2026-09-23 재구현(APPROVED 조건부)**: 배너를 완전히 삭제하고, `#qr-sheet-panel`(QR 공유 바텀시트) 안의 `#btn-qr-save`("이미지로 저장") 오른쪽에 `#btn-qr-install`("📲 홈 화면에 추가하기") 버튼을 추가하는 방식으로 재설계. `assets/js/install-banner.js` → `assets/js/install-prompt.js`로 파일 교체, 배너 노출/닫기/localStorage dismiss 로직 전부 제거(자동 팝업이 아니라 사용자가 시트를 열어야만 보이므로 "다시 안 뜨게" 개념이 불필요해짐).

**스크립트 로드 순서**: `supabase-client.js` → `install-prompt.js` → `entries.js` (`index.html`). `entries.js`가 top-level에서 `btnQrInstall.addEventListener('click', triggerInstallPrompt)`처럼 `install-prompt.js`의 함수를 직접 참조하므로 이 순서가 필수. `install-prompt.js`는 top-level에서 `entries.js`(`showDialog` 등)를 참조하지 않음 — `showDialog` 참조는 `triggerInstallPrompt()` 함수 본문 안에 있고 클릭 시점에야 호출되므로 순서 문제 없음. 확인 완료.

**남은 Minor 리스크 (미수정, 다음 리뷰 시 참고)**:
1. `triggerInstallPrompt()`에 더블클릭/동시 호출 가드 없음 — `deferredInstallPrompt.prompt()`가 비동기 `await` 도중 재호출되면 동일 이벤트에 대한 중복 `prompt()` 호출로 브라우저에 따라 에러 가능성.
2. `deferredInstallPrompt.prompt()`/`userChoice`에 try/catch 없음 — reject 시 콘솔에만 남고 사용자 피드백 없이 조용히 실패.
3. `docs/07-components.md`의 `btn-secondary` 항목에 QR 시트 신규 사용처가 텍스트로 추가되지 않음 — 새 토큰 값은 아니라서 [[project_design-docs-are-review-gate]] 규칙(색/radius/그림자 값 변경 시 문서 동기화) 위반은 아님. 다만 다른 컴포넌트 항목들처럼 "적용된 곳" 한 줄을 추가하면 문서 완전성 측면에서 더 일관됨(선택 사항).

**2026-09-23 3차 레이아웃 조정(APPROVED, 스크린샷 피드백 "보조 버튼 2줄 줄바꿈+여백 과다" 대응)**: `#btn-qr-install` 라벨 `"📲 홈 화면에 추가하기"` → `"📲 홈 화면에 추가"`로 단축(JS/CSS 주석도 동기화). `.qr-sheet-body` 좌우 padding `24px`→`16px`(spacing 스케일 [4·8·12·16·20·24] 안, 예외 등록 불필요), `.qr-actions` gap `12px`→`8px`, `.qr-actions .btn-secondary`에만 `padding:0 8px; font-size:14px` 오버라이드 추가(옆 `.cta-btn`은 16px 유지 — 두 버튼 폰트 크기 불일치가 남음, `docs/07-components.md`는 버튼 "높이" 통일만 요구하고 폰트 크기 통일은 요구하지 않아 문서 위반은 아니나 시각적 위계 관점에서 Minor). `white-space: nowrap`은 의도적으로 넣지 않음(flex:1 아이템에 nowrap을 걸면 min-content가 전체 텍스트 폭이 되어 컨테이너 가로 오버플로 위험 — 대신 줄바꿈 허용 + 텍스트/여백 축소로 graceful degradation 선택, 타당한 판단). 375px 뷰포트 기준 어림 계산으로는 한 줄에 들어갈 가능성이 높지만 320px처럼 더 좁은 기기에서는 여전히 타이트해 2줄로 꺾일 수 있음(정확한 렌더링 미검증, 실기기 스크린샷 재확인 권장).

**Why:** 배너 자체를 없애는 구조적 해법이 카드 가림 문제를 근본적으로 해소했고, 로드 순서 변경이 top-level 참조 타이밍 문제를 실제로 막는지가 2차 재검토의 핵심 검증 포인트였음. 3차는 순수 레이아웃(패딩/폰트/라벨 길이) 조정이라 JS 로직 재검증은 불필요했음.

**How to apply:** 이 기능을 다시 건드릴 때 스크립트 로드 순서(`supabase-client.js` → `install-prompt.js` → `entries.js`)가 깨지지 않았는지 우선 확인. Minor 3개(더블클릭 가드/try-catch/문서 적용처)는 아직 코드에 반영 안 됨. 라벨을 다시 늘리거나 padding을 되돌리는 변경이 있으면 320px급 좁은 화면에서의 줄바꿈 여부를 다시 체크할 것.
