# Supabase Realtime Presence — 실시간 접속자 수 표시

## Context

사용자가 리스트 화면 헤더의 "♡ N명" 칩(`.count-chip`) 위치를 스크린샷으로 지목하며, Supabase의 소켓(WebSocket) 기반 실시간 기능을 활용해 "지금 이 화면을 몇 명이 같이 보고 있는지"를 그 자리에 표시하고 싶다고 요청했다. 이 칩은 현재 `entries.js`의 `renderList()`가 "필터 조건에 맞는 명단 건수"를 채워 넣는 용도로 쓰이고 있고, 실시간/소켓 관련 로직은 코드베이스 전체에 전무하다(신규 구현).

사용자 확인 결과:
- 기존 칩은 접속자 수로 **완전히 교체**한다("필터된 명단 건수" 표시는 사라짐).
- 카운트 단위는 **사람(고유 방문자) 단위** — 같은 사람이 탭을 여러 개 열어도 1명으로 집계.
- 숫자 변경 시 펄스 애니메이션은 **넣지 않는다**(즉시 `textContent` 갱신).

이 프로젝트의 Supabase 프로젝트(`lrqqxzlxuilwfumitwmc`)는 `statkit.cms.api`, `franchise_*`, `deartintsanta` 등 다른 앱들과 DB를 공유하며, 과거 다른 앱의 트리거가 이 앱의 익명 로그인과 충돌한 전례가 있다(`.claude/memory/project_supabase-shared-project-conflict.md`). Realtime Presence는 DB 테이블/트리거를 전혀 만들지 않는 순수 WebSocket 채널 기능이라 이 리스크를 피해갈 수 있다는 점이 이 기능을 선택한 이유이자 설계의 핵심 제약이다.

MCP로 직접 확인한 사실: `realtime.messages` 테이블은 RLS가 `ENABLED`이지만 정책이 0개다. 즉 채널을 `private: true`로 열면(정책이 없으므로) join이 거부될 가능성이 높다 — **채널은 반드시 기본(public) 모드로 연다.**

## 구현 파일

### 1. 신규 파일: `assets/js/presence.js`

기존 파일 분리 관례(`supabase-client.js` = 클라이언트 초기화, `entries.js` = 도메인 로직, `install-prompt.js` = PWA)를 따라 새 관심사로 분리한다.

```js
(async () => {
  await window.supabaseReady;

  const countTextEl = document.getElementById('count-text');
  if (!countTextEl) return;

  const session = window.supabaseClient
    ? (await window.supabaseClient.auth.getSession()).data.session
    : null;
  const presenceKey = session?.user?.id || crypto.randomUUID();

  const channel = window.supabaseClient.channel('holywin2026-presence', {
    config: { presence: { key: presenceKey } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length; // 고유 방문자 수
      countTextEl.textContent = `${count}명`;
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });
})();
```

- 채널 이름에 `holywin2026-` 접두사를 붙여 공유 프로젝트 내 다른 앱과 topic 충돌을 피한다.
- `private` 옵션은 절대 넣지 않는다(위 RLS 근거).
- `sync` 이벤트 하나로만 카운트를 갱신한다(join/leave 별도 리스너 불필요).
- 탭 종료/새로고침 시 정리는 별도 코드 없이 브라우저의 소켓 종료 → Realtime 서버의 자동 leave 처리에 맡긴다(`beforeunload`/`pagehide` 리스너 추가하지 않음).
- 에러 처리는 `console.error`만 남기는 최소 수준으로 한다. supabase-js의 RealtimeClient가 자체적으로 재연결을 시도하므로 별도 재시도 로직은 만들지 않는다.

### 2. `assets/js/entries.js` 수정

- 6행 `const countText = document.getElementById('count-text');` 선언 삭제(더 이상 이 파일이 쓰지 않음).
- 212행 `countText.textContent = \`${source.length}명\`;` 삭제(`renderList()` 내부).

### 3. `index.html` 수정

- 359~366행 스크립트 로드 순서에 `presence.js`를 `supabase-client.js` 다음, `entries.js` 이전에 추가:

```html
<script src="./assets/js/supabase-client.js"></script>
<script src="./assets/js/presence.js"></script>
<script src="./assets/js/install-prompt.js"></script>
<script src="./assets/js/entries.js"></script>
```

- 34~39행 `.count-chip` 마크업에 `aria-label="현재 접속자 수"`를 추가해 의미 변경을 스크린리더 사용자에게도 알린다. `#count-text`의 초기값(`-`)은 그대로 두어 presence 동기화 전까지의 로딩 상태를 표현한다.

### 4. CSS

변경 없음 — 기존 `.count-chip`, `.count-chip span`(`assets/css/entries.css` 192~205행) 스타일을 그대로 재사용한다. 펄스 애니메이션은 넣지 않기로 확정했으므로 `@keyframes` 추가 없음.

## 검증

**로컬 수동 테스트**
1. `python3 -m http.server 8080` 실행 후 `http://localhost:8080/index.html`을 일반 창과 시크릿창(서로 다른 익명 세션) 각각 연다.
2. 두 창 모두 "♡ 2명"으로 표시되는지 확인.
3. 한 창에서 탭을 하나 더 열어(같은 브라우저, 같은 익명 세션) 총 3개 탭이 되어도 여전히 "2명"으로 유지되는지 확인(사람 단위 집계 검증).
4. 창 하나를 닫고 남은 창에서 숫자가 "1명"으로 내려오는지(수 초 내) 확인.
5. DevTools Network 탭에서 `wss://lrqqxzlxuilwfumitwmc.supabase.co/realtime/v1/websocket...` 연결이 101로 정상 업그레이드되는지, Console에 에러가 없는지 확인.
6. 만약 카운트가 전혀 안 올라가면 `private: true`가 실수로 들어가지 않았는지부터 의심한다(가장 유력한 실패 지점).

**Supabase MCP 사후 확인**
- `mcp__supabase__get_advisors(type: "security")`를 재실행해 `realtime.messages` 관련 새 advisory가 생기지 않았는지 확인.
- 새 테이블/트리거/함수를 만들지 않았는지 `git diff`로 재확인(공유 프로젝트 트리거 충돌 전례 재발 방지).

**코드 리뷰/커밋**
- 이 저장소 관례상 커밋 전 `code-reviewer` 에이전트의 APPROVED가 필요하다. 구현 완료 후 diff를 code-reviewer에 전달해 검토받는다.
