---
name: radius_doc_sync_rule
description: docs/05-radius.md·docs/09-shadcn-tokens.md의 ".container 바깥 프레임 28px" 예외 문구가 실제 코드(.container border-radius 24px 24px 0 0)와 어긋났던 문제 — 2026-09-22 발견, 같은 날 재검토에서 수정 확인, 해소됨
metadata:
  type: project
---

`docs/05-radius.md`(25번 줄)와 `docs/09-shadcn-tokens.md`(94번 줄)는 한때 "`.container` 바깥 프레임의 **28px**은 디바이스 목업 전용 값이라 파생 스케일에 포함하지 않는다"고 적고 있었다. 2026-09-22 `.phone`→`.container` 리네이밍 + border-radius/box-shadow 추가 커밋 이후 실제 `entries.css`의 `.container`는 `border-radius: 24px 24px 0 0`(하단은 각짐, 상단만 24px)인데 문서는 "28px, 전체 모서리"로 남아 있어 값·범위 모두 어긋났었다(Major).

**해소(같은 날 재검토):** 두 파일 모두 "실제 값은 24px이며 `--radius-xl`(24px, 큰 컨테이너·모달)과 일치하므로 더 이상 파생 스케일 밖 예외가 아니다"로 재서술되어 코드값과 일치함을 확인. "28px, 디바이스 목업 프레임" 표현은 과거형("예전에는 ~였지만")으로만 남아 있고, 현재 스펙으로 주장하는 곳은 없음. `docs/04-spacing.md`(14번 줄, `.header`/`.topbar` 56px 패딩을 "디바이스 목업 전용 값"으로 부르는 부분)는 이번 수정 대상이 아니고 05/09번의 재분류와도 모순되지 않음(별개 속성·별개 예외).

**Why:** `docs/02-colors.md`의 색상 동기화 규칙([[color_doc_sync_rule]])과 동일한 성격의 문제로, 이 프로젝트는 "docs/의 수치는 코드의 실측값과 일치해야 한다"는 자체 거버넌스를 갖고 있다(`08-guidelines.md`, `CLAUDE.md`의 docs 동기화 문구).

**How to apply:** `.container`의 `border-radius`/`box-shadow` 등 `docs/05-radius.md`·`docs/09-shadcn-tokens.md`가 다루는 수치가 바뀌는 CSS 변경을 리뷰할 때마다, 문서 값과 실제 값을 라인 단위로 대조할 것. 값이 다르면 Major로 지적.
