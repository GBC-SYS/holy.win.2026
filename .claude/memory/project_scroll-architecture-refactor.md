---
name: project-scroll-architecture-refactor
description: 2026-09-22 .container/.screen을 고정 390x844 박스+내부 스크롤에서 네이티브 document 스크롤+position:fixed 오버레이로 전환
metadata:
  node_type: memory
  type: project
  modified: 2026-09-22T00:00:00.000Z
---

`.container`을 `overflow:hidden` 고정 390×844 박스(내부 `.list-scroll` div가 자체 `overflow-y:auto` 담당)에서, `max-width:430px`의 일반 콘텐츠 컬럼(내부 스크롤 없음, 실제 브라우저 window/document 스크롤 사용)으로 전환했다. `.screen`은 `min-height:100dvh` flex 컬럼이며 화면 전환은 absolute+translateX 크로스페이드 대신 `display:none`(`.screen--hidden`) 즉시 전환으로 바뀌었다.

**같이 바뀐 것들:**
- `.cta-bar`는 `position:fixed`로 뷰포트 하단 고정(바는 `pointer-events:none`, 버튼만 `pointer-events:auto`로 클릭 영역 제한).
- `.sheet-backdrop`/`.sheet-panel`(등록·수정 바텀시트)와 `.dialog-panel`(확인 다이얼로그)이 `.container` 기준 `position:absolute`에서 `position:fixed`(뷰포트 기준)로 바뀜 — `.container`이 콘텐츠에 따라 얼마든지 길어질 수 있게 되면서, absolute로 두면 리스트를 스크롤한 상태에서 오버레이를 열었을 때 화면 밖에 뜨는 버그가 있었음.
- `entries.js`의 `setScreen()`에 `window.scrollTo(0,0)` 추가 — 화면 전환 시 스크롤 위치 리셋(주의: 리스트→티켓뿐 아니라 티켓→리스트로 돌아갈 때도 리셋되므로, 리스트를 스크롤한 뒤 상세를 봤다가 돌아오면 스크롤 위치가 보존되지 않고 항상 맨 위로 감 — 의도적 트레이드오프로 리뷰에서 승인됨, 스크롤 위치 복원이 필요해지면 이 부분부터 볼 것).
- `syncListScrollMaxHeight()`(구 구조에서 `.list-scroll`에 인라인 `style.maxHeight`를 강제하던 함수) 및 관련 DOM 참조(`phoneEl`/`headerEl`/`listScrollEl`)를 entries.js에서 완전히 삭제 — 새 구조에서는 인라인 스타일이 CSS padding보다 우선순위가 높아 스크롤 가능 영역을 계속 짓누르는 버그였음(사용자가 개발자도구에서 발견).

**z-index 쌓임 순서(확정):** `.cta-bar` 30 < `.sheet-backdrop`/`.edit-sheet-backdrop`/`.dialog-backdrop` 40 < `.sheet-panel`/`.edit-sheet-panel` 50 < `.dialog-panel` 70. dialog-backdrop과 sheet-backdrop류가 z-index 40으로 동률인 점은 현재는 DOM 순서(dialog 쪽이 나중에 옴)로 우연히 올바르게 그려지지만 fragile함 — 백드롭이 여러 개 동시에 뜨는 케이스(예: 수정 시트가 열린 채 유효성 검증 실패로 dialog가 뜨는 경우)가 늘어나면 dialog-backdrop에 명시적으로 더 높은 z-index(예: 60)를 주는 걸 권장.

**남은 미정리 항목(Minor, 아직 안 고침):**
- `entries.css`의 `.is-hidden` 바로 위 주석이 여전히 ".screen--hidden(트랜지션 포함)"이라고 적혀 있는데, 실제로는 트랜지션 없는 즉시 `display:none`임 — 주석이 구 크로스페이드 시절 설명 그대로 남아있음.
- `430px`가 `.container`/`.cta-bar`/`.sheet-panel` 세 곳에 매직넘버로 중복됨 — CSS 변수화 안 됨.
- `.container`의 `position:relative`가 이제 어떤 자식도 기준으로 삼지 않는 vestigial 스타일(과거 absolute 자식들의 기준점이었음).
- `.list-scroll` 클래스명이 이제 자체 스크롤을 하지 않는데도 이름이 그대로 남아 있어 헷갈릴 수 있음.

**Why:** 고정 크기 모바일 목업 박스 대신 일반 페이지처럼 동작하게 하려고 의도적으로 제거함(사용자 요청).

**How to apply:** 이 화면 구조를 다시 건드릴 때 위 4가지 미정리 항목을 함께 정리할 기회로 삼을 것. [[project-claude-md-doc-drift]]도 참고 — CLAUDE.md의 다른 섹션(데이터 로딩 설명)도 별개로 낡아 있었음.
