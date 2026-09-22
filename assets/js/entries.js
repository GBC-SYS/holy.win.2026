// 전도대상자 QR 프로토타입 — Supabase(holywin_entries 테이블)에서 데이터를 읽어 리스트/티켓 화면을 렌더링합니다.

// ============ DOM 참조 — 리스트 화면 ============
const screenList = document.getElementById('screen-list');
const listRecent = document.getElementById('list-recent');
const listPast = document.getElementById('list-past');
const countText = document.getElementById('count-text');
const btnAdd = document.getElementById('btn-add');
const phoneEl = document.querySelector('.phone');
const headerEl = document.querySelector('.header');
const listScrollEl = document.querySelector('.list-scroll');

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

// ============ 레이아웃 동기화 ============
// CTA 버튼이 뷰포트에 따라 화면 밖으로 밀려나는 것을 막기 위해
// .list-scroll의 실제 스크롤 가능 높이를 인라인으로 계산해둔다.
function syncListScrollMaxHeight() {
  const phoneHeight = phoneEl.getBoundingClientRect().height;
  const headerHeight = headerEl.getBoundingClientRect().height;
  listScrollEl.style.maxHeight = `${phoneHeight - headerHeight}px`;
}

syncListScrollMaxHeight();
window.addEventListener('resize', syncListScrollMaxHeight);

// ============ 상태 ============
let entries = [];

// ============ 상태값 & localStorage 영속성 ============
const STATUS_OPTIONS = ['기도 중', '완료'];
const STATUS_STORAGE_KEY = 'holywin:status-overrides';

function cycleStatus(current) {
  const currentIndex = STATUS_OPTIONS.indexOf(current);
  const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
  return STATUS_OPTIONS[nextIndex];
}

function getStatusOverrides() {
  const raw = localStorage.getItem(STATUS_STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('상태 오버레이 데이터가 손상되어 초기화합니다.', err);
    localStorage.removeItem(STATUS_STORAGE_KEY);
    return {};
  }
}

function saveStatusOverride(id, status) {
  const overrides = getStatusOverrides();
  overrides[id] = status;
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(overrides));
}

// entries.json 원본은 건드리지 않고, id 기준으로 저장된 상태 오버레이를 메모리 상에서만 병합한다.
// 동시에 현재 entries에 없는 id의 오버레이(고아 키)는 정리해 다시 저장한다.
function applyStatusOverrides(loadedEntries) {
  const overrides = getStatusOverrides();
  const validIds = new Set(loadedEntries.map((entry) => entry.id));

  loadedEntries.forEach((entry) => {
    if (overrides[entry.id]) {
      entry.status = overrides[entry.id];
    }
  });

  const prunedOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([id]) => validIds.has(Number(id)))
  );
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(prunedOverrides));

  return loadedEntries;
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
  countText.textContent = `${entries.length}명`;

  listRecent.replaceChildren();
  listPast.replaceChildren();

  entries
    .filter((entry) => entry.group === 'recent')
    .forEach((entry) => listRecent.appendChild(createEntryCard(entry, 'light')));

  entries
    .filter((entry) => entry.group === 'past')
    .forEach((entry) => listPast.appendChild(createEntryCard(entry, 'dark')));
}

function renderTicket(entry) {
  ticketFields.to.textContent = entry.to;
  ticketFields.from.textContent = entry.from;
  ticketFields.relation.textContent = entry.relation;
  ticketFields.date.textContent = entry.date;
  ticketFields.from2.textContent = entry.from;
  ticketFields.status.replaceChildren(createStatusBadge(entry));
  ticketFields.stamp.classList.toggle('stamp--done', entry.status === '완료');
  ticketFields.stampStatus.textContent = entry.status;
}

// 상태 배지 클릭 시 진입점. entry.status를 갱신하고 저장한 뒤,
// 티켓 화면은 renderTicket(entry)에, 리스트 화면은 renderList()에 위임해
// 두 화면 모두 같은 entry 객체를 바라보며 항상 동기화되도록 한다.
function handleStatusToggle(entry) {
  entry.status = cycleStatus(entry.status);
  saveStatusOverride(entry.id, entry.status);
  renderTicket(entry);
  renderList();
}

// ============ 화면 전환 ============
function setScreen(activeScreen, inactiveScreen) {
  inactiveScreen.classList.add('screen--hidden');
  activeScreen.classList.remove('screen--hidden');
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

// ============ 이벤트 바인딩 ============
btnBack.addEventListener('click', backToList);

// 실제 서비스에서는 이 버튼이 이름 제출 폼으로 이어집니다. (프로토타입에서는 자리만 잡아둠)
btnAdd.addEventListener('click', () => {
  alert('전도 대상자 이름 제출 폼으로 연결될 자리입니다.');
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

function mapRowToEntry(row) {
  return {
    id: row.id,
    to: row.to_name,
    from: row.from_name,
    relation: row.relation,
    status: row.status,
    date: formatEntryDate(row.submitted_at),
    group: resolveEntryGroup(row.submitted_at),
  };
}

// ============ 데이터 로딩 ============
window.supabaseReady
  .then(() =>
    window.supabaseClient
      .from('holywin_entries')
      .select('*')
      .order('submitted_at', { ascending: false })
  )
  .then(({ data, error }) => {
    if (error) {
      console.error('holywin_entries 데이터를 불러오지 못했습니다.', error);
      entries = [];
      renderList();
      return;
    }

    entries = applyStatusOverrides((data ?? []).map(mapRowToEntry));
    renderList();
  })
  .catch((err) => {
    console.error('holywin_entries 데이터를 불러오지 못했습니다.', err);
    entries = [];
    renderList();
  });
