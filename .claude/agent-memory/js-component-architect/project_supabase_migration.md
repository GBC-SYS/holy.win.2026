---
name: project_supabase_migration
description: Supabase 무로그인 CRUD 도입(전체 계획 .claude/plans/crystalline-enchanting-perlis.md)의 진행 상태와 2단계 산출물
type: project
metadata:
  type: project
---

전체 계획은 `.claude/plans/crystalline-enchanting-perlis.md`에 있고, 6단계로 나뉘어 순차 진행 중이다(각 단계 후 사용자가 브라우저에서 수동 확인 후 다음 단계 진행 — Chrome 자동화 도구 연결 안 됨).

## 2026-09-22 기준 진행 상태
- 1단계(스키마+RLS, `supabase/migrations/0001_init.sql`): 완료(사용자가 Dashboard SQL Editor에서 실행 완료 확인).
- **2단계(Supabase 클라이언트 연결) 완료.** 신규 파일 `assets/js/supabase-client.js`:
  - `@supabase/supabase-js@2.116.0` UMD 빌드를 jsDelivr CDN(`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js`)으로 고정 핀 로드. 이 UMD 번들은 전역 `window.supabase`(→ `.createClient`)로 노출됨. 버전 갱신 시 이 파일 상단 주석이 아니라 `index.html`의 `<script>` URL을 직접 바꿔야 함 — 버전 문자열이 URL에 하드코딩되어 있음.
  - 전역 `const supabaseClient` — 다른 스크립트(3~4단계의 `entries.js`)가 그대로 참조.
  - 전역 `window.supabaseReady` — `ensureAnonymousSession()`이 반환하는 Promise. 기존 세션 있으면 재사용, 없으면 `signInAnonymously()`. **reject하지 않고 항상 세션 또는 null로 resolve** — 실패 시 콘솔 에러만 남기고 이후 로직에 책임을 넘기는 설계(사용자 대상 알림은 3~4단계 이후 범위). 향후 `entries.js`는 `await window.supabaseReady` 또는 `.then()`으로 세션 준비를 기다린 뒤 쿼리해야 함.
  - `index.html`의 스크립트 순서: CDN supabase-js → `supabase-client.js` → `entries.js`(3순위, 아직 미수정).
- 3단계(읽기 전환: `entries.json` fetch → `supabaseClient.from('holywin_entries').select()`, `group` 필터를 `submitted_at` 7일 파생 계산으로 교체)와 4단계(상태 토글을 실제 UPDATE로 전환, localStorage 오버레이 로직 제거)는 아직 미착수.

**Why:** 이 프로젝트는 번들러가 없어 `import`/`export` 사용 불가 — CDN classic script + 전역 변수 공유가 유일한 스크립트 간 연동 방법. anon key는 공개 키라 하드코딩이 정상(RLS가 실제 접근 제어 담당).

**How to apply:** 3~4단계를 진행할 때 `supabase-client.js`를 다시 만들거나 CDN URL을 재조사하지 말고 위 산출물을 그대로 재사용할 것. `entries.js` 최상단에 `window.supabaseReady` 대기 로직을 추가하는 것이 3단계의 첫 작업이 됨.
