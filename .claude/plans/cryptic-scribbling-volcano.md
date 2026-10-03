# 이름 마스킹 (정규표현식 기반 가운데 글자 마스킹)

## Context

전도 대상자 이름과 제출자 이름이 리스트 카드·티켓 상세 화면에 평문으로 노출되고 있다. 개인정보 보호를 위해 "홍*동"처럼 가운데 글자를 `*`로 가려서 표시해야 한다. 한글 이름은 길이가 일정하지 않다(외자 포함 2자, 3자, "박선생님" 같은 4자 등) — 길이에 상관없이 동작하는 일반 규칙이 필요하다.

조사 결과 `assets/data/entries.json`은 Supabase 전환(`df1910d`) 이후 삭제되었고, 현재 이름은 `holywin_entries` 테이블에서 가져와 `mapRowToEntry()`(entries.js:1077)가 `entry.to`/`entry.from`으로 매핑한 뒤, 아래 두 함수에서 화면에 그려진다. 이름이 쓰이는 지점은 전부 `entries.js` 안에 있고, `index.html`에는 빈 컨테이너(`#t-to`, `#t-from`, `#t-from2`)만 있어 수정할 필요가 없다.

## 마스킹 규칙

- 길이 1(진짜 외자 한 글자): 가릴 "가운데"가 없으므로 그대로 둔다.
- 길이 2 (예: "민지"): 첫 글자만 남기고 끝 글자를 가린다 → `민*`
- 길이 3 이상 (예: "홍길동", "박선생님"): 첫 글자와 끝 글자만 남기고 가운데를 전부 `*`로 채운다 → `홍*동`, `박**님`

## 구현

**`assets/js/entries.js`** — `createEntryCard` 함수(135번 줄) 바로 위, "컴포넌트 팩토리" 주석 섹션 앞에 순수 유틸리티 함수 추가:

```js
// ============ 이름 마스킹 ============
// 2자는 가운데가 없어 끝 글자만, 3자 이상은 첫/끝 글자를 남기고 가운데를 전부 가린다.
function maskName(name) {
  if (!name || name.length <= 1) return name;
  if (name.length === 2) return name.replace(/^(.)(.)$/, '$1*');
  return name.replace(/^(.)(.*)(.)$/, (_, first, middle, last) => first + '*'.repeat(middle.length) + last);
}
```

적용 위치 (읽기 전용 표시 5곳 전부):

- `entries.js:146` `from.textContent = \`${entry.from} → 전도대상자\`;` → `maskName(entry.from)`
- `entries.js:149` `to.textContent = entry.to;` → `maskName(entry.to)`
- `entries.js:254` `ticketFields.to.textContent = entry.to;` → `maskName(entry.to)`
- `entries.js:255` `ticketFields.from.textContent = entry.from;` → `maskName(entry.from)`
- `entries.js:258` `ticketFields.from2.textContent = entry.from;` → `maskName(entry.from)`

**적용하지 않는 곳 (사용자 결정, 2026-10-03):** `openEditForm()`(entries.js:531-532)의 수정 폼 입력창(`editFormFields.to.value` / `editFormFields.from.value`)은 마스킹하지 않고 원본 이름 그대로 프리필한다. 마스킹된 텍스트가 그대로 재입력되어 실명이 `*`로 영구 저장되는 사고를 막기 위함.

## 한계 (사용자에게 설명 필요)

이건 **표시 단계(클라이언트 렌더링)에서만** 가리는 것이다. `holywin_entries` 테이블의 `to_name`/`from_name`은 여전히 평문으로 저장되고, Supabase `select` 응답(devtools 네트워크 탭 등)에는 실명 그대로 담겨 온다. 진짜 데이터 비노출이 필요하면 별도로 RLS/컬럼 마스킹(서버 단) 작업이 필요하며, 이번 작업 범위는 아니다.

## 검증

1. `python3 -m http.server 8080` 로 로컬 구동 후 `http://localhost:8080/index.html` 접속.
2. 리스트 화면에서 카드마다 "제출자 → 전도대상자"와 대상자 이름이 `민*`/`홍*동`/`박**님` 형태로 마스킹되는지 확인 (실제 DB 목데이터 "서연/병훈이형/예은/할머니/태윤" 기준으로 2~4자 혼합 확인).
3. 카드를 눌러 티켓 상세로 진입 → 상단 "~가 함께 기도하고 있어요"와 "제출자" 그리드 값, 대상자 이름(`t-to`) 모두 마스킹되는지 확인.
4. 연필 아이콘으로 수정 폼을 열어 입력창에 원본 이름(마스킹 안 됨)이 그대로 채워지는지 확인.
5. 브라우저 콘솔에 에러 없는지 확인.
