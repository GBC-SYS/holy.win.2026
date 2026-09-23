---
name: project_ticket_fullbleed_brown_rebrand_review
description: 티켓 상세 화면 풀블리드 리디자인 + 브라운 색상 리브랜딩(--tone-1~5) 리뷰 — 1차 BLOCKED(대비 미달 2건 + 문서 드리프트 3건) → 2차 APPROVED(2026-09-23, 전부 수정 확인 및 대비율 검산 일치)
metadata:
  type: project
---

`entries.css`에 브라운 톤 스케일(`--tone-1`~`--tone-5`, `#f2c696`~`#541a02`)이 도입되고 티켓 상세 화면(`.ticket-head`/`.ticket-grid`/`.ticket-wrap`)이 카드형에서 풀블리드 3단 배경 분리(상단 `--accent`/중간 `--tone-3`/하단 `--tone-4`) 구조로 바뀌었다. 1차 리뷰에서 5개 Major로 BLOCKED, 같은 날 전부 수정 후 재검토에서 APPROVED로 전환.

**1차 BLOCKED 사유(5건) → 2차 확인 결과:**
1. `.relation-tag`/`.filter-tab--active`가 `color: var(--accent)`(새 브라운 `--accent` on `--accent-soft`, 약 3.53:1)로 대비 미달 → `#3a1e10`(기존에 `.status-badge--praying` 등에서 이미 검증된 예외색, 11.2:1)로 통일. 재검산 결과 **11.22:1**, 일치.
2. `.grid-label`(65% 흰색 on `--tone-3`, 3.90:1) 대비 미달 → 85%로 상향. 재검산 결과 **5.55:1**, 일치.
3. `docs/02-colors.md`가 tone-3/tone-4를 "아직 미사용"이라 오기재 → 실사용처(`.ticket-grid`/`.ticket-wrap`) 반영, 예외색 표에 `.grid-value`(7.05:1)/`.grid-label`(5.55:1)/`.ticket-footnote`(6.31:1) 추가, `#e5e3df`를 grep 재확인 후 "미사용"→"`.entry-date` 점선 구분선에 실사용"으로 정정. `.grid-value`/`.ticket-footnote` 대비도 재산 결과 각각 **7.05:1**, **6.31:1**로 일치.
4. `docs/03-typography.md`의 `.ticket-name` 34px 표기가 실제 코드(44px)와 불일치 → 문서를 44px로 정정(코드는 유지). [[elevation_shadow_spec_violation]]에 기록된 "코드가 의도적으로 최신이면 문서를 코드에 맞춘다" 원칙과 동일 패턴.
5. `docs/06-elevation.md`/`docs/08-guidelines.md`가 "그림자 2단계(티켓+container)"로 남아있었는데, 풀블리드 리디자인으로 티켓이 카드가 아니게 되면서 그림자 자체가 사라짐 → "1단계(container만)+배경색 3단 분리로 티켓 내부 구분" 서술로 정정. 코드에도 `.ticket-head`/`.ticket-grid`/`.ticket-wrap`/`.ticket`에 box-shadow 없음을 grep으로 확인. **이로써 [[elevation_shadow_spec_violation]]에 "미해결로 남았다"고 적어둔 티켓 그림자 미구현 문제는, 그림자를 추가하는 방식이 아니라 "그림자 요구 자체를 없애는" 방식으로 최종 해소됨.**

**재검토에서 새로 발견한 Minor(이번 5건 범위 밖, 차단 사유 아님):**
- `docs/02-colors.md` 37행 `#3a1e10` 예외색 사용처 목록에 `.status-badge--praying`/`.relation-tag`/`.filter-tab--active`만 있고 `.entry-status--praying`(같은 조합을 이미 쓰고 있음)이 빠져있음 — 표를 다음에 만질 때 같이 추가할 것.
- `docs/08-guidelines.md` 21행 "그림자는 06번에서 정한 1단계(`.container`)만 쓴다"는 현재도 부정확함 — `.cta-btn`(box-shadow `0 12px 24px rgba(0,0,0,.2)`)과 `.dialog-panel`(`0 -12px 32px rgba(0,0,0,.2)`)이 이미 `.container`와 다른 그림자 값을 쓰고 있음. 이번 리브랜딩과 무관하게 그 이전부터 있던 드리프트로 보임. 그림자 관련 코드를 다음에 만질 때 "카드/컨테이너 레이어"와 "뜬 버튼/모달 레이어"를 구분해서 정리 권고.

**Why:** [[color_doc_sync_rule]]·[[elevation_shadow_spec_violation]]과 같은 패턴(CSS 토큰/구조가 바뀌면 docs/0X를 안 고치는 경향)이 대규모 리디자인(색+구조 동시 변경)에서 재현됨. 다만 이번엔 사용자가 지적받은 즉시 5건을 한 번에 정확히 고쳐, 재검토가 매끄럽게 APPROVED로 끝난 사례.

**How to apply:** 다음에 `entries.css`의 색상 토큰이나 그림자/구조가 바뀌는 diff를 리뷰할 때, (1) 대비율 수치가 보고되면 WCAG 상대휘도 공식으로 직접 재계산해서 검산하고 — 특히 `rgba(255,255,255,alpha)` 텍스트는 배경색과 알파 합성한 뒤 대비를 계산해야 함(합성 전 순수 흰색으로 계산하면 과대평가됨), (2) `docs/02·03·06·08` 4개 파일이 실제 코드와 라인 단위로 일치하는지 grep으로 교차 확인할 것.
