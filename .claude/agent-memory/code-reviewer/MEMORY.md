# Memory Index

- [저장소 성격](project_repo_nature.md) — holy.win.2026은 실제 정적 HTML/CSS/JS 앱(statkit.llm.design 템플릿 킷과 다름). 일반 프론트엔드 코드 리뷰 기준을 그대로 적용할 것.
- [색상 문서 동기화 규칙](color_doc_sync_rule.md) — entries.css 색상 변수 변경 시 docs/02-colors.md도 갱신해야 함(프로젝트 자체 규칙). 2026-09-22 위반 발견 후 같은 날 수정 확인(해소).
- [entries.js innerHTML 패턴](entries_js_xss_pattern.md) — createEntryCard는 2026-09-22 수정으로 innerHTML→createElement/textContent 전환 완료(해소). entries.json 소스가 실제 폼 제출로 바뀌면 회귀 여부 Critical로 재검토.
- [hooks/settings.json 동기화 규칙](hooks_settings_sync_rule.md) — .claude/hooks/*.sh 삭제 시 settings.json의 hooks 참조도 같이 지워야 함. 2026-09-22 notification-hook.sh 삭제 후 settings.json 미동기화(참조 남음) 발견.
- [.phone clamp/max-height 엣지케이스](phone_clamp_overflow_edge_case.md) — 데스크톱 창 높이 768px~1030px 구간에서 body 패딩과 충돌해 페이지 스크롤 발생 가능(Minor, 2026-09-22 발견).
