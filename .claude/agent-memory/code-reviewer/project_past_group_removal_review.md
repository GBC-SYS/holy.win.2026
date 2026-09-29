---
name: project_past_group_removal_review
description: 리스트 화면의 "이전 명단"(7일 지난 글) 그룹을 렌더링에서 완전히 제거한 diff 리뷰(2026-09-29) — APPROVED. entry-card--dark variant/group-past/listPast 전부 삭제, isEmpty 판정이 필터 무관 source.length===0으로 변경됨.
type: project
---

**배경:** [[project_infinite_scroll_review]]에서 무한 스크롤을 붙인 직후, recent 그룹이 늘어나면 그 뒤의 past 그룹("이전 명단")에 도달하기 위해 스크롤을 한없이 내려야 하는 문제가 드러남. 사용자 확인 후 "7일 지난 글은 화면에서 아예 숨긴다"로 방향 확정.

**변경 요지:**
- `index.html`: `#group-past`(그룹 라벨 + `#list-past`) 블록 전체 삭제. `#list-empty` 문구를 "아직 작성한 글이 없어요" → "최근 7일간 작성한 글이 없어요"로 변경.
- `entries.js`의 `renderList()`: `source`를 `entries.filter(group==='recent')`로 한정(카운트 칩도 recent 전용). `isEmpty` 판정을 `listFilterMine && source.length===0` → `source.length===0`으로 바꿔, "전체" 필터에서도 recent 0건이면 빈 상태가 뜨도록 함.
- `createEntryCard(entry, variant)` → `createEntryCard(entry)`로 variant 매개변수 제거(호출부가 하나뿐이라 'dark' 분기가 죽은 코드였음). 전체 grep으로 두 번째 인자를 넘기는 호출부가 없음을 확인.
- `entries.css`의 `.entry-card--dark`와 하위 규칙(`.entry-to`/`.relation-tag`/`.entry-status--praying/--done` dark 변형) 전부 삭제. `--card-muted`/`--card-muted-line` 토큰은 qr-info-card/sheet-handle/보조 버튼 등 다른 곳에서 여전히 쓰이고 있어 죽은 토큰이 되지 않음(확인 완료).
- docs 5개(01/02/06/07/08)가 "카드가 최근/이전 두 톤이었으나 유리질감 표면 하나로 통일"이라는 과거형 서술로 정확히 갱신됨 — grep으로 "이전 명단"/"entry-card--dark"의 현재형(오류) 잔존 없음을 확인.

**부수적으로 해소된 기존 이슈:** `index.html`의 `.group-label--dim` no-op(과거 [[project_glass_liquid_bg_review_2026-09-25]]에서 지적된 Minor)이 `#group-past` 블록 삭제와 함께 같이 사라짐 — 별도 조치 없이 자연 해소.

**검토했지만 이슈로 보지 않은 것들:**
- past 그룹 항목은 이제 리스트 카드로 렌더링되지 않으므로 `openTicket()`으로 진입할 경로 자체가 없어짐 — 즉 사용자가 7일이 지난 자신의 글을 수정/삭제할 UI 경로가 없어짐. 사용자가 명시적으로 확정한 방향(행사 성격상 최근 글만 관리하면 충분)이라 버그로 보지 않았으나, 팀 논의가 필요하면 재검토 대상.
- count-chip이 이제 recent 전용 인원수만 표시 — 전체 누적 참여자 수가 아니라 "최근 7일 참여자 수"로 의미가 바뀜. 스펙대로지만 문구/라벨이 "명"으로만 되어 있어 오해 소지 있음(Minor, 차단 아님).

**Why:** 대량 더미데이터(94건)로 무한 스크롤을 검증하다 발견된 UX 문제 → 스코프를 좁히는 방향으로 기능 자체를 제거한 케이스. 코드/문서/CSS 세 군데 모두 일관되게 정리되어 한 번에 APPROVED.

**How to apply:** 다음에 "명단이 계속 쌓이는데 예전 것도 봐야 한다"는 요구가 다시 나오면, past 그룹을 부활시키기보다 검색/필터/날짜별 조회 같은 별도 진입점을 검토할 것 — 이번에 "무한 스크롤 + 두 그룹" 조합이 근본적으로 상충한다는 게 확인됐기 때문.
