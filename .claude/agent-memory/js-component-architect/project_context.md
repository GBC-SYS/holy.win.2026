---
name: project_context
description: 홀리윈 2026 전도 명단 프로젝트의 JS 관련 기본 사실 — JS 파일 구성(entries.js/supabase-client.js), 화면·오버레이 구성, Supabase 데이터 스키마
type: project
metadata:
  type: project
---

- `assets/js/`에는 `supabase-client.js`(Supabase 클라이언트/익명 세션 초기화, [[project_supabase_migration]] 참고)와 `entries.js`(렌더링/이벤트) 두 파일이 있다(2026-09-22 기준). `index.html` 진입점 로드 순서: CDN supabase-js → `supabase-client.js` → `entries.js`.
- 화면/오버레이 구성: `#screen-list`(리스트) / `#screen-ticket`(티켓 상세)는 `.screen--hidden` 클래스 토글(`setScreen()`)로 전환하는 전체화면 쌍이고, 명단 등록/수정 UI는 `#screen-*`이 아니라 각각 독립된 바텀시트 오버레이 2개다 — 등록: `#sheet-backdrop`/`#sheet-panel`(`openEntryForm()`/`closeEntryForm()`), 수정: `#edit-sheet-backdrop`/`#edit-sheet-panel`(`openEditForm()`/`closeEditForm()`). 둘 다 같은 `.sheet-backdrop`/`.sheet-panel` CSS를 재사용하고 `setScreen()`과는 별개의 hidden-토글 메커니즘이다.
- 데이터는 더 이상 `assets/data/entries.json`을 fetch하지 않는다 — Supabase 테이블 `holywin_entries`(컬럼: `to_name`/`from_name`/`relation`/`status`/`submitted_at`/`owner_id`/`deleted_at`)를 읽고 쓰며, `mapRowToEntry()` 어댑터가 `{id, to, from, relation, status, date, group, ownerId, isMine}` 형태로 변환한다. `group`은 DB에 없는 파생 필드로 `resolveEntryGroup()`이 `submitted_at` 기준 7일 이내 여부로 클라이언트에서 계산(`recent`/`past`, 각각 `#list-recent`/`#list-past`에 `entry-card` 라이트 / `entry-card--dark`로 렌더링). `isMine`은 모듈 스코프 `currentUserId`(익명 세션의 `session.user.id`, 데이터 로딩 단계에서 세팅)와 `row.owner_id` 비교로 계산하며, 리스트 필터(`listFilterMine`)와 티켓 화면의 수정/삭제 버튼 노출 여부를 결정한다. 실제 SQL DELETE는 테이블에 권한 자체가 없고(`supabase/migrations/0001_init.sql`), "삭제"는 `deleted_at`을 채우는 UPDATE(소프트 삭제)로만 동작한다.
- 과거 코드 리뷰에서 `innerHTML` 사용이 Major 이슈로 지적되어 전량 `.textContent`/`document.createElement` 방식으로 수정된 전례가 있다 ([[feedback_entries_review]] 참고). 이후로는 안전한 용도(빈 문자열로 초기화 등)라도 `innerHTML`보다 `.replaceChildren()` 같은 DOM API를 우선한다.
- `.phone`(390×844 목업) 안에 리스트/티켓 화면과 바텀시트가 모두 존재하는 단일 페이지 구조라 리스너 cleanup이 필요한 시점이 없다 — SPA 언마운트 개념 자체가 없음.
- 2026-09-22: 브라우저 기본 `alert()`/`window.confirm()` 9+1곳을 전부 커스텀 다이얼로그로 교체 완료. `#dialog-backdrop`(기존 `.sheet-backdrop` 클래스 재사용)/`#dialog-panel`(신규 `.dialog-panel` 클래스, 중앙 fade+scale, 백드롭 탭으로 안 닫힘 — 바텀시트와 다른 완전 별개 오버레이)이 단일 인스턴스로 존재하고, `entries.js`의 `showDialog({ title, description, confirmText, showCancel, cancelText, danger })`(Promise<boolean> 반환, resolve(true)=확인/resolve(false)=취소)가 매 호출마다 내용을 갈아끼워 재사용한다. 리스너 중복 방지 패턴: 모듈 스코프 `dialogConfirmHandler`/`dialogCancelHandler` 변수에 직전 핸들러를 담아두고 호출 시마다 `removeEventListener` 후 재등록. 알림 전용(showCancel 생략) 9곳, 확인+취소(삭제, `showCancel:true, danger:true`) 1곳. `docs/07-components.md`의 다이얼로그 항목도 동기화됨.
