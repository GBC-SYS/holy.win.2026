// 리스트 화면 헤더의 count-chip에 Supabase Realtime Presence 기반 실시간 접속자 수를 표시합니다.
// 채널은 이 프로젝트가 다른 앱과 DB를 공유하므로 topic 충돌을 피하기 위해 holywin2026- 접두사를 쓰고,
// realtime.messages에 RLS 정책이 없어 private 채널은 join이 거부되므로 항상 기본(public) 모드로 엽니다.

(async () => {
  const countTextEl = document.getElementById('count-text');
  const countChipEl = countTextEl?.closest('.count-chip');
  if (!countTextEl || !window.supabaseClient) return;

  const session = await window.supabaseReady;
  const presenceKey = session?.user?.id || crypto.randomUUID();

  const channel = window.supabaseClient.channel('holywin2026-presence', {
    config: { presence: { key: presenceKey } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      countTextEl.textContent = `${count}명`;
      countChipEl?.setAttribute('aria-label', `현재 접속자 수 ${count}명`);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('[presence] channel subscribe failed:', status);
      }
    });
})();
