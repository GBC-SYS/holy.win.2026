---
name: feedback-post-approval-redesign-expected
description: Plan Mode로 설계하고 구현·code-reviewer APPROVED까지 받은 기능이라도, 사용자가 스크린샷을 보고 즉시 전체 재설계를 지시할 수 있다 — 승인된 설계를 방어하려 하지 말 것
metadata:
  node_type: memory
  type: feedback
  modified: 2026-09-23T00:00:00.000Z
---

PWA 설치 유도 기능을 Plan Mode(Explore → Plan 에이전트 → 계획 파일 → ExitPlanMode 승인)로 설계하고, HTML/CSS/JS를 전부 구현한 뒤 code-reviewer 리뷰까지 돌렸다(1차 BLOCKED, 원인은 배너가 리스트 카드를 가리는 레이아웃 버그). 그런데 사용자는 그 버그를 고쳐달라고 하지 않고, 곧바로 "버튼을 QR 시트의 다른 버튼 옆으로 옮기고 배너는 통째로 삭제해달라"며 기능의 진입 방식 자체를 완전히 다른 구조로 바꿔달라고 요청했다. 이후에도 같은 세션에서 레이아웃을 두고 4~5차례 더(여백, 버튼 폭 분배 방식, 그림자, hover) 빠르게 뒤집었다 — 그중 일부는 직전에 적용한 CSS 기법(flex:none+nowrap)을 명시적으로 "없애달라"며 되돌리는 지시였다.

**Why:** [[user-screenshot-driven-iteration]]에 이미 기록된 "소규모 반복 조정 선호"가 개별 CSS 값 수준을 넘어, **이미 승인·구현된 기능/컴포넌트 구조 전체**에도 똑같이 적용된다는 걸 이번에 확인했다. Plan Mode를 거쳤다거나 code-reviewer가 APPROVED를 줬다는 사실이 사용자의 재설계 결정을 막는 근거가 되지 않는다 — 이 프로젝트는 실시간 렌더링 확인 수단이 스크린샷뿐이라([[feedback-ambiguous-visual-requests]]), 실제로 화면을 본 뒤에야 구조적 문제(공간 부족, 시각적 위계 등)가 드러나는 경우가 많다.

**How to apply:** 승인된 계획이나 통과된 리뷰를 "이미 정해진 것"으로 방어하지 말 것. 사용자가 기존 설계를 뒤집는 지시를 하면(예: "배너 없애고 다른 버튼 옆으로 옮겨줘") 왜 원래 설계가 나았는지 설득하려 들지 말고, 구조적으로 애매한 부분(예: 기존 배너의 문구/닫기 버튼은 어떻게 할지)만 짧게 확인 질문한 뒤 즉시 재설계에 들어간다. 재설계 후에도 다시 code-reviewer 승인 절차([[feedback-git-commit-pusher-unreliable]]와 별개로 이 저장소의 커밋 전 필수 게이트)는 동일하게 반복해야 한다 — 규모가 작아져도 생략하지 않는다.
