---
name: entries_js_xss_pattern
description: entries.js의 createEntryCard()는 2026-09-22 수정으로 innerHTML 템플릿 리터럴을 createElement/textContent로 교체함 — 향후 회귀(innerHTML 재도입) 여부와 entries.json 소스 전환 시점을 계속 추적할 것
metadata:
  type: project
---

`assets/js/entries.js`의 `createEntryCard()`는 과거 `entry.from`/`entry.to`/`entry.relation`/`entry.date`를 `btn.innerHTML = \`...\`` 템플릿 리터럴에 직접 삽입했으나(Major 이슈로 BLOCKED), **2026-09-22 수정에서 `document.createElement` + `.textContent` + `.append()`/`.appendChild()` 패턴으로 전량 교체됨**. `openTicket()`의 기존 `.textContent` 패턴과 스타일이 통일됨. 재검증 결과(2026-09-22) DOM 구조/클래스명(`entry-card`, `entry-card--dark`, `entry-top`, `entry-from`, `entry-to`, `entry-right`, `relation-tag`, `entry-date`)이 `assets/css/entries.css`와 일치함을 확인. 파일 내 남은 `innerHTML` 사용은 `listRecent.innerHTML = ''` / `listPast.innerHTML = ''`(목록 초기화용, 데이터 삽입 없음)뿐.

**Why:** 코드 내 주석(`btnAdd` 클릭 핸들러 근처)이 "실제 서비스에서는 이 버튼이 이름 제출 폼으로 이어집니다"라고 명시하고 있어, `entries.json`의 소스가 로컬 mock에서 실제 사용자 제출 폼(서버 API 응답)으로 바뀌는 것이 예정된 다음 단계다. 그때 데이터 삽입 부분이 다시 `innerHTML`로 회귀하면 저장형 XSS가 재발할 수 있다.

**How to apply:** 다음 리뷰에서 (1) `entries.js`에 새로운 `innerHTML` + 템플릿 리터럴 삽입이 재도입됐는지 확인 — 재도입 시 Critical, (2) `entries.json`의 데이터 소스가 서버 API나 사용자 입력 폼으로 바뀌었는지 확인 — 바뀌었다면 신규 렌더링 코드도 `textContent`/`createElement` 기반인지 반드시 확인할 것.
