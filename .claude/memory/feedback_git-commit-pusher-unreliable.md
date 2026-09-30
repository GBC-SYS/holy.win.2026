---
name: feedback-git-commit-pusher-unreliable
description: git-commit-pusher 서브에이전트가 실제 git 명령을 실행하지 않고 명령어만 반환한 전례 — 결과를 git status/log로 직접 검증할 것
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3dd53893-19af-4039-989f-1c627d9c21fa
  modified: 2026-09-30T06:45:00.000Z
---

`git-commit-pusher` 서브에이전트를 호출한 뒤, 실제로 커밋/푸시가 일어났는지 `git status`/`git log`로 직접 확인한다. 실패해 있으면 add/commit/push를 직접 실행한다(커밋 전 시크릿 패턴 grep 스캔 포함).

**Why:** 이 에이전트가 실제 git 명령을 실행하는 대신 사람이 실행해야 할 셸 명령어 텍스트만 반환하고 끝나는 사례가 최소 다섯 차례(이전 세션 두 차례 + 2026-09-22 저녁 세션 한 차례 + 2026-09-27 세션 한 차례 + 2026-09-30 세션 한 차례) 재현됐다. 코드 리뷰(`code-reviewer`)가 APPROVED를 낸 뒤에도 이 문제가 매번 재현됐다. 2026-09-22 저녁 세션에서 근본 원인을 확인함: 이 프로젝트의 에이전트 설정상 `git-commit-pusher`의 도구 목록에 **Bash가 아예 포함되어 있지 않다**(Glob/Grep/Read/WebFetch/WebSearch/Edit/Write/NotebookEdit/Skill/Task*/EnterWorktree/ExitWorktree/Cron*/ToolSearch만 있음) — 즉 이건 가끔 실패하는 플레이키 동작이 아니라, 이 에이전트가 구조적으로 git 명령을 실행할 수 없는 설정이라 매번 재현되는 것이다. 2026-09-27 세션에서는 사용자가 커밋/푸시를 명시적으로 승인한 뒤에도 에이전트가 "제 도구 환경에 bash 실행 기능이 없다"고 자백하며 명령어 텍스트만 반환했다. 2026-09-30 세션에서는 이 메모리에 이미 적힌 "호출 자체를 생략하라"는 권고를 따르지 않고 한 번 더 호출해 재검증했는데, 역시 동일하게 커밋 메시지/git 명령 텍스트만 반환하고 실제 커밋은 하지 않았다 — 즉 이 권고를 무시하고 다시 시도해도 결과는 달라지지 않는다는 게 재확인됐다.

**How to apply:** `git-commit-pusher`를 호출한 직후를 "완료"로 간주하지 말고, 반드시 `git status`로 워킹트리가 clean한지, `git log -1`로 새 커밋이 실제로 생겼는지 확인한다. 확인 결과 반영이 안 됐다면 직접 `git add`/`git commit`/`git push`를 수행한다(리포 규칙상 `code-reviewer`의 APPROVED가 선행되어야 하는 점은 그대로 유지). 도구 목록이 구조적 원인이므로, 이 에이전트 설정 자체가 바뀌었다는 확인이 없는 한 앞으로도 호출 즉시 완료로 믿지 말 것. **5회 연속 재현되었으니 더 이상 "혹시 이번엔 될까" 하고 호출을 시도하지 말고, `code-reviewer`의 APPROVED만 받은 뒤 처음부터 곧바로 직접 `git add`(파일 단위 명시, `-A`/`.` 금지)/`git commit`/`git push`를 실행할 것** — 이 에이전트를 아예 호출 후보에서 제외하는 편이 왕복을 줄인다.
