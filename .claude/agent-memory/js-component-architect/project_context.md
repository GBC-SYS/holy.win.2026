---
name: project_context
description: 홀리윈 2026 전도 명단 프로젝트의 JS 관련 기본 사실 — 유일한 JS 파일, 화면 구성, 데이터 스키마
type: project
metadata:
  type: project
---

- 이 프로젝트의 JS는 `assets/js/entries.js` 단 하나뿐이다 (2026-09-22 기준). `index.html`이 유일한 진입점이고 화면은 `#screen-list`(리스트) / `#screen-ticket`(티켓 상세) 두 개, `.screen--hidden` 클래스 토글로 전환한다.
- `assets/data/entries.json`은 `{ count, entries: [{ id, from, to, relation, date, status, group }] }` 형태. `group`은 `"recent"` | `"past"`만 존재하며 리스트 화면에서 각각 `#list-recent`/`#list-past`로 분리 렌더링된다 (recent → `entry-card` 라이트, past → `entry-card--dark`).
- 과거 코드 리뷰에서 `innerHTML` 사용이 Major 이슈로 지적되어 전량 `.textContent`/`document.createElement` 방식으로 수정된 전례가 있다 ([[feedback_entries_review]] 참고). 이후로는 안전한 용도(빈 문자열로 초기화 등)라도 `innerHTML`보다 `.replaceChildren()` 같은 DOM API를 우선한다.
- `.phone`(390×844 목업) 안에 리스트/티켓 두 화면이 모두 존재하는 단일 페이지 구조라 리스너 cleanup이 필요한 시점이 없다 — SPA 언마운트 개념 자체가 없음.
