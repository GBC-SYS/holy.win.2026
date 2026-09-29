// 전도대상자 QR 프로토타입 — Supabase(holywin_entries 테이블)에서 데이터를 읽어 리스트/티켓 화면을 렌더링합니다.

// ============ DOM 참조 — 리스트 화면 ============
const screenList = document.getElementById('screen-list');
const listRecent = document.getElementById('list-recent');
const listPast = document.getElementById('list-past');
const countText = document.getElementById('count-text');
const btnAdd = document.getElementById('btn-add');
const btnRefresh = document.getElementById('btn-refresh');
const groupRecentEl = document.getElementById('group-recent');
const groupPastEl = document.getElementById('group-past');
const listEmptyEl = document.getElementById('list-empty');
const listSkeletonEl = document.getElementById('list-skeleton');
const listLoadingStatusEl = document.getElementById('list-loading-status');
const filterTabAll = document.getElementById('filter-tab-all');
const filterTabMine = document.getElementById('filter-tab-mine');

// ============ DOM 참조 — 티켓 상세 화면 ============
const screenTicket = document.getElementById('screen-ticket');
const btnBack = document.getElementById('btn-back');
const ticketFields = {
  to: document.getElementById('t-to'),
  from: document.getElementById('t-from'),
  relation: document.getElementById('t-relation'),
  date: document.getElementById('t-date'),
  from2: document.getElementById('t-from2'),
  status: document.getElementById('t-status'),
  stamp: document.getElementById('t-stamp'),
  stampStatus: document.getElementById('t-stamp-status'),
};

// ============ DOM 참조 — 등록 바텀시트 ============
const sheetBackdrop = document.getElementById('sheet-backdrop');
const sheetPanel = document.getElementById('sheet-panel');
const btnFormClose = document.getElementById('btn-form-close');
const entryForm = document.getElementById('entry-form');
const formFields = {
  to: document.getElementById('input-to-name'),
  from: document.getElementById('input-from-name'),
  relation: document.getElementById('input-relation'),
};

// ============ DOM 참조 — 수정 바텀시트 ============
const editSheetBackdrop = document.getElementById('edit-sheet-backdrop');
const editSheetPanel = document.getElementById('edit-sheet-panel');
const btnEditFormClose = document.getElementById('btn-edit-form-close');
const editEntryForm = document.getElementById('edit-entry-form');
const editFormFields = {
  to: document.getElementById('edit-input-to-name'),
  from: document.getElementById('edit-input-from-name'),
  relation: document.getElementById('edit-input-relation'),
};

// ============ DOM 참조 — QR 코드 공유 바텀시트 ============
const btnQrShare = document.getElementById('btn-qr-share');
const qrSheetBackdrop = document.getElementById('qr-sheet-backdrop');
const qrSheetPanel = document.getElementById('qr-sheet-panel');
const btnQrClose = document.getElementById('btn-qr-close');
const qrCanvas = document.getElementById('qr-canvas');
const qrUrlText = document.getElementById('qr-url-text');
const qrCaption = document.getElementById('qr-caption');
const qrCaptionDefaultText = qrCaption.textContent;
const btnQrSave = document.getElementById('btn-qr-save');
const btnQrInstall = document.getElementById('btn-qr-install');
const btnKakaoShare = document.getElementById('btn-kakao-share');

// ============ DOM 참조 — 인스타그램 스토리 공유 바텀시트 ============
const btnIgShare = document.getElementById('btn-ig-share');
const igSheetBackdrop = document.getElementById('ig-sheet-backdrop');
const igSheetPanel = document.getElementById('ig-sheet-panel');
const btnIgClose = document.getElementById('btn-ig-close');
const btnIgOpen = document.getElementById('btn-ig-open');
const igExampleCarousel = document.getElementById('ig-example-carousel');
const igExampleWrapper = document.getElementById('ig-example-wrapper');
const igExamplePrev = document.getElementById('ig-example-prev');
const igExampleNext = document.getElementById('ig-example-next');
const igLightboxBackdrop = document.getElementById('ig-lightbox-backdrop');
const igLightboxContent = document.getElementById('ig-lightbox-content');
const btnIgLightboxClose = document.getElementById('btn-ig-lightbox-close');

// ============ DOM 참조 — 티켓 소유자 액션(수정/삭제) ============
const ticketOwnerActions = document.getElementById('ticket-owner-actions');
const btnEditEntry = document.getElementById('btn-edit-entry');
const btnDeleteEntry = document.getElementById('btn-delete-entry');

// ============ DOM 참조 — 알림/확인 다이얼로그 ============
const dialogBackdrop = document.getElementById('dialog-backdrop');
const dialogPanel = document.getElementById('dialog-panel');
const dialogTitle = document.getElementById('dialog-title');
const dialogDescription = document.getElementById('dialog-description');
const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');

// ============ 상태 ============
let entries = [];
let currentUserId = null;
let listFilterMine = false;
let currentTicketEntry = null;

// ============ 상태값 ============
const STATUS_OPTIONS = ['기도 중', '완료'];

function cycleStatus(current) {
  const currentIndex = STATUS_OPTIONS.indexOf(current);
  const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
  return STATUS_OPTIONS[nextIndex];
}

// ============ 컴포넌트 팩토리 ============
function createEntryCard(entry, variant = 'light') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `entry-card${variant === 'dark' ? ' entry-card--dark' : ''}`;

  const top = document.createElement('div');
  top.className = 'entry-top';

  const left = document.createElement('div');
  const from = document.createElement('p');
  from.className = 'entry-from';
  from.textContent = `${entry.from} → 전도대상자`;
  const to = document.createElement('p');
  to.className = 'entry-to';
  to.textContent = entry.to;
  left.append(from, to);

  const right = document.createElement('div');
  right.className = 'entry-right';
  const relation = document.createElement('span');
  relation.className = 'relation-tag';
  relation.textContent = entry.relation;
  const status = document.createElement('span');
  status.className = `entry-status ${entry.status === '완료' ? 'entry-status--done' : 'entry-status--praying'}`;
  status.textContent = entry.status;
  right.append(relation, status);

  top.append(left, right);
  btn.appendChild(top);

  if (variant !== 'dark') {
    const date = document.createElement('p');
    date.className = 'entry-date';
    date.textContent = `${entry.date} 제출`;
    btn.appendChild(date);
  }

  btn.addEventListener('click', () => openTicket(entry.id));
  return btn;
}

function createStatusBadge(entry) {
  const isDone = entry.status === '완료';

  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = `status-badge ${isDone ? 'status-badge--done' : 'status-badge--praying'}`;
  badge.textContent = entry.status;
  badge.setAttribute('aria-label', `상태: ${entry.status}. 눌러서 변경`);

  badge.addEventListener('click', () => handleStatusToggle(entry));
  return badge;
}

// 상태 배지가 버튼이라는 것을 알려주는 말풍선 힌트. 배지 자체는 아이콘 없이 원래
// 모양 그대로 두고, 옆에 붙는 별도 요소로 안내만 더한다(클릭 대상은 배지만).
function createStatusHint() {
  const hint = document.createElement('span');
  hint.className = 'status-hint';
  hint.textContent = '눌러서 상태 변경';
  hint.setAttribute('aria-hidden', 'true');
  return hint;
}

// ============ 렌더링 ============
function renderList() {
  const source = listFilterMine ? entries.filter((entry) => entry.isMine) : entries;
  countText.textContent = `${source.length}명`;

  listRecent.replaceChildren();
  listPast.replaceChildren();

  source
    .filter((entry) => entry.group === 'recent')
    .forEach((entry) => listRecent.appendChild(createEntryCard(entry, 'light')));

  source
    .filter((entry) => entry.group === 'past')
    .forEach((entry) => listPast.appendChild(createEntryCard(entry, 'dark')));

  const isEmpty = listFilterMine && source.length === 0;
  groupRecentEl.classList.toggle('is-hidden', isEmpty);
  groupPastEl.classList.toggle('is-hidden', isEmpty);
  listEmptyEl.classList.toggle('is-hidden', !isEmpty);

  filterTabAll.classList.toggle('filter-tab--active', !listFilterMine);
  filterTabMine.classList.toggle('filter-tab--active', listFilterMine);
}

function renderTicket(entry) {
  currentTicketEntry = entry;
  ticketFields.to.textContent = entry.to;
  ticketFields.from.textContent = entry.from;
  ticketFields.relation.textContent = entry.relation;
  ticketFields.date.textContent = entry.date;
  ticketFields.from2.textContent = entry.from;
  ticketFields.status.replaceChildren(createStatusBadge(entry), createStatusHint());
  ticketFields.stamp.classList.toggle('stamp--done', entry.status === '완료');
  ticketFields.stampStatus.textContent = entry.status;
  ticketOwnerActions.classList.toggle('ticket-owner-actions--hidden', !entry.isMine);
}

// 상태 배지 클릭 시 진입점. Supabase에 UPDATE를 보내고, 실제로 반영된 행이
// 있는 경우에만(= 비관적 업데이트) entry.status를 갱신한 뒤 티켓 화면은
// renderTicket(entry)에, 리스트 화면은 renderList()에 위임해 두 화면 모두
// 같은 entry 객체를 바라보며 항상 동기화되도록 한다.
async function handleStatusToggle(entry) {
  const nextStatus = cycleStatus(entry.status);

  const { data, error } = await window.supabaseClient
    .from('holywin_entries')
    .update({ status: nextStatus })
    .eq('id', entry.id)
    .select();

  if (error) {
    console.error('상태 업데이트에 실패했습니다.', error);
    await showDialog({ description: '상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.' });
    return;
  }

  if (!data || data.length === 0) {
    // RLS의 using 절이 대상 행을 걸러내면 에러 없이 빈 배열만 돌아온다.
    // (예: 본인이 작성하지 않은 시드 데이터의 status는 변경할 수 없음)
    await showDialog({ description: '본인이 작성한 글만 상태를 변경할 수 있습니다.' });
    return;
  }

  entry.status = nextStatus;
  renderTicket(entry);
  renderList();
}

// 등록 폼 제출 진입점. Supabase에 INSERT를 보내고, 성공 시 반환된 행을
// mapRowToEntry로 변환해 entries 배열 맨 앞에 추가한 뒤 리스트 화면으로 복귀한다.
// owner_id/status/submitted_at은 DB 기본값(auth.uid()/'기도 중'/now())에 맡기고
// payload에 절대 포함하지 않는다.
async function handleEntryFormSubmit(event) {
  event.preventDefault();

  const toName = formFields.to.value.trim();
  const fromName = formFields.from.value.trim();
  const relation = formFields.relation.value.trim();

  if (!toName || !fromName || !relation) {
    await showDialog({ description: '모든 항목을 입력해주세요.' });
    return;
  }

  // 데이터 로딩과 달리 폼 제출은 페이지 진입 직후에도 일어날 수 있는 사용자
  // 액션이므로, 세션 초기화가 아직 끝나지 않았을 가능성을 방어적으로 기다린다.
  await window.supabaseReady;

  const { data, error } = await window.supabaseClient
    .from('holywin_entries')
    .insert({ to_name: toName, from_name: fromName, relation })
    .select();

  if (error) {
    console.error('전도 대상자 등록에 실패했습니다.', error);
    await showDialog({ description: '등록에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    return;
  }

  const [newRow] = data ?? [];
  if (newRow) {
    entries.unshift(mapRowToEntry(newRow));
    renderList();
  }

  entryForm.reset();
  closeEntryForm();
}

// 수정 폼 제출 진입점. handleStatusToggle과 동일한 방어 패턴(error/빈 배열/성공
// 세 갈래)을 따른다. owner_id는 payload에 포함하지 않는다 — .eq('id', ...)로
// 대상만 지정하고, 실제 소유권 판별은 RLS(using owner_id = auth.uid())에 맡긴다.
async function handleEditFormSubmit(event) {
  event.preventDefault();

  if (!currentTicketEntry) return;

  const toName = editFormFields.to.value.trim();
  const fromName = editFormFields.from.value.trim();
  const relation = editFormFields.relation.value.trim();

  if (!toName || !fromName || !relation) {
    await showDialog({ description: '모든 항목을 입력해주세요.' });
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('holywin_entries')
    .update({ to_name: toName, from_name: fromName, relation })
    .eq('id', currentTicketEntry.id)
    .select();

  if (error) {
    console.error('명단 수정에 실패했습니다.', error);
    await showDialog({ description: '수정하지 못했습니다. 잠시 후 다시 시도해주세요.' });
    return;
  }

  if (!data || data.length === 0) {
    await showDialog({ description: '본인이 작성한 글만 수정할 수 있습니다.' });
    return;
  }

  currentTicketEntry.to = toName;
  currentTicketEntry.from = fromName;
  currentTicketEntry.relation = relation;
  renderTicket(currentTicketEntry);
  renderList();
  closeEditForm();
}

// 삭제 버튼 진입점. 실제 SQL DELETE 권한이 없으므로(0001_init.sql 참고)
// deleted_at을 채우는 소프트 삭제를 실행한다.
//
// 일반 update()로는 안 된다: deleted_at을 null → 값 있음으로 바꾸는 순간
// 그 행이 SELECT 정책(using (deleted_at is null))을 더 이상 통과하지 못하고,
// PostgREST는 .select() 없이도 내부적으로 항상 RETURNING을 구성하기 때문에
// Postgres가 이를 조용히 생략하지 않고 42501(RLS 위반) 에러로 막아버린다
// (curl로 직접 재현해 확정 — relation 등 deleted_at을 안 건드리는 수정은
// 항상 성공했다). 그래서 RLS의 RETURNING 가시성 검사를 거치지 않는
// security definer RPC(holywin_soft_delete_entry, 0003_soft_delete_rpc.sql)를
// 대신 호출한다. 소유권 검증(owner_id = auth.uid())은 그 함수 내부에서
// 직접 수행되므로 안전하다.
async function handleDeleteEntry(entry) {
  const confirmed = await showDialog({
    title: '정말 삭제하시겠습니까?',
    description: '이 작업은 되돌릴 수 없습니다.',
    confirmText: '삭제',
    showCancel: true,
    danger: true,
  });
  if (!confirmed) return;

  const { data: deleted, error } = await window.supabaseClient.rpc(
    'holywin_soft_delete_entry',
    { entry_id: entry.id }
  );

  if (error) {
    console.error('명단 삭제에 실패했습니다.', error);
    await showDialog({ description: '삭제하지 못했습니다. 잠시 후 다시 시도해주세요.' });
    return;
  }

  if (!deleted) {
    await showDialog({ description: '본인이 작성한 글만 삭제할 수 있습니다.' });
    return;
  }

  entries = entries.filter((e) => e.id !== entry.id);
  backToList();
  renderList();
}

// ============ 리스트 필터(전체/내가 쓴 글) ============
function setListFilter(mine) {
  listFilterMine = mine;
  renderList();
}

// ============ 화면 전환 ============
function setScreen(activeScreen, inactiveScreen) {
  inactiveScreen.classList.add('screen--hidden');
  activeScreen.classList.remove('screen--hidden');
  window.scrollTo(0, 0);
}

function openTicket(id) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  renderTicket(entry);
  setScreen(screenTicket, screenList);
}

function backToList() {
  setScreen(screenList, screenTicket);
}

// ============ 바텀시트 스크롤 잠금 ============
// 시트가 리스트 화면 위에 오버레이로 뜨는 동안, 뒤에 깔린 문서가 같이 스크롤되면
// 시트는 그대로인데 배경만 밀려 올라가는 어색한 상태가 된다. 이 사이트는 .container에
// 별도 스크롤 박스가 없는 네이티브 문서 스크롤 구조라(CLAUDE.md 참고),
// document.scrollingElement가 body가 아니라 html이다 — 브라우저마다 실제 스크롤
// 컨테이너로 취급하는 요소가 갈릴 수 있어(html 단독으로는 일부 환경에서 휠 스크롤이
// 새어나감) html과 body 양쪽에 모두 overflow:hidden을 건다. 지금은 시트끼리
// 서로 배타적으로 열려(동시에 두 시트가 열리는 경로가 없음) 카운터가 1을 넘을 일이
// 없지만, boolean 대신 카운터로 짜두면 나중에 시트 위에 또 다른 잠금이 필요한
// 오버레이가 추가돼도 언밸런스한 open/close로 스크롤이 풀리지 않는다.
let sheetScrollLockCount = 0;

function lockBodyScroll() {
  sheetScrollLockCount += 1;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  sheetScrollLockCount = Math.max(0, sheetScrollLockCount - 1);
  if (sheetScrollLockCount === 0) {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}

// ============ 명단 등록 바텀시트 ============
// setScreen()의 list↔ticket 전환과는 별개의 메커니즘이다 — 바텀시트는 리스트
// 화면을 가리지 않고 그 위에 오버레이로 뜨므로, 백드롭/패널의 hidden 클래스만
// 토글한다.
function openEntryForm() {
  sheetBackdrop.classList.remove('sheet-backdrop--hidden');
  sheetPanel.classList.remove('sheet-panel--hidden');
  lockBodyScroll();
  // 슬라이드 업 트랜지션(0.28s)이 끝난 뒤에 포커스를 줘서, 시트가 자리잡기 전에
  // 모바일 키보드가 먼저 튀어 올라와 화면이 들썩이는 것을 막는다.
  setTimeout(() => formFields.to.focus(), 280);
}

function closeEntryForm() {
  sheetBackdrop.classList.add('sheet-backdrop--hidden');
  sheetPanel.classList.add('sheet-panel--hidden');
  unlockBodyScroll();
}

// ============ 명단 수정 바텀시트 ============
// 등록 바텀시트와 같은 오버레이 메커니즘을 그대로 재사용하는 두 번째 시트다.
// 열 때 현재 티켓(currentTicketEntry)의 값을 입력 필드에 미리 채워넣는다.
function openEditForm(entry) {
  editFormFields.to.value = entry.to;
  editFormFields.from.value = entry.from;
  editFormFields.relation.value = entry.relation;
  editSheetBackdrop.classList.remove('sheet-backdrop--hidden');
  editSheetPanel.classList.remove('sheet-panel--hidden');
  lockBodyScroll();
}

function closeEditForm() {
  editSheetBackdrop.classList.add('sheet-backdrop--hidden');
  editSheetPanel.classList.add('sheet-panel--hidden');
  unlockBodyScroll();
}

// ============ QR 코드 공유 바텀시트 ============
// 등록/수정 바텀시트와 같은 오버레이 메커니즘(백드롭/패널의 hidden 클래스 토글)을
// 그대로 재사용한다. window.location.href(로컬 개발 서버 주소 등)가 아니라 항상
// 배포된 GitHub Pages 주소를 인코딩한다 — 누가 QR을 찍어도 실제 서비스로 연결되도록.
const QR_SHARE_URL = 'https://gbc-sys.github.io/holy.win.2026/';

function openQrSheet() {
  const url = QR_SHARE_URL;
  qrUrlText.textContent = url;

  // qrcode.js는 CDN에서 로드되므로(사내망 차단/애드블록 등으로) 로드에 실패할 수
  // 있다. 그 경우 QRCode가 전역에 없어 바로 예외가 나므로, 시트는 정상적으로 열되
  // 빈 캔버스 대신 안내 문구로 바꿔서 "고장난 버튼"처럼 보이지 않게 한다.
  if (typeof QRCode === 'undefined') {
    console.error('QR 코드 라이브러리(qrcode.js)를 불러오지 못했습니다.');
    qrCaption.textContent = 'QR 코드를 불러오지 못했어요. 네트워크를 확인해주세요.';
  } else {
    qrCaption.textContent = qrCaptionDefaultText;
    QRCode.toCanvas(qrCanvas, url, { width: 220, margin: 1 }, (err) => {
      if (err) {
        console.error('QR 코드를 생성하지 못했습니다.', err);
        qrCaption.textContent = 'QR 코드를 불러오지 못했어요. 네트워크를 확인해주세요.';
      }
      // qrcode.js가 캔버스에 심는 인라인 width/height(px)를 지워, CSS의
      // width:100%/height:auto가 정사각형 비율을 그대로 유지하도록 한다.
      // (지우지 않으면 좁은 qr-card 안에서 폭만 줄어들고 높이는 220px로
      // 고정돼 QR이 세로로 눌린 직사각형으로 찌그러진다.)
      qrCanvas.style.removeProperty('width');
      qrCanvas.style.removeProperty('height');
    });
  }

  // install-prompt.js의 canPromptInstall() — 시트를 열 때마다 다시 확인한다. beforeinstallprompt가
  // 시트를 처음 연 뒤에야 도착했거나, appinstalled로 상태가 바뀌었을 수 있어서다.
  btnQrInstall.classList.toggle('is-hidden', !canPromptInstall());

  qrSheetBackdrop.classList.remove('sheet-backdrop--hidden');
  qrSheetPanel.classList.remove('sheet-panel--hidden');
  lockBodyScroll();
}

function closeQrSheet() {
  qrSheetBackdrop.classList.add('sheet-backdrop--hidden');
  qrSheetPanel.classList.add('sheet-panel--hidden');
  unlockBodyScroll();
}

// 캔버스를 PNG로 저장한다. canvas.toDataURL + <a download> 조합은 iOS Safari에서
// 다운로드로 이어지지 않고 새 탭 이동처럼 동작하는 경우가 있어 신뢰할 수 없다
// (알려진 플랫폼 제약). 그래서 파일 공유가 가능한 환경(iOS Safari 포함)에서는
// Web Share API를 우선 쓰고, 지원하지 않는 환경(대부분의 데스크톱 브라우저)에서만
// 기존 <a download> 방식으로 폴백한다.
function handleQrSave() {
  qrCanvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], 'holywin-qr.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'HOLY WIN 2026 QR' });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // 사용자가 공유 시트를 취소함
        console.error('QR 이미지 공유에 실패했습니다.', err);
      }
    }

    const link = document.createElement('a');
    link.href = qrCanvas.toDataURL('image/png');
    link.download = 'holywin-qr.png';
    link.click();
  }, 'image/png');
}

// 카카오톡 공유 버튼 — 아직 Kakao JavaScript SDK 앱 키가 없어(도메인 등록 필요)
// 실제 카카오톡 공유(Kakao.Share.sendDefault)는 붙이지 못했다. 키가 준비되면
// 이 핸들러만 SDK 호출로 교체하면 된다. 지금은 링크를 클립보드에 복사해서
// 사용자가 직접 카카오톡에 붙여넣도록 안내한다.
async function handleKakaoShare() {
  try {
    await navigator.clipboard.writeText(QR_SHARE_URL);
    showDialog({
      title: '링크가 복사되었어요',
      description: '카카오톡 채팅방에 붙여넣어 공유해보세요.',
    });
  } catch (err) {
    console.error('링크 복사에 실패했습니다.', err);
    showDialog({
      title: '링크 복사에 실패했어요',
      description: QR_SHARE_URL,
    });
  }
}

// ============ 인스타그램 스토리 공유 바텀시트 ============
// QR 공유 바텀시트와 같은 오버레이 메커니즘을 그대로 재사용한다. Instagram Stories
// Sharing API(대상 앱을 지정해 스토리 작성 화면으로 바로 넘기는 방식)는 iOS/Android
// 네이티브 앱 URL 스킴이 필요해 순수 웹에서는 호출할 수 없다 — 대신 계정 프로필
// 페이지로 이동시켜, 사용자가 이미 찍어둔 사진을 직접 스토리에 올리고 태그하도록 안내한다.
const IG_PROFILE_URL = 'https://www.instagram.com/gangchung_gbc';

function openIgSheet() {
  igSheetBackdrop.classList.remove('sheet-backdrop--hidden');
  igSheetPanel.classList.remove('sheet-panel--hidden');
  lockBodyScroll();
  // 캐러셀 타일 영상은 시트가 실제로 열릴 때만 재생한다 — 시트는 display:none이
  // 아니라 transform으로만 화면 밖에 있어(entries.css), 페이지 로드 시점부터
  // 재생을 걸어두면 시트를 열어본 적 없는 방문자에게도 영상이 통째로 받아진다.
  igExampleWrapper.querySelectorAll('video').forEach((video) => video.play().catch(() => {}));
}

function closeIgSheet() {
  igSheetBackdrop.classList.add('sheet-backdrop--hidden');
  igSheetPanel.classList.add('sheet-panel--hidden');
  unlockBodyScroll();
  igExampleWrapper.querySelectorAll('video').forEach((video) => video.pause());
}

function handleIgOpen() {
  window.open(IG_PROFILE_URL, '_blank', 'noopener');
}

// ============ 인스타그램 예시 캐러셀 + 라이트박스 ============
// "이렇게 찍어서 공유해주세요"의 예시 컷. assets/imgs/holywin_reference/의 실제
// 현장 사진 9장을 사용한다. 영상 예시가 추가되면 항목에 src 대신 video(영상 경로)를
// 채우면 카드와 라이트박스 모두 자동으로 영상으로 렌더링한다.
const IG_EXAMPLE_ITEMS = Array.from({ length: 9 }, (_, i) => ({
  type: 'image',
  src: `./assets/imgs/holywin_reference/holywin_reference${String(i + 1).padStart(2, '0')}.avif`,
  label: 'HolyWin POP-UP 현장',
}));
IG_EXAMPLE_ITEMS.splice(1, 0, {
  type: 'video',
  video: './assets/video/holywin_15s.mp4',
  label: 'HolyWin POP-UP 현장',
});

const IG_EXAMPLE_ICON = {
  image: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  video: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none"/></svg>',
};

const IG_PLAY_BADGE = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

function createExampleTile(item, index) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ig-example-tile';
  btn.dataset.index = String(index);

  if (item.src) {
    btn.classList.add('ig-example-tile--photo');
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.label;
    img.loading = 'lazy';
    btn.appendChild(img);
  } else if (item.video) {
    // 썸네일 자체가 무음으로 반복 재생되는 미리보기 — 탭하면 라이트박스에서
    // 소리 있는 원본이 다시 autoplay된다(openIgLightbox). 재생은 여기서 바로
    // 시작하지 않는다 — 이 슬라이드는 시트가 닫혀 있어도(transform으로만
    // 화면 밖에 있을 뿐 DOM에는 존재) 페이지 로드 시점에 만들어지므로, 여기서
    // play()를 걸면 시트를 열어본 적 없는 방문자에게도 영상이 재생·다운로드된다.
    // 실제 재생/정지는 openIgSheet/closeIgSheet가 담당한다.
    btn.classList.add('ig-example-tile--photo');
    btn.setAttribute('aria-label', item.label);
    const video = document.createElement('video');
    video.src = item.video;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    btn.appendChild(video);
  } else {
    const icon = document.createElement('span');
    icon.className = 'ig-example-icon';
    icon.innerHTML = IG_EXAMPLE_ICON[item.type];
    btn.appendChild(icon);

    const label = document.createElement('span');
    label.className = 'ig-example-label';
    label.textContent = item.label;
    btn.appendChild(label);
  }

  if (item.type === 'video') {
    const badge = document.createElement('span');
    badge.className = 'ig-example-badge';
    badge.innerHTML = IG_PLAY_BADGE;
    btn.appendChild(badge);
  }

  slide.appendChild(btn);
  return slide;
}

// Swiper 인스턴스는 슬라이드가 DOM에 이미 있어야 폭을 올바르게 계산하므로,
// replaceChildren으로 슬라이드를 먼저 채운 뒤에 생성한다. 이 시트는
// sheet-panel--hidden이어도 display:none이 아니라 transform으로만 화면 밖으로
// 밀려나 있어(entries.css) 페이지 로드 시점에 바로 만들어도 폭이 0으로 잡히지 않는다.
function renderExampleCarousel() {
  igExampleWrapper.replaceChildren(...IG_EXAMPLE_ITEMS.map(createExampleTile));

  if (typeof Swiper === 'undefined') {
    console.error('Swiper 라이브러리를 불러오지 못했습니다.');
    return;
  }

  new Swiper(igExampleCarousel, {
    slidesPerView: 'auto',
    slidesPerGroup: 4,
    spaceBetween: 8,
    freeMode: true,
    grabCursor: true,
    mousewheel: { forceToAxis: true },
    navigation: {
      nextEl: igExampleNext,
      prevEl: igExamplePrev,
    },
  });
}

function openIgLightbox(item) {
  igLightboxContent.replaceChildren();

  if (item.src) {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.label;
    igLightboxContent.appendChild(img);
  } else if (item.video) {
    const video = document.createElement('video');
    video.src = item.video;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    igLightboxContent.appendChild(video);
  } else {
    // 실제 파일이 아직 없는 자리표시 상태 — 타일과 같은 아이콘을 크게 보여준다.
    const icon = document.createElement('span');
    icon.className = 'ig-example-icon';
    icon.innerHTML = IG_EXAMPLE_ICON[item.type];
    igLightboxContent.appendChild(icon);
  }

  const label = document.createElement('span');
  label.className = 'ig-example-label';
  label.textContent = item.label;
  igLightboxContent.appendChild(label);

  igLightboxBackdrop.classList.remove('lightbox-backdrop--hidden');
  lockBodyScroll();
}

function closeIgLightbox() {
  igLightboxBackdrop.classList.add('lightbox-backdrop--hidden');
  unlockBodyScroll();
  // 영상이 재생 중이면 백드롭이 사라진 뒤에도 소리가 계속 나오지 않도록 정지한다.
  const video = igLightboxContent.querySelector('video');
  if (video) video.pause();
}

// ============ 알림/확인 다이얼로그 ============
// 바텀시트(sheet-backdrop/sheet-panel)와 완전히 별개의 오버레이다. 화면 중앙에
// fade+scale로 뜨고, 백드롭을 탭해도 닫히지 않는다 — 실수로 알림을 놓치지 않도록
// 반드시 확인/취소 버튼을 눌러야만 닫히는 shadcn AlertDialog의 설계를 그대로 따른다.
//
// 메시지마다 별도 컴포넌트를 만들지 않고, 하나의 다이얼로그를 매 호출마다 내용만
// 새로 채워 재사용한다. 클릭 리스너는 호출할 때마다 새로 추가되므로, 직전 호출의
// 리스너를 항상 먼저 제거한 뒤 새로 등록해 중복 resolve를 막는다.
let dialogConfirmHandler = null;
let dialogCancelHandler = null;

function showDialog({
  title = '',
  description = '',
  confirmText = '확인',
  showCancel = false,
  cancelText = '취소',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    dialogTitle.textContent = title;
    dialogDescription.textContent = description;
    dialogConfirmBtn.textContent = confirmText;
    dialogCancelBtn.textContent = cancelText;

    dialogConfirmBtn.className = `dialog-confirm-btn ${danger ? 'btn-danger' : 'cta-btn'}`;
    dialogCancelBtn.classList.toggle('is-hidden', !showCancel);

    if (dialogConfirmHandler) {
      dialogConfirmBtn.removeEventListener('click', dialogConfirmHandler);
    }
    if (dialogCancelHandler) {
      dialogCancelBtn.removeEventListener('click', dialogCancelHandler);
    }

    dialogConfirmHandler = () => {
      closeDialog();
      resolve(true);
    };
    dialogCancelHandler = () => {
      closeDialog();
      resolve(false);
    };

    dialogConfirmBtn.addEventListener('click', dialogConfirmHandler);
    dialogCancelBtn.addEventListener('click', dialogCancelHandler);

    dialogBackdrop.classList.remove('sheet-backdrop--hidden');
    dialogPanel.classList.remove('dialog-panel--hidden');
  });
}

function closeDialog() {
  dialogBackdrop.classList.add('sheet-backdrop--hidden');
  dialogPanel.classList.add('dialog-panel--hidden');
}

// ============ 이벤트 바인딩 ============
btnBack.addEventListener('click', backToList);

btnAdd.addEventListener('click', openEntryForm);

btnFormClose.addEventListener('click', closeEntryForm);

// 백드롭 자체(패널이 아닌 어두운 배경 부분)를 눌렀을 때만 닫는다.
sheetBackdrop.addEventListener('click', (event) => {
  if (event.target === sheetBackdrop) {
    closeEntryForm();
  }
});

entryForm.addEventListener('submit', handleEntryFormSubmit);

btnEditEntry.addEventListener('click', () => {
  if (currentTicketEntry) openEditForm(currentTicketEntry);
});

btnDeleteEntry.addEventListener('click', () => {
  if (currentTicketEntry) handleDeleteEntry(currentTicketEntry);
});

btnEditFormClose.addEventListener('click', closeEditForm);

editSheetBackdrop.addEventListener('click', (event) => {
  if (event.target === editSheetBackdrop) {
    closeEditForm();
  }
});

editEntryForm.addEventListener('submit', handleEditFormSubmit);

filterTabAll.addEventListener('click', () => setListFilter(false));
filterTabMine.addEventListener('click', () => setListFilter(true));

btnQrShare.addEventListener('click', openQrSheet);

btnQrClose.addEventListener('click', closeQrSheet);

qrSheetBackdrop.addEventListener('click', (event) => {
  if (event.target === qrSheetBackdrop) {
    closeQrSheet();
  }
});

btnQrSave.addEventListener('click', handleQrSave);

btnQrInstall.addEventListener('click', triggerInstallPrompt);

btnKakaoShare.addEventListener('click', handleKakaoShare);

btnIgShare.addEventListener('click', openIgSheet);

btnIgClose.addEventListener('click', closeIgSheet);

igSheetBackdrop.addEventListener('click', (event) => {
  if (event.target === igSheetBackdrop) {
    closeIgSheet();
  }
});

btnIgOpen.addEventListener('click', handleIgOpen);

renderExampleCarousel();

igExampleCarousel.addEventListener('click', (event) => {
  const tile = event.target.closest('.ig-example-tile');
  if (!tile) return;
  openIgLightbox(IG_EXAMPLE_ITEMS[Number(tile.dataset.index)]);
});

btnIgLightboxClose.addEventListener('click', closeIgLightbox);

igLightboxBackdrop.addEventListener('click', (event) => {
  if (event.target === igLightboxBackdrop) {
    closeIgLightbox();
  }
});

btnRefresh.addEventListener('click', async () => {
  if (btnRefresh.disabled) return;
  btnRefresh.disabled = true;
  btnRefresh.classList.add('is-spinning');
  await loadEntries();
  btnRefresh.classList.remove('is-spinning');
  btnRefresh.disabled = false;
});

// ============ Supabase row → entries.js 필드 매핑 ============
// createEntryCard/renderList/renderTicket 등 렌더링 함수들은 entry.to/from/relation/
// date/status/id/group 필드명을 그대로 기대한다. 그 함수들은 건드리지 않고, DB의
// to_name/from_name/submitted_at 등을 이 구조로 변환하는 어댑터만 데이터 로딩 단계에 둔다.
const RECENT_GROUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7일

// entries.json 원본이 쓰던 "연.월.일"(점 구분, 앞자리 0 없음) 포맷을 그대로 재현한다.
// toLocaleDateString 등은 로케일/브라우저에 따라 구분자가 달라질 수 있어 직접 조합한다.
function formatEntryDate(submittedAt) {
  const parsed = new Date(submittedAt);
  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  return `${year}.${month}.${day}`;
}

// group 컬럼은 DB에 없으므로, submitted_at이 현재 시각 기준 7일 이내인지로
// 클라이언트에서 파생 계산한다.
function resolveEntryGroup(submittedAt) {
  const elapsed = Date.now() - new Date(submittedAt).getTime();
  return elapsed <= RECENT_GROUP_WINDOW_MS ? 'recent' : 'past';
}

// currentUserId가 null인 극단적 케이스(익명 세션 발급 자체가 실패한 경우)에는
// 절대 "내 글"로 오판하지 않도록 currentUserId != null 조건을 함께 확인한다.
function mapRowToEntry(row) {
  return {
    id: row.id,
    to: row.to_name,
    from: row.from_name,
    relation: row.relation,
    status: row.status,
    date: formatEntryDate(row.submitted_at),
    group: resolveEntryGroup(row.submitted_at),
    ownerId: row.owner_id,
    isMine: currentUserId != null && row.owner_id === currentUserId,
  };
}

// ============ 데이터 로딩 ============
// group-recent/group-past 자리에 뜨는 skeleton 카드로 전환한다. renderList()가
// 끝나면 실제 상태(비어있음 포함)에 맞춰 이 is-hidden들을 다시 정확히 계산해
// 덮어쓰므로, 여기서는 로딩 중 화면만 신경 쓰면 된다.
function showListSkeleton() {
  listSkeletonEl.classList.remove('is-hidden');
  groupRecentEl.classList.add('is-hidden');
  groupPastEl.classList.add('is-hidden');
  listEmptyEl.classList.add('is-hidden');
  // 스켈레톤 자체는 장식용(aria-hidden)이라 스크린 리더가 읽지 않으므로,
  // 별도의 sr-only 상태 텍스트로 로딩 중임을 알린다.
  listLoadingStatusEl.textContent = '명단을 불러오는 중입니다';
}

function hideListSkeleton() {
  listSkeletonEl.classList.add('is-hidden');
  listLoadingStatusEl.textContent = '';
}

// 최초 로딩과 새로고침 버튼(btn-refresh)이 이 함수를 공유한다. 새로고침은
// btn-refresh 자체의 회전 아이콘(.is-spinning, entries.css)으로 이미 진행 중임을
// 알리고 있으므로, 화면에 아직 아무 카드도 없는 최초 로딩일 때만 스켈레톤을
// 띄운다 — 그렇지 않으면 새로고침을 누를 때마다 이미 떠 있던 카드들이 스켈레톤으로
// 지워졌다 다시 나타나는 플래시가 생긴다.
async function loadEntries() {
  const isInitialLoad = entries.length === 0;
  if (isInitialLoad) showListSkeleton();
  try {
    const session = await window.supabaseReady;
    currentUserId = session?.user?.id ?? null;

    const { data, error } = await window.supabaseClient
      .from('holywin_entries')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('holywin_entries 데이터를 불러오지 못했습니다.', error);
      entries = [];
    } else {
      entries = (data ?? []).map(mapRowToEntry);
    }
  } catch (err) {
    console.error('holywin_entries 데이터를 불러오지 못했습니다.', err);
    entries = [];
  }

  if (isInitialLoad) hideListSkeleton();
  renderList();
}

loadEntries();
