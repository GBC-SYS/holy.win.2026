# 리스트 헤더에 전도 대상자 총 갯수 노출

## Context

리스트 화면 헤더(검색 돋보기 아이콘, 새로고침 아이콘이 있는 `.header-actions` 영역)에, 현재 등록된 전도 대상자 전체 명단의 총 갯수를 볼 수 있는 표시가 없다. 사용자는 전도 대상자가 많아지면서 전체가 몇 명인지 한눈에 파악하고 싶어 하며, 스크린샷 기준으로 그 두 아이콘 버튼 오른쪽에 숫자를 노출하길 원한다.

이 총 갯수는 하단 `.count-chip`(현재 접속자 수, presence.js 기반 실시간 인원)과는 다른 개념 — **등록된 entries 배열의 전체 길이**다. 필터 탭("전체"/"기도 중"/"완료")이나 검색어와 무관하게 항상 전체 등록 건수를 보여줘야 하므로, `renderList()`의 필터링 전 원본 `entries.length`를 기준으로 삼는다.

## 변경 사항

**`index.html`** — `.header-actions` 안, 기존 두 버튼(`#btn-search-toggle`, `#btn-refresh`) 뒤에 배지 span을 추가한다(마크업 순서상 뒤에 와야 flex 상에서 오른쪽에 위치):

```html
<div class="header-actions">
  <button id="btn-search-toggle">...</button>
  <button id="btn-refresh">...</button>
  <span class="total-count-badge" id="total-count-text" aria-live="polite">총 0명</span>
</div>
```

**`assets/css/entries.css`** — `.header-actions` 규칙(entries.css:188) 근처에 `.total-count-badge` 스타일 추가. 기존 글래스 알약 톤(`.filter-tab`, `.back-btn`과 동일한 레시피: `var(--glass-sheen)` + `rgba(236, 231, 219, 0.6)` 배경, `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat))`, `border: 1px solid var(--glass-border)`, `color: var(--ink)`, `border-radius: 999px`)를 재사용해 새로운 색/질감을 만들지 않는다. `.filter-tab`보다 살짝 작은 패딩(예: `4px 12px`)과 `font-weight: 700`으로 아이콘 버튼(36px 원형)과 높이 균형을 맞춘다.

**`assets/js/entries.js`**:
1. DOM 참조 섹션(entries.js:16 부근, `btnSearchToggle` 옆)에 `const totalCountText = document.getElementById('total-count-text');` 추가.
2. `renderList()` 함수(entries.js:232) 맨 앞부분에서 필터링 전 `entries.length`로 배지 텍스트를 갱신: `totalCountText.textContent = \`총 ${entries.length}명\`;`. `renderList()`는 최초 로딩(`loadEntries()`), 새 등록(`entries.unshift`), 삭제(`entries.filter`), 새로고침 등 `entries` 배열이 바뀌는 모든 지점에서 이미 호출되고 있으므로(entries.js:318, 366, 429, 475, 482, 1001, 1011, 1020, 1175), 별도의 호출 지점을 추가하지 않고 기존 렌더 파이프라인에 올라타면 항상 동기화된다.

## 검증

1. `python3 -m http.server 8080`으로 로컬 서버를 띄우고 `http://localhost:8080/index.html` 접속.
2. 헤더의 검색/새로고침 아이콘 오른쪽에 "총 N명" 배지가 보이는지 확인 (N은 현재 entries.json 또는 Supabase 데이터 건수).
3. 명단 등록/삭제 후 숫자가 즉시 갱신되는지 확인.
4. "기도 중"/"완료" 필터 탭을 전환하거나 검색어를 입력해도 이 배지 숫자는 변하지 않아야 함(전체 건수 고정) — 리스트 카드 수만 줄어드는 것과 대비되는지 확인.
5. 모바일 폭(390px 전후)에서 제목(`전도 대상자`)·두 아이콘 버튼·배지가 한 줄에서 줄바꿈 없이 들어가는지 확인, 필요 시 배지 폰트 크기/패딩 축소.
