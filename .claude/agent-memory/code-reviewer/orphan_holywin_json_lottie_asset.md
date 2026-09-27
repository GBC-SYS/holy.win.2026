---
name: orphan_holywin_json_lottie_asset
description: holywin(.json/_slim.json) Lottie 인트로 애니메이션 자산 — 2026-09-27 1차 BLOCKED(3MB+ 미참조 단일파일) → 2026-09-27 2차 사용자가 AskUserQuestion으로 "자산만 커밋(기능 미완성)" 명시 승인, holywin_slim.json+assets/imgs/intro/*.png로 슬림화. 로딩 코드 부재는 더 이상 blocking 사유 아님. 단, 슬림화 과정에서 생긴 asset 경로 불일치는 별도 이슈로 [[holywin_slim_asset_path_mismatch]] 참고
type: project
---

2026-09-27 오전: `assets/data/holywin.json`(3MB+, base64 PNG 내장 Lottie JSON, entries.js/html/css 어디서도 미참조)을 Major/BLOCKED 처리.

2026-09-27 오후: 사용자가 base64 내장 이미지를 빼고 외부 PNG로 분리한 `assets/data/holywin_slim.json`(4.8KB) + `assets/imgs/intro/01_Mask.png`~`06_Mask.png`(총 ~10MB)로 교체 제출. 로딩 코드(lottie-web 스크립트/fetch/렌더링)는 여전히 없음 — 이 부분은 AskUserQuestion을 통해 사용자가 "자산만 먼저 커밋, 로딩 코드는 나중에" 방침을 명시적으로 승인했으므로, 코드-리뷰어가 이 사실만으로 BLOCKED 처리하지 않고 Minor/참고로 남김. 파일 내용 자체(JSON 구조, PNG 6개)는 유효하고 악성 코드·시크릿 없음을 직접 확인(2차 리뷰에서 APPROVED 조건부).

**Why:** 사용자의 명시적 승인은 "로딩 코드 없음"이라는 범위에 한정된다 — 파일 내용 자체의 결함(예: 경로 불일치, 손상된 이미지, 악성 스크립트)까지 사전 승인한 것은 아니므로 그 부분은 별도로 계속 검증해야 한다.

**How to apply:** 다음 리뷰에서 "로딩 코드가 없다"는 이유만으로는 다시 BLOCKED 처리하지 말 것(이미 승인된 범위). 대신 (1) lottie-web 등 로딩 코드가 실제로 추가됐을 때 [[holywin_slim_asset_path_mismatch]]에 적힌 경로 불일치가 고쳐졌는지, (2) 새 이미지/데이터 파일이 추가될 때마다 내용 자체(유효성, 시크릿, 악성 스크립트)는 매번 새로 검증할 것.
