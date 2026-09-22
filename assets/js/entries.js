// 전도대상자 QR 프로토타입 — mock entries.json을 읽어 리스트/티켓 화면을 렌더링합니다.

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
  right.appendChild(relation);

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
  ticketFields.status.textContent = entry.status;
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

// ============ 데이터 로딩 ============
fetch('./assets/data/entries.json')
  .then((res) => res.json())
  .then((data) => {
    entries = data?.entries ?? [];
    renderList();
  })
  .catch((err) => {
    console.error('mock 데이터를 불러오지 못했습니다.', err);
  });
