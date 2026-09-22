// Supabase 클라이언트 초기화 — 화면엔 로그인 UI가 없지만, RLS의 소유권 판별
// (owner_id = auth.uid())을 위해 내부적으로 익명 세션을 발급받아둔다.
// entries.js 등 이후 스크립트는 `window.supabaseReady`가 resolve된 뒤에
// `supabaseClient`로 쿼리를 시작해야 한다.

// ============ 클라이언트 생성 ============
// anon public key는 공개용 키이며 실제 접근 제어는 RLS 정책이 담당하므로
// 코드에 직접 넣어도 안전하다.
const SUPABASE_URL = 'https://lrqqxzlxuilwfumitwmc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycXF4emx4dWlsd2Z1bWl0d21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwOTU0OTAsImV4cCI6MjA5NzY3MTQ5MH0.q4ZzxjN-irf4raeaMzBjMj1dE38O-3S2po97S6sDOKo';

// 최상위 const/let은 <script> 태그 간 전역 렉시컬 스코프에는 남지만
// window의 프로퍼티는 되지 않는다. entries.js 등 다른 스크립트와 DevTools
// 콘솔 모두에서 안정적으로 접근할 수 있도록 window에 명시적으로 노출한다.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

// ============ 익명 세션 준비 ============
// 기존 세션이 있으면 재사용하고, 없으면 signInAnonymously()로 새로 발급받는다.
// 어떤 경우에도 reject하지 않고 세션(또는 null)으로 resolve한다 — 실패 시
// 콘솔에 에러만 남기고, 이후 단계의 쿼리 로직이 각자 실패를 처리하도록 둔다.
async function ensureAnonymousSession() {
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error('[supabase] 기존 세션을 확인하는 중 오류가 발생했습니다.', sessionError);
  }

  if (sessionData?.session) {
    return sessionData.session;
  }

  const { data: signInData, error: signInError } = await supabaseClient.auth.signInAnonymously();

  if (signInError) {
    console.error(
      '[supabase] 익명 로그인에 실패했습니다. Supabase Dashboard > Authentication > Providers에서 "Allow anonymous sign-ins" 설정이 켜져 있는지 확인하세요.',
      signInError,
    );
    return null;
  }

  return signInData?.session ?? null;
}

// 다른 스크립트는 `await window.supabaseReady` 또는
// `window.supabaseReady.then(() => { ... })`로 익명 세션 준비를 기다린 뒤
// supabaseClient를 사용한다.
window.supabaseReady = ensureAnonymousSession();
