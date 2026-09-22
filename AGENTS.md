# holy.win.2026 — Codex 작업 지침

## 프로젝트 확인

- 한국어로 소통한다.
- 작업 전 실제 파일 구조와 Git 변경 상태를 확인하고 기존 사용자 변경을 보존한다.
- `.claude/`는 기존 Claude Code 설정 원본이다. 다른 프로젝트에서 가져온 설명이나 메모리보다 현재 저장소의 파일과 사용자 지시를 우선한다.
- `.env`, `.env.*`, `secrets/`는 읽거나 수정하지 않고 `build/`는 읽지 않는다. 사용자 명시 지시와 상위 지침이 우선한다. 이 규칙은 모델 지침이며 운영체제 수준의 접근 차단 설정은 아니다.

## 서브에이전트

역할은 `.codex/config.toml`, 세부 지침은 `.codex/agents/*.toml`에 정의되어 있다.
사용자가 전문 작업을 요청하면 아래 역할을 활용한다. 독립 작업만 병렬화하고 동일 파일 편집을 중복 위임하지 않는다.

| 역할 | 담당 |
| --- | --- |
| router | 요청 분류와 전문 역할 선택 |
| prd-generator | PRD 작성 |
| prd-validator | PRD 기술 검증 |
| development-planner | 구현 로드맵 및 검증 계획 |
| infra-architect | 초기 구조 및 인프라 |
| starter-cleaner | 스타터 정리 |
| supabase-db-architect | DB·SQL·RLS·마이그레이션 |
| rbac-architect | 역할 및 권한 구조 |
| code-reviewer | 코드 검토 및 APPROVED/BLOCKED 판정 |
| git-commit-pusher | 요청된 스테이징·커밋·푸시 |

- 커밋·푸시 요청은 `code-reviewer` 검토 → `APPROVED` 확인 → `git-commit-pusher` 순서로 처리한다. 사용자 요청 범위를 넘는 푸시는 하지 않는다.
- 전문 역할에 해당하지 않는 작업은 기본 에이전트가 처리한다.
- 현재 세션에서 이름으로 역할을 호출할 수 없으면 해당 TOML의 `developer_instructions`를 읽어 일반 서브에이전트의 작업 지침으로 전달한다. 서브에이전트 도구 자체가 없으면 직접 같은 역할 지침을 적용하고 이를 알린다.
- 역할별 메모리는 `docs/agent-memory/<역할>/MEMORY.md`를 필요할 때 직접 읽는다. 자동 로딩으로 간주하지 않는다. 오래된 `.claude/agent-memory/` 내용은 현재 프로젝트의 사실로 간주하지 않는다.

## 기존 워크플로우 참조

- 관련 작업에는 `.claude/skills/<이름>/SKILL.md`와 그 참조 파일을 읽고 적용한다.
- 기존 명령 절차는 `.claude/commands/`를 참조한다. 슬래시 명령 등록과는 별개다.
- Claude의 `settings.json`, hooks, tmux 팀 설정은 Codex에 자동 이식되지 않는다. 도구 실행·승인·권한은 현재 Codex 세션 설정을 따른다.
