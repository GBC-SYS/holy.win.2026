---
name: project-qr-sheet-flat-card-redesign
description: QR 공유 시트 본문이 사이트 전역 유리질감(glass) 패턴 대신 순백 카드(--paper)로 예외적으로 바뀐 이유 — radius 문서 불일치 후속 조치 필요
metadata:
  type: project
  modified: 2026-09-27
---

`assets/css/entries.css`의 `.qr-card`/`.kakao-share-btn`(QR 공유 바텀시트 안 QR코드/카카오톡 공유 타일)이 사이트 전역에서 쓰던 `--glass-sheen` + `backdrop-filter: blur()` + `--glass-border` 유리질감 스타일에서, 순백(`--paper`) 배경의 새 래퍼 `.qr-info-card` + 그 안의 `--card-muted` 플랫 표면 조합으로 바뀌었다(2026-09-27, 아직 커밋 전/code-reviewer 미검토). `index.html`도 `.qr-info-card`/`.qr-info-text` 래퍼가 추가되도록 마크업이 바뀌었다. 캡션/URL 텍스트, QR 캔버스, 카카오톡 버튼 등 콘텐츠 자체는 전혀 바뀌지 않았다.

**Why:** 사용자가 두 장의 참고 이미지를 첨부하며 "두 번째 이미지처럼 UI를 동일하게, 내용은 유지"라고 요청했다. 참고 이미지는 배달앱의 "실시간 배달 수수료" 카드(순백 카드에 라벨→큰 숫자→취소선 텍스트를 세로로 쌓은 레이아웃)였고, QR 시트엔 대응되는 숫자 콘텐츠가 없어 AskUserQuestion으로 적용 범위를 먼저 확인했다([[feedback-ambiguous-visual-requests]] 참고). 사용자가 "전체 모달을 카드 스타일로 재구성"을 선택해, 기존에 흩어져 있던 QR+카카오 행 / 안내문구 / URL을 하나의 순백 카드에 그림자로만 띄우고, 안쪽 두 타일은 `docs/02-colors.md`의 "밝은 바탕 + 한 단계 어두운 표면" 원칙에 따라 `--card-muted`로 눌러 넣는 방식으로 구현했다. 새 색은 만들지 않고 기존 7색 토큰만 재사용했다.

**✅ 2026-09-27 해결됨 — radius 스케일 불일치.** 05번 문서는 "기준값 16px → 카드·다이얼로그 16px / 큰 컨테이너·모달 24px"로 정의하는데, `.qr-info-card`(모달 안에 든 카드)가 한동안 `border-radius: 20px`(16도 24도 아닌 중간값)였다. code-reviewer가 실제로 이를 Major로 잡아 BLOCKED 판정을 냈고([[project-design-docs-are-review-gate]] 예측대로), `.qr-info-card`를 16px로 낮춰 재검토 없이 바로 해결했다. `.qr-card`/`.kakao-share-btn`은 이미 16px로 맞춰져 있었다.

**참고사항 (계속 유효):** 이 컴포넌트(QR 시트 본문)는 사이트 전역 유리질감 컨벤션의 의도적 예외로 시작됐으나, 같은 날 세션에서 사용자가 `.kakao-share-btn`에는 다시 `#btn-add`와 동일한 유리질감 스타일을 명시적으로 요청해 적용했다(배경 `var(--glass-sheen), rgba(232, 98, 44, 0.82)` + `backdrop-filter` + `border: var(--glass-border)` + `box-shadow`). 단, `.kakao-share-btn`의 부모 `.qr-info-card`가 불투명한 `--paper` 배경이라 `backdrop-filter`가 시각적으로는 아무 효과가 없고 GPU 비용만 발생시킨다는 점을 code-reviewer가 Major로 지적했다(커밋 자체를 막을 정도는 아니라고 판단해 그대로 진행) — 사용자가 `#btn-add`와 "똑같이" 적용해달라고 명시적으로 요청한 결과라 의도적 트레이드오프로 유지 중이다. 나중에 "왜 여기만 유리질감이냐/왜 backdrop-filter가 낭비냐"는 지적이 나오면 버그가 아니라 이 세션의 사용자 요청 결과임을 참고할 것.
