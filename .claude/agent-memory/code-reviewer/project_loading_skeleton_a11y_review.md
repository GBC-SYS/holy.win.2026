---
name: project_loading_skeleton_a11y_review
description: 데이터 로딩 스켈레톤 UI — 1차 BLOCKED(새로고침 시 리스트 삭제/스크린리더 미안내/문서 미등재) → 2차 APPROVED(2026-09-29, isInitialLoad 가드+sr-only status+docs 07번 등재 전부 확인)
metadata:
  type: project
---

`assets/js/entries.js`의 `loadEntries()`(최초 로딩과 새로고침 버튼이 공유)에 스켈레톤 UI를 추가한 변경.

1차 리뷰(BLOCKED) 사유 3가지:
1. 새로고침 시에도 스켈레톤이 기존 리스트를 통째로 지움 (`.is-spinning` 아이콘 회전만으로 충분했던 기존 UX 파손)
2. 로딩 상태가 스크린 리더에 전혀 전달 안 됨 (스켈레톤이 `aria-hidden`)
3. `docs/07-components.md`에 신규 컴포넌트 미등재

2차 수정(2026-09-29, APPROVED) — 3가지 모두 해결 확인:
1. `const isInitialLoad = entries.length === 0;`을 `loadEntries()` 최상단에 두고 `showListSkeleton()`/`hideListSkeleton()` 호출을 `if (isInitialLoad)`로 감쌈. 최초 로딩 실패로 entries가 빈 배열로 남은 채 사용자가 새로고침을 누르면 다시 `isInitialLoad=true`로 판정돼 스켈레톤이 재노출되는데, 이는 화면에 보여줄 카드가 실제로 없는 상태이므로 적절한 동작으로 판단(BLOCKED 아님).
2. `index.html`의 `#list-skeleton` 앞에 형제 요소로 `<p class="sr-only" id="list-loading-status" role="status" aria-live="polite">`를 추가(스켈레톤의 `aria-hidden` 컨테이너 안이 아니라 밖에 위치 — 중요, 안에 있었으면 조상의 aria-hidden에 가려짐). `entries.css`의 `.sr-only`는 표준 visually-hidden 클리핑 기법. `showListSkeleton()`/`hideListSkeleton()`이 textContent를 채웠다 비움 — 표준적이고 안정적인 패턴.
3. `docs/07-components.md` "로딩 스켈레톤(list-skeleton)" 항목 추가. 노출 조건(최초 로딩만)·모서리 값 출처(05/06번)·새로고침 시 미노출·sr-only 접근성 처리까지 정확히 서술, 실제 코드와 일치 확인.

남은 Minor(비차단, escalate 안 함):
- `entries.css` 285~289행 주석이 "초기 로딩·새로고침 모두"라고 옛 동작을 서술한 채 안 고쳐짐 — 실제로는 이제 최초 로딩에만 해당하므로 주석이 stale함. 다음에 이 블록 건드릴 때 같이 고칠 것.
- 로드 실패 시 사용자 안내 없음(1차 리뷰 때부터 있던 Minor, 안 고침) — 이번에 확인해보니 실패 시 `entries=[]`가 되고 `listFilterMine`이 기본 false라 `renderList()`의 `isEmpty` 판정이 false로 나와서 그룹 헤더("이번 주 제출"/"이전 명단")만 보이고 카드도 없고 안내문도 없는 애매한 빈 화면이 뜸(이 diff가 만든 회귀는 아니고 원래 있던 렌더링 갭, 스켈레톤 fix와 별개 이슈로 분리해서 추적 권장).
- 스켈레톤 카드 높이 variant별 미분리, glass-sheen 미적용 — 순수 시각적 폴리시, 기능/접근성 영향 없어 Minor 유지.

관련: [[hooks_settings_sync_rule]] 아님, 이 항목은 독립 기능. `docs/07-components.md`는 [[radius_doc_sync_rule]]/[[elevation_shadow_spec_violation]]과 같은 문서-코드 동기화 패턴을 계속 잘 지킨 사례.
