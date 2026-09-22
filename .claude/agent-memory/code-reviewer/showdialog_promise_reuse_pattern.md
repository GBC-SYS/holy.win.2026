---
name: showdialog_promise_reuse_pattern
description: entries.js의 showDialog()는 단일 재사용 다이얼로그 인스턴스 + 모듈 스코프 리스너 교체 패턴 — 동시 호출 시 이전 Promise가 영원히 미해결로 남는 엣지케이스 존재(2026-09-22 발견, Minor)
metadata:
  type: project
---

`assets/js/entries.js`의 `showDialog({title, description, confirmText, showCancel, cancelText, danger})`는 alert()/confirm() 10곳을 대체한 Promise 기반 커스텀 다이얼로그다. `#dialog-backdrop`/`#dialog-panel` 단일 인스턴스를 매 호출마다 내용만 갈아끼워 재사용하며, `dialogConfirmHandler`/`dialogCancelHandler`(모듈 스코프 변수)에 직전 리스너를 담아두고 호출할 때마다 `removeEventListener` 후 재등록해 중복 resolve를 막는다.

**엣지케이스:** 만약 이전 `showDialog()` 호출이 아직 사용자 응답을 기다리는 중(Promise가 pending)인 상태에서 다른 코드 경로가 `showDialog()`를 다시 호출하면, 리스너가 새 핸들러로 완전히 교체되면서 첫 번째 호출의 Promise는 다시는 resolve/reject되지 않고 그 `await showDialog(...)`를 호출한 async 함수가 영원히 멈춘다(dangling Promise). 2026-09-22 최종 리뷰 시점 기준으로는 모든 호출부가 순차적(사용자가 한 다이얼로그를 닫아야 다음 액션 가능)이라 실제로 트리거되지는 않지만, 설계상 잠재 위험이다.

**Why:** 단일 인스턴스 재사용은 이 프로젝트 규모(바텀시트 2개 + 다이얼로그 1개)에서 합리적인 트레이드오프이지만, 향후 비동기 이벤트(예: 실시간 구독, 백그라운드 폴링)가 추가되어 사용자 액션과 무관하게 `showDialog()`가 호출될 여지가 생기면 이 가정이 깨진다.

**How to apply:** 다음에 `showDialog()` 호출부가 늘어나거나(특히 사용자 액션과 무관한 트리거), Promise.all/동시 호출 패턴이 등장하면 이 엣지케이스가 실제로 재현 가능한지 확인할 것. 재현 가능해지면 Major로 격상 — 큐잉이나 "이미 열려있으면 무시" 가드 추가를 제안할 것.
