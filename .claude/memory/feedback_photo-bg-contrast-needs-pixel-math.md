---
name: feedback-photo-bg-contrast-needs-pixel-math
description: 사진 배경(list-bg.jpg) 위에 얹는 흰 텍스트의 WCAG 대비를 code-reviewer에게 보고할 때는 스크린샷 육안 확인이 아니라 실제 픽셀 합성 계산(320~430px 전 구간)을 근거로 제시해야 승인된다
metadata:
  name: feedback-photo-bg-contrast-needs-pixel-math
  type: feedback
---

`#screen-list`/`.ticket-hero`에 사진 배경(`assets/imgs/list-bg.jpg`) + 오렌지 틴트를 얹고 그 위에 흰 텍스트를 올리는 작업에서, code-reviewer가 "브라우저로 확인했고 텍스트가 잘 보였다"는 보고를 세 번 연속 BLOCKED로 되돌렸다(3차: 430px 캡 폭 1지점 육안 확인만 함 → 지적, 4차: 검증 폭이 여전히 1지점뿐이라 재지적). 다양한 폭(320~430px)에서 Python(PIL)으로 `background-size:cover`의 실제 크롭/스케일 수식을 재현하고, 텍스트 요소 각각의 실제 위치에 해당하는 사진 픽셀에 CSS 레이어 순서대로 알파 블렌딩을 적용해 WCAG 상대휘도 공식으로 worst-case 대비비를 계산해 수치로 제시하자 5차에서 APPROVED가 나왔다.

**Why:** 이 프로젝트의 `.container`는 `width:100%; max-width:430px`라서 실제 서비스되는 폭이 320~430px 사이로 계속 바뀌고, `list-bg.jpg`(720×1280)의 `background-size:cover center top` 크롭 결과는 뷰포트 폭에 따라 완전히 달라진다(폭이 좁을수록 사진의 더 아래쪽까지 노출됨). 특정 뷰포트 하나에서 스크린샷으로 "잘 보인다"고 확인한 것은 다른 폭에서의 대비를 전혀 보장하지 못한다 — 이 프로젝트에는 이런 사진+텍스트 오버레이 화면이 이미 2곳(`#screen-list` 헤더, `.ticket-hero`) 있고 앞으로 더 늘어날 수 있다.

**How to apply:** `list-bg.jpg` 위(또는 유사한 사진 배경 위)에 텍스트를 올리는 CSS를 바꿀 때는, code-reviewer를 부르기 전에 먼저:
1. 텍스트 요소의 실제 CSS 위치를 브라우저에서 `getBoundingClientRect()`로 얻고
2. `scale = max(box_w/img_w, box_h/img_h)`, `offset_x=(box_w-scaled_w)/2`, `offset_y=0`(top 정렬 시) 공식으로 각 텍스트 영역이 덮는 원본 이미지 픽셀 범위를 역산하고
3. 320/360/375/390/393/412/414/430 같은 대표 폭 집합 전체에 대해 반복하고
4. CSS의 실제 레이어 순서대로(사진→틴트→스크림→하이라이트 등) 알파 블렌딩한 뒤 WCAG 대비비를 계산해서
5. 텍스트의 실제 폰트 크기/굵기에 맞는 기준(대형+굵음 18.66px 이상=3:1, 그 외=4.5:1)을 만족하는지 확인한다.
스크린샷 육안 확인은 "명백히 잘못됐는지"를 잡는 보조 수단일 뿐, code-reviewer에게 제시할 근거로는 부족하다. [[project-list-bg-cover-crop-math]]에 이 계산에 쓰는 이미지 자체의 특성이 정리돼 있다.
