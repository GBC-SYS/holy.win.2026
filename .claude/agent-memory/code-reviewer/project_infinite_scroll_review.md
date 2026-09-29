---
name: project_infinite_scroll_review
description: 리스트 화면 클라이언트 배치 렌더링(무한 스크롤) 기능 리뷰 이력 — listVisibleCount 상태와 관련 회귀/접근성 이슈
metadata:
  type: project
---

entries.js에 `listVisibleCount`/`LIST_PAGE_SIZE` 기반 무한 스크롤(전체 entries는 메모리에 다 있고, DOM 카드만 페이지 단위로 늘려 그림)을 도입.

1차 리뷰 BLOCKED (Major 3건):
1. `handleEntryFormSubmit`에서 `entries.unshift()` 후 `listVisibleCount` 미갱신 → 등록 직후 slice 경계에 걸린 마지막 카드가 사라지는 회귀
2. `renderList()`가 매번 `replaceChildren()`으로 전체를 다시 그림 → 페이지가 늘수록 이미 그린 카드까지 재생성(무한 스크롤의 "초기 렌더링 비용 완화" 취지 퇴색)
3. sentinel이 `aria-hidden`인 빈 div라 카드 추가 시 스크린 리더에 신호 없음

2차 리뷰 APPROVED (2026-09-29):
- 1번: `entries.unshift()` 직후 `listVisibleCount += 1` 추가. slice가 count를 자동으로 clamp하므로 반대 방향(`handleDeleteEntry`의 `entries.filter()`)은 별도 decrement 없이도 안전함을 코드 추적으로 확인 — 대칭적으로 고칠 필요 없음.
- 3번: 로딩 스켈레톤 기능에서 이미 만든 `#list-loading-status`(sr-only, role="status"/aria-live="polite")를 재사용해 `명단 N개를 더 불러왔습니다` 텍스트 반영. IntersectionObserver `.observe()` 시점에 sentinel이 초기 마크업에서 `is-hidden`(display:none)이라 초기 로딩 중에는 콜백이 오탐하지 않음을 확인.
- 2번: 코드 수정 없이 트레이드오프 주석만 추가 — 사용자가 이전 리뷰에서 "지금 당장 급한 문제 아님, 데이터 규모 작으면 복잡도 늘리지 않는 선택도 합리적"이라 확인한 바 있어(행사 명단이라 데이터 규모 원래 작음) 그대로 유지 타당.

남은 Minor(비차단): 초기 로딩에서 데이터가 20개 초과이고 rootMargin(600px)이 넉넉해 사용자가 스크롤하기도 전에 sentinel이 즉시 교차하면, sr-only 텍스트가 "명단을 불러오는 중입니다" → "" → "명단 20개를 더 불러왔습니다"로 매우 빠르게 연쇄 전환될 수 있음 — 논리적 오류는 아니지만 스크린 리더 사용자에게 "아직 스크롤 안 했는데 더 불러왔다"는 안내가 즉시 뜨는 체감이 있을 수 있음. 새로고침(`btnRefresh`)은 `isInitialLoad`가 아니므로 `listLoadingStatusEl` 텍스트를 건드리지 않아, 직전 스크롤에서 남은 "더 불러왔습니다" 문구가 새로고침 후에도 그대로 남아있을 수 있음(새 안내 없음) — [[project_loading_skeleton_a11y_review]]에서 지적된 "로드 실패 시 무안내" 갭과 같은 계열의 잔여 이슈.
