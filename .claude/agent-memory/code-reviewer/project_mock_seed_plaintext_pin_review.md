---
name: project_mock_seed_plaintext_pin_review
description: 0007_replace_mock_seed_entries.sql이 목(mock) 시드 5건의 평문 PIN(1111~5555)을 주석+INSERT 인자로 그대로 커밋한 것에 대한 판정과 근거
type: project
---

`supabase/migrations/0007_replace_mock_seed_entries.sql`(2026-09-30)은 sentinel owner_id를 쓰는 목데이터 5건(서연/병훈이형/예은/할머니/태윤)을 pin_hash까지 채워 INSERT하며, 각 행의 평문 PIN(1111/2222/3333/4444/5555)을 파일 주석과 `crypt()` 호출 인자에 그대로 노출한다. 이 저장소는 공개 GitHub 저장소 + GitHub Pages 공개 배포([[project_github-pages-deployment]]).

**판정: APPROVED(조건부), Critical/Major 아님.** 근거:
- 사용자가 명시적으로 요청한 의도된 기능("목데이터라도 비밀번호를 만들어 앱에서 수정/삭제를 시연 가능하게")이며, 대상 행은 실제 사용자 데이터가 아니라 sentinel owner_id를 쓰는 목데이터 5건뿐이다.
- `pin_hash` 컬럼은 0006_restrict_pin_hash_select.sql([[project_pin_ownership_migration_review]] 참고)에서 이미 테이블 단위 SELECT를 revoke하고 컬럼 단위로 재부여했기 때문에, anon/authenticated 키로는 pin_hash 자체를 조회할 수 없다 — 앱(`entries.js`의 `.select('id, to_name, from_name, relation, status, submitted_at, owner_id')`)도 pin_hash를 요청하지 않는다. 즉 이 평문 PIN이 노출되는 유일한 경로는 "git 히스토리를 직접 읽는 것"뿐이고, 그건 정확히 의도된 공개 경로다.
- bcrypt 해시는 단방향이라 이 5건의 평문 PIN이 유출돼도 다른(실제) 사용자의 PIN을 유추할 근거가 되지 않는다.

**Minor/조언(비차단):** 그래도 "소스에 평문 자격증명을 커밋"하는 패턴 자체는 gitleaks/trufflehog/GitHub push-protection 같은 시크릿 스캐너가 향후 오탐으로 잡아낼 수 있고, 이 파일을 템플릿 삼아 나중에 실사용자용 마이그레이션에 같은 패턴을 실수로 재사용할 위험이 있다. 제안: 파일 상단에 "⚠️ 데모 전용 — 실사용자 데이터/PIN 재설정에 이 패턴 재사용 금지" 같은 명시적 경고 주석을 추가하면 향후 코드리뷰에서 다시 판단할 필요 없이 의도가 명확해짐 (강제 아님, 다음에 이 패턴을 보면 이 메모를 재사용해 판단할 것).

SQL 정확성은 별도 문제없이 확인됨: `extensions.crypt/gen_salt('bf')`는 0005와 동일, `delete ... where owner_id = sentinel`은 0004(무조건 전체 delete)보다 오히려 더 안전한 타겟팅, FK drop→NOT VALID 재생성 패턴은 0001/0004와 동일.
