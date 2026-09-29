---
name: project_group_filter_full_removal_review
description: "7일 이내(group:'recent') 시간 기반 필터링" 자체를 완전히 제거해 전체 명단을 하나의 리스트로 보여주는 diff 리뷰(2026-09-29) — APPROVED. [[project_past_group_removal_review]]의 후속(그때는 past 그룹 UI만 숨겼고, 이번엔 group 계산 자체를 없앰).
type: project
---

**배경:** [[project_past_group_removal_review]](같은 날 이전 리뷰)에서는 "이전 명단"(#group-past) UI만 렌더링에서 숨겼지만, `entry.group`(`resolveEntryGroup()`가 `submitted_at` 7일 이내 여부로 파생 계산)과 `renderList()`의 `group==='recent'` 필터는 남아 있어 7일 지난 글은 여전히 카운트/화면에서 제외되고 있었다. 이번 변경으로 그 계산 자체를 없애 전체 명단이 보이도록 확정.

**변경 확인 완료:**
- `assets/js/entries.js` `renderList()` — `source`를 상태/작성자 필터만 적용한 결과로 직접 대입(구 `filtered` 변수명이 `source`로 흡수됨), 이후 `group==='recent'` 필터 단계 삭제. `countText`/`visibleSource` slice/`isEmpty`/sentinel 토글/aria-selected 갱신 로직은 전부 `source` 하나만 보고 동작하도록 이미 일관되어 있어 추가 수정 없이도 맞물림.
- `mapRowToEntry`에서 `group` 필드 제거, `resolveEntryGroup`/`RECENT_GROUP_WINDOW_MS` 완전 삭제 — grep으로 `entry.group`/`resolveEntryGroup`/`RECENT_GROUP_WINDOW_MS`가 `assets/js/` 전체에 더 이상 없음을 확인(과거 리뷰 메모 파일들에만 역사적 언급으로 남음).
- `index.html`의 `#group-recent`/`#list-recent`/`#list-empty` id는 그대로 유지, 라벨/빈 상태 문구만 "전도 대상자 리스트"/"등록된 전도 대상자가 없어요"로 교체 — `entries.js`가 참조하는 DOM id와 어긋나지 않음.
- `docs/01/02/03/06/07/08` 전부 "제출 시점과 무관하게 전체 명단을 보여준다"는 현재형으로 갱신됨. grep으로 "이번 주 제출"/"최근 7일"/"entry-card--dark"/"#list-past" 등 잔존 서술 없음 확인.

**발견한 이슈(이번 diff 범위 밖, Major):** 루트 `CLAUDE.md`(docs/ 폴더가 아니라 저장소 최상위)의 "Screen flow" 문단이 여전히 `renders list cards into #list-recent/#list-past`라고 서술함 — `#list-past`는 [[project_past_group_removal_review]] 때 이미 index.html에서 삭제되어 오늘 두 커밋 전부터 실재하지 않는 id다. CLAUDE.md는 docs/ 갱신 체크리스트에 포함되지 않아 두 차례 연속 이 드리프트를 놓침. group 관련 기능을 다시 건드릴 일이 생기면 CLAUDE.md도 grep 대상에 포함시킬 것.

**Why:** 대량 더미데이터(94건, 7일 지난 백데이트 포함)로 실제 count-chip이 59명→94명으로 바뀌는 걸 스크린샷으로 확인해 의도대로 전체가 노출됨을 검증함 — 정적 코드 리뷰로는 확인 불가능한 부분이라 사용자 보고를 신뢰.

**How to apply:** 이 저장소에서 "N일 이내만 보여준다/숨긴다" 류의 시간 기반 필터를 다시 추가하거나 제거할 때는 `docs/`뿐 아니라 루트 `CLAUDE.md`의 "Screen flow" 문단도 함께 grep해 DOM id 서술이 실제 index.html과 맞는지 확인할 것 — 이번에 두 번 연속 CLAUDE.md만 빠졌다.
