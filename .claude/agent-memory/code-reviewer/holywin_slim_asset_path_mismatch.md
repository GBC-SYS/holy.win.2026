---
name: holywin_slim_asset_path_mismatch
description: holywin_slim.json의 assets[].p/u 필드(긴 UUID 파일명, "images/" 접두)가 실제 커밋된 assets/imgs/intro/0N_Mask.png 파일명·경로와 다름 — 나중에 lottie-web 로딩 코드를 그대로 연결하면 이미지 404 발생. 2026-09-27 발견, Major이나 현재는 미참조라 비차단
type: project
---

`assets/data/holywin_slim.json`의 `assets` 배열은 각 이미지를 `{"p": "01_Mask_group_7bab7279-0783-4712-95b9-bdb2a542dc71.png", "u": "images/"}` 같은 긴 UUID 파일명 + `images/` 폴더 접두로 참조한다. 그런데 실제로 커밋된 파일은 `assets/imgs/intro/01_Mask.png`~`06_Mask.png`로, 폴더 경로도 파일명도 전혀 다르다(6개 PNG 모두 직접 열어 내용 확인 완료: 01=구리색 프레임 배경, 02=주황 거베라 꽃, 03=별 모양, 04="Holy·Win" 로고 텍스트, 05=세로형 그라데이션 배경, 06=구리색 프레임 배경2 — 손상되거나 악성인 파일 없음).

추가로 JSON의 `assets` 배열 index 0(`"download 3_...png"`, 1812×3221)과 index 1(`"Mask group_7bab7279...png"`, → 파일로는 `01_Mask.png`에 해당)은 `layers` 배열의 어떤 레이어에서도 `refId`로 참조되지 않는다 — Lottie 자체 기준으로도 죽은 자산 정의다. index 0은 대응 파일도 아예 없다(6개 PNG 중 어느 것도 "download"류 이름이 아님).

**Why:** Lottie(bodymovin) 표준 로더는 `assets[].u + assets[].p`를 그대로 이미지 URL로 사용해 fetch한다. 지금 이 값들을 고치지 않은 채 나중에 lottie-web 스크립트 태그 + `loadAnimation()` 코드를 그대로 추가하면, 브라우저는 `images/01_Mask_group_7bab7279-...png` 같은 존재하지 않는 경로를 요청해 인트로 애니메이션이 전부 깨진다. 현재는 이 JSON을 fetch/렌더링하는 코드가 전혀 없으므로(사용자가 승인한 "자산만 먼저 커밋" 상태, [[orphan_holywin_json_lottie_asset]] 참고) 지금 당장 사이트에 영향은 없다 — 그래서 Major이지만 비차단으로 분류했다.

**How to apply:** 이후 커밋에서 lottie-web 로딩 코드(`assets/js/intro.js` 같은 신규 파일 등)가 추가되는 것을 보면, 반드시 다음을 확인할 것 — (1) `holywin_slim.json`의 `assets[].p`가 실제 `assets/imgs/intro/0N_Mask.png` 파일명으로 갱신됐는지, 또는 로더 쪽에서 id→로컬 경로 매핑을 커스텀 처리하는지, (2) `assets[].u`가 `images/`가 아니라 `assets/imgs/intro/`를 가리키는지, (3) 미사용 asset index 0/1을 JSON에서 정리했는지(정리 안 해도 동작엔 지장 없지만 index 1의 파일(01_Mask.png)이 실제로 화면에 안 쓰이면서도 용량만 차지하는 죽은 자산이 됨). 이 세 가지가 안 맞은 채 로딩 코드만 추가된 채 커밋되면 그때는 Major/BLOCKED로 지적할 것(그때는 "미완성 자산 준비"가 아니라 "동작 안 하는 완성 기능"이 되기 때문).
