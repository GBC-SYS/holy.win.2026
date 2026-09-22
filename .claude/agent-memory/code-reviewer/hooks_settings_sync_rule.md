---
name: hooks_settings_sync_rule
description: .claude/settings.json의 hooks 설정과 .claude/hooks/*.sh 파일 존재 여부가 반드시 일치해야 함 — 2026-09-22 첫 커밋 리뷰에서 notification-hook.sh 삭제 후 settings.json 미동기화 발견
metadata:
  type: project
---

`.claude/`(설정 포함) 전체가 2026-09-22 기준 아직 git에 커밋된 적 없는 untracked 디렉터리였다(최초 커밋 대상). 이 시점에 `.claude/hooks/notification-hook.sh`를 의도적으로 삭제했지만, `.claude/settings.json`의 `hooks.Notification[0].hooks[0].command`는 여전히 `bash .claude/hooks/notification-hook.sh`를 가리키고 있어 파일을 찾지 못해 에러가 난다(치명적 크래시는 아니고 hook 실행 실패 정도지만, 커밋 시점에 이미 깨진 설정이 들어감).

**Why:** Claude Code hook 스크립트는 `settings.json`이 참조하는 경로에 실제 파일이 있어야 조용히 넘어간다(`formatter.sh`처럼 존재하되 no-op인 것과, 파일 자체가 없어서 nothing to execute인 것은 다름). 이 프로젝트는 `.claude/hooks/*.sh` 중 하나를 지울 때 `settings.json`도 같이 고치는 걸 놓치기 쉬운 구조(하나는 셸 스크립트, 하나는 JSON이라 diff에서 따로 보임).

**How to apply:** `.claude/hooks/*.sh` 파일이 추가/삭제/이름변경되는 커밋을 리뷰할 때마다 `.claude/settings.json`의 `hooks.*[].hooks[].command`에 나열된 스크립트 경로들과 실제 `.claude/hooks/` 디렉터리 내용을 Glob으로 대조할 것. 참조는 있는데 파일이 없으면 Major로 지적(BLOCKED까지는 아니어도 커밋 전 수정 권장).
