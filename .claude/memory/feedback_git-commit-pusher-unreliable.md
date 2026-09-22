---
name: feedback-git-commit-pusher-unreliable
description: git-commit-pusher 서브에이전트가 실제 git 명령을 실행하지 않고 명령어만 반환한 전례 — 결과를 git status/log로 직접 검증할 것
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3dd53893-19af-4039-989f-1c627d9c21fa
  modified: 2026-09-22T04:37:33.818Z
---

`git-commit-pusher` 서브에이전트를 호출한 뒤, 실제로 커밋/푸시가 일어났는지 `git status`/`git log`로 직접 확인한다. 실패해 있으면 add/commit/push를 직접 실행한다(커밋 전 시크릿 패턴 grep 스캔 포함).

**Why:** 이번 세션에서 이 에이전트가 두 차례 모두 실제 git 명령을 실행하는 대신 사람이 실행해야 할 셸 명령어 텍스트만 반환하고 끝냈다. 코드 리뷰(`code-reviewer`)가 APPROVED를 낸 뒤에도 이 문제가 재현됐다.

**How to apply:** `git-commit-pusher`를 호출한 직후를 "완료"로 간주하지 말고, 반드시 `git status`로 워킹트리가 clean한지, `git log -1`로 새 커밋이 실제로 생겼는지 확인한다. 확인 결과 반영이 안 됐다면 직접 `git add`/`git commit`/`git push`를 수행한다(리포 규칙상 `code-reviewer`의 APPROVED가 선행되어야 하는 점은 그대로 유지).
