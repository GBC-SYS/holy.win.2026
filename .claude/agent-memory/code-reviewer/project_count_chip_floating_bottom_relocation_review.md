---
name: project_count_chip_floating_bottom_relocation_review
description: count-chip(접속자 수 배지)을 헤더에서 화면 하단 .floating-bottom(cta-bar 감싸는 새 래퍼)으로 옮긴 리뷰 이력 — [[project_presence_realtime_count_review]]의 후속
metadata:
  type: project
---

배경: 320px 폭에서 헤더에 타이틀(28px 굵게)+count-chip+새로고침 버튼을 한 줄로 넣기 빠듯해, count-chip을 헤더에서 빼서 화면 하단 `.cta-bar`(이름 올리기/QR/인스타그램 공유 버튼) 바로 위에 떠 있는 배지로 재배치(2026-09-30). 문구도 "N명" → "N명이 보고 있어요"로 변경(사용자와 상의 끝에 "지금"/"같이" 삭제).

구조: 기존 `.cta-bar`가 갖던 `position:fixed; left:50%; bottom:0; z-index:30; width:100%; max-width:430px; transform:translateX(-50%); pointer-events:none`을 새 부모 `.floating-bottom`(`assets/css/entries.css`)으로 옮기고, `.cta-bar`는 flex column인 `.floating-bottom`의 자식(count-chip과 세로로 쌓임)이 됨. `<footer class="cta-bar">`가 `<div class="floating-bottom">` 안에 중첩되지만, div는 새 섹셔닝 루트를 만들지 않으므로 footer의 시맨틱 연결 대상(`#screen-list`)에는 문제 없음.

1차 리뷰 BLOCKED (Major 2건, 서로 연관):
1. `.list-scroll`의 `padding-bottom`(기존 `104px`, `.cta-bar` 단독 높이에 맞춰 튜닝된 값 — `.claude/plans/qr-distributed-falcon.md`에 근거 기록)이 `.floating-bottom`에 count-chip+gap(8px)이 추가되며 커진 실제 높이(약 141.5px)에 맞춰 갱신되지 않아, 리스트를 맨 아래까지 스크롤하면 마지막 카드가 배지에 가려짐.
2. `.count-chip`에 붙은 `pointer-events: auto`(클릭 핸들러 전혀 없는 순수 텍스트 배지)가 1번과 겹치면 마지막 카드로 가야 할 탭을 count-chip이 가로챔 — 사용자 본인도 "auto가 굳이 필요 없을 수도 있다"고 리뷰 요청 시 미리 의심했던 부분.

2차 리뷰 APPROVED (2026-09-30, 같은 날 재검토):
- 1번: `.list-scroll` padding-bottom을 `104px` → `150px`로 상향(`16(top padding) + 33.5(count-chip) + 8(gap) + 64(cta-bar) + 20(bottom padding) = 141.5px` + 여유 8px 계산, 코드에 근거 주석 포함). Chrome 실측으로 마지막 카드 bottom과 `.floating-bottom` top 사이 8.5px 여유 확인.
- 2번: `.floating-bottom .count-chip { pointer-events: auto; }` 규칙 완전 삭제 + `.cta-bar` 자신의 중복 `pointer-events: none`(부모로부터 이미 상속되는 값이라 죽은 코드였음)도 함께 제거. `elementFromPoint()`로 마지막 카드 하단 좌표에서 `entry-card`가 정상적으로 잡힘을 재검증.

부가 확인: `.cta-bar` 실사용처는 `index.html`/`entries.css` 두 곳뿐(grep 전수 확인, `.claude/memory/`·`.claude/plans/`·`docs/`의 다른 참조는 과거 기록/계획일 뿐 살아있는 코드 아님) — "다른 곳에 부작용" 우려는 실제로는 없었음. 이 `104px→150px` 클리어런스 값은 애초에 `docs/` 디렉터리에 문서화된 적이 없어(오직 `.claude/plans/`에만 있던 값) 이번 변경으로 새로운 문서 드리프트도 없음.

남은 논의거리(비차단, 이번 범위 밖): [[project_presence_realtime_count_review]]에 기록된 연결 실패 시 무안내, 하트 아이콘 의미 불일치 두 건은 그대로 열려 있음.
