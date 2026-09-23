---
name: btn_secondary_hover_removal
description: .btn-secondary:hover 전역 삭제 이력과 .cta-btn에는 애초에 hover 규칙이 없었다는 사실 — QR 시트/티켓 수정 버튼 hover 리뷰 시 참고
type: project
---

2026-09-23, 사용자가 QR 공유 시트 버튼 hover를 없애달라고 요청 → 처음엔 `.qr-actions .btn-secondary:hover`로 스코프 한정 → 곧이어 "`.btn-secondary:hover` 기능 삭제"로 범위 확대 요청, 최종적으로 전역 `.btn-secondary:hover { border-color: var(--accent); }` 규칙 자체와 방금 추가했던 `.qr-actions .btn-secondary:hover` 오버라이드(죽은 코드가 됨)를 모두 삭제.

**확인된 사실**
- `.btn-secondary`는 QR 시트의 "홈 화면에 추가"(`#btn-qr-install`) 버튼과 티켓 상세의 "수정"(`#btn-edit-entry`) 버튼 등 여러 곳에서 재사용되는 공용 클래스 — 전역 삭제이므로 두 곳 다 hover 영향을 받음(요청대로 의도된 범위).
- QR 시트의 "이미지로 저장"(`#btn-qr-save`)은 `.btn-secondary`가 아니라 `.cta-btn` 클래스이고, `.cta-btn`에는 애초에 `:hover` 규칙이 존재한 적이 없음(`entries.css` 전체에 `.cta-btn:hover` 매치 없음). 즉 "두 버튼 다 hover 없애기" 요청은 `.btn-secondary:hover` 하나만 지워도 완전히 충족됨 — 두 버튼의 hover 소스가 원래 비대칭이었다는 점에 주의.
- `docs/06-elevation.md:17`의 "강조 카드는 hover 시 포인트 색 테두리"는 `.entry-card:hover`(강조 카드)에 대한 설명이며 `.btn-secondary`와는 무관 — 이번 삭제로 docs-코드 드리프트 발생하지 않음.
- `docs/07-components.md:40` "상태(hover/focus/disabled)를 새 색으로 만들지 않는다"는 향후 hover 색을 정의할 때의 원칙이지, 모든 버튼에 hover 상태가 반드시 있어야 한다는 규정은 아님 — hover 상태 자체를 없애는 것은 이 규칙 위반이 아님.

**How to apply:** 앞으로 `.btn-secondary`/`.cta-btn` 관련 hover·상태 변경을 리뷰할 때, 두 클래스의 hover 유무가 비대칭이라는 점과 `#btn-edit-entry`가 `.btn-secondary`를 공유한다는 점을 먼저 확인할 것. docs 06/07/08번은 색상 원칙만 규정하며 버튼별 hover 존재 여부를 못박지 않으므로, hover 삭제 자체는 [[color_doc_sync_rule]]·[[radius_doc_sync_rule]]·[[elevation_shadow_spec_violation]] 같은 docs 동기화 위반 대상이 아님.
