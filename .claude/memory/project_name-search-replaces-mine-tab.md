---
name: name-search-replaces-mine-tab
description: "내가 쓴 글" 필터 탭을 삭제하고 돋보기 아이콘 토글 검색바로 교체(2026-10-03) — 전도대상자/제출자 이름으로 검색, 상태 필터(전체/기도 중/완료)와 AND 결합
metadata:
  type: project
  modified: 2026-10-03
---

[[pin-ownership-and-next-steps]]에서 "다음 작업"으로 예정됐던 제출자 이름 검색을, 범위를 넓혀 전도대상자 이름까지 포함한 통합 검색으로 구현했다. `index.html` 헤더의 새로고침 버튼(`#btn-refresh`) 옆에 같은 `.back-btn` 스타일의 돋보기 아이콘(`#btn-search-toggle`)을 추가했고, 클릭 시 `#search-bar`(입력창 + X 지우기 버튼)가 토글된다. 닫을 때는 검색어도 같이 지운다(열림/닫힘 상태와 필터링 상태가 어긋나지 않도록).

`assets/js/entries.js`의 `renderList()`에서 상태 필터(`activeFilter`)로 먼저 거르고, 그 결과에 검색어(`searchQuery`, trim 후 `entry.to.includes(q) || entry.from.includes(q)`)를 AND로 추가 적용한다. 검색은 마스킹된 표시 문자열이 아니라 `entry.to`/`entry.from`(실제 원본 이름, [[name-masking-display]] 참고)을 대상으로 하므로, 화면엔 "병**형"처럼 보여도 "병훈"으로 검색하면 정상적으로 찾아진다.

**"내가 쓴 글" 제거에 따른 정리:** `filterTabMine` DOM 참조, `filter-tab-mine` 마크업, `getMyEntryIds`/`rememberMyEntryId`/`MY_ENTRY_IDS_KEY`(localStorage 기반) 함수, `mapRowToEntry`의 `isMine` 필드, `handleEntryFormSubmit`의 `rememberMyEntryId(data.id)` 호출을 모두 삭제했다. 더 이상 이 기능을 쓰는 곳이 없어서 통째로 제거(데드 코드 남기지 않음).

**Why:** 사용자가 "내가 쓴 글" 탭을 보고 "이거 삭제하고 검색으로 바꿔달라"고 직접 요청. [[pin-ownership-and-next-steps]]에서 이미 "내가 쓴 글"은 기기 로컬 한계가 있다고 설명·합의된 상태였어서, 이름 검색으로의 전환은 그 결정의 연장선.

**How to apply:** 새로운 필터/검색 조건을 추가할 때는 `renderList()`의 `statusFiltered` → `source` 파이프라인에 단계를 하나 더 끼워 넣는 패턴을 따를 것(AND 체이닝). 검색 관련 테스트 시 반드시 실제 `entry.to/from` 원본 문자열 기준으로 검증하고, 마스킹된 화면 텍스트로 검색어를 추측하지 말 것.
