---
name: feedback_entries_review
description: entries.js 리팩토링 리뷰(2026-09-22)에서 확정된, 이후에도 지켜야 할 구조적 판단 기준
type: feedback
metadata:
  type: feedback
---

`assets/js/entries.js` 전체 리뷰를 통해 확정된 판단 기준. 이후 이 파일을 또 건드릴 때 동일한 기준으로 재검토할 것 — 이미 반영된 내용을 다시 지적하지 말고, 새 변경이 이 기준을 깨는지만 확인한다.

## 확정된 구조 (2026-09-22 기준)

파일은 섹션 주석으로 논리적 경계를 나눈다 (모듈 시스템이 없으므로 주석이 유일한 분리 도구):
1. DOM 참조 — 리스트 화면 / 티켓 상세 화면 (두 그룹으로 분리, 티켓 쪽은 `ticketFields` 객체로 묶어서 캐싱)
2. 레이아웃 동기화 (`syncListScrollMaxHeight`)
3. 상태 (`let entries = []`)
4. 컴포넌트 팩토리 (`createEntryCard`)
5. 렌더링 (`renderList`, `renderTicket` — 데이터를 DOM에 반영하는 것만 담당, 화면 전환은 하지 않음)
6. 화면 전환 (`setScreen(activeScreen, inactiveScreen)` 헬퍼 + `openTicket`/`backToList` — "데이터 채우기"와 "화면 토글"을 분리)
7. 이벤트 바인딩
8. 데이터 로딩 (fetch, 파일 최하단)

## 고친 것과 이유

- **`openTicket`이 `document.getElementById`를 6번 직접 호출하던 것 → `ticketFields` 객체로 캐싱 + `renderTicket(entry)`로 분리.**
  Why: 화면 전환 로직과 데이터 렌더링 로직이 한 함수에 섞여 있었음 (사용자가 명시적으로 지적한 문제). renderTicket은 순수하게 entry → DOM 텍스트 반영만 담당, setScreen은 순수하게 화면 토글만 담당.
- **`listRecent.innerHTML = ''` / `listPast.innerHTML = ''` → `.replaceChildren()`으로 교체.**
  Why: 데이터 삽입은 아니라 실질적 XSS 위험은 없었지만, 이 프로젝트는 과거 코드 리뷰에서 innerHTML 사용 자체가 Major 이슈로 지적된 전례가 있어([[project_context]] 참고) "innerHTML을 아예 쓰지 않는다"는 원칙을 문자 그대로 지키는 편이 안전함.
- **`createEntryCard(entry, variant)` → 기본 매개변수 `variant = 'light'` 추가, 클래스명 문자열 연결(`+`) → 템플릿 리터럴로 교체.** ES6+ 관례 정렬용 minor fix.
- **fetch 콜백의 `data.entries` → `data?.entries ?? []`.** 옵셔널 체이닝/널 병합 사용 원칙 반영.

## 의도적으로 고치지 않은 것

- **`resize` 리스너에 대한 `removeEventListener` cleanup을 추가하지 않았다.**
  Why: 이 앱은 라우터도 없고 `.phone` 컨테이너가 페이지 생애주기 동안 한 번만 생성되는 완전한 SPA 단일 화면 구조라 리스너를 제거해야 할 시점 자체가 없음(페이지를 벗어나면 전체 스크립트 컨텍스트가 사라짐). 클린업 로직을 억지로 추가하면 오히려 죽은 코드가 됨.
- **최상위 `const`/`let` 전역 변수들을 IIFE로 감싸지 않았다.**
  Why: 이 프로젝트는 `index.html`이 스크립트 하나만 직접 로드하는 구조이고, 다른 스크립트와 전역 스코프를 공유할 계획이 없음(모듈 시스템 자체가 없음). 기존 컨벤션(`entries.js`가 유일한 JS 파일)과 맞지 않는 과설계라 판단해 보류.
- **shadcn/ui variant 구조 참고 워크플로를 실행하지 않았다.**
  Why: 이번 요청은 리팩토링이었고 새로운 UI 요소 타입(버튼/뱃지/다이얼로그 등)을 추가하는 것이 아니었음 — `docs/07-components.md`에 이미 정의된 `entry-card`/`entry-card--dark` variant 컨벤션을 그대로 따름. 새 컴포넌트 타입을 만들 때만 shadcn 워크플로를 실행하면 됨.
