// 전도대상자 QR 프로토타입 — mock entries.json을 읽어 리스트/티켓 화면을 렌더링합니다.

const screenList = document.getElementById('screen-list');
const screenTicket = document.getElementById('screen-ticket');
const listRecent = document.getElementById('list-recent');
const listPast = document.getElementById('list-past');
const countText = document.getElementById('count-text');
const btnAdd = document.getElementById('btn-add');
const btnBack = document.getElementById('btn-back');

let entries = [];

function createEntryCard(entry, variant) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'entry-card' + (variant === 'dark' ? ' entry-card--dark' : '');

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

function renderList() {
  countText.textContent = `${entries.length}명`;

  listRecent.innerHTML = '';
  listPast.innerHTML = '';

  entries
    .filter((e) => e.group === 'recent')
    .forEach((e) => listRecent.appendChild(createEntryCard(e, 'light')));

  entries
    .filter((e) => e.group === 'past')
    .forEach((e) => listPast.appendChild(createEntryCard(e, 'dark')));
}

function openTicket(id) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  document.getElementById('t-to').textContent = entry.to;
  document.getElementById('t-from').textContent = entry.from;
  document.getElementById('t-relation').textContent = entry.relation;
  document.getElementById('t-date').textContent = entry.date;
  document.getElementById('t-from2').textContent = entry.from;
  document.getElementById('t-status').textContent = entry.status;

  screenList.classList.add('screen--hidden');
  screenTicket.classList.remove('screen--hidden');
}

function backToList() {
  screenTicket.classList.add('screen--hidden');
  screenList.classList.remove('screen--hidden');
}

btnBack.addEventListener('click', backToList);

// 실제 서비스에서는 이 버튼이 이름 제출 폼으로 이어집니다. (프로토타입에서는 자리만 잡아둠)
btnAdd.addEventListener('click', () => {
  alert('전도 대상자 이름 제출 폼으로 연결될 자리입니다.');
});

fetch('./assets/data/entries.json')
  .then((res) => res.json())
  .then((data) => {
    entries = data.entries;
    renderList();
  })
  .catch((err) => {
    console.error('mock 데이터를 불러오지 못했습니다.', err);
  });
