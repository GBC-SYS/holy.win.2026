# PWA 홈 화면 설치 유도 배너

## Context

QR 코드를 스캔해 들어온 방문자가 이 사이트를 앱처럼 계속 쓰려면 홈 화면에 설치해야 하는데, 지금은 그 경로를 안내하는 UI가 전혀 없다. `assets/manifest.webmanifest`는 이미 설치에 필요한 필드(name/icons/display/start_url 등)를 다 갖추고 있어 "설치 가능한" 상태지만, 아무도 그 사실을 모른 채 그냥 브라우저 탭으로만 쓰게 된다. Android/Chrome은 `beforeinstallprompt` 이벤트로 네이티브 설치를 트리거할 수 있고, iOS/Safari는 그 API가 없어 "공유 → 홈 화면에 추가"를 텍스트로 안내해야 한다 — 두 플랫폼 모두 이미 홈 화면에서 실행 중(`display-mode: standalone`)이면 아무것도 뜨지 않아야 한다.

사전 조사와 두 차례 확인을 거쳐 다음을 확정했다:
- **서비스워커는 추가하지 않는다.** 최신 Chrome의 installability 조건은 서비스워커를 요구하지 않아 manifest만으로 `beforeinstallprompt`가 발생한다. 이 앱은 Supabase에서 실시간으로 명단을 읽어오므로, 서비스워커 캐싱을 넣으면 오래된 데이터가 보일 위험만 늘어난다.
- **배너는 리스트(랜딩) 화면(`#screen-list`)에만 노출한다.** QR이 인코딩하는 주소가 리스트 화면이라 사용자 흐름과 일치하고, 화면 전환(`entries.js`의 `setScreen()`)을 건드릴 필요가 없어진다 — `.screen--hidden`은 `display: none`이므로, 배너 마크업을 `#screen-list`의 자식으로 두면 티켓 화면 전환 시 자동으로 함께 숨겨지고 복귀 시 자동으로 다시 보인다(직접 확인: `.container`/`.screen` 어디에도 `transform`이 없어 `position: fixed` 자식의 컨테이닝 블록이 뷰포트 그대로 유지됨).

## 구현 파일

- `index.html` — 배너 마크업 2개(Android/iOS) + 신규 스크립트 태그
- `assets/js/install-banner.js` (신규) — 감지/노출/닫기 로직
- `assets/css/entries.css` — `.cta-bar` 규칙 바로 아래 새 블록
- `docs/07-components.md` — "설치 유도 배너" 컴포넌트 등록 (리뷰 게이트 대응, [[project-design-docs-are-review-gate]] 참고)

## 1. HTML — `index.html`

`.container` 안, `#screen-list`의 `<footer class="cta-bar">` 바로 앞에 두 배너를 별도 엘리먼트로 삽입한다(동시에 뜨는 일이 없으므로 등록/수정 바텀시트가 같은 CSS 클래스를 공유하는 것과 같은 원칙으로 `.install-banner` 클래스를 공유):

```html
<div class="install-banner install-banner--hidden" id="install-banner-android" role="region" aria-label="홈 화면에 추가">
  <div class="install-banner-row">
    <p class="install-banner-text">홈 화면에 추가하고 앱처럼 빠르게 열어보세요</p>
    <button type="button" class="back-btn" id="btn-install-android-close" aria-label="닫기">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>
  <button type="button" class="cta-btn" id="btn-install-android">📲 홈 화면에 추가하기</button>
</div>

<div class="install-banner install-banner--hidden" id="install-banner-ios" role="region" aria-label="홈 화면에 추가 안내">
  <div class="install-banner-row">
    <p class="install-banner-text">공유 버튼을 누른 뒤 "홈 화면에 추가"를 선택하세요</p>
    <button type="button" class="back-btn" id="btn-install-ios-close" aria-label="닫기">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>
</div>
```

- Android 배너의 "홈 화면에 추가하기" 버튼은 새 스타일을 만들지 않고 기존 `.cta-btn`(주 버튼, `--accent` 오렌지 배경)을 그대로 사용한다 — 요청한 "오렌지색 버튼"과 정확히 일치.
- 닫기(X) 버튼은 기존 `.back-btn` 클래스를 그대로 재사용(다른 시트들의 닫기 버튼과 동일 패턴).
- 스크립트 태그는 `entries.js` 다음에 추가하고 `defer`/`async`를 붙이지 않는다 — `beforeinstallprompt` 리스너를 최대한 이른 시점에 등록해 이벤트를 놓치지 않기 위함(기존 `entries.js`/`supabase-client.js`도 동일하게 동기 로드).

```html
<script src="./assets/js/supabase-client.js"></script>
<script src="./assets/js/entries.js"></script>
<script src="./assets/js/install-banner.js"></script>
```

## 2. JS — `assets/js/install-banner.js` (신규 파일)

CLAUDE.md의 "기능별 파일 분리" 컨벤션을 따라 새 파일로 둔다. classic `<script>`라 `entries.js`와 전역 스코프를 공유하므로, 이 파일 안의 식별자가 `entries.js`의 기존 변수명과 겹치지 않도록 `install`/`Install` 접두사를 일관되게 쓴다.

```js
const INSTALL_BANNER_DISMISSED_KEY = 'holywin-install-banner-dismissed';

const androidBanner = document.getElementById('install-banner-android');
const btnInstallAndroid = document.getElementById('btn-install-android');
const btnInstallAndroidClose = document.getElementById('btn-install-android-close');
const iosBanner = document.getElementById('install-banner-ios');
const btnInstallIosClose = document.getElementById('btn-install-ios-close');

let deferredInstallPrompt = null;

function isStandaloneDisplay() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
function isInstallBannerDismissed() {
  try {
    return localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === '1';
  } catch (err) {
    return false; // 사파리 사생활 모드 등 localStorage 접근 불가 시 안전하게 배너를 보여주는 쪽으로 폴백
  }
}
function markInstallBannerDismissed() {
  try {
    localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, '1');
  } catch (err) {
    // 저장 실패해도 현재 세션에서 배너를 닫는 동작 자체는 계속 진행
  }
}

function hideAndroidInstallBanner() { androidBanner.classList.add('install-banner--hidden'); }
function hideIosInstallBanner() { iosBanner.classList.add('install-banner--hidden'); }

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // 브라우저 기본 미니 인포바 대신 이 배너로만 노출
  deferredInstallPrompt = event;
  if (isStandaloneDisplay() || isInstallBannerDismissed()) return;
  androidBanner.classList.remove('install-banner--hidden');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hideAndroidInstallBanner();
});

btnInstallAndroid.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  hideAndroidInstallBanner();
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});

btnInstallAndroidClose.addEventListener('click', () => {
  hideAndroidInstallBanner();
  markInstallBannerDismissed();
});

btnInstallIosClose.addEventListener('click', () => {
  hideIosInstallBanner();
  markInstallBannerDismissed();
});

if (!isStandaloneDisplay() && !isInstallBannerDismissed() && isIosDevice()) {
  iosBanner.classList.remove('install-banner--hidden');
}
```

닫기(X)는 두 배너 공통으로 `holywin-install-banner-dismissed` 플래그를 남겨 영구적으로 다시 뜨지 않게 한다(요청 스펙 그대로). `deferredInstallPrompt.prompt()`를 사용자가 취소해도 별도로 dismiss 플래그를 남기지 않는다 — 명시적으로 X를 눌러 닫았을 때만 영구 억제한다는 요청 의도를 따른 것.

## 3. CSS — `assets/css/entries.css`, `.cta-bar` 블록 바로 아래 추가

`.cta-bar`(z-index 30, 하단 고정)와 겹치지 않아야 하는데, 이미 `.list-scroll`이 `padding: 8px 24px calc(104px + env(safe-area-inset-bottom, 0px))`로 cta-bar를 피하려고 104px라는 실측 클리어런스 값을 쓰고 있다(코드 직접 확인). 새로 88px을 계산해 쓰는 대신 이미 검증된 이 값을 그대로 재사용한다.

```css
/* ---------- 설치 유도 배너 ---------- */
/* cta-bar(z-index 30, 하단 고정)와 겹치지 않도록, .list-scroll이 이미 같은 목적으로 쓰는
   104px 클리어런스 값을 그대로 재사용한다. sheet-backdrop(40)보다는 아래에 둬서 바텀시트가
   열리면 자연스럽게 그 뒤로 가려진다. */
.install-banner {
  position: fixed;
  left: 50%;
  bottom: calc(104px + env(safe-area-inset-bottom, 0px));
  z-index: 35;
  width: calc(100% - 32px);
  max-width: 398px; /* 430 - 32, cta-bar와 동일한 좌우 16px 여백 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: var(--card-muted);
  border: 1px solid var(--card-muted-line);
  border-radius: 16px;
  transform: translateX(-50%);
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.install-banner--hidden {
  opacity: 0;
  transform: translate(-50%, 8px);
  pointer-events: none;
}

.install-banner-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.install-banner-text {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}
```

새 색·모서리·그림자를 만들지 않는다 — `--card-muted`/`--card-muted-line`/`--muted`는 기존 토큰, 모서리 16px은 `docs/05-radius.md`의 공식 "카드" 값, 안쪽 여백 20px과 요소 간격 8px은 `docs/04-spacing.md`의 공식 스케일 값(새 예외 불필요), 그림자는 `docs/06-elevation.md`의 "화면에 붙어있는 요소는 그림자 없음, 절제 카드만 테두리로 구분" 원칙 그대로("가리는" 백드롭이 없는 배너이므로 절제 카드 취급이 맞음). `z-index: 35`는 기존 스택(30/40/50/70)과 충돌하지 않는 빈 값(코드 확인 완료).

## 4. `docs/07-components.md` 갱신 (같은 커밋 필수)

"채우는 칸" 코드 블록 끝(빈 상태 다음)에 아래 불릿 추가:

```
- 설치 유도 배너(install-banner) — 리스트 화면(#screen-list) 전용 PWA 홈 화면 추가 유도 오버레이. #screen-list 안쪽에 둬서 화면 전환(.screen--hidden) 시 함께 자동으로 숨겨진다(별도 JS 연동 없음). 카드와 같은 원칙(--card-muted 배경 + --card-muted-line 테두리 1px, 모서리 16px, 안쪽 여백 20px·요소 간격 8px, 그림자 없음 — 06번 "화면에 붙어있는 요소" 취급). 위치는 cta-bar와 같은 좌우 정렬로 화면 하단 고정(.list-scroll이 쓰는 104px 클리어런스 재사용), z-index는 cta-bar(30)보다 위·바텀시트(40)보다 아래인 35. 본문 문구 14px·--muted. 닫기 버튼은 back-btn 재사용. Android 배너의 액션 버튼은 기존 주 버튼(cta-btn)을 그대로 씀(새 버튼 스타일 없음), iOS 배너는 액션 버튼 없이 안내 문구만. 두 인스턴스(#install-banner-android/#install-banner-ios)가 install-banner 클래스를 공유하고 동시에는 하나만 노출됨(등록/수정 바텀시트가 sheet-backdrop/sheet-panel을 공유하는 것과 같은 원칙). localStorage(holywin-install-banner-dismissed)로 닫으면 영구 재노출 안 함
```

"프로젝트가 커지면 추가할 수 있는 컴포넌트" 목록에도 교차 참조 한 줄 추가:

```
- 설치 유도 배너 — install-banner로 구현됨(위 "채우는 칸" 참고)
```

## 5. 엣지 케이스 처리 방침

- **`beforeinstallprompt`가 늦게 도착**: 스크립트를 body 끝에서 동기 실행하고 `defer`/`async`를 붙이지 않아, 리스너가 이벤트보다 항상 먼저 등록된다.
- **이미 설치된 사용자가 브라우저 탭으로 재방문**: Chrome은 이미 설치된 PWA에 `beforeinstallprompt`를 재발생시키지 않으므로 Android 배너는 코드 없이 자연스럽게 안 뜬다. iOS는 애초에 설치 여부를 감지할 API가 없어, 사용자가 한 번 X로 닫으면 `localStorage` 플래그가 유일한 억제 수단 — 이미 요청 스펙과 일치.
- **iOS 비-Safari 브라우저(Chrome iOS 등)**: UA로 iOS 여부만 판별해 동일한 "공유 → 홈 화면에 추가" 문구를 보여준다. 모든 iOS 브라우저가 WebKit 기반이라 공유 시트에 "홈 화면에 추가"가 동일하게 존재하고, QR 스캔 유입은 대부분 기본 브라우저(Safari)로 열리므로 브라우저별 분기는 비용 대비 이득이 낮다.

## 검증 방법

- `node --check assets/js/install-banner.js`로 문법 확인.
- `python3 -m http.server 8080` 후 `localhost:8080/index.html`을 크롬 DevTools에서 열어:
  - DevTools 콘솔에서 `window.dispatchEvent(new Event('beforeinstallprompt'))`로는 실제 `prompt()`가 없는 목업 이벤트라 완전한 테스트는 안 되므로, Chrome의 "Application → Manifest" 패널에서 installability 체크와 실제 `beforeinstallprompt` 콘솔 로그(임시 `console.log` 추가 후 제거하거나 Network 조건 확인)로 이벤트 발생 자체를 확인.
  - DevTools의 기기 툴바로 iOS 화면 크기를 흉내 내고 `navigator.userAgent`를 iPhone으로 오버라이드해 iOS 배너가 뜨는지, 리스트 화면에서만 보이고 티켓 화면 전환 시 사라지는지 확인.
  - 닫기(X) 클릭 후 새로고침해도 배너가 다시 안 뜨는지, `localStorage.holywin-install-banner-dismissed` 값 확인.
  - `.cta-bar`의 두 버튼(전도 대상자 이름 올리기/QR 공유)과 배너가 겹치지 않는지 육안 확인.
- Chrome 확장(claude-in-chrome)이 연결돼 있다면 실제 스크린샷으로 배치를 확인하고, 연결 안 돼 있다면 로컬 서버 URL을 안내해 사용자가 직접 스크린샷으로 확인하도록 요청(이 프로젝트 관례 — [[user-screenshot-driven-iteration]]).
- 구현 완료 후 code-reviewer 서브에이전트 리뷰를 거쳐 APPROVED를 받은 뒤에만 커밋/푸시(이 리포의 확립된 워크플로우).
