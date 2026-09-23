---
name: project_ticket_margin_reintroduction_2026-09-23
description: .ticket-hero/.ticket-wrap에 margin 0 16px가 최종 복원된 시점의 리뷰 기록 — 04번 spacing 스케일 준수, 둘 다 동일 margin이라 좌우 정렬 이상 없음, APPROVED
metadata:
  type: project
---

2026-09-23, 직전 커밋(a5c7890) 이후 `.ticket-hero`(28px radius, 주황 카드)와 `.ticket-wrap`(32px radius, 흰 카드)에 `margin: 0 16px;`가 (재)추가됨. 이 화면은 같은 세션 안에서 병합→분리→여백 제거→여백 재추가를 여러 차례 반복한 이력이 있다([[project_ticket_fullbleed_brown_rebrand_review]], repo 쪽 메모리 `project_ticket-detail-two-card-layout.md` 참고).

**리뷰 결과(APPROVED):**
- `16px`는 `docs/04-spacing.md`의 공식 스케일(4·8·12·16·20·24) 안의 값 — 새 임의값 도입 아님. 04번 문서는 "화면 좌우 여백"엔 24px를 권장하지만, 이건 `.container` 자체의 화면 좌우 여백이 아니라 그 안에 뜬 카드의 인셋이라 다른 항목이라 24px 강제 대상이 아님.
- `.ticket-hero`/`.ticket-wrap` 둘 다 정확히 동일한 `margin: 0 16px`를 받아 좌우 정렬이 어긋나지 않음(두 카드가 같은 x축 인셋을 가져 하나의 세로 열처럼 보임).
- `docs/05-radius.md`/`docs/09-shadcn-tokens.md`는 radius 값만 서술하고 margin/폭에 대해서는 언급이 없어 이번 margin 변경으로 새로 모순되는 문구는 없음.
- `.container`는 padding 없이 margin(40px auto 0, 수직 전용)만 가지므로 margin 이중 적용/충돌 없음. `.ticket-perf`의 절취선 장식(좌우 원, `var(--bg)`로 채워 카드 밖 배경과 블렌딩)도 margin 유무와 무관하게 `.ticket-wrap`의 `overflow:hidden` 기준으로 클리핑되므로 시각적으로 계속 맞음.
- Minor(차단 아님): `.container:has(#screen-ticket...)` 위의 코드 주석(entries.css 110~116행, "바닥 모서리를 안 맞추면 .ticket-wrap 둥근 바닥과 어긋난다")은 두 요소가 완전히 같은 폭이던(margin 없던) 시절에 쓰인 설명이라, 지금은 좌우 인셋이 생겨 논리가 약간 낡음(틀린 건 아니고 근거가 약해짐 정도) — 다음에 이 주석 근처를 만질 때 갱신 권장.

**Why:** 이 화면의 margin 값이 세션 내내 불안정하게 바뀌어 왔다는 게 이미 기록돼 있어([[project_ticket-detail-two-card-layout]] 성격의 반복), 매번 "지금 코드가 실제로 어떤 값인지" 직접 읽어 검증하는 게 중요했음 — 이번에도 Read/Grep으로 실제 값 대조 후 판정.

**How to apply:** 다음에 이 화면 margin이 또 바뀌면, (1) 04번 spacing 스케일 안의 값인지, (2) hero/wrap 둘 다 동일 값을 받았는지, (3) 05/06/08/09번 문서에 margin/폭을 못박은 문구가 있는지 세 가지만 확인하면 됨 — 지금까지는 docs가 margin을 규정한 적이 없어 문서 드리프트 리스크는 낮은 편.
