---
name: project-status-badge-hint-layout
description: 티켓 상세 "상태" 그리드 칸(#t-status, 배지+말풍선)이 여러 레이아웃을 거쳐 정착한 이력 — 그리드 풀스팬은 폐기됨, fit-content는 시도했으나 효과 없어 제거됨
metadata:
  node_type: memory
  type: project
  modified: 2026-09-30T00:00:00.000Z
---

`#screen-ticket`의 `.ticket-grid` 4칸(관계/제출일/제출자/상태) 중 "상태" 칸(`#t-status`, 상태 배지 + "눌러서 상태 변경" 말풍선 힌트)이 한 세션 안에서 여러 레이아웃을 거쳐 다음 형태로 정착했다:

1. 배지 아래에 말풍선을 세로로 쌓음(원래 형태, 좁은 칸 폭 때문에 가로 배치 시 배지가 타원으로 깨지는 문제가 있었다는 주석이 남아 있었음)
2. 배지 옆에 말풍선을 가로로 배치하기 위해 "상태" 칸만 `grid-column: 1 / -1`로 그리드 두 컬럼을 전부 차지하게 넓힘
3. 사용자가 "상태 영역을 오른쪽 빈 공간으로 이동해줘"라고 요청 → **2번(풀스팬)을 폐기**하고 원래 그리드 위치(제출자 옆, 오른쪽 아래 칸)로 되돌림. 대신 `#t-status`에 `flex-wrap: wrap`을 줘서, 좁은 칸에서 배지+말풍선이 한 줄에 안 들어가면 말풍선만 다음 줄로 넘어가고 배지(`white-space: nowrap`)는 항상 알약 모양을 유지하게 함
4. 배지+말풍선 그룹을 칸 안에서 오른쪽 정렬(`justify-content: flex-end`), 말풍선 폭도 축소
5. 말풍선 안 "눌러서 상태 변경" 텍스트에 마퀴(실제 텍스트가 고정폭 창 안에서 흐르는 효과) 적용 — 방향을 오른쪽→왼쪽에서 왼쪽→오른쪽으로, 다시 오른쪽→왼쪽으로 두 번 반전함(사용자가 참고 이미지로 정정). [[feedback-ambiguous-visual-requests]]의 "애니메이션 방향 요청은 참고 이미지 없이는 오역되기 쉽다" 사례 참고
6. 말풍선 배경색을 `.ticket-hero`와 동일한 오렌지 유리 톤(`var(--glass-sheen), rgba(232, 98, 44, 0.82)`)으로, 글자색도 `.ticket-hero` 내부 요소들과 똑같이 `var(--ink)`로 통일(기존 `var(--muted)`는 이 배경 위에서 대비가 무너짐)
7. 375px처럼 좁은 화면에서 폰트 폴백(느린 네트워크로 Pretendard 로드 전 시스템 폰트 사용) 시에도 배지가 카드 밖으로 안 새도록 `.status-badge`에 `max-width:100%; min-width:0; overflow:hidden; text-overflow:ellipsis;`, 그리드 칸과 `#t-status`에 `min-width:0` 추가

**시도했으나 효과 없어서 제거한 것 — `width: fit-content`:** devtools 스크린샷에서 `#t-status`(`<p class="grid-value">`)의 박스 모델이 실제 콘텐츠(배지+말풍선)보다 훨씬 넓게 보인다는 지적을 받고 `width: fit-content; margin-left: auto;`를 추가했으나, 실측 결과 폭이 전혀 줄지 않았다(여전히 그리드 칸 전체 폭). 원인은 CSS 스펙 자체: `fit-content`는 "내용이 줄바꿈 없이 한 줄에 들어가려면 필요한 폭(max-content)"이 사용 가능한 공간보다 넓어서 `flex-wrap`이 일어나는 상황에서는 정의상 "사용 가능한 공간 전체"로 떨어진다. 배지(~82px)+말풍선(~72px)을 한 줄에 놓으면 162px인데 그리드 칸은 128~153px밖에 없어 항상 이 케이스에 해당한다. **이 여백은 devtools 박스 모델 오버레이에서만 보이고 실제 화면(배경도 테두리도 클릭 이벤트도 없는 투명 `<p>`)에는 전혀 영향 없다** — 사용자에게 이걸 설명하고 AskUserQuestion으로 확인한 결과 "그대로 둔다"를 선택해 `width: fit-content`는 다시 제거했다.

**Why(다음에 또 이 요청을 받으면):** 이 시각적 "빈 여백"을 devtools에서까지 완전히 없애려면 유일한 방법은 배지+말풍선을 `flex-direction: column`으로 항상 세로 쌓기로 바꾸는 것인데, 그러면 화면이 넓어 한 줄에 들어갈 수 있는 경우(큰 폰)에도 항상 세로 배치가 되어 4번 단계(가로 배치)를 포기하게 된다. 이 트레이드오프를 먼저 설명하고 확인받을 것 — 실제 화면에 안 보이는 devtools 전용 이슈를 말없이 큰 레이아웃 변경으로 "해결"하지 말 것.

**How to apply:** 이 칸을 또 건드리게 되면 (a) 그리드 풀스팬은 이미 폐기된 대안이니 다시 시도하지 말 것, (b) `fit-content`로 devtools 여백을 줄이려는 시도도 flex-wrap이 걸려있는 한 소용없다는 걸 먼저 인지할 것, (c) 정확한 현재 CSS 값(폭, 배율 등)은 계속 바뀌었으므로 `entries.css`의 `#t-status`/`.status-badge`/`.status-hint`를 직접 읽어서 확인할 것.
