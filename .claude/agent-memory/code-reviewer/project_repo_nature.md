---
name: project_repo_nature
description: holy.win.2026 저장소는 실제로 동작하는 정적 HTML/CSS/JS 교회 전도 명단 앱이며, docs/ 아래 01~09 디자인 시스템 문서는 statkit.llm.design 템플릿 방법론을 이 앱에 맞게 채워 넣은 것
metadata:
  type: project
---

이 저장소(holy.win.2026)는 "홀리윈 2026 전도 명단"이라는 실제 정적 웹앱이다. 프레임워크/번들러/`package.json` 없이 `index.html` + `assets/css/{init,entries}.css` + `assets/js/entries.js` + `assets/data/entries.json`으로 구성되며, `.phone`(390×844) 목업 안에서 리스트 화면 ↔ 티켓 상세 화면을 `.screen--hidden` 클래스 토글로 전환한다.

**주의 — 과거에 다른 저장소(statkit.llm.design, 문서 템플릿 킷)와 혼동해 메모리를 남긴 적 있음.** statkit.llm.design은 `docs/01~09-*.md` 번호 파일 자체가 산출물인 범용 템플릿 킷이지만, 이 저장소(holy.win.2026)는 그 방법론을 **가져와서 실제 앱의 값으로 채운 것**이다. 즉 `docs/`는 여기서 "산출물"이 아니라 `assets/css/entries.css`의 실제 코드 값을 설명하는 **부속 문서**이며, 코드와 문서가 서로 어긋나면 안 된다.

**How to apply:** 이 저장소를 리뷰할 때는
1. 일반적인 정적 프론트엔드 코드 리뷰 기준(XSS/innerHTML, fetch 에러 처리, a11y, 네이밍/중복)을 적용한다 — statkit.llm.design과 달리 실행되는 앱 코드이므로 "코드 리뷰 기준이 대부분 해당 안 됨"이라는 판단은 **적용하지 않는다**.
2. `docs/02-colors.md`·`docs/09-shadcn-tokens.md`와 `assets/css/entries.css`의 `:root` 변수·하드코딩 HEX 값이 서로 일치하는지 교차 검증한다 (자세한 규칙은 [[color_doc_sync_rule]] 참고).
3. `CLAUDE.md`(저장소 루트)가 이미 이 저장소의 구조/aliasing 규칙을 상세히 설명하고 있으니 먼저 참고할 것.
