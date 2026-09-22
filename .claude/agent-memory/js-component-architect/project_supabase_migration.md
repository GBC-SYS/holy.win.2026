---
name: project_supabase_migration
description: Supabase 무로그인 CRUD 도입(전체 계획 .claude/plans/crystalline-enchanting-perlis.md) 6단계 전부 완료 — 각 단계 산출물과 재사용 가능한 패턴 기록
type: project
metadata:
  type: project
---

전체 계획은 `.claude/plans/crystalline-enchanting-perlis.md`에 있고, 6단계로 나뉘어 순차 진행했다(각 단계 후 사용자가 브라우저에서 수동 확인 후 다음 단계 진행 — Chrome 자동화 도구 연결 안 됨). **2026-09-22 기준 6단계 전부 완료.**

## 2026-09-22 기준 진행 상태
- 1단계(스키마+RLS, `supabase/migrations/0001_init.sql`): 완료(사용자가 Dashboard SQL Editor에서 실행 완료 확인).
- **2단계(Supabase 클라이언트 연결) 완료.** 신규 파일 `assets/js/supabase-client.js`:
  - `@supabase/supabase-js@2.116.0` UMD 빌드를 jsDelivr CDN(`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js`)으로 고정 핀 로드. 이 UMD 번들은 전역 `window.supabase`(→ `.createClient`)로 노출됨. 버전 갱신 시 이 파일 상단 주석이 아니라 `index.html`의 `<script>` URL을 직접 바꿔야 함 — 버전 문자열이 URL에 하드코딩되어 있음.
  - 전역 `const supabaseClient` — 다른 스크립트(3~4단계의 `entries.js`)가 그대로 참조.
  - 전역 `window.supabaseReady` — `ensureAnonymousSession()`이 반환하는 Promise. 기존 세션 있으면 재사용, 없으면 `signInAnonymously()`. **reject하지 않고 항상 세션 또는 null로 resolve** — 실패 시 콘솔 에러만 남기고 이후 로직에 책임을 넘기는 설계(사용자 대상 알림은 3~4단계 이후 범위). 향후 `entries.js`는 `await window.supabaseReady` 또는 `.then()`으로 세션 준비를 기다린 뒤 쿼리해야 함.
  - `index.html`의 스크립트 순서: CDN supabase-js → `supabase-client.js` → `entries.js`(3순위, 아직 미수정).
- **3단계(읽기 전환) 완료.** `entries.js`가 `window.supabaseReady.then(() => supabaseClient.from('holywin_entries').select('*').order('submitted_at', {ascending: false}))`로 데이터를 읽고, `mapRowToEntry()` 어댑터로 `{id, to, from, relation, status, date, group}` 형태로 변환. `group`은 DB에 컬럼이 없어 `resolveEntryGroup()`이 `submitted_at` 기준 7일 이내 여부로 클라이언트에서 파생 계산(`RECENT_GROUP_WINDOW_MS`).
- **4단계(상태 토글 UPDATE 전환) 완료(2026-09-22).** `handleStatusToggle(entry)`를 `async function`으로 변경, 비관적 업데이트 방식 채택(낙관적 업데이트 금지 — 이유는 아래). `.update({status: nextStatus}).eq('id', entry.id).select()`를 호출해 세 갈래로 분기:
  - `error` 있음 → `console.error` + `alert('상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.')`, 화면 갱신 안 함.
  - `error` 없지만 `data`가 빈 배열 → RLS `using` 절이 조용히 걸러낸 경우(예: `owner_id`가 sentinel UUID인 시드 데이터는 어떤 익명 세션으로도 UPDATE 불가). `alert('본인이 작성한 글만 상태를 변경할 수 있습니다.')`, 화면 갱신 안 함.
  - `data`에 행 있음 → 그제서야 `entry.status = nextStatus` 후 `renderTicket`/`renderList` 호출.
  - localStorage 기반 상태 오버레이 로직(`STATUS_STORAGE_KEY`, `getStatusOverrides`, `saveStatusOverride`, `applyStatusOverrides`)은 전량 삭제. `STATUS_OPTIONS`/`cycleStatus`(다음 상태 계산 순수 로직)만 유지.
- **5단계(등록 폼 INSERT 전환) 완료.** `handleEntryFormSubmit(event)`가 `async function`으로 폼 값을 trim/검증 후 `await window.supabaseReady`로 세션을 기다린 다음 `.from('holywin_entries').insert({to_name, from_name, relation}).select()` 호출. `owner_id`/`status`/`submitted_at`은 payload에 넣지 않고 DB 기본값(`auth.uid()`/`'기도 중'`/`now()`)에 위임. 성공 시 `data[0]`을 `mapRowToEntry()`로 변환해 `entries.unshift()` 후 `renderList()`, `entryForm.reset()`. 실패 시 `alert()` + `console.error`(4단계와 동일한 에러 처리 컨벤션).
- **등록 폼 UI를 전체화면(`.screen`) → 바텀시트 오버레이로 재구조화 완료(2026-09-22).** `#screen-form`(세 번째 `.screen`)을 없애고 `.phone` 안에 `#sheet-backdrop`(어두운 스크림)/`#sheet-panel`(하단 슬라이드 패널)을 형제 오버레이로 배치. `openEntryForm()`/`closeEntryForm()`이 `setScreen()`(list↔ticket 전용)과 완전히 분리된 별개 토글 메커니즘 — hidden 클래스(`sheet-backdrop--hidden`/`sheet-panel--hidden`)만 조작. `handleEntryFormSubmit` 성공 분기의 `setScreen(screenList, screenForm)` 호출은 `closeEntryForm()`으로 교체됨(INSERT 로직 자체는 무변경). 상세 CSS 클래스/토큰은 `docs/07-components.md`의 "바텀시트(sheet-backdrop/sheet-panel)" 항목에 기록됨. 드래그로 끌어내리는 제스처는 범위 밖(백드롭 탭 + 닫기 버튼만 지원).
- **6단계(수정/삭제 UI + 내 글 필터) 완료(2026-09-22). 이로써 전체 6단계 계획 완료.** 새 SQL 마이그레이션 없음 — 기존 UPDATE RLS 정책(`owner_id = auth.uid()`) 하나가 일반 필드 수정과 소프트 삭제(`deleted_at` UPDATE) 둘 다 커버.
  - `mapRowToEntry()`에 `ownerId: row.owner_id`, `isMine: currentUserId != null && row.owner_id === currentUserId` 추가. `currentUserId`는 모듈 스코프 `let`, 데이터 로딩 단계 `window.supabaseReady.then((session) => { currentUserId = session?.user?.id ?? null; ... })`에서 채움(이전엔 `.then(() =>` 로 세션 값을 버리고 있었음 — 이번에 고침).
  - `renderList()`: `listFilterMine` 상태에 따라 `entries`를 미리 필터링한 `source` 배열 기준으로 그룹핑/countText/빈 상태(`#list-empty`, `.is-hidden` 유틸리티 클래스로 토글) 렌더링.
  - `renderTicket(entry)`: `currentTicketEntry = entry` 저장(수정/삭제 핸들러가 참조), `entry.isMine`에 따라 `#ticket-owner-actions`(`.ticket-owner-actions--hidden`) 토글.
  - 새 함수: `handleEditFormSubmit`(수정 시트 제출 → UPDATE to_name/from_name/relation), `handleDeleteEntry`(성공 시 `entries` 배열에서 제거 + `backToList()`), `openEditForm(entry)`/`closeEditForm()`(두 번째 바텀시트, 등록 시트와 완전히 동일한 hidden-토글 메커니즘 재사용), `setListFilter(mine)`(필터 탭 클릭 핸들러).
  - **`handleDeleteEntry`는 이후 별도로 수정됨(아래 "소프트 삭제 RLS 버그" 항목 참고) — 최종적으로는 일반 UPDATE가 아니라 `holywin_soft_delete_entry` RPC를 호출한다.** confirm()도 이후 `showDialog()`로 전량 교체됐다(아래 참고).
  - 둘 다 4~5단계와 동일한 세 갈래 분기(`error` → alert, `data` 빈 배열 → RLS 방어 alert, 성공 → 로컬 상태 갱신) 패턴 재사용. update/delete payload에 `owner_id`는 절대 포함하지 않음(`.eq('id', ...)`로만 대상 지정, 소유권 판별은 RLS에 위임).
  - `index.html`: 리스트 헤더에 `.filter-tabs`(`#filter-tab-all`/`#filter-tab-mine`), 티켓 화면에 `#ticket-owner-actions`(수정/삭제 버튼), 등록 시트와 동일 구조의 두 번째 바텀시트(`#edit-sheet-backdrop`/`#edit-sheet-panel`/`#edit-entry-form`) 추가.
  - `entries.css` 신규 클래스: `.filter-tabs`/`.filter-tab`/`.filter-tab--active`(칩과 동일 원칙 — 선택 시 `--accent-soft` 배경 + `--accent` 글자), `.list-empty`, `.is-hidden`(범용 `display:none` 유틸리티, `.screen--hidden`과 달리 트랜지션 없음), `.ticket-owner-actions`(flex+gap), `.btn-secondary`(보조 버튼, `docs/07-components.md` 스펙대로 배경 없음+`--ink`+1px `--card-muted-line` 테두리), `.btn-danger`(위험 버튼, `--destructive`/`--destructive-foreground` 최초 실사용).
  - `:root`에 `--destructive: #dc2626`/`--destructive-foreground: #ffffff` 추가(이전엔 `docs/09-shadcn-tokens.md`에만 대기 상태로 정의돼 있었음). WCAG 상대 휘도 공식으로 직접 계산한 대비 ≈ **4.83:1**(4.5:1 기준 통과) — `docs/02-colors.md` "코드에 남아있는 추가 색" 표에 행 추가, `docs/09-shadcn-tokens.md`의 "미사용" 문구를 "실제 사용 중"으로 갱신.
  - `docs/07-components.md`: 보조 버튼/위험 버튼/탭/빈 상태 네 항목을 "미구현"에서 실제 구현 값으로 채움, "프로젝트가 커지면 추가할 수 있는 컴포넌트" 목록에서 이 네 항목을 "구현됨" 표시로 갱신(토글/하단 네비게이션만 여전히 미구현으로 남음).

**Why:** 이 프로젝트는 번들러가 없어 `import`/`export` 사용 불가 — CDN classic script + 전역 변수 공유가 유일한 스크립트 간 연동 방법. anon key는 공개 키라 하드코딩이 정상(RLS가 실제 접근 제어 담당). PostgREST는 UPDATE/INSERT가 RLS에 막혀도 에러를 던지지 않고 `data: []`만 반환하므로 `error` 유무만으로 성공 판정하면 조용한 실패를 놓친다 — 반드시 `data.length`(또는 `data[0]` 존재 여부) 체크 병행.

**How to apply:** 이 프로젝트에 앞으로 새 쓰기(INSERT/UPDATE) 기능을 추가할 때는 `supabase-client.js`를 다시 만들거나 CDN URL을 재조사하지 말고 기존 `window.supabaseClient`/`window.supabaseReady`를 그대로 재사용할 것. 모든 쓰기 작업에 `.select()`를 붙여 반환된 행 개수(`data.length`)로 RLS 통과 여부를 확인하는 세 갈래 분기(`error`/빈 배열/성공) 패턴을 유지할 것(4~6단계에서 확립한 컨벤션이자 이 프로젝트의 표준 쓰기 에러 처리 방식). 새 오버레이형 UI(모달/시트 등)가 더 필요해지면 `.screen` 전환 체계에 끼워 넣지 말고 바텀시트처럼 별도 hidden-토글 메커니즘(`.is-hidden` 유틸리티 또는 전용 `--hidden` modifier 클래스)으로 분리할 것. update/delete(소프트 삭제) payload에는 `owner_id`를 절대 포함하지 말 것 — `.eq('id', ...)`로만 대상을 지정하고 소유권 판별은 항상 RLS에 맡길 것.
