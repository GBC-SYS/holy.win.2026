# Claude Code 서브에이전트 이식

`.claude/agents/`의 10개 역할을 Codex TOML로 이식했다. 역할별 업무 지침과 산출물 형식을 유지하고, 오래된 프로젝트 컨텍스트와 메모리 경로는 현재 저장소 기준으로 보정했다. 원본 `.claude/`는 수정하지 않았다.

## 적용

이 프로젝트에서 새 Codex 세션을 시작한다. 프로젝트 설정을 읽는 신뢰된 작업공간이어야 한다. 현재 세션에 새 역할이 즉시 노출되는지는 클라이언트에 따라 다르므로, 실제 목록에 없는 역할이 로드되었다고 가정하지 않는다. 루트 `AGENTS.md`에는 일반 서브에이전트에 역할 지침을 전달하는 대체 방법도 있다.

예: “prd-generator로 PRD 작성해줘”, “code-reviewer로 변경 사항 검토해줘”.

## 대응 관계와 차이

| Claude 설정 | Codex 적용 |
| --- | --- |
| agents/*.md 및 agents/docs/prd-*.md | agents/*.toml의 developer_instructions |
| name, description | 동일 이름과 역할 선택용 설명, config.toml 역할 등록 |
| sonnet / opus / haiku | 부모 세션 모델 상속; 서로 다른 제공자의 모델을 동일 모델로 간주하지 않음 |
| tools, color | 직접 이식하지 않음; 현재 Codex 도구 및 권한 사용 |
| memory: project | docs/agent-memory/<역할>/의 명시적 파일 읽기/쓰기 |
| 공통 메모리 가이드 | .claude/agents/docs/_shared-memory-guide.md 참조 |
| skills, commands | 원본 파일 필요 시 참조; 자동 등록한 것은 아님 |
| settings.json, hooks, sandbox.conf, tmux | 이식 범위에서 제외; 현재 Codex 실행 설정 유지 |

기존 code-reviewer 메모리는 다른 저장소(statkit.llm.design)의 내용이므로 복제하지 않았다. 다른 프로젝트의 절대 경로와 자동 메모리 주입 문구도 이식하지 않았다. 새 메모리 디렉터리는 기록이 필요할 때 만든다.

검증: 역할 10개와 TOML 11개의 파싱, 등록 경로 및 원본 역할 목록 일치 확인. 실제 모델 호출에 의한 각 역할의 동작 검증은 별도다.

공식 문서: https://developers.openai.com/codex/subagents 및 https://developers.openai.com/codex/config-reference
