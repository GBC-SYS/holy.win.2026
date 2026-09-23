// QR 공유 시트의 "홈 화면에 추가" 버튼(entries.js의 #btn-qr-install)을 위한
// PWA 설치 감지/트리거 로직. entries.js보다 먼저 로드되어야 한다 — entries.js가 이
// 파일의 함수를 top-level에서 바로 참조하기 때문(스크립트 로드 순서 = 정의 순서).

let deferredInstallPrompt = null;

function isStandaloneDisplay() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// 이미 설치돼 있거나(standalone) 설치를 유도할 방법이 전혀 없으면(Android
// beforeinstallprompt 이벤트도 없고 iOS도 아님) false — 이 경우 버튼 자체를 숨긴다.
function canPromptInstall() {
  return !isStandaloneDisplay() && (deferredInstallPrompt != null || isIosDevice());
}

// Android는 네이티브 설치창을 띄우고, iOS는 프로그래밍적으로 트리거할 방법이 없어
// "공유 → 홈 화면에 추가" 안내를 entries.js의 showDialog()로 띄운다.
async function triggerInstallPrompt() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  if (isIosDevice()) {
    await showDialog({ description: '공유 버튼을 누른 뒤 "홈 화면에 추가"를 선택하세요.' });
  }
}

// 브라우저 기본 미니 인포바 대신 QR 시트의 버튼으로만 설치를 유도한다.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
});
