---
name: project_glass_liquid_bg_review_2026-09-25
description: list-bg.jpg 사진 배경 + 유리질감(backdrop-filter) 전면 적용 리뷰(2026-09-25) — 1차 BLOCKED → 2차 재검토도 BLOCKED(Critical은 해소, Major 3건 신규/잔존). 재검토 시 이 파일부터 확인.
type: project
---

2026-09-25, entries.css/entries.js/index.html + assets/imgs/list-bg.jpg(신규) 커밋 전 리뷰에서 1차 BLOCKED 판정.

**발견된 Critical:** `.ticket-hero`(entries.css 466-477)의 `background` 3-layer 순서 버그.
`var(--glass-sheen)`(반투명) → `url('../imgs/list-bg.jpg')`(불투명 JPG, cover/no-repeat로 전체를 덮음) → `rgba(232, 98, 44, 0.82)`(마지막=베이스 레이어).
CSS 배경 레이어는 먼저 적힌 게 위, 나중 게 아래(베이스)다. 사진 레이어가 불투명이라 그 아래 깔린 오렌지 82%가 전혀 보이지 않는다 — 의도(사진에 오렌지 틴트를 입혀 브랜드 색+대비를 보장)가 완전히 무효화됨. 반면 `#btn-add`(415-429)와 `.count-chip`(178)은 같은 오렌지 82%를 쓰지만 사진 레이어가 없어(투명 그라디언트만 위) 정상 작동 — `.ticket-hero`만의 버그. 재발 방지: 사진 위에 색을 "틴트"하려면 색(alpha 있는) 레이어가 사진보다 위에 와야 한다.

**발견된 Major(3):**
1. **list-bg.jpg 위 흰 글자 대비 미검증.** 이미지 실물 확인 결과 좌측·중앙에 큰 밝은 크림/핑크색 블롭이 이미지 상단~중반 넓게 걸쳐 있음. `#screen-list`(143)는 `background-position: center top`이라 스크롤 콘텐츠 영역(`.group-label` 등, 236-242, 카드 없이 사진에 직접 얹힌 흰 글자)이 정확히 이 밝은 블롭 위에 올라갈 위험이 큼. 실기기/실뷰포트 스크린샷으로 확인 필요 — 안전하게 하려면 사진 위에 별도의 어둡게 하는 그라디언트 오버레이를 추가해 텍스트 대비를 사진 콘텐츠에 의존하지 않게 할 것.
2. **backdrop-filter 이중 중첩 6곳+.** 부모·자식 모두 backdrop-filter를 갖는 조합: `.ticket-hero`(466)>`.back-btn`(486/501), `.ticket-wrap`(516)>`.status-badge`(604)/`.btn-secondary`(713)/`.btn-danger`(734), `.sheet-panel`(812, qr-sheet-panel 인스턴스)>`.qr-card`(865)/`.btn-secondary`(713, #btn-qr-install), `.dialog-panel`(919)>`.btn-secondary`/`.btn-danger`(dialogConfirmBtn이 danger일 때, entries.js:501). 이중 블러로 성능·시각적 과블러 우려.
3. **새 `--glass-*` 토큰(16-23, rgba 색 포함)이 docs/02-colors.md의 "코드에 남아있는 추가 색(7개 밖의 예외, 늘리지 않는다)" 표에 반영 안 됨.** [[color_doc_sync_rule]]과 같은 패턴의 문서 드리프트.

**Minor:** `.ticket-wrap`(520) 배경에 `--bg`와 값이 동일한 `#f3efe6` 하드코딩(토큰 미사용), `#btn-add`(415-429)가 새로 뽑아낸 `--glass-blur`/`--glass-sat`/`--glass-border`/`--glass-sheen` 대신 자기만의 리터럴 값을 중복 보유(추출한 토큰과 드리프트 위험), `color: #ffffff` 반복(10곳+, `--paper` 토큰 있는데 미사용), index.html:55 `.group-label--dim` 클래스가 CSS에 정의 없음(no-op, 이 diff에서 새로 생긴 건지는 미확인).

다음 리뷰 시: 위 Critical부터 수정 여부 확인, 이미지 위 대비는 실제 스크린샷 없이는 최종 확정 어려우니 재차 강조할 것.

---

**2차 재검토(같은 날, 2026-09-25) — 결과: BLOCKED 유지.**

1차 지적 5건 중 실제로 고쳐진 것:
- **Critical(레이어 순서) 완전히 해소.** `.ticket-hero`(entries.css 469-483)가 `var(--glass-sheen), linear-gradient(rgba(232,98,44,.82) 2회), url(list-bg.jpg)` 순서로 재배치되어, 이제 사진이 맨 아래(베이스)이고 오렌지 틴트가 그 위에 와서 정상적으로 보인다. 주석(473-475)도 재발 방지 원칙("색을 틴트하려면 alpha 레이어가 사진보다 위")을 남겨둠 — 좋은 패턴.
- **backdrop-filter 이중 중첩 6곳 전부 해소.** `.status-badge`/`.btn-secondary`/`.btn-danger`/`.qr-card`에서 자체 backdrop-filter 제거, `.topbar .back-btn`/`.sheet-header .back-btn`에 `backdrop-filter: none` 오버라이드 추가(510-514). 각 위치에 "이미 블러된 부모 안이라 이중 블러 방지"라는 주석을 남겨 재발 방지 근거가 명확함. 다른 곳(entry-card/count-chip/filter-tab/qr-btn/#btn-add/sheet-panel/dialog-panel)은 블러된 조상이 없어 단일 블러로 정상 확인.
- **Minor 전부 해소.** `.ticket-wrap` 배경 `var(--glass-sheen), var(--bg)`로 토큰화(535), `color: #ffffff` 리터럴 전부 `var(--paper)`로 교체(그 중 `.list-empty`도 포함, 260행 확인), `#btn-add`가 공유 `--glass-*` 토큰만 참조(427-430)하도록 정리.

새로 확인/재확인된 미해결 사항(Major 3건 → BLOCKED 유지 근거):

1. **list-bg.jpg 대비 완화가 실측 검증 없이는 여전히 불충분해 보임.** `#screen-list`(145-150)에 추가된 어둡게하는 그라디언트(`rgba(20,10,5,.35)`→`.05` at 220px→transparent at 420px)는 이미지 최상단만 220px 구간 위주로 어둡게 하는데, 실제 `list-bg.jpg`를 열어보면 좌상단 크림색 블롭이 이미지 상단부에서 이미 꽤 밝게 시작한다. `#screen-list`는 `.screen{min-height:100vh}`로 뷰포트 높이가 바닥이라, 리스트 항목이 적어 화면이 뷰포트 높이에 가까울 때(흔한 경우) `background-size:cover`의 확대율이 상대적으로 작아 이미지의 밝은 블롭이 오히려 헤더 쪽(상단 0~250px)에 가깝게 걸릴 가능성이 있다 — "리스트가 매우 길 때"보다 "리스트가 짧거나 뷰포트 높이 근처일 때"가 더 위험한 케이스일 수 있어, 원래 disclosure에서 말한 위험 방향과 반대일 수 있음. 실기기/실제 뷰포트 스크린샷으로 헤더 텍스트(.title/.subtitle/.group-label, 모두 var(--paper) 흰 텍스트) 대비를 직접 확인하기 전까지는 "완화됨"으로 간주하기 어렵다.
2. **docs/09-shadcn-tokens.md 미동기화.** CLAUDE.md가 "entries.css의 :root 변수는 docs/02-colors.md와 docs/09-shadcn-tokens.md 둘 다와 동기화해야 한다"고 명시하는데, 이번 수정은 02번에만 `--glass-*` 4개 토큰을 반영했고 09번은 그대로다([[color_doc_sync_rule]]과 같은 패턴, 이번엔 절반만 해소).
3. **docs/06-elevation.md·08-guidelines.md의 "그림자 없음/그라데이션 금지" 규칙이 이번 리디자인으로 대폭 더 어긋남.** 06번 17행은 "화면에 붙어있는 요소(리스트 카드, 버튼, 입력창) — 그림자 없음"이라고 명시하는데, 이번 diff에서 `.entry-card`(리스트 카드 그 자체)에 `box-shadow: var(--glass-shadow)`가 새로 생겼다. 08번 21행 DON'T("그라데이션, 글로우, 그 외 임의 그림자를 추가하지 않는다")도 `--glass-sheen` 그라디언트가 카드/칩/버튼/시트 전체에 퍼지면서 정면으로 어긋난다. `.cta-btn`/`.dialog-panel` 그림자 불일치는 [[project_ticket_fullbleed_brown_rebrand_review]]에서 이미 "범위 밖 Minor"로 넘어간 적 있지만, 이번엔 그 범위가 리스트 카드 전체 + 그라디언트 전면 도입으로 훨씬 커졌으므로 Minor로 넘기기보다 06/08번 문서를 "유리질감 레이어" 방향으로 다시 쓰는 게 맞아 보임([[elevation_shadow_spec_violation]]과 동일 패턴 — 코드가 의도적 최신이면 문서를 코드에 맞추되, 이번엔 그 갱신이 아직 없음).

**Minor(차단 아님, 다음에 같이 처리):**
- index.html 55행 `.group-label--dim` 클래스가 entries.css에 여전히 미정의(no-op) — 1차 리뷰 때부터 이어짐, 이번 diff 범위 밖으로 보이나 미해소.
- `docs/02-colors.md` 37행 `#3a1e10` 예외색 사용처 표에 `.entry-status--praying` 누락 — [[project_ticket_fullbleed_brown_rebrand_review]]에서 이미 지적된 채 남아있음.
- list-bg.jpg 파일 용량/포맷(WebP 등) 최적화 여부 미확인 — Bash 도구가 없어 파일 크기를 직접 잴 수 없었음, 다음 리뷰에서 재확인 권고.

**Why:** 유리질감 리디자인은 색/그림자/그라데이션을 동시에 대량으로 바꾸는 유형이라 [[color_doc_sync_rule]]·[[elevation_shadow_spec_violation]]·[[project_ticket_fullbleed_brown_rebrand_review]]에서 반복된 "코드 먼저, 문서 나중(또는 누락)" 패턴이 다시 나타났다. Critical/backdrop-filter 이중중첩처럼 "버그"에 해당하는 항목은 이번에 정확히 고쳐졌지만, "문서 동기화"에 해당하는 항목(09번, 06/08번)은 02번만 처리되고 나머지는 놓쳤다.

**How to apply:** 다음 리뷰(3차)에서는 (1) list-bg.jpg를 실제 브라우저 스크린샷(짧은 리스트/긴 리스트 둘 다)으로 헤더 대비를 직접 확인하기 전까지 Major #1을 닫지 말 것, (2) docs/09-shadcn-tokens.md에 `--glass-*` 4개가 shadcn 네이밍으로 반영됐는지 확인, (3) docs/06-elevation.md·08-guidelines.md가 "유리질감 레이어(그라디언트 하이라이트 + 그림자)"를 새 예외/방향으로 명시했는지 확인.
