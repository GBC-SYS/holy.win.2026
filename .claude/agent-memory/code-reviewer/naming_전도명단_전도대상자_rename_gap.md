---
name: naming_전도명단_전도대상자_rename_gap
description: "전도 명단" → "전도 대상자" 프로젝트명 리네이밍(2026-09-23)에서 assets/manifest.webmanifest의 PWA "name" 필드가 빠짐 — 사용자 노출 문자열 누락 사례
metadata:
  type: project
---

2026-09-23 세션에서 "전도 명단"을 "전도 대상자"로 바꾸는 작업을 index.html 7곳(title/h1/topbar-title/QR 안내문구/aria-label 3곳)과 docs/DESIGN.md·docs/01-style-reference.md의 프로젝트명에 적용했다. 리뷰 시점에 grep으로 전수 확인한 결과 `assets/manifest.webmanifest`의 `"name": "holywin 2026 전도 명단"` 필드가 바뀌지 않고 남아 있었다 — 이 필드는 PWA를 "홈 화면에 추가"했을 때 실제로 사용자에게 보이는 앱 이름이라 명백한 사용자 노출 문자열이다. `CLAUDE.md` 1줄 설명, `supabase/migrations/0001_init.sql` 주석, `.claude/agents/js-component-architect.md`, 여러 서브에이전트 메모리 파일에도 구 명칭이 남아 있었지만 이들은 비-사용자-노출(내부 문서/주석)이라 우선순위가 낮다.

**Why:** 문자열 리네이밍 작업은 사용자가 지정한 파일 목록(index.html + 특정 docs 2개)만 고치는 경우가 많은데, 같은 문자열이 `manifest.webmanifest`처럼 스코프 밖의 다른 사용자 노출 위치에도 있을 수 있다. grep 없이 "지정된 파일만" 봤다면 이 누락을 놓쳤을 것이다.

**How to apply:** 브랜드/제품명 문자열을 바꾸는 요청을 리뷰할 때는 항상 저장소 전체에 대해 옛 문자열로 grep 1회를 돌려, 사용자 노출 위치(manifest, meta 태그, alt 텍스트, PWA 관련 파일)에 남은 잔재가 있는지 확인한다. 코드 주석/내부 문서(CLAUDE.md, supabase 마이그레이션 주석, 에이전트 정의 파일)는 낮은 우선순위(Minor)로 별도 언급하되, 커밋을 막을 필요는 없다 — [[project_repo_nature]] 참고.
