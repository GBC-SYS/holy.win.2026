---
name: project-github-pages-deployment
description: "홀리윈 2026 앱은 GitHub Pages(gbc-sys.github.io/holy.win.2026)로 실배포 중, PWA 아이콘/매니페스트 포함 — 2026-09-22"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3dd53893-19af-4039-989f-1c627d9c21fa
  modified: 2026-09-22T10:47:13.770Z
---

이 저장소는 사용자가 GitHub 저장소 Settings에서 직접 Pages를 활성화해(Source: GitHub Actions) 실제로 배포되고 있다. `main` 브랜치에 push될 때마다 `.github/workflows/static.yml`이 레포 전체(`path: '.'`)를 그대로 업로드해 배포한다. 배포 주소는 `https://gbc-sys.github.io/holy.win.2026/`이며 커스텀 도메인은 아직 미설정(CNAME 없음).

**PWA/앱 아이콘 인프라 추가됨(2026-09-22):** `assets/imgs/appIcon.png`(1254×1254 마스터, 사용자가 직접 추가)를 `sips`로 리사이즈해 `favicon-16/32.png`, `apple-touch-icon.png`(180), `icon-192/512.png`를 생성하고, `assets/manifest.webmanifest`를 새로 만들어 `index.html`에 연결했다. 홈 화면 표시 이름은 사용자가 한글("홀리윈 명단")이 아니라 영문 `"holywin"`으로 직접 수정함 — 향후 매니페스트를 다시 만들거나 앱 이름을 바꿀 일이 있으면 이 영문 표기 선호를 기본값으로 참고할 것.

**Why:** 사용자가 아이폰에서 "홈 화면에 추가"로 앱처럼 쓰길 원해서 favicon만으로는 부족해 manifest 기반 PWA 아이콘까지 확장했다.

**How to apply:** 배포 상태나 최신 반영 여부를 확인할 때는 `gh run list --workflow=static.yml`로 최근 배포 성공 여부를, `curl -sI`로 실제 서빙되는 파일의 `last-modified`/`cache-control`을 확인하는 방식이 유효했다 — 사용자가 기기(특히 iOS Safari)에서 문제를 보고할 때, 서버 쪽 배포 문제인지 기기 쪽 캐시 문제인지를 이 방법으로 먼저 구분하고 나서 안내할 것.
