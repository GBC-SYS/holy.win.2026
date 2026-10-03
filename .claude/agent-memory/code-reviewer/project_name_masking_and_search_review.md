---
name: project_name_masking_and_search_review
description: 이름 마스킹(maskName) + "내가 쓴 글" 탭을 이름 검색으로 교체한 기능 1차 리뷰(2026-10-03) BLOCKED → 2차 리뷰(같은 날) APPROVED(조건부)
metadata:
  type: project
---

2026-10-03 리뷰 대상: assets/js/entries.js(maskName 추가, 수정 폼 마스킹-되돌리기 로직, 검색바 로직), index.html(#btn-search-toggle/#search-bar 추가, filter-tab-mine 삭제), assets/css/entries.css(.search-bar* 추가).

**1차 판정: BLOCKED (Major 3건)**

1. **접근성 회귀 — `.search-bar-input:focus { outline: none; }`에 대체 포커스 표시 없음.** entries.css의 기존 `.form-input:focus`는 `outline: 2px solid var(--accent); outline-offset: 1px;`로 포커스를 항상 보여주는 게 이 프로젝트의 확립된 패턴인데, 새 검색창만 outline을 완전히 제거하고 대체 스타일을 넣지 않음 — 키보드 사용자가 검색창에 포커스됐는지 알 수 없음(WCAG 2.4.7 위반).
2. **데이터 무결성 — 마스킹-되돌리기 로직이 "부분 수정"을 못 구분함.** `toNameInput === maskName(currentTicketEntry.to) ? currentTicketEntry.to : toNameInput`는 전체 문자열 일치만 보므로, 사용자가 마스킹된 자리표시자(예: "홍**동", 중간 2글자가 `*`)의 일부만 고치고 나머지 `*`는 그대로 남겨두면("홍*동이" 중 한 글자만 고쳤는데 다른 자리의 `*`가 남는 식) 전체 일치가 깨져 "다르다"로 분류되고, 그 결과 **리터럴 `*` 문자가 포함된 이름이 그대로 DB에 영구 저장**된다. 이름 필드에 `*` 금지 검증도 없어 조용히 발생한다. 근본 원인은 입력창 value를 마스킹 문자열로 프리필한 것 자체 — placeholder/힌트 텍스트로 보여주고 value는 비워두는 방식(빈 채 제출 시 원본 유지)으로 바꾸면 이 위험이 구조적으로 사라진다.
3. **docs/07-components.md 드리프트.** 20번째 줄이 여전히 "전체/기도 중/완료/**내가 쓴 글** 4개가 한 줄"이라고 서술 — 실제론 3개 탭 + 별도 검색바로 바뀜(필터 탭 설명과 모순). 새로 추가된 `.search-bar` 컴포넌트도 07번 문서에 미등재.

**Minor(비차단):**
- entries.css 329행 주석 "'내가 쓴 글' 필터에 결과가 없을 때만 노출" — 이미 past-group 제거 때(2026-09-29) 한 번 고쳤던 문구인데 이번에 다시 stale해짐(그 필터 자체가 삭제됨).
- maskName 자체 또는 호출부 근처에 "이 마스킹은 클라이언트 표시용일 뿐, select 쿼리는 여전히 to_name/from_name 평문을 그대로 내려준다(진짜 접근제어 아님)"라는 주석이 없음 — 위협모델상 허용 가능하다고 판단했지만(공개 전도명단, RLS만 존재하는 정적사이트) 문서화는 안 돼 있음.
- 극단적 edge case: 사용자가 의도한 새 이름이 우연히 원본의 마스킹 패턴과 글자 단위로 완전히 동일한 경우(예: 실제로 `*`가 든 이름으로 바꾸길 원함) — 현실성 거의 없어 Minor로만 기록.

**확인된 양호한 부분:** `filterTabMine`/`isMine`/`getMyEntryIds`/`rememberMyEntryId`/`MY_ENTRY_IDS_KEY` 데드코드 전부 삭제 확인(grep으로 실제 코드 3파일에 잔존 없음 — 메모리/plans/docs 안의 과거 기록만 남음, 정상). 새 DOM id 4개(`btn-search-toggle`/`search-bar`/`input-search`/`btn-search-clear`) 중복 없음. 새 색상 토큰 추가 없이 기존 `--glass-*`/`--muted`/`--ink` 재사용(02번 색상표 위반 없음). `createEntryCard` 등 렌더링은 여전히 `textContent` 기반이라 XSS 회귀 없음. 검색은 상태 필터와 AND 결합되고 `entry.to`/`entry.from`(원본, 마스킹 전) 기준으로 동작해 요구사항과 일치. `holywin_update_entry` RPC가 전체 덮어쓰기 방식이라는 전제는 `supabase/migrations/0005_pin_ownership.sql` 실제 코드로 확인됨(부분 UPDATE 미지원 맞음).

**Why:** 사용자가 이름 마스킹 기능과 "내가 쓴 글"→검색 교체를 같은 세션에서 구현하고 리뷰 요청. 특히 "마스킹-되돌리기 로직의 엣지 케이스"를 명시적으로 짚어달라고 요청해서 나온 발견.

**How to apply:** 다음 라운드에서 (1) 포커스 아웃라인 복구 또는 대체 스타일 추가, (2) 수정 폼의 이름 입력을 "value 프리필" 대신 "placeholder/힌트 + 빈 값 제출 시 원본 유지"로 재설계(또는 최소한 `*` 포함 여부를 저장 전에 거부하는 가드 추가), (3) docs/07-components.md 20번째 줄 갱신 + `.search-bar` 컴포넌트 등재가 됐는지 확인할 것. 관련: [[entries_js_xss_pattern]](textContent 패턴 계속 유지되는지), [[project_pin_ownership_migration_review]](RPC 전체덮어쓰기 전제 재확인).

---

**2차 리뷰(2026-10-03, 같은 날 재검토): APPROVED(조건부).** Bash 없이 Read/Grep으로 `assets/js/entries.js`, `assets/css/entries.css`, `index.html`, `docs/07-components.md`를 직접 대조.

1. **포커스 아웃라인 — 해소 확인.** entries.css 272~278행에 `.search-bar:focus-within { outline: 2px solid var(--accent); outline-offset: 1px; }` 추가, `.search-bar-input:focus { outline: none; }`는 유지(중복 방지). `.form-input:focus`와 동일 색·두께 재사용 + 알약 부모 전체에 걸어 radius 999px와 충돌 없음. 문제 완전 해소.
2. **마스킹-되돌리기 데이터 무결성 — 해소 확인(구조적 수정).** `openEditForm`(555~566행)이 `editFormFields.to.value = ''`로 비우고 `placeholder = 비워두면 유지: ${maskName(entry.to)}`만 세팅(from도 동일). `handleEditFormSubmit`(376~431행)은 `toNameInput === '' ? currentTicketEntry.to : toNameInput`로 분기(trim 후 공백만 입력해도 빈 문자열이 되어 "유지"로 처리됨 — placeholder 안내와 일관되고 합리적인 엣지케이스 처리). 입력창에 마스킹 문자열이 애초에 존재하지 않으므로 "부분 수정으로 리터럴 `*` 저장" 경로 자체가 구조적으로 불가능해짐 — 1차 지적 완전 해소. `index.html`에서 `#edit-input-to-name`/`#edit-input-from-name`의 `required` 속성 제거도 확인(251/255행), JS 폴백이 항상 비어있지 않은 값을 보장하므로 네이티브 required 제거가 제출 로직에 부작용 없음.
3. **docs/07-components.md 드리프트 — 지적한 부분은 해소, 그러나 같은 수정이 새 드리프트를 하나 만듦.** 20번째 줄 "전체/기도 중/완료 3개"로 수정 확인 + 21번째 줄에 `.search-bar` 컴포넌트 설명(글래스 알약, 토글, AND 결합, focus-within 아웃라인) 신규 등재 확인. **다만** 같은 파일 13번째 줄 "입력창(form-input)" 설명이 여전히 "등록 바텀시트와 수정 바텀시트 둘 다에 적용됨(두 폼 모두 4개 필드 전부 필수)"라고 서술 — 이번 수정으로 수정 폼의 이름 2개 필드는 HTML `required` 속성이 빠졌으므로(실제 필수 여부를 "input의 required 속성이 담당"한다는 같은 줄의 설명과도 모순) 더 이상 정확하지 않음. Minor로 하향(기능적 영향 없음, 결과값은 JS 폴백으로 항상 비어있지 않게 보장됨) — 다음 라운드에서 13번째 줄에 "수정 폼의 이름 필드는 빈 제출=원본유지 방식이라 HTML required 없음" 식의 각주 추가 권장.

**추가 확인된 양호한 부분:** maskName 함수 주석(136~140행)에 "표시 단계에서만 가리고 네트워크 응답/검색은 원본" 위협모델 설명 추가 확인(1차 Minor 해소). `.list-empty` 주석(entries.css 337행)도 "현재 상태 필터+검색어 조건"으로 갱신 확인(1차 Minor 해소). `openEditForm` 재호출 경로나 제출 실패 시 재오픈 등 다른 곳에서 `.value`에 마스킹 문자열을 세팅하는 코드는 grep으로 없음을 확인(새 엣지케이스 없음).

**남은 Minor(비차단):** docs/07-components.md 13번째 줄의 "두 폼 모두 4개 필드 전부 필수" 서술이 이번 수정으로 부분적으로 stale해짐(위 3번 참고). `.required-mark` 장식(빨간 점)을 required 없는 필드에도 그대로 남겨둔 것은 "결과적으로 항상 비어있지 않은 값이 보장된다"는 논리로는 일관되나, 사용자에게는 "필수 같지만 비워도 된다"는 미묘한 신호 불일치가 있음 — 디자인 판단으로 수용 가능.
