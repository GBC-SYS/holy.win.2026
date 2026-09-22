# Supabase 기반 무로그인 CRUD 도입

> 이전 계획("티켓 카드 보딩패스 스타일 재디자인")은 이미 구현 완료되어 더 이상 유효하지 않으므로, 이번 요청에 맞춰 완전히 새로 작성함.

## Context

지금까지 이 앱은 `assets/data/entries.json`을 fetch로 읽기만 하는 완전 정적 사이트였고, 상태(기도 중/완료) 토글조차 `localStorage`에 값을 얹는 "가짜 영속성"이었다(그 브라우저에서만 보이고, `entries.json` 원본은 절대 안 바뀜). 사용자는 "본인이 작성한 전도 대상자를 따로 보고 수정도 하고 싶다"며 실제 CRUD(등록/조회/수정/삭제)를 요청했고, 회원가입·로그인 UI 없이 Supabase 같은 가벼운 백엔드로 **실제로 여러 사람과 공유되는** 명단을 원한다고 확정했다(순수 로컬 방식은 명시적으로 거절).

사용자는 이 프로젝트용 Supabase 프로젝트를 이미 가지고 있다(URL/anon key 제공 가능). 조사 결과 `.mcp.json`의 기존 `supabase` 항목은 완전히 다른 프로젝트(`statkit.cms.api`, read_only)를 가리키고 있어 이 프로젝트엔 재사용 불가하고, `supabase/` 디렉토리는 비어있으며, `.claude/agents/supabase-db-architect.md`에 이미 "쓰기(DDL/DML)는 파일로 먼저 작성, 읽기만 MCP로 직접 조회"라는 이 저장소 전용 규칙이 있다.

Plan 서브에이전트가 Supabase 공식 문서를 직접 확인해 아키텍처를 검증했고, 사용자와 상의해 아래 세 가지 핵심 결정을 확정했다:

1. **소유권 모델: Supabase Anonymous Sign-In 채택** (커스텀 헤더 방식 대신). 화면엔 로그인 UI가 전혀 없지만, 내부적으로 `supabase.auth.signInAnonymously()`로 진짜 `auth.uid()`를 발급받아 표준 RLS(`auth.uid() = owner_id`)를 쓴다. 직접 토큰 관리 코드를 짤 필요가 없고, 스팸 방지용 rate limit이 기본 내장되며, Realtime과도 호환된다. **단, Supabase Dashboard → Authentication → Providers에서 "Allow anonymous sign-ins"를 사용자가 직접 켜야 한다(에이전트가 대신 할 수 없음).**
2. **"이번 주 제출"/"이전 명단" 구분: `submitted_at` 기준 7일 이내를 클라이언트에서 파생 계산.** 기존 `group` 컬럼(현재 5개 데이터 전부 하드코딩, 파생 규칙 없음)은 없앤다.
3. **마이그레이션 실행: 파일로만 작성, 사용자가 Supabase Dashboard SQL Editor에 직접 붙여넣어 실행.** `.mcp.json`은 건드리지 않는다(기존 규칙과 일치, 사람 검토 단계 유지).

이 방식의 본질적 한계를 사용자가 인지해야 한다: **익명 인증이라 브라우저 데이터를 지우거나 다른 기기로 접속하면 본인 글이라도 다시는 수정/삭제할 수 없다.** 진짜 계정이 아니기 때문이며, 이건 "회원가입 없이" 요구사항의 필연적 트레이드오프다.

## 아키텍처

### 클라이언트 로딩 (번들러 없음, classic script 유지)
`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.x.y">`(정확한 버전 핀 고정, `@2` 같은 부동 태그 금지)를 `entries.js`보다 먼저 로드 → `window.supabase.createClient(url, anonKey)`로 전역 `supabaseClient` 생성. `import`/`export` 없이 기존 classic-script 컨벤션 그대로 유지(`js-component-architect` 원칙과 일치).

### 스키마 (`holywin_entries` 테이블)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | `bigint generated always as identity` | 내부 식별자, 화면 노출 안 됨(소유권은 owner_id가 지킴) |
| `to_name` | `text not null check (length(to_name) <= 50)` | 전도 대상자 이름(기존 `to`) |
| `from_name` | `text not null check (length(from_name) <= 50)` | 제출자 이름(기존 `from`) |
| `relation` | `text not null check (length(relation) <= 50)` | |
| `status` | `text not null default '기도 중' check (status in ('기도 중','완료'))` | |
| `submitted_at` | `timestamptz not null default now()` | 기존 자유 텍스트 `date` 대체, 화면 표시는 JS에서 포맷 |
| `owner_id` | `uuid not null default auth.uid() references auth.users(id) on delete set null` | 익명 세션의 `auth.uid()` |
| `deleted_at` | `timestamptz` | soft delete |

### RLS 정책
- SELECT: 공개, `deleted_at is null`인 행만
- INSERT: 공개(익명 세션이면 누구나), `owner_id`는 `default auth.uid()`로 서버가 채움
- UPDATE: `owner_id = auth.uid()`인 행만 — 실제 `DELETE` 권한은 부여하지 않고, 이 UPDATE 정책으로 `deleted_at`만 채우는 soft delete로 "삭제"를 구현(복구 가능성 확보)
- 시드 데이터(기존 `entries.json`의 5건)는 owner_id 없이(또는 존재하지 않는 값으로) 넣어 사실상 아무도 수정 못 하는 읽기 전용 시범 데이터로 유지

## 구현 순서 (단계별로 나눠 진행 — 한 번에 다 하지 않음)

### 0단계 — 사용자로부터 받아야 할 것 (구현 착수 전)
- Supabase 프로젝트 URL + anon public key (anon key는 공개용 키라 `.env` 차단 규칙과 무관하게 코드에 직접 넣어도 됨)
- Dashboard에서 "Allow anonymous sign-ins" 활성화 확인

### 1단계 — 스키마 + RLS (`supabase-db-architect` 위임)
`supabase/migrations/0001_init.sql` 작성: 위 스키마 DDL, RLS 정책, 기존 `entries.json` 5건을 시드 INSERT로 포함, 파일 상단에 "익명 인증 기반 소유권의 한계" 주석 명시. 사용자가 Dashboard SQL Editor에서 직접 실행.

### 2단계 — Supabase 클라이언트 연결 (`js-component-architect` 위임)
`assets/js/supabase-client.js` 신규 — CDN 클라이언트 초기화, 페이지 로드 시 기존 세션 없으면 `signInAnonymously()` 호출 후 완료 대기. `index.html`에 `<script>` 태그 순서대로 추가.

### 3단계 — 읽기 전환 (`js-component-architect` 위임)
`entries.js`의 `fetch('./assets/data/entries.json')`를 `supabaseClient.from('holywin_entries').select(...)`로 교체. `group` 필터링 로직을 `submitted_at` 7일 기준 파생 함수로 교체. `assets/data/entries.json`은 더 이상 fetch되지 않음(마이그레이션 시드로 이관되었으므로 파일 자체는 삭제).

### 4단계 — 상태 토글을 실제 UPDATE로 전환 (`js-component-architect` 위임)
`getStatusOverrides`/`saveStatusOverride`/`applyStatusOverrides`/`STATUS_STORAGE_KEY`(가짜 localStorage 영속성) 전체 제거. `handleStatusToggle`이 `supabaseClient.from('holywin_entries').update({status}).eq('id', entry.id)`를 호출하도록 교체(RLS로 본인 글 아니면 실패 — 실패 시 사용자에게 알림 필요).

### 5단계 — 등록(Create) 폼 (`js-component-architect` 위임)
`#btn-add`의 `alert()` placeholder를 실제 폼 화면(`#screen-list`/`#screen-ticket`과 같은 패턴의 세 번째 `.screen`)으로 교체 — 대상자 이름/제출자 이름/관계 입력 → `insert()`. `docs/07-components.md`에 이미 "미구현, 제안 스펙만 기재"로 남아있는 입력창 스펙을 이번에 실제 값으로 채운다(문서 동기화 규칙).

### 6단계 — 수정/삭제 UI + "내 글" 필터 (`js-component-architect` 위임)
티켓 상세 화면에 "내 글"일 때만 보이는 수정 폼(이름/관계 수정)과 삭제 버튼(확인 단계 포함, `docs/07-components.md`의 "위험 버튼" 조건과 일치) 추가. 리스트 화면에 "내가 쓴 글" 필터/탭 추가(`owner_id = 현재 auth.uid()`로 필터링).

각 단계 완료 후 사용자가 브라우저에서 직접 확인하고 다음 단계로 넘어간다(대규모 변경을 한 번에 검토하기 어려우므로).

## 확인 방법
- 1단계 후: Supabase Dashboard Table Editor에서 `holywin_entries` 테이블과 시드 5건이 보이는지 확인
- 2~3단계 후: 로컬 서버(`python3 -m http.server 8080`)로 접속해 목록이 Supabase에서 로드되는지, DevTools Application 탭에서 익명 세션이 생겼는지 확인
- 4단계 후: 상태 배지를 토글하고 새로고침 → 유지되는지, 다른 브라우저(시크릿 창)에서도 바뀐 상태가 보이는지(진짜 공유 확인)
- 5~6단계 후: 새 글 등록 → 목록에 바로 뜨는지, "내가 쓴 글" 필터에 방금 등록한 것만 보이는지, 수정/삭제가 본인 글에서만 동작하고 시드 데이터나 다른 브라우저에서 만든 글에는 안 먹히는지 확인
- Chrome 자동화 도구가 이번 세션 내내 연결되지 않았으므로 각 단계마다 사용자의 수동 확인이 필요함
