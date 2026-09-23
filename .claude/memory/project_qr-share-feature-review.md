---
name: project-qr-share-feature-review
description: QR 공유 기능(index.html의 qrcode CDN 스크립트 + entries.js handleQrSave/openQrSheet) 1차 BLOCKED → 2차 재검토 APPROVED 이력과 남은 Minor 리스크
metadata:
  node_type: memory
  type: project
  modified: 2026-09-23T00:00:00.000Z
---

QR 코드 공유 기능(리스트 화면 `.qr-btn` → `qr-sheet-panel` 바텀시트, `assets/js/entries.js`의 `openQrSheet`/`handleQrSave`)을 code-reviewer가 1차 리뷰에서 BLOCKED시켰고, 2026-09-23 재검토에서 두 Major 이슈가 모두 해결되어 APPROVED로 전환됐다.

**1차 BLOCKED 사유 → 수정 내용:**
1. `index.html`의 `qrcode` CDN 스크립트가 `qrcode@1/build/qrcode.min.js`(메이저만 고정)이던 것을 `qrcode@1.5.1/build/qrcode.min.js`로 패치 버전까지 고정하고 `integrity="sha384-..."` + `crossorigin="anonymous"` SRI를 추가함. (jsdelivr는 정확한 버전 경로를 불변 콘텐츠로 서빙하므로 패치 버전 고정 + SRI 조합이면 캐시/CDN이 바뀌어도 안전.)
2. `assets/js/entries.js`의 `handleQrSave()`가 기존엔 `canvas.toDataURL()` + `<a download>` 클릭만 사용했는데, iOS Safari에서 이 조합이 다운로드로 이어지지 않고 새 탭 이동처럼 동작하는 문제가 있어(알려진 플랫폼 제약) `canvas.toBlob()` → `File` → `navigator.canShare({files:[...]})`가 되는 환경에서는 `navigator.share()`를 우선 쓰고, 미지원 환경에서만 기존 `<a download>` 방식으로 폴백하도록 재작성함. `AbortError`(사용자 취소)는 조용히 종료, 그 외 에러는 `console.error` 후 폴백 실행.

부수적으로 Minor였던 "`QRCode` 전역 존재 여부 미확인"도 `openQrSheet()`에서 `typeof QRCode === 'undefined'` 체크 + `#qr-caption` 안내 문구 교체로 해결됨.

**Why:** iOS Safari의 `<a download>` + data URI 저장 실패는 실사용자에게 "저장 버튼이 고장난 것처럼" 보이는 문제였고, CDN 메이저 버전만 고정하는 것은 같은 메이저 내에서도 콘텐츠가 바뀔 수 있어(실제로 jsdelivr가 서빙 중인 버전이 1.5.1임을 x-jsd-version 헤더로 확인) SRI 없이는 무결성 보장이 안 됐다.

**How to apply:** 이후 이 기능을 다시 건드릴 일이 있으면 아래 두 가지는 이미 해결된 것으로 간주하고 재검사 우선순위를 낮춰도 된다. 대신 아래 **남은 Minor 리스크**는 이번 재검토에서 새로 식별된 것으로, 아직 코드에 반영되지 않았다 — 다음에 이 파일을 만질 때 참고:
- `openQrSheet()`가 열리자마자 `QRCode.toCanvas`는 비동기로 렌더링되는데, `btn-qr-save`는 렌더링 완료를 기다리지 않고 항상 클릭 가능하다. QR 생성이 느리거나 실패한 상태(캔버스가 기본 300×150 빈 캔버스)에서 사용자가 바로 저장/공유를 누르면 빈 이미지가 공유/저장되고 아무 에러 피드백도 없다. (이번 두 Major 수정 이전부터 있던 기존 동작이며, 이번 패치로 새로 생기거나 악화되지는 않았다.) 제안: `QRCode.toCanvas` 콜백이 성공적으로 끝나기 전까지 `btn-qr-save`를 `disabled` 처리하거나, `toBlob` 콜백에서 캔버스가 비어있는지 확인.
- `handleQrSave()`가 `navigator.share()`를 `canvas.toBlob()`의 콜백(비동기) 안에서 호출한다. Web Share API는 보통 "user activation"이 있어야 동작하는데, 클릭 이벤트와 `share()` 호출 사이에 비동기 갭이 있다. 대부분 브라우저의 transient activation 유예 시간(수 초) 안에서는 문제없이 동작하지만(이 패턴 자체는 업계 표준 방식), 만약 activation이 소실되면 `NotAllowedError`로 실패 → 코드가 `AbortError`가 아니므로 자동으로 `<a download>` 폴백으로 넘어가는데, 이게 바로 원래 BLOCKED 사유였던 iOS Safari 취약 경로라서 "고쳤는데 조용히 원래 문제로 돌아가는" 시나리오가 이론상 가능하다. 실기기(iOS Safari) 수동 테스트로 확인 권장.
