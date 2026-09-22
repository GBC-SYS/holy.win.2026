---
name: project-claude-md-doc-drift
description: CLAUDE.md의 "Entry point"/"Screen flow" 섹션이 entries.json fetch 방식을 여전히 설명 — 실제로는 Supabase CRUD로 이미 전환됨(2026-09-22 리뷰에서 발견)
metadata:
  node_type: memory
  type: project
  modified: 2026-09-22T00:00:00.000Z
---

CLAUDE.md의 "Architecture" 섹션(Entry point / Screen flow 문단)이 여전히 "`entries.js`가 `./assets/data/entries.json`을 fetch한다", "Opening `index.html` directly via `file://` will break `fetch()`"라고 설명하고 있는데, [[project-supabase-crud-migration]]으로 이미 이 방식이 완전히 대체되었다 — `assets/data/entries.json` 파일 자체가 저장소에 더 이상 존재하지 않고, `assets/js/`에 `fetch(` 호출이 전혀 없다(2026-09-22 확인). 대신 `entries.js`는 `window.supabaseClient`/`window.supabaseReady`(`assets/js/supabase-client.js`, `index.html`에서 `@supabase/supabase-js` CDN 스크립트와 함께 로드)를 통해 `holywin_entries` 테이블을 조회한다.

로컬 서버 실행이 필요하다는 결론 자체는(Supabase CDN 스크립트 로딩 등의 이유로) 여전히 맞을 가능성이 높지만, 그 근거로 대던 "entries.json fetch가 CORS로 깨진다"는 설명은 더 이상 사실이 아니다.

**Why:** 이번 세션(스크롤 아키텍처 리팩터링)에서 CLAUDE.md의 다른 문단(스크롤 구조 설명)만 갱신되고, 이 데이터 로딩 문단은 그보다 훨씬 전(Supabase 마이그레이션 시점)부터 방치되어 있었음이 코드 리뷰 중 발견됨.

**How to apply:** CLAUDE.md를 다음에 편집할 기회가 있으면 "Entry point"/"Screen flow" 문단을 Supabase 기반 데이터 로딩으로 갱신할 것(index.html이 로드하는 스크립트 3개: `@supabase/supabase-js` CDN → `supabase-client.js` → `entries.js` 순서도 함께 반영). 이 저장소는 CLAUDE.md 같은 안내 문서가 실제 코드와 어긋나는 일이 반복되는 편이니, 향후 리뷰에서도 CLAUDE.md 서술과 실제 코드를 대조하는 습관을 유지할 것.
