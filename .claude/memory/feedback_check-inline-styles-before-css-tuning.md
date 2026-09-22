---
name: feedback-check-inline-styles-before-css-tuning
description: CSS 값을 여러 번 늘려도 시각적 버그가 안 고쳐지면, 계속 값을 추측하지 말고 JS가 인라인 스타일을 강제하고 있는지부터 grep할 것
metadata:
  node_type: memory
  type: feedback
  modified: 2026-09-22T13:10:00.000Z
---

CSS `padding`/`margin` 등의 값을 두세 차례 늘렸는데도 같은 시각적 버그(요소가 가려짐/잘림)가 계속 재현되면, 값 자체를 더 크게 추측하며 반복 수정하기 전에 `grep -rn "\.style\.\|maxHeight\|\.style\[" assets/js/`처럼 관련 JS가 해당 요소에 인라인 스타일을 강제하고 있는지부터 확인한다.

**Why:** 이 세션에서 "+ 전도 대상자 이름 올리기" 버튼이 마지막 리스트 카드를 가리는 문제를 `.list-scroll`의 `padding-bottom`을 96px → 140px → 180px로 세 차례 늘려가며 고치려 했지만 매번 재현됐다. 실제 원인은 CSS 값이 부족해서가 아니라, 구 아키텍처(내부 div 스크롤) 시절에 만들어진 `syncListScrollMaxHeight()`라는 JS 함수가 `listScrollEl.style.maxHeight`를 매번 인라인으로 강제 설정하고 있었기 때문이었다. 인라인 스타일은 외부 CSS 스타일시트의 어떤 선택자보다도 우선순위가 높아서, CSS의 `padding` 값을 아무리 키워도 인라인 `max-height`가 계속 레이아웃 높이를 짓눌렀다 — 사용자가 브라우저 개발자도구에서 이 인라인 값을 직접 찾아내고 나서야 진짜 원인이 드러났다. [[project-scroll-architecture-refactor]] 참고.

**How to apply:** 특히 이 프로젝트처럼 아키텍처가 여러 번 리팩터링된 코드베이스에서는, 리팩터링 이전 구조를 전제로 DOM에 직접 값을 써넣던 JS(예: `.style.maxHeight`, `.style.height`, `resize` 리스너로 크기를 재계산하는 코드)가 새 CSS 구조로 바뀐 뒤에도 죽지 않고 계속 실행되며 조용히 새 레이아웃을 망가뜨리는 경우가 있다. CSS 값을 두 번 이상 조정했는데도 사용자가 "그래도 안 고쳐진다"고 하면, 세 번째로 값을 더 키우기 전에 (1) 관련 요소를 `document.querySelector`로 찾는 JS가 있는지, (2) 그 JS가 `.style.*`을 직접 대입하는지부터 확인한다.
