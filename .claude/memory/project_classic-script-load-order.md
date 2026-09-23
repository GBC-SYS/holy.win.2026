---
name: project-classic-script-load-order
description: 번들러 없는 classic <script> 구조라, 한 JS 파일이 다른 파일의 함수를 top-level에서 즉시 참조하면 index.html의 script 태그 순서가 실제로 실행을 좌우한다
metadata:
  node_type: memory
  type: project
  modified: 2026-09-23T00:00:00.000Z
---

이 저장소는 번들러/모듈 시스템이 없고(`package.json` 자체가 없음), `entries.js`/`supabase-client.js`/`install-prompt.js` 등 여러 `<script>` 태그가 하나의 전역 렉시컬 스코프를 공유한다. `assets/js/install-prompt.js`를 추가하면서 실제로 겪은 함정: `entries.js`가 top-level(함수 바디 안이 아니라 스크립트가 파싱되는 즉시 실행되는 코드)에서 `btnQrInstall.addEventListener('click', triggerInstallPrompt)`처럼 다른 파일이 정의한 함수를 식별자로 직접 참조했는데, 그 다른 파일(`install-prompt.js`)이 `entries.js`보다 **나중에** 로드되도록 태그 순서가 잡혀 있었다면 `triggerInstallPrompt`가 아직 전역에 존재하지 않아 `ReferenceError`가 나고, 그 시점부터 `entries.js`의 나머지 코드(다른 버튼 바인딩, Supabase 데이터 로딩 등)가 전부 실행되지 않았을 것이다.

**핵심 구분**: 함수 *본문 안*에서의 참조(예: `openQrSheet()` 내부에서 `canPromptInstall()` 호출, `triggerInstallPrompt()` 내부에서 `entries.js`의 `showDialog()` 호출)는 실제 호출이 사용자 인터랙션 이후로 지연되므로 두 스크립트가 이미 다 실행된 뒤라 순서가 상관없다. 문제가 되는 건 스크립트 최상위에서 즉시 실행되는 참조(`addEventListener` 호출 자체, DOM 초기화 코드 등)뿐이다.

**Why:** classic script는 각 `<script>` 태그가 파싱되는 시점에 그 파일의 top-level `function` 선언이 전역에 등록된다. 아직 실행되지 않은 이후 스크립트의 함수는 존재하지 않는 식별자라 즉시 참조하면 예외가 난다. `supabase-client.js`의 기존 주석(최상위 `const`가 `window` 프로퍼티가 되지 않아 명시적으로 `window.supabaseClient = ...`해야 한다는 내용)과는 다른 종류의 함정이다 — 이쪽은 "존재 여부/순서"고 저쪽은 "전역 노출 방식"이다.

**How to apply:** 이 프로젝트에 새 `assets/js/<feature>.js` 파일을 추가할 때, 다른 파일의 함수/변수를 top-level에서 즉시 참조한다면 그 파일이 `index.html`에서 먼저 로드되도록 순서를 맞출 것(현재: `supabase-client.js` → `install-prompt.js` → `entries.js`). 확신이 없으면 참조를 함수 바디 안(이벤트 핸들러 등)으로 감싸 지연 평가시키는 쪽이 순서에 안전하다. 번들러를 나중에 도입하게 되면 이 순서 의존성 자체가 사라지므로 그때 이 메모리는 무의미해진다.
