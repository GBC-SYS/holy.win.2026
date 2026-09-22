---
name: project_anon-auth-crud-plan
description: holy.win.2026 프로젝트가 무로그인 Supabase CRUD로 전환하는 중장기 계획과 확정된 아키텍처 결정
metadata:
  type: project
---

holy.win.2026("홀리윈 2026 전도 명단")은 원래 완전 정적 사이트(entries.json fetch만)였는데,
Supabase 기반 실제 CRUD(등록/조회/수정/삭제, 여러 사람과 공유)로 전환 중이다.
승인된 계획 파일: `.claude/plans/crystalline-enchanting-perlis.md`
(제목 "Supabase 기반 무로그인 CRUD 도입"). 단계별로 나눠 진행하며 각 단계 후
사용자가 브라우저에서 수동 확인하고 다음 단계로 넘어간다.

확정된 핵심 결정 3가지:
1. **소유권 모델 = Supabase Anonymous Sign-In** (`supabase.auth.signInAnonymously()`).
   회면엔 로그인 UI 없지만 내부적으로 진짜 `auth.uid()`를 발급받아 표준 RLS
   (`owner_id = auth.uid()`)를 쓴다. 사용자가 Dashboard에서
   "Allow anonymous sign-ins"를 직접 켜야 함(에이전트가 대신 할 수 없음).
2. "이번 주 제출"/"이전 명단" 구분은 `submitted_at` 기준 7일 이내를
   **클라이언트에서 파생 계산**한다. DB에 `group` 컬럼을 두지 않는다
   (기존 entries.json의 `group` 필드는 폐기).
3. 마이그레이션은 파일로만 작성 — 사용자가 Supabase Dashboard SQL Editor에
   직접 붙여넣어 실행한다. 에이전트가 실제 DB에 쓰기 작업을 실행하지 않는다.

**Why**: 회원가입 UI 없이 "실제로 여러 사람과 공유되는" 명단을 원한다는 사용자
요구사항과, 순수 localStorage 방식은 명시적으로 거절당했다는 제약에서 나온 결정.

**How to apply**: 이후 단계(2~6단계: 클라이언트 연결, 읽기 전환, 상태 토글 UPDATE,
등록 폼, 수정/삭제 + 내 글 필터)를 진행할 때 이 3가지 결정을 전제로 삼는다.
특히 익명 세션의 본질적 한계(브라우저 데이터 삭제/기기 변경 시 본인 글도
다시는 수정 불가)는 스키마·UX 설계 모두에서 반복적으로 언급해야 하는 트레이드오프다.
[[project_entries-schema]] 참고.

**진행 상황 (2026-09-22 기준)**: 1단계(스키마+RLS) 완료 — `supabase/migrations/0001_init.sql`
작성함. 2단계부터는 아직 미착수.
