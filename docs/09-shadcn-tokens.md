# 09. CSS 변수 토큰 — 코드로 내보내는 칸

02~07에서 정한 값을 **코드가 읽는 형태**로 옮기는 파일.
변수 이름은 shadcn/ui 규약을 그대로 따르므로, shadcn을 쓰든 안 쓰든 그대로 사용 가능하다.

> 값은 비어 있다. 02~07에서 정한 값을 그대로 옮겨 적는다. 여기서 새 값을 만들지 않는다.

## 변수 이름 읽는 법

| 이름 규칙 | 뜻 |
|---|---|
| `--이름` | 그 요소의 **배경**색 |
| `--이름-foreground` | 그 배경 **위에 얹는 글자**색 |

`--primary`와 `--primary-foreground`는 항상 짝. 배경을 바꾸면 그 위 글자색도 함께 확인해야 한다.

## 어느 변수에 무엇을 넣나

| 변수 | 02~07의 어느 값 |
|---|---|
| `--background` / `--foreground` | 바탕 / 글자 기본 |
| `--card`, `--popover` | 표면 |
| `--primary` | 포인트 색 |
| `--primary-foreground` | 포인트 색 위에서 4.5:1이 나오는 색 |
| `--secondary`, `--accent`, `--muted` | 포인트 색 옅은 것, 또는 표면보다 한 단계 들어간 무채색 |
| `--muted-foreground` | 글자 보조 |
| `--border`, `--input` | 테두리 |
| `--ring` | 포커스 링 — 포인트 색 또는 테두리보다 진한 무채색 |
| `--destructive` | 위험(삭제) 색 — 7개 색 밖의 예외 |
| `--radius` | 05번 기준값 |
| `--chart-*` | 차트 계열색. 대시보드가 없으면 통째로 삭제 |
| `--sidebar-*` | 사이드바 전용. 사이드바가 없으면 통째로 삭제 |

## 채우는 칸

```css
:root {
  --radius: 16px;

  --background: #f3efe6;
  --foreground: #141413;

  --card: #ece7db;
  --card-foreground: #141413;

  --popover: #ece7db;
  --popover-foreground: #141413;

  --primary: #e8622c;
  --primary-foreground: #141413;

  --secondary: #ddd6c5;
  --secondary-foreground: #6e6b64;

  --muted: #ece7db;
  --muted-foreground: #6e6b64;

  --accent: #fceae0;
  --accent-foreground: #e8622c;

  --destructive: #dc2626;
  --destructive-foreground: #ffffff;

  --success: #e3f5e6;
  --success-foreground: #1f7a37;

  --border: #e6e1d5;
  --input: #e6e1d5;
  --ring: #e8622c;
}
```

01번에서 테마를 light 하나로 정했으므로 `.dark` 블록은 만들지 않는다 — 위 `:root` 값 자체가 이 프로젝트의 유일한(라이트) 테마다. `--chart-*`, `--sidebar-*` 블록도 대시보드·사이드바가 없어 삭제했다.

**참고:**
- `--muted`은 `--card`와 같은 값(#ece7db)을 공유한다 — 이 프로젝트에는 카드 표면과 별도의 옅은 배경이 아직 없기 때문이다. 필요해지면 그때 분리한다.
- `--muted-foreground`(#6e6b64)는 02번에서 라이트 배경 대비 4.5:1을 맞추기 위해 다크 테마 값(#8a8783)보다 어둡게 조정한 값과 같다.
- `--destructive`는 실제로 쓰인다 — 티켓 상세 화면의 위험 버튼(`.btn-danger`, "삭제")이 `entries.css`의 `--destructive`(#dc2626, 배경)/`--destructive-foreground`(#ffffff, 글자)로 구현되어 있다. 대비 4.83:1(02번 "코드에 남아있는 추가 색" 표 참고)로 4.5:1 기준을 통과하며, 삭제는 `showDialog()` 커스텀 다이얼로그(백드롭 탭으로 안 닫힘) 확인 단계를 거친 뒤에만 실행된다. 02번 7색 밖의 예외로 취급되는 것은 동일하다.
- `--success`/`--success-foreground`는 `--destructive`와 달리 실제로 쓰인다 — 티켓 상세 화면과 리스트 카드의 상태 배지(`.status-badge--done`/`.entry-status--done`, "완료")가 `entries.css`의 `--success`(#1f7a37, 글자)/`--success-soft`(#e3f5e6, 배경)로 구현되어 있다. 여기서는 shadcn 명명 규칙(`--이름`=배경, `--이름-foreground`=글자)을 따르므로 순서가 반대로 매핑된다: `--success`(배경 #e3f5e6) / `--success-foreground`(글자 #1f7a37). 02번 "상태 색은 7색 밖 예외(최대 3색)" 조항의 1번째 색이며, 경고/오류 색은 아직 추가하지 않았다.
- `--primary-foreground`(#141413)는 `.cta-btn { color: var(--ink) }`의 실측값과 일치한다.

## 모서리 파생값 (05번 방식 2를 골랐다면)

기준값 하나만 채우면 나머지는 자동으로 따라온다. **파생값을 개별로 덮어쓰지 않는다.**

```css
--radius:    16px;                        /* 기준값 — 여기만 바꾼다 */
--radius-sm: calc(var(--radius) - 4px);   /* 12px — 배지, 체크박스 (현재 배지·칩은 999 고정 사용, 예비값) */
--radius-md: calc(var(--radius) - 2px);   /* 14px — 버튼, 입력창 (cta-btn 실측값과 일치) */
--radius-lg: var(--radius);               /* 16px — 카드, 다이얼로그 (entry-card 실측값과 일치) */
--radius-xl: calc(var(--radius) + 8px);   /* 24px — 큰 컨테이너, 모달 (파생값 기준) */
```

`.container`/`.ticket-wrap`의 `border-radius`(32px)는 `--radius-xl`(24px 파생값)보다 크게 잡은 의도적 예외값이다. `.ticket-hero`(티켓 화면의 주황 상단 카드)는 `28px`로 또 다른 예외값을 쓴다 — `.topbar` 자신은 더 이상 별도의 `border-radius`를 갖지 않는다(부모 `.ticket-hero`가 모서리를 담당). 자세한 배경은 05번 참고.

## 색 표기 — HEX와 OKLCH 중 하나로 통일

**OKLCH를 권장하는 이유:** 밝기(L)를 고정한 채 색상 각도만 바꿔도 눈에 보이는 명도가 일정하게 유지된다.
포인트 색만 갈아끼워 같은 시스템을 여러 브랜드에 재사용할 때 특히 유리하다.

```css
/* oklch(밝기 채도 색상각도) — 참고용 예시, 이 프로젝트는 아래 이유로 채우지 않음 */
--primary: oklch(____ ____ ____);
```

**이 프로젝트는 HEX로 통일한다.** 이미 `entries.css`가 HEX로 작성되어 있고, 포인트 색을 여러 브랜드에 재사용할 계획이 없어 OKLCH의 이점(명도 유지)이 필요하지 않다. 위 OKLCH 블록은 다른 프로젝트에서 이 킷을 재사용할 때를 위한 참고 예시로만 남겨둔다.

- **HEX로 갈 경우:** 디자인 툴에서 바로 집어올 수 있지만, 포인트 색을 바꿀 때 명도를 매번 눈으로 맞춰야 한다
- 한 프로젝트 안에서 두 표기를 **섞지 않는다**

## 값을 채울 때 순서

1. `--background` / `--foreground` — 나머지 명도의 기준
2. `--card` — 바탕과의 명도 차를 02번 기준대로
3. `--border` — 바탕과 글자 보조 사이
4. `--primary` / `--primary-foreground` — 짝으로 함께
5. `--muted` / `--muted-foreground` — 옅은 배경과 보조 글자
6. `--destructive` — 위험 신호는 대부분 빨강 계열을 유지하는 편이 안전
7. 안 쓰는 블록(`--chart-*`, `--sidebar-*`, `.dark`) 삭제

## 다크를 함께 쓸 경우

- 라이트 값을 **그대로 반전시키지 않는다.** 반전하면 포인트 색이 탁해진다 — `--primary`는 명도를 올려 따로 정할 것
- 바탕은 **순수 검정을 피한다.** 글자와 대비가 과해 눈이 피로해짐
- 다크에서는 그림자가 거의 안 보이므로, 테두리(`--border`)를 반투명 흰색 계열로 두는 방식이 흔히 쓰인다

## 체크리스트
- [ ] 02~07에서 정한 값만 옮겼는가 (여기서 새 값을 만들지 않았는가)
- [ ] 모든 `--이름` / `--이름-foreground` 짝의 대비가 4.5:1 이상인가
- [ ] HEX와 OKLCH 중 하나로 통일했는가
- [ ] 안 쓰는 변수 블록을 삭제했는가
- [ ] 컴포넌트 코드에서 색을 변수로만 참조하는가 (값을 직접 박지 않았는가)
