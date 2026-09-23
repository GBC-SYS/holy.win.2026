---
name: project-design-docs-are-review-gate
description: docs/02~09의 디자인 토큰(색·radius·그림자 등)이 실제 CSS 값과 어긋나면 code-reviewer가 이를 Major로 판정해 커밋을 BLOCKED시킨다 — 제안이 아니라 실제 게이트
metadata:
  node_type: memory
  type: project
  modified: 2026-09-22T13:40:00.000Z
---

CSS에서 색상/radius/그림자/간격 같은 시각적 토큰 값을 바꾸면, `docs/02-colors.md`·`docs/05-radius.md`·`docs/06-elevation.md`·`docs/08-guidelines.md`·`docs/09-shadcn-tokens.md` 중 그 값을 확정해둔 문서도 같은 커밋에서 함께 갱신해야 한다. CLAUDE.md는 이미 "색을 바꾸면 CSS와 docs 둘 다 갱신"이라고 적어뒀지만, 이번에 직접 겪은 건 그게 권고가 아니라 **code-reviewer 에이전트가 실제로 강제하는 게이트**라는 점이다.

**Why:** `.phone`→`.container` 리네이밍 + `box-shadow`/`border-radius`/`body` 배경색 변경을 커밋하려다 code-reviewer 1차 리뷰에서 BLOCKED를 받았다. 이유는 코드 자체의 결함이 아니라, 새로 넣은 `box-shadow: 0 8px 32px rgba(20,21,26,.12)`가 `docs/06-elevation.md`에 이미 확정돼 있던 값(`0 40px 80px rgba(0,0,0,.5)`, "폰 프레임")과 다르다는 것, `docs/02-colors.md`에 이제 코드에 없는 `#e7e2d4`가 죽은 채로 남아있다는 것, `docs/05-radius.md`/`docs/09-shadcn-tokens.md`가 실제 값(24px, 상단만)과 다른 "28px, 네 모서리" 예외를 여전히 주장하고 있다는 것 — 전부 CSS가 아니라 docs 쪽의 드리프트였다. 문서 3곳을 코드 실측값에 맞게 고치고 나서야 재검토에서 APPROVED를 받았다. [[project-scroll-architecture-refactor]]에도 이번 리네이밍 세부 내용이 함께 기록돼 있다.

**How to apply:** `entries.css`에서 색/radius/그림자/간격 값을 바꾸는 작업을 할 때는, code-reviewer를 호출하기 *전에* 먼저 해당 값을 다루는 `docs/0X-*.md` 파일이 있는지 확인하고 함께 갱신해둔다(사후에 BLOCKED를 받고 고치는 것보다 한 번에 끝내는 게 빠름). 특히: 그림자 값 변경 → 06번+08번, radius 값 변경 → 05번+09번, 색 추가/제거 → 02번. 코드 값과 문서 값이 다를 때는 (a) 이번 변경이 의도된 새 값이면 문서를 코드에 맞추고, (b) 실수로 스펙을 벗어난 거면 코드를 문서 값으로 되돌린다 — 어느 쪽이든 둘을 일치시켜야 리뷰를 통과한다.
