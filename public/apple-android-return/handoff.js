/* Opaque ticket only. No tokens, identity information, analytics, storage or network requests. */
(() => {
  const fragment = window.location.hash;
  window.history.replaceState(null, '', '/apple-android-return/');
  const status = document.getElementById('status');
  const link = document.getElementById('continue');
  const params = new URLSearchParams(fragment.slice(1));
  const id = params.get('transaction');
  const ticket = params.get('ticket');
  if (window.location.origin !== 'https://app.nmood.app' || [...params.keys()].length !== 2 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id) || !/^[0-9a-f]{64}$/.test(ticket)) {
    status.textContent = 'This sign-in response is unavailable. Restart Apple sign-in in Nmood.';
    return;
  }
  link.href = 'intent://apple-auth/callback?transaction=' + id + '&ticket=' + ticket + '#Intent;scheme=nmood;package=com.nmood.app;end';
  link.hidden = false;
  status.textContent = 'Continue in the app to finish signing in.';
})();
