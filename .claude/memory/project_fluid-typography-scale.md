---
name: project-fluid-typography-scale
description: entries.css 전체 font-size(39곳)와 일부 padding이 --fluid-scale 변수를 곱하는 calc()로 반응형화됨 — 새 font-size/padding 추가 시 이 패턴을 따라야 함
metadata:
  node_type: memory
  type: project
  modified: 2026-09-30T00:00:00.000Z
---

`:root`에 `--fluid-scale: clamp(0.9, calc(0.9 + 0.1 * (100vw - 320px) / (430px - 320px)), 1);`을 추가하고, `entries.css`의 `font-size: Npx;` 선언 39곳 전부를 `font-size: calc(Npx * var(--fluid-scale));`로 일괄 치환했다(`perl -pi -e` 정규식 치환, 예외 없이 전부 `font-size: 숫자px;` 패턴이었음). 이후 `.status-badge`/`.status-hint`의 `padding`도 같은 패턴(`calc(Npx * var(--fluid-scale))`)으로 확장됨.

**Why:** 사용자가 iPhone SE(375px) devtools 반응형 모드 스크린샷을 보여주며 "상태" 영역(배지+말풍선)이 깨져 보인다고 지적했다. 로컬 재현으로는 폭 자체의 오버플로우는 재현 안 됐지만(별도로 `min-width:0`+`overflow:hidden` 안전장치는 이미 적용함, [[project-status-badge-hint-layout]] 참고), 사용자가 뒤이어 "텍스트가 너무 커서 그런가? calc를 활용해서 프로젝트 폰트 사이즈를 전부 반응형으로 만들어줘"라고 명시적으로 요청해 전체 타이포그래피 스케일링 작업으로 확장됐다.

**왜 `vw`를 직접 안 쓰고 배율 변수 하나로 감쌌는지:** `.container`가 `max-width: 430px`로 고정돼 데스크톱에서도 카드 폭이 절대 안 넓어진다. `font-size: calc(20px + 1vw)`처럼 각 규칙에 `vw`를 직접 넣으면 데스크톱 실제 뷰포트(예: 1600px) 기준으로 글자가 한없이 커져 430px 카드와 전혀 안 맞는다. `clamp(0.9, ..., 1)`로 위아래를 막은 배율 변수 하나만 두고 모든 곳이 그걸 곱해 쓰는 구조라, 상한(`1`)이 430px 이상에서 항상 디자인 그대로 고정되는 걸 한 줄로 보장한다.

**검증이 까다로웠던 이유:** 이 세션의 Chrome 자동화 브라우저 창은 `resize_window`로 500px 아래로 줄어들지 않았다(환경 제약으로 보임, 320px 뷰포트 직접 재현 불가). 대신 `document.documentElement.style.setProperty('--fluid-scale', '0.9')`로 배율을 직접 주입해 `calc(28px * var(--fluid-scale))` = `25.2px`처럼 곱셈이 정확한지 수치로 확인하고, 그 상태에서 실제 화면을 스크린샷으로 검증하는 2단계 방식을 썼다. 앞으로 이 앱에서 좁은 뷰포트 CSS를 검증할 때도 같은 우회법(`--fluid-scale` 직접 주입, 또는 `.container`의 `maxWidth`를 JS로 강제)을 쓸 것.

**docs/03-typography.md와의 관계 — 확정 안 된 부분(⚠️ 다음 세션에서 확인 필요):** 문서에 적힌 값(화면 제목 28px, 카드 제목 20px 등)은 이번 변경으로 바뀌지 않았다(430px 이상에서의 값, 즉 `--fluid-scale`이 정확히 1일 때의 값과 동일) — 그래서 이번 세션에서는 문서를 갱신하지 않았다. 그런데 [[project-design-docs-are-review-gate]]에 따르면 이 프로젝트의 code-reviewer는 "값 자체는 안 바뀌었지만 그 값을 렌더링하는 방식/책임이 바뀐" 구조적 변경도 문서 드리프트로 BLOCKED시킨 전례가 있다. `--fluid-scale`이라는 새 반응형 레이어가 typography 문서에 전혀 언급이 안 된 상태이므로, 이 변경을 커밋/code-reviewer 리뷰에 올리기 전에 `docs/03-typography.md`에 "값은 430px 이상 기준, 320~430px 사이는 `--fluid-scale`로 최대 10% 축소됨" 같은 한 줄을 추가해둘지 먼저 확인할 것.

**How to apply:** 앞으로 `entries.css`에 새 `font-size`나 badge류 요소의 `padding`을 추가할 때는 고정 `Npx`가 아니라 `calc(Npx * var(--fluid-scale))` 패턴을 따를 것 — 안 그러면 그 요소만 반응형에서 빠져 다른 텍스트와 스케일이 안 맞아 보인다.
