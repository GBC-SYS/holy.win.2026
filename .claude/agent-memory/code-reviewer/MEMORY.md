# Memory Index

- [저장소 성격](project_repo_nature.md) — holy.win.2026은 실제 정적 HTML/CSS/JS 앱(statkit.llm.design 템플릿 킷과 다름). 일반 프론트엔드 코드 리뷰 기준을 그대로 적용할 것. `.phone`→`.container` 리네이밍 반영(2026-09-22).
- [색상 문서 동기화 규칙](color_doc_sync_rule.md) — entries.css 색상(추가/변경/삭제) 시 docs/02-colors.md도 갱신해야 함(프로젝트 자체 규칙). 2026-09-22 낮 위반, 저녁 재발(#e7e2d4) 모두 같은 날 재검토에서 수정 확인, 해소됨.
- [radius 문서 동기화 규칙](radius_doc_sync_rule.md) — docs/05-radius.md·09-shadcn-tokens.md의 ".container 28px 프레임" 문구가 실제 코드(24px 24px 0 0)와 불일치했던 문제(Major, 2026-09-22 발견) → 같은 날 재검토에서 24px로 갱신 확인, 해소됨.
- [엘리베이션(그림자) 스펙 위반](elevation_shadow_spec_violation.md) — docs/06-elevation.md·08-guidelines.md이 정했던 옛 그림자 값과 .container 실제 값(0 8px 32px rgba(20,21,26,.12))이 달랐던 문제(Major, 2026-09-22) → 코드는 유지하고 문서를 코드에 맞춰 갱신, 해소됨. 티켓 요소 그림자 미구현은 여전히 남음.
- [entries.js innerHTML 패턴](entries_js_xss_pattern.md) — createEntryCard는 2026-09-22 수정으로 innerHTML→createElement/textContent 전환 완료(해소). entries.json 소스가 실제 폼 제출로 바뀌면 회귀 여부 Critical로 재검토.
- [hooks/settings.json 동기화 규칙](hooks_settings_sync_rule.md) — .claude/hooks/*.sh 삭제 시 settings.json의 hooks 참조도 같이 지워야 함. 2026-09-22 notification-hook.sh 삭제 후 settings.json 미동기화(참조 남음) 발견.
- [.container 마진/스크롤 이력](phone_clamp_overflow_edge_case.md) — 1세대(clamp/max-height, 해소됨) → 2세대(margin-top:40px로 상시 40px 스크롤, Minor·의도된 트레이드오프, 2026-09-22).
- [.gitignore가 supabase-client.js를 제외하는 버그](gitignore_supabase_client_bug.md) — 커밋 시 핵심 스크립트가 저장소에서 빠져 앱이 전체적으로 깨짐(Critical, 2026-09-22 발견, 커밋 전 반드시 재확인).
- [Supabase 마이그레이션 리뷰 반복 포인트](supabase_migration_review_notes.md) — 6단계 전부 완료(2026-09-22), search_path 관례 정착, 소프트삭제 RPC 우회 패턴, confirm()→showDialog() 문서 3곳 드리프트.
- [showDialog Promise 재사용 패턴](showdialog_promise_reuse_pattern.md) — 단일 다이얼로그 인스턴스 재사용, 동시 호출 시 이전 Promise 미해결 엣지케이스(Minor, 2026-09-22).
- [Bash 도구 없음 — Read/Grep으로 리뷰](feedback_no_bash_tool_use_read_grep.md) — 이 저장소의 code-reviewer는 도구 목록에 Bash가 없어 git diff 직접 실행 불가. Read/Grep/Glob으로 현재 파일 상태를 직접 대조해 리뷰할 것.
- [PWA 설치 유도 배너 → QR 시트 통합 버튼](install_prompt_feature_review.md) — 1차 BLOCKED(배너 카드 가림) → 2차 배너 삭제·QR 시트 버튼 통합(APPROVED 조건부) → 3차 라벨 단축+padding/gap/font-size 조정(APPROVED, 2026-09-23). 남은 Minor: 더블클릭 가드/try-catch/문서 적용처 미기재 + 320px 초협폭 줄바꿈 미검증.
- [.btn-secondary hover 전역 삭제](btn_secondary_hover_removal.md) — QR 시트 hover 제거 요청이 전역 `.btn-secondary:hover` 삭제로 확대(2026-09-23, APPROVED). `.cta-btn`은 애초 hover 없어 비대칭이었음, `#btn-edit-entry`도 영향받음. docs 06/07번은 색상 원칙만 규정해 드리프트 아님.
