---
name: project_total_count_badge_review
description: 헤더에 추가된 "총 N명" 배지(.total-count-badge) 리뷰 — entries.length(필터 무관 전체 건수) 사용, 유일하게 fluid-scale 없는 고정 15px font-size, docs/07 미등재
type: project
---

헤더 `.header-actions`(검색/새로고침 아이콘 버튼 옆)에 `#total-count-text` 배지 추가. `renderList()` 안에서 필터링 전 `entries.length`(전체 등록 건수, 필터 탭/검색과 무관)를 매번 다시 쓴다. 2026-10-05 리뷰, Critical/Major 없이 APPROVED. textContent만 쓰므로 XSS 없음, 로딩 실패 시에도 `entries=[]`로 안전하게 "총 0명" 표시됨(loadEntries의 try/catch 경로 모두 renderList()로 귀결).

**Why (발견한 특이사항):**
1. `font-size: 15px`가 고정값 — grep 결과 entries.css 전체에서 `calc(Npx * var(--fluid-scale))` 패턴을 안 쓰는 유일한 font-size 선언(사용자가 명시적으로 요청한 변경). 320px에서 다른 모든 텍스트(필터탭·검색입력·아이콘버튼 36px은 원래 고정)는 0.9배로 줄어드는데 이 배지만 그대로라 좁은 화면에서 비례가 깨질 수 있음.
2. `.header-row`(title + header-actions, `justify-content: space-between`)에 `flex-wrap`/`overflow` 처리가 없음. header-actions가 2개(36px 아이콘버튼)에서 3개로 늘어 320px 뷰포트에서 타이틀("전도 대상자", 28px*0.9/900) + 배지 폭을 합치면 여유 폭(272px)에 근접/초과할 수 있음 — 실측 미확인(이 레포 과거 리뷰에서 반복된 "320px 초협폭 미검증" 패턴, [[install_prompt_feature_review]] 참고).
3. docs/07-components.md "채우는 칸"에 새 컴포넌트(total-count-badge)가 등재되지 않음 — 토큰은 전부 기존 값(.back-btn과 동일한 `rgba(236,231,219,.6)` + `--ink`) 재사용이라 02/05/06 문서 드리프트는 없음.
4. `aria-live="polite"`가 배지 자체에 걸려 있는데, `renderList()`가 필터 탭 클릭·검색 키입력(매 키 입력마다!)·무한스크롤·상태토글 등에서도 매번 호출되며 그때마다 (실제 값이 안 바뀌어도) `textContent`를 재할당함 — 스크린리더가 불필요하게 재안내할 가능성(기능 버그는 아님, 비효율).

**How to apply:** 다음에 이 배지를 다시 만지거나 유사한 헤더 요소를 추가할 때 — (a) 320px 뷰포트에서 header-row 줄바꿈/잘림 여부 실측 우선순위로 확인, (b) 고정 15px을 유지할지 fluid-scale로 되돌릴지 사용자와 재확인, (c) docs/07 등재는 차단 사유 아님(Minor로만 취급해온 전례, [[project_loading_skeleton_a11y_review]] 등), (d) renderList() 호출 빈도가 높아지는 변경을 할 때는 textContent 재할당이 꼭 필요한 경로인지 점검.
