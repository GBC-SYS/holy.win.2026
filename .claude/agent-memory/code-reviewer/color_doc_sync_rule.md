---
name: color_doc_sync_rule
description: entries.css의 색상(추가/변경/삭제 모두)이 바뀌면 docs/02-colors.md·docs/09-shadcn-tokens.md도 함께 갱신해야 함 — 프로젝트 자체 규칙(08-guidelines.md). 2026-09-22 낮 위반, 저녁 재발(#e7e2d4) 모두 수정 확인, 현재 해소됨
metadata:
  type: project
---

`docs/08-guidelines.md`의 DON'T 첫 줄이 "02번 색상표에 없는 색을 추가하지 않는다"라고 명시한다. 즉 이 프로젝트는 `entries.css`에 새 색(또는 CSS 변수)을 추가하면 반드시 `docs/02-colors.md`(그리고 `docs/09-shadcn-tokens.md`)에도 반영해야 한다는 **자체 거버넌스 규칙**을 갖고 있다.

**2026-09-22 리뷰에서 발견 → 같은 날 수정 확인된 위반(라이트 테마 전환 작업 중 발생, 현재는 해소됨):**
- `entries.css`의 `--card-muted-line: #ddd6c5`가 `.entry-card--dark`(테두리)·`.entry-card--dark .relation-tag`(배경)에서 쓰이는데 `docs/02-colors.md`에 빠져 있었음 → "코드에 남아있는 추가 색" 표에 `#ddd6c5 (--card-muted-line)` 행 추가로 수정 확인.
- `docs/02-colors.md`는 `#a6a39e`가 "티켓 카드 안에서만 사용(grid-label)"이라고 적었지만 실제로는 `.entry-date`(리스트 화면)에도 쓰였음 → "티켓 카드 안에서만" 문구 삭제, `.entry-date` 사용처 추가로 수정 확인.
- 참고: `docs/09-shadcn-tokens.md`는 02~07의 "7색+destructive"만 shadcn 명명으로 옮기는 별도 목적 파일이라, `--card-muted-line`/`#a6a39e` 같은 "7개 밖 예외 색"은 애초에 이 파일의 갱신 대상이 아님(값 `#ddd6c5` 자체는 `--secondary`로 이미 반영돼 있었음) — 향후 리뷰에서 이 파일에 예외 색까지 요구하지 말 것.

**2026-09-22 저녁 재발 → 같은 날 재검토에서 수정 확인(해소됨):** body 배경을 하드코딩 `#e7e2d4` → `var(--bg)`로 바꾸면서 `#e7e2d4`가 코드 전체(`entries.css` 포함)에서 완전히 사라졌는데, `docs/02-colors.md`의 "코드에 남아있는 추가 색" 표에 `#e7e2d4` 행이 한동안 남아 있었음(역방향 드리프트 — 추가 누락이 아니라 삭제 누반영). 재검토 시점(같은 날 저녁, 재검토 회차)에 해당 행이 삭제되어 있음을 확인 — 더 이상 존재하지 않는 색을 참조하는 행 없음. 같은 세션에서 radius/elevation 쪽에도 동일 패턴이 있었으나([[radius_doc_sync_rule]], [[elevation_shadow_spec_violation]]) 모두 같은 재검토에서 함께 해소됨 — 이 프로젝트는 CSS 값을 바꿀 때 docs/ 동기화를 빼먹는 경향이 있으니 다음에도 재차 확인할 것.

**Why:** 이 프로젝트는 AI에게 화면 생성을 맡길 때 `docs/`를 규칙 파일로 함께 전달하는 워크플로우를 쓰므로(`CLAUDE.md`, `docs/01-style-reference.md` 참고), 문서가 코드와 어긋나면 다음에 AI가 화면을 만들 때 실제와 다른 색상표를 기준 삼아 새 화면을 만들게 됨 — 단순 오탈자가 아니라 워크플로우 신뢰성 문제.

**How to apply:** `entries.css`의 `:root` 변수 목록과 하드코딩 HEX(`#e7e2d4`, `#3a1e10`, `#e5e3df`, `#a6a39e`, `#ddd6c5` 등)를 항상 `docs/02-colors.md`의 "색 7개" 표 + "코드에 남아있는 추가 색" 목록과 라인 단위로 대조할 것. 새 변수/색이 CSS에 있는데 02-colors.md에 없으면 Major로 지적한다. `docs/09-shadcn-tokens.md`는 7색+destructive 범위만 대조하면 됨(예외 색은 대상 아님).
