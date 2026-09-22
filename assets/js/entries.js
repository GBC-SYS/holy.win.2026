// 전도대상자 QR 프로토타입 — Supabase(holywin_entries 테이블)에서 데이터를 읽어 리스트/티켓 화면을 렌더링합니다.

// ============ DOM 참조 — 리스트 화면 ============
const screenList = document.getElementById('screen-list');
const listRecent = document.getElementById('list-recent');
const listPast = document.getElementById('list-past');
const countText = document.getElementById('count-text');
const btnAdd = document.getElementById('btn-add');
const groupRecentEl = document.getElementById('group-recent');
const groupPastEl = document.getElementById('group-past');
const listEmptyEl = document.getElementById('list-empty');
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
  ticketFields.status.replaceChildren(createStatusBadge(entry));
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

// ============ 명단 등록 바텀시트 ============
// setScreen()의 list↔ticket 전환과는 별개의 메커니즘이다 — 바텀시트는 리스트
// 화면을 가리지 않고 그 위에 오버레이로 뜨므로, 백드롭/패널의 hidden 클래스만
// 토글한다.
function openEntryForm() {
  sheetBackdrop.classList.remove('sheet-backdrop--hidden');
  sheetPanel.classList.remove('sheet-panel--hidden');
  // 슬라이드 업 트랜지션(0.28s)이 끝난 뒤에 포커스를 줘서, 시트가 자리잡기 전에
  // 모바일 키보드가 먼저 튀어 올라와 화면이 들썩이는 것을 막는다.
  setTimeout(() => formFields.to.focus(), 280);
}

function closeEntryForm() {
  sheetBackdrop.classList.add('sheet-backdrop--hidden');
  sheetPanel.classList.add('sheet-panel--hidden');
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
}

function closeEditForm() {
  editSheetBackdrop.classList.add('sheet-backdrop--hidden');
  editSheetPanel.classList.add('sheet-panel--hidden');
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
window.supabaseReady
  .then((session) => {
    currentUserId = session?.user?.id ?? null;
    return window.supabaseClient
      .from('holywin_entries')
      .select('*')
      .order('submitted_at', { ascending: false });
  })
  .then(({ data, error }) => {
    if (error) {
      console.error('holywin_entries 데이터를 불러오지 못했습니다.', error);
      entries = [];
      renderList();
      return;
    }

    entries = (data ?? []).map(mapRowToEntry);
    renderList();
  })
  .catch((err) => {
    console.error('holywin_entries 데이터를 불러오지 못했습니다.', err);
    entries = [];
    renderList();
  });
