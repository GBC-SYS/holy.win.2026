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

---

**3차 리뷰(같은 날 저녁, 2026-09-25) — `.ticket-hero` 오렌지 틴트 불투명도 0.82→0.55 diff 단독 리뷰. 결과: BLOCKED.**

Major #2(09번 미동기화)·#3(06/08번 그라디언트/그림자 예외 문구 없음)은 이 시점 재확인 결과 **모두 해소됨** — docs/09-shadcn-tokens.md 71-75행에 `--glass-*` 4개 반영 완료, docs/06-elevation.md 23행·08-guidelines.md 21행에 "예외 — 유리질감(glassmorphism) 레이어" 문구가 명시되어 `--glass-shadow`/`--glass-sheen` 공유 토큰 한정 그림자·그라데이션 예외를 정식 허용하고 있다. `.ticket-hero`의 오렌지 틴트 자체(alpha 값)는 이 두 토큰에 속하지 않는 "표면마다 다른 rgba 틴트"(docs/02-colors.md 33행이 이 구조를 이미 설명)라서, 틴트 alpha를 0.82→0.55로 바꾸는 것 자체는 문서 구조상 드리프트가 아니다. 레이어 순서(사진 베이스 → 오렌지 틴트 → 유리 하이라이트)와 주석도 그대로 유지됨.

**남아있는 Major #1(list-bg.jpg 대비 미검증)이 이번 diff로 악화됨 — 육안+계산 추정 결과:**
`assets/imgs/list-bg.jpg`를 열어 확인한 결과 상단(≈y 150-450/1280, `.ticket-hero`가 `center top` 크롭으로 보여주는 바로 그 영역) 좌측에 크림/피치색 밝은 블롭이 있음 — 대략 RGB(235,210,190) 톤으로 추정. 이 블롭 위에 오렌지 틴트를 합성하면(단순 알파블렌드, 그 위에 `--glass-sheen` 화이트 하이라이트까지 얹으면 더 밝아짐):
- 기존 0.82 opacity: 합성색 ≈ RGB(233,118,70), WCAG 상대휘도 계산 시 흰 텍스트 대비 ≈ **2.9:1** 근사 — 44px/900 `.ticket-name`(대형 텍스트, 3:1 기준) 기준으로도 이미 경계선상.
- 변경된 0.55 opacity: 합성색 ≈ RGB(233,148,110), 대비 ≈ **2.5:1** 근사 — 3:1(대형 텍스트)·4.5:1(일반 텍스트) 기준 둘 다 확실히 미달. `.topbar-title`(20px/700, 대형 텍스트 경계)과 `.ticket-from`(16px/600, 일반 텍스트 취급해야 함— 08번이 언급하는 "bold" 기준은 보통 700 이상이라 600은 대형 텍스트 예외에 해당하지 않음)이 특히 위험.
이 값은 픽셀 스포이드 도구 없이 이미지 크롭을 눈으로 보고 추정한 근사치이며(Bash/이미지 분석 도구 미보유), 정확한 판정에는 실제 렌더링 화면에서 DevTools 컨트라스트 체커로 확인이 필요하다 — 다만 0.82→0.55 방향 자체가 "사진을 더 드러낸다"는 목적과 "흰 텍스트 대비를 지킨다"는 목적이 서로 상충하는 트레이드오프이므로, 어느 쪽으로 추정하든 **완화가 아니라 악화**라는 결론은 바뀌지 않는다.

**Why:** Major #1은 처음 지적된 2차 리뷰 이후 한 번도 실측 확인 없이 넘어왔고, 이번 diff는 그 위험을 사진 노출도를 높이는 방향으로 더 키웠다. "사진이 안 보인다"는 사용자 체감 문제를 오렌지 틴트를 낮추는 방식으로 풀면 필연적으로 텍스트-배경 대비가 낮아지므로, 이 트레이드오프는 틴트 alpha 하나로 풀 문제가 아니다.

**How to apply:** 다음에 이 영역을 다시 만지면 (1) 틴트 alpha를 올리는 단순 되돌리기보다, 텍스트가 얹히는 부분(`.topbar`, `.ticket-head`)에만 별도의 어둡게 하는 스크림(예: 텍스트 뒤 국소 radial/linear 그라디언트)을 추가하는 방향을 우선 검토할 것 — 단, 08번 DON'T "글자에 그림자를 넣지 않는다"는 text-shadow 금지이지 배경 스크림 금지가 아니므로 저촉되지 않는다. (2) 실제 브라우저에서 DevTools 컨트라스트 체커로 `.ticket-name`/`.topbar-title`/`.ticket-from` 위치의 실측 대비를 재확인하기 전까지 이 영역을 "완료"로 간주하지 말 것.

---

**4차 리뷰(2026-09-25, 같은 날) — 레이어를 `sheen → 무채색 스크림(20,10,5,.35) → 오렌지 틴트(232,98,44,.5) → 사진`으로 재구성 + Python(PIL) 기반 픽셀 단위 워스트케이스 대비 계산. 결과: BLOCKED.**

3차의 "국소 스크림 추가" 제안이 정확히 반영됐고, `entries.css` 469-486행의 레이어 순서·알파값이 diff 설명과 실제 코드가 정확히 일치함을 확인(코드 대조 완료). `.topbar-title`(20px/700)·`.ticket-name`(44px/900)을 large-text 3:1, `.ticket-from`(16px/600)을 일반 4.5:1로 나눈 WCAG 임계값 판단도 정확함(600은 16px에서 large-text bold 임계 18.66px 미달이라 어차피 4.5:1 적용이 맞음). `.ticket-hero` 폭이 `430(max-width) - 32(margin 0 16px)=398px`로 코드에서 정확히 도출된다는 점도 확인 — 이 부분 방법론은 신뢰할 수 있음.

**새로 발견한 Major — 검증이 데스크톱/태블릿 캡 폭(430px)에서만 이뤄짐, 실제 모바일 폭은 미검증.**
`.container`는 `width:100%; max-width:430px`(entries.css:100-110)라서 430px는 "더 넓은 뷰포트에서 중앙정렬"되는 캡값이고, 실제 폰(360~414px 등, CLAUDE.md가 명시한 주 타깃)에서는 `.ticket-hero` 폭이 398px보다 좁아진다(예: 360px 뷰포트 → hero 폭 328px). 소스 사진(720×1280, 세로가 훨씬 긴 세로사진)과 가로로 넓은 박스 조합에서는 `background-size:cover`의 배율이 항상 폭 기준으로 결정되므로, 폭이 좁아질수록 배율이 작아지고 `center top` 크롭이 원본 이미지의 더 아래쪽까지 노출된다(예: 430px 캡에서는 원본 y0~460px 노출, 360px 뷰포트에서는 y0~558px까지 노출). `.ticket-name`/`.ticket-from`처럼 `.ticket-hero` 하단부에 위치한 텍스트는 이 크롭 변화에 따라 실제로 겹치는 사진 픽셀이 폭마다 달라진다. 이번에 보고된 워스트케이스 중 가장 타이트한 값(`.ticket-from` 4.68:1 vs 기준 4.5:1, 여유 약 4%)은 오직 430px 폭 1개 지점에서만 계산됐고, 실제 주 타깃 폭(320~414px 범위)에서 같은 계산을 다시 돌리지 않으면 이 4% 여유가 유지되는지 알 수 없다. Major #1(list-bg.jpg 대비 미검증)의 연장선 — 이번엔 "계산 자체는 정교해졌지만 검증 범위(대표 뷰포트 폭)가 한 지점뿐"이라는 새로운 형태로 남음.

**문서 동기화 Major (신규):** 새로 도입된 무채색 스크림 `rgba(20, 10, 5, 0.35)`가 `docs/02-colors.md` 33행(코드에 남아있는 추가 색 표)에 반영되지 않음. 같은 표에 이미 `--glass-border`/`--glass-sheen`/`--glass-shadow`뿐 아니라 `#3a1e10`/`--success`/`--destructive` 등 리터럴 색까지 개별 등록해온 이 저장소 관례([[color_doc_sync_rule]])에 따르면, 이번에 새로 생긴 스크림 색도 "표면마다 다른 rgba 틴트"(기존 오렌지 틴트, 이미 3차에서 드리프트 아님으로 판단됨)와는 별개의 새 범주(사진 위 무채색 대비 보정 오버레이)라서 별도 등록이 필요해 보임.

**Minor(차단 아님, 이전 리뷰에서 이어지는 항목 — 이번 diff 범위 밖):**
- `docs/02-colors.md` 37행 `#3a1e10` 예외색 사용처 표에 `.entry-status--praying` 누락 — 계속 미해소.
- `index.html` 55행 `.group-label--dim` 미정의(no-op) — 계속 미해소.

**Why:** 3차에서 요청한 "alpha만 조정하지 말고 텍스트 영역에 국소 스크림을 추가하라"는 정확히 이행됐고 계산 방법론도 이전(육안 추정)보다 훨씬 정교해졌다. 다만 검증 대상 폭을 하나만 선택하면서 하필 실제 사용자가 가장 적게 마주칠 폭(430px 캡, 넓은 화면)을 선택했고, 가장 타이트한 마진(4%)이 바로 이 미검증 변수(뷰포트 폭)에 의존한다.

**How to apply:** 다음 리뷰에서는 (1) 동일한 픽셀 합성 계산을 320/360/375/393/412/430px 등 대표 폭 집합에서 재실행해 전역 워스트케이스를 다시 잡을 것(가장 좁은 폭이 사진을 가장 적게 확대해 크롭이 가장 아래까지 내려가므로 보통 가장 위험한 지점일 가능성이 높음), (2) `docs/02-colors.md`에 새 스크림 색 등록 여부 확인.

---

**5차 리뷰(2026-09-25, 같은 날) — 스크림 alpha 0.35→0.4 상향(양쪽 위치 통일) + 320~430px 전 구간 PIL 재계산. 결과: APPROVED.**

코드 대조 결과 4차의 두 Major 모두 실제로 해소됨을 확인:
1. **검증 폭 범위 확장.** `#screen-list`(entries.css 146-152)와 `.ticket-hero`(469-488) 둘 다 스크림이 `rgba(20,10,5,0.4)`로 통일(이전 `.ticket-hero`만 0.35였던 것도 0.4로 맞춰짐 — `grep`으로 0.35 잔존 없음 확인). 사용자가 보고한 방법론(720×1280 소스, `box_w=min(viewport_w,430)`, `cover` 배율=`max(box_w/720, box_h/1280)`, `center top`이라 `offset_y=0`)은 CLAUDE.md·코드의 `.container{width:100%;max-width:430px}` 구조와 정확히 일치. 레이어 합성 순서(사진→틴트0.5→스크림0.4→[히어로는 sheen까지])도 코드 순서(482-484행, 148행)와 정확히 일치. 실제 이미지(`list-bg.jpg`, 720×1280 크림/피치 블롭 배경)를 열어 육안 확인한 결과, 보고된 워스트케이스 대비(그룹라벨 4.90:1@375px, ticket-from 5.10:1@360px)를 손으로 근사 재계산(피크 크림톤 RGB≈245,215,195 가정)해도 ≈5.05:1로 근사 일치 — 수치가 조작되지 않았다고 판단.
2. **docs/02-colors.md 33행 다음(현재 36행)에 `rgba(20,10,5,.4)` 신규 행 등록 확인.** 코드 값(0.4)과 문서 값(.4) 일치, 용도·기준(대형 3:1/일반 4.5:1) 설명도 정확.

새로 발견된 이슈 없음. `docs/09-shadcn-tokens.md`는 기존 오렌지 틴트도 `--glass-*` 공유 토큰에 포함 안 된 "표면별 리터럴" 패턴이라 이번 스크림도 같은 패턴 유지가 맞음(드리프트 아님).

**Why:** 4차에서 지적한 두 Major가 "1개 폭에서만 계산"→"320~430px 대표 폭 집합 재계산", "문서 미등록"→"등록"으로 정확히 대응되어 해소됨. 코드 대조와 수동 근사 계산이 보고된 수치와 합리적으로 일치.

**How to apply:** 이 영역이 다시 바뀌면 (1) 틴트/스크림 alpha 중 하나만 바꾸는 diff는 반드시 "몇 개 폭에서 재계산했는지"를 diff 설명에 명시하도록 요구할 것(1개 폭만 계산하는 패턴이 3번 반복됐던 이력이 있음), (2) 이 저장소엔 Bash/PIL 실행 도구가 없어 수치를 직접 재현할 수 없으므로, 보고된 수치는 항상 "코드-설명 일치 + 극단값(peak 밝기) 수동 근사"로만 검증 가능하다는 한계를 인지할 것. 남은 Minor(entry-status--praying 누락, group-label--dim no-op)는 계속 범위 밖.
