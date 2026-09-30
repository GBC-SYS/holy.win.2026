---
name: project_presence_realtime_count_review
description: count-chip을 필터 건수 표시에서 Supabase Realtime Presence 기반 실시간 접속자 수 표시로 교체한 기능 리뷰 이력
metadata:
  type: project
---

신규 파일 `assets/js/presence.js` 추가. 기존 `count-chip`(리스트 헤더)이 표시하던 "필터된 명단 건수"를 완전히 걷어내고, Supabase Realtime Presence 채널(`holywin2026-presence`)로 실시간 동시 접속자 수("사람" 단위, 같은 익명 세션=같은 `session.user.id`를 presence key로 써서 탭 여러 개를 1명으로 집계)를 표시하도록 교체. `entries.js`에서 `countText` 관련 코드(선언 + `renderList()`의 갱신 라인) 삭제 — grep으로 잔여 참조 없음 확인, entries.js 안전.

인프라 제약: 이 Supabase 프로젝트는 `statkit.cms.api` 등 다른 앱과 DB를 공유([[project-supabase-shared-project-conflict]] 참고, 과거 다른 앱 트리거와 익명 로그인이 충돌한 전례 있음). 이번 구현은 새 테이블/트리거/함수를 전혀 만들지 않고 순수 클라이언트 Realtime Presence만 사용해 이 위험을 피함. `realtime.messages`에 RLS 정책이 0개라 `private: true` 채널은 join이 거부될 수 있음을 MCP로 직접 확인한 뒤, 코드에서 `private` 옵션을 의도적으로 빼고 기본(public) 채널로만 연결 — 주석에도 근거가 남아있음.

1차 리뷰 BLOCKED (Major 1건 + Minor 1건):
1. (Major) `index.html`의 `.count-chip`에 정적 `aria-label="현재 접속자 수"`를 추가했는데, `presence.js`는 `countTextEl.textContent`만 갱신하고 `aria-label`은 갱신하지 않음 → `aria-label`이 자식 텍스트를 완전히 덮어써서 스크린 리더 사용자에게 실제 숫자가 영원히 전달되지 않는 회귀(diff 이전엔 aria-label이 없어 자식 텍스트가 읽혔음). `entries.js`의 `createStatusBadge`가 이미 "동적 값이 바뀔 때마다 aria-label도 함께 갱신"하는 관례를 확립해두고 있어 그 패턴과도 불일치.
2. (Minor) `await window.supabaseReady;`를 값 없이 호출한 뒤 곧바로 `window.supabaseClient.auth.getSession()`을 다시 호출 — `window.supabaseReady`가 이미 세션으로 resolve하도록 설계돼 있고(`supabase-client.js`), `entries.js:996`이 이미 `const session = await window.supabaseReady;` 한 줄로 쓰는 관례와 불일치. 기능적 버그는 아니고 불필요한 중복 호출 + 일관성 문제.

2차 리뷰 APPROVED (2026-09-30):
- 1번: sync 콜백에서 `countChipEl?.setAttribute('aria-label', \`현재 접속자 수 ${count}명\`)` 추가로 해결. `countChipEl`은 `countTextEl?.closest('.count-chip')`로 얻음. Chrome으로 `document.querySelector('.count-chip').getAttribute('aria-label')`이 `"현재 접속자 수 2명"`으로 갱신됨을 재검증 확인.
- 2번: `getSession()` 재호출 제거, `const session = await window.supabaseReady;` 한 줄로 통일 — entries.js 관례와 일치.

남은 Minor(비차단, 이번 범위에서 의도적으로 미적용):
- Presence 채널 연결 실패(`CHANNEL_ERROR`/`TIMED_OUT`) 시 `console.error`만 남고 `count-text`는 초기값 `-`에 영구히 머묾 — "연결 실패"와 "0명"을 UI에서 구분할 수 없음. 이 앱 규모(부가 정보성 UI)를 고려해 차단 사유 아님으로 판단.
- `count-chip`의 하트 모양 아이콘이 "접속자 수"라는 새 의미와 어긋남 — 코드 문제가 아닌 디자인 논의 대상, 이번 커밋 범위 밖.

프라이버시 참고(차단 아님, 논의용): presence key로 쓰이는 익명 `auth.uid()`가 public 채널을 통해 모든 접속자에게 브로드캐스트됨. `entries.js`가 이미 `.select('*')`로 모든 글의 `owner_id`(=동일 uid)를 클라이언트에 노출하고 있어(이 기능 이전부터 존재하던 설계), 이론적으로 "이 글 작성자가 지금 접속 중인지" 대조 가능. uid에 PII가 없고 저위험 서비스라 지금 수준에서 막을 사안 아님.
