---
name: name-masking-display
description: 리스트 카드/티켓 상세/수정 폼 입력창까지 전도 대상자·제출자 이름을 전부 가운데 마스킹(maskName) 처리함(2026-10-03) — 수정 폼은 "마스킹 placeholder와 값이 같으면 원본으로 치환" 패턴으로 데이터 손실 없이 마스킹
metadata:
  type: project
  modified: 2026-10-03
---

`assets/js/entries.js`에 `maskName(name)` 유틸을 추가해 `createEntryCard`/`renderTicket`의 이름 표시 5곳(entry-from/entry-to/t-to/t-from/t-from2)을 모두 마스킹한다. 규칙: 1자는 그대로, 2자는 끝 글자만, 3자 이상은 첫/끝 글자를 남기고 가운데를 전부 `*`로 채운다(`홍*동`, `병**형`).

**수정 폼(`openEditForm`) 입력창도 마스킹 포함:** 처음엔 plan mode에서 "수정 폼 입력창은 원본 이름 유지"로 사용자 승인을 받고 구현했으나, 구현 후 사용자가 "수정할 때 입력필드에는 마스킹 처리가 안 되어 있다"며 문제로 지적해 결정이 뒤집혔다. 이후 입력창도 `maskName(entry.to/from)`으로 프리필하도록 바꿈.

**데이터 손실 위험과 해결:** `holywin_update_entry` RPC(0005_pin_ownership.sql)는 `new_to_name`/`new_from_name`을 항상 통째로 UPDATE하며 부분 수정(NULL=유지)을 지원하지 않는다. 입력창에 마스킹된 텍스트("병**형")를 그대로 뒀다가 사용자가 안 건드리고 제출하면 실명이 영구적으로 마스킹 문자열로 저장되는 사고가 난다. 이를 막기 위해 `handleEditFormSubmit`에서: 제출된 입력값이 `maskName(currentTicketEntry.to/from)`과 동일하면(=안 건드렸다는 뜻) `currentTicketEntry.to/from`(원본 실명)으로 되돌려서 RPC에 보낸다. 실제로 이름을 바꾸면(입력값이 마스킹 placeholder와 다름) 그 새 값이 그대로 저장된다. Supabase에 직접 SQL로 양쪽 경로(안 바꿈/바꿈) 모두 실측 검증 완료.

**Why:** 개인정보 보호 목적으로 화면에 이름이 노출되는 모든 지점을 마스킹해달라는 요청이었고, 수정 폼도 "이름이 들어가는 공간"에 포함된다는 게 최종 결정.

**How to apply:** 이름이 표시되는 새 위치를 추가할 때는 항상 `maskName()`을 통과시킬 것. 반대로 "원본 값이 필요한 로직"(예: RPC payload, 수정 안 했을 때의 폴백)에서는 `currentTicketEntry.to/from`처럼 entry 객체의 실제 필드를 써야 하며, 입력창의 `.value`를 마스킹 여부 확인 없이 그대로 신뢰하면 안 된다.

**한계:** 표시 단계 마스킹일 뿐 — `holywin_entries.to_name`/`from_name`은 DB에 평문 저장되고 네트워크 응답에도 실명이 그대로 담겨 온다([[pin-ownership-and-next-steps]] 참고). 서버 단 마스킹/컬럼 제한은 범위 밖.
