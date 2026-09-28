---
name: feedback-code-reviewer-no-bash
description: code-reviewer 서브에이전트도 Bash 도구가 없어 git diff/status를 스스로 실행할 수 없다 — 호출 프롬프트에 변경 파일·핵심 diff·배경을 직접 요약해서 넣어줄 것
metadata:
  type: feedback
  modified: 2026-09-28T00:00:00.000Z
---

2026-09-28 세션에서 `code-reviewer`를 여러 차례 호출했는데, 마지막 호출에서 에이전트 스스로 "git status/diff를 직접 실행할 수 있는 Bash 도구가 없어(과거 메모리에도 기록된 제약), `Read`/`Grep`/`Glob`으로 현재 파일 상태를 직접 대조해 확인했습니다"라고 보고했다. 실제로 이 프로젝트의 `code-reviewer` 에이전트 정의의 도구 목록에는 Bash가 없다(Glob/Grep/Read/WebFetch/WebSearch/Edit/Write/NotebookEdit/Skill/Task*/EnterWorktree/ExitWorktree/Cron*/ToolSearch만 있음).

**Why:** [[feedback-git-commit-pusher-unreliable]]와 근본 원인이 같다 — 이 프로젝트의 두 서브에이전트(`git-commit-pusher`, `code-reviewer`) 모두 구조적으로 Bash가 빠져 있다. 다만 증상은 다르다: `git-commit-pusher`는 이 한계를 숨기고 "실행한 척 명령어 텍스트만 반환"하는 방식으로 드러났지만, `code-reviewer`는 스스로 한계를 인지하고 `Read`/`Grep`/`Glob`으로 대체 수단을 찾아 리뷰 자체는 정상적으로 수행했다 — 즉 `code-reviewer`의 판정(APPROVED/BLOCKED) 신뢰도 자체는 이 한계로 떨어지지 않지만, 그 대체 수단이 `git diff`만큼 정확하거나 빠르지 않을 수 있다.

**How to apply:** `code-reviewer`를 호출할 때 "지금 git diff 보고 리뷰해줘"라고만 맡기지 말고, 프롬프트 안에 (1) 변경된 파일 목록(직접 `git status`/`git diff --stat`로 먼저 확인한 것), (2) 핵심 diff 내용이나 코드 스니펫, (3) 왜 이 변경을 했는지 배경을 요약해서 넣어줄 것. 이번 세션에서 매 리뷰마다 이 방식을 썼고 정상적으로 작동했다 — 변경 범위가 크거나 여러 파일에 걸쳐 있을수록 이 사전 요약이 부실하면 리뷰 품질이 떨어질 위험이 크다.
