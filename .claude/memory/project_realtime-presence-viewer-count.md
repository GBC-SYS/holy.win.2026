---
name: project-realtime-presence-viewer-count
description: 리스트 화면 count-chip이 "필터된 명단 건수"에서 Supabase Realtime Presence 기반 "실시간 동시 접속자 수"로 완전히 교체됨 — 신규 assets/js/presence.js, 2026-09-30
metadata:
  node_type: memory
  type: project
  modified: 2026-09-30T06:45:00.000Z
---

리스트 화면 헤더의 "♡ N명" 칩(`.count-chip`, `#count-text`)이 기존에는 `entries.js`의 `renderList()`가 "현재 필터 조건에 맞는 명단 건수"를 채우던 자리였는데, 이를 완전히 걷어내고 신규 `assets/js/presence.js`가 Supabase Realtime Presence로 "지금 이 앱을 보고 있는 사람 수"를 표시하도록 교체했다(커밋 `685d6d6`).

**Why:** 사용자가 "supabase에서 소켓통신을 활용해서 현재 서비스 화면에 접속한 사람을 실시간으로 조회해서 특정 위치에 몇명이 같이 보고 있어요 라고 넣고 싶어"라고 요청하며 정확히 이 칩 위치를 스크린샷으로 지목했다. Plan Mode에서 AskUserQuestion으로 세 가지를 확인받았다: (1) 기존 "필터 건수" 표시는 완전히 버리고 접속자 수로 교체(대안: 별도 칩 추가는 기각), (2) 카운트 단위는 "사람"(같은 브라우저에서 탭을 여러 개 열어도 1명) — 탭 단위가 아님, (3) 숫자 변경 시 펄스 애니메이션 없음(즉시 텍스트 갱신).

**설계 결정과 근거:**
- 채널 이름은 `holywin2026-presence`(이 프로젝트만의 접두사) — [[project-supabase-shared-project-conflict]]에 적힌 대로 DB를 공유하는 다른 앱들과 topic이 겹치지 않게 하기 위함.
- presence key는 `session.user.id`(기존 `ensureAnonymousSession()`이 만든 익명 세션 UID)를 그대로 재사용 — 새 인증 로직 불필요, 같은 브라우저=같은 세션=같은 key이므로 "사람 단위" 요구사항이 자연히 충족됨. 세션이 없으면 `crypto.randomUUID()`로 폴백.
- `channel()` 호출 시 **`private: true`를 절대 넣지 않는다** — `realtime.messages`에 RLS 정책이 0개라 private 채널은 join이 거부될 위험이 있음(위 링크 메모리 참고).
- 카운트 계산은 `sync` 이벤트 하나만 구독해 `Object.keys(channel.presenceState()).length`로 계산(join/leave 개별 리스너는 안 씀).
- `beforeunload`/`pagehide` 등 정리 리스너는 넣지 않음 — 탭 종료/새로고침 시 소켓이 끊기면 Realtime 서버가 자동으로 leave 처리하므로 불필요(이 앱 규모에 맞는 최소 구현 원칙).
- DB 테이블/트리거/함수는 전혀 만들지 않음 — Presence는 순수 클라이언트-서버 WebSocket 채널이라 Postgres 스키마를 거치지 않는다. 구현 전후 `mcp__supabase__list_migrations`/`list_tables`/`get_advisors`로 비교해 DB 쪽 변화가 0건임을 실제로 재확인했다(공유 프로젝트 트리거 충돌 전례를 반복하지 않기 위한 검증).

**접근성 회귀와 수정(code-reviewer가 잡음):** 처음 구현에서 `index.html`의 `.count-chip`에 정적 `aria-label="현재 접속자 수"`를 추가했는데, `presence.js`가 `#count-text`의 `textContent`만 갱신하고 `aria-label`은 갱신하지 않아 스크린 리더에는 숫자가 영원히 전달되지 않는 회귀가 생겼다(aria-label이 있으면 스크린 리더는 자식 텍스트 노드를 무시함). `entries.js`의 `createStatusBadge`가 이미 "동적 값이 바뀔 때마다 aria-label도 같이 갱신"하는 관례를 갖고 있었는데 이를 놓친 것 — code-reviewer가 Major로 BLOCKED시켰고, `sync` 콜백에서 `countChipEl?.setAttribute('aria-label', \`현재 접속자 수 ${count}명\`)`을 추가해 해결, 재검토 후 APPROVED.

**검증 방법(재현 가능):** Chrome 자동화로 탭을 2개 열어, (a) 같은 브라우저(같은 localStorage=같은 익명 세션)에서는 정확히 "1명"으로 집계됨을 확인, (b) 한쪽 탭에서 `localStorage.clear()` 후 새로고침해 별도 익명 세션을 만들면 양쪽 다 "2명"으로 동기화됨을 확인, (c) 탭 하나를 닫으면 수 초 내 "1명"으로 자동 감소함을 확인. Supabase Studio의 **Realtime → Inspector**에서 채널명(`holywin2026-presence`)을 리스닝하면 `sync`/`join`/`leave` 원시 이벤트를 볼 수 있지만, 이건 "몇 명"이라는 집계값이 아니라 이벤트 로그일 뿐이라 혼동하지 말 것 — 실제 접속자 수는 앱 화면의 count-chip이나 가장 최근 `sync` 이벤트의 payload 안 key 개수로만 정확히 알 수 있다.

**How to apply:** 이 칩(`#count-text`, `.count-chip`)은 이제 `presence.js`가 단독 소유한다 — `entries.js`나 다른 파일에서 다시 "명단 건수" 같은 다른 의미로 덮어쓰지 말 것. 아이콘은 여전히 하트 모양(♡)이라 "관심/좋아요"처럼 보일 수 있다는 지적이 있었으나 디자인 논의로 남겨두고 이번 범위에서는 바꾸지 않았다 — 후속 요청이 오면 사람/신호 아이콘 교체를 검토.

**⚠️ 2026-10-03 갱신:** "텍스트 내용"에 대한 단독 소유권은 여전히 유효하지만, "노출 타이밍"(처음 보이냐 숨어있냐)은 더 이상 `presence.js` 소관이 아니다 — 접속 후 2.5초 고정 지연으로 나타나는 CSS 진입 애니메이션이 `entries.css`에 추가됐다. 자세한 내용과 왜 데이터 도착 시점 연동 방식을 버렸는지는 [[project_count-chip-entrance-animation]] 참고.
