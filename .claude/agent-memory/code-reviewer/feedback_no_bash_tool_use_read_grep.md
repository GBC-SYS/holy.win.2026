---
name: feedback_no_bash_tool_use_read_grep
description: 이 저장소에서 code-reviewer 서브에이전트는 도구 목록에 Bash가 없어 git diff/git status를 직접 실행할 수 없음 — Read/Grep/Glob으로 현재 파일 상태를 직접 읽어 리뷰할 것
metadata:
  type: feedback
---

2026-09-22 리뷰 세션에서 `git diff`/`git status`를 실행하려 했으나 Bash 도구 자체가 도구 목록/ToolSearch 어디에도 없었다(EnterWorktree/ExitWorktree/NotebookEdit/WebFetch/WebSearch만 deferred로 잡혀 있었음). `.claude/memory/feedback_git-commit-pusher-unreliable.md`에 기록된 "git-commit-pusher 에이전트에 Bash가 없다"는 구조적 원인과 같은 성격의 제약이 `code-reviewer` 에이전트 자신에게도 적용된다.

**Why:** 사용자가 diff 요약을 프롬프트에 텍스트로 제공해도, 실제 커밋 전 상태를 신뢰성 있게 검증하려면 그 요약을 곧이곧대로 믿지 말고 Read/Grep으로 현재 워킹트리 파일 내용을 직접 열어 대조해야 한다(예: `.phone` 잔재가 실제로 없는지, 색상/치수 값이 문서와 실제로 일치하는지는 diff 요약 문장이 아니라 파일 원문에서 확인해야 신뢰할 수 있다).

**How to apply:** 이 저장소에서 "커밋 전 diff 리뷰" 요청을 받으면, git diff를 시도하지 말고 (1) 사용자가 제공한 변경 파일 목록을 그대로 신뢰하되, (2) Grep으로 관련 패턴(예: 리네이밍이면 구 이름 잔재)을 저장소 전체에서 검색하고, (3) Read로 각 변경 파일의 현재 전체 내용을 읽어 대조하는 방식으로 리뷰를 완성한다. Bash가 갑자기 도구 목록에 나타나면(에이전트 설정이 바뀌었다면) 이 제약은 재확인 후 갱신할 것.
