---
name: project_ig_story_share_feature_review
description: 인스타그램 스토리 공유 바텀시트(#btn-ig-share/#ig-sheet-panel) 1차 리뷰 — APPROVED 조건부(2026-09-28), cta-bar 3버튼 320px 미검증이 핵심 잔여 이슈
metadata:
  type: project
---

2026-09-28, QR 공유 바텀시트 옆에 인스타그램 스토리 공유 바텀시트를 추가하는 PR(커밋 전)을 리뷰함. 결과: **APPROVED (조건부)** — Critical/Major 없음, Minor만 존재.

구조: `#btn-ig-share`(cta-bar 세 번째 버튼, `.qr-btn.ig-btn` 클래스 공유) → `#ig-sheet-backdrop`/`#ig-sheet-panel` 오픈. `openIgSheet`/`closeIgSheet`가 `openQrSheet`/`closeQrSheet`와 동일한 backdrop/panel hidden 토글 패턴을 그대로 복제. `IG_PROFILE_URL`을 `window.open(url, '_blank', 'noopener')`로 새 탭에 여는 방식으로 "실제 네이티브 스토리 공유 API는 웹에서 호출 불가"를 타협 — 이 트레이드오프는 코드 주석에 잘 문서화되어 있음(QR/카카오 공유 주석과 같은 스타일).

**확인된 사실(디자인 시스템 관점):**
- 새 CSS(`.ig-story-preview` 등)는 새 색상 토큰을 하나도 추가하지 않음 — `--paper`/`--accent`/`--accent-soft`/`--muted`/`--ink`/`--card-muted-line`만 재사용, 인스타그램 실제 브랜드 그라데이션은 의도적으로 배제(코드 주석에 08번 가이드라인 인용까지 명시). [[project_design-docs-are-review-gate]]가 막는 "토큰 값 변경"에는 해당하지 않음.
- `.ig-story-preview`의 `box-shadow: 0 12px 28px rgba(20,21,26,.12)`는 `.qr-info-card`([[project_qr-sheet-flat-card-redesign]])와 완전히 동일한 값 — docs/06-elevation.md가 공식 등록한 두 값(`.container`/`.ticket-hero`)과는 다른 제3의 미문서화 그림자지만, 이미 QR 시트에서 선례가 있고 이번 리뷰에서 새로 만든 값이 아니므로 Minor로만 처리.
- radius(16px 카드/14px 로고박스/999px 필)는 모두 05번 스케일(16/14/999) 안에 있어 문제 없음.
- `.ig-story-action` padding 14px 16px, `.ig-tag-chip` padding 2px 10px 등은 04번 스펙(4/8/12/16/20/24) 밖 값이지만 `.filter-tab`(6px 14px)·`.relation-tag`/`.entry-status`(3px 10px) 등 기존 칩/탭 컴포넌트와 동일 패턴이라 신규 위반이라기보다 기존 관행의 연장 — Minor.

**cta-bar 3버튼 폭 이슈(주의 관찰 대상):** 리스트 화면 `.cta-bar`가 `#btn-add`(flex:1) + `.qr-btn` + `.ig-btn`(각 52px, flex:none) 3개로 늘어남. 320px 폭 기준 계산상 `#btn-add`의 가용 텍스트 폭이 아이콘 버튼 1개였을 때(~144px)보다 크게 줄어듦(~82px) — "전도 대상자"/"이름 올리기" 두 줄 라벨이 줄바꿈/찌그러짐 위험이 있으나 실제 브라우저로 검증하지 않음. [[project_install-prompt-qr-integration]]에서도 "320px 초협폭 줄바꿈 미검증"을 Minor로 남긴 전례가 있어 이번에도 Minor로 통일해 처리했지만, 아이콘 버튼이 2개로 늘어난 첫 사례이므로 **다음에 320px 스크린샷이 확보되면 최우선으로 재검증할 것**.

**기타 Minor:**
- `assets/imgs/gangchung-logo.jpg`가 1080×1080 추정 크기인데 실제 표시는 52×52 CSS 박스(`.ig-story-logo`) — 리사이즈/압축 권장.
- 이 로고 자산은 사용자가 "같은 조직이 운영하는 다른 공개 GitHub Pages 사이트에서 가져왔다"고 밝힘 — 코드 결함은 아니지만 출처/권한 확인 여지 있음.
- docs/07-components.md에 QR 시트도 IG 시트도 컴포넌트로 등재되어 있지 않음(선례 있는 누락, 이번 PR 고유 문제 아님) — 두 바텀시트를 묶어서 한 번에 문서화할 것을 권장.
- 버튼/시트 open·close 함수 쌍(등록/수정/QR/IG, 이제 4개)이 완전히 동일한 2줄 토글 로직을 반복 — `openSheet(backdrop, panel)`/`closeSheet(backdrop, panel)` 공용 헬퍼로 추출할 여지가 커짐(시트가 늘어날수록 이 중복이 누적).
