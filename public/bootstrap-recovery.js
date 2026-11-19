/* Independent of React, native plugins, network and bundled module loading. */
(() => {
  const panel = document.getElementById('nmood-recovery');
  const message = document.getElementById('nmood-recovery-message');
  const reference = document.getElementById('nmood-recovery-reference');
  const stages = new Set(['bootstrap', 'module', 'native-link', 'render', 'google-init', 'google-native', 'google-exchange', 'auth-session', 'post-auth', 'profile-form', 'profile-edit', 'post-auth-profile', 'post-auth-route', 'app-ready']);
  let stage = 'bootstrap';
  let timer;
  let generation = 0;
  let failed = false;
  const diagnostics = [];
  const paths = new Set(['ROOT', 'AUTH', 'ROUTER', 'MEM', 'SAFE', 'APP', 'MEM-REALTIME', 'MEM-STORE', 'GLOBAL', 'PROMISE', 'MODULE', 'NATIVE', 'PROFILE', 'PROFILE-ZODIAC', 'PROFILE-GENDER', 'PROFILE-COUNTRY', 'PROFILE-SAVE']);
  const categories = new Set(['TYPE', 'REF', 'RANGE', 'SECURITY', 'STORAGE', 'HOOKS', 'LOOP', 'CHILD', 'TRANSPORT', 'NOERROR', 'RESIZE', 'RESOURCE', 'OPAQUE', 'UNKNOWN']);
  const marked = new WeakMap();
  let reportedRender = false;
  let localRetry = null;
  let localStage = 'profile-form';
  let localPath = 'GLOBAL';
  function category(error) {
    try {
      const names = { TypeError: 'TYPE', ReferenceError: 'REF', RangeError: 'RANGE', SecurityError: 'SECURITY', QuotaExceededError: 'STORAGE' };
      if (Object.hasOwn(names, error?.name)) return names[error.name];
      // Inspect only to select fixed categories. Never retain or output this text.
      const text = typeof error?.message === 'string' ? error.message : '';
      if (/^WebSocket not available:/.test(text)) return 'TRANSPORT';
      if (/Minified React error #(310|311|300|321)\b|Rendered (more|fewer) hooks|Should have a queue/.test(text)) return 'HOOKS';
      if (/Minified React error #185\b|Maximum update depth exceeded/.test(text)) return 'LOOP';
      if (/Minified React error #31\b|Objects are not valid as a React child/.test(text)) return 'CHILD';
    } catch { /* Even diagnostic access must never prevent recovery. */ }
    return 'UNKNOWN';
  }
  function codeFor(error, path) {
    if (path === 'GLOBAL' && localRetry) path = localPath;
    const selected = error && (typeof error === 'object' || typeof error === 'function') ? marked.get(error) || path : path;
    return `${paths.has(selected) ? selected : 'ROOT'}-${category(error)}`;
  }
  function safeCode(code) {
    return [...paths].some(path => [...categories].some(kind => code === `${path}-${kind}`)) ? code : '';
  }
  function fail(reason = 'unexpected', code = '') {
    // Secondary cleanup/root-empty errors must not erase the useful render code.
    const previous = diagnostics.at(-1);
    const moreSpecific = previous && /-(OPAQUE|NOERROR|UNKNOWN)$/.test(previous.code || '')
      && safeCode(code) && !/-(OPAQUE|NOERROR|UNKNOWN)$/.test(code);
    if (failed && !moreSpecific && (reportedRender || reason !== 'render')) return;
    if (reason === 'render') reportedRender = true;
    failed = true;
    clearTimeout(timer);
    const safeReason = ['timeout', 'module', 'render', 'empty-root'].includes(reason) ? reason : 'unexpected';
    const suffix = safeCode(code);
    const profileFailure = localRetry && /^(PROFILE|GLOBAL)(-|$)/.test(suffix);
    const failureStage = profileFailure ? localStage : stage;
    const entry = { stage: failureStage, reason: safeReason, ...(suffix ? { code: suffix } : {}) };
    diagnostics.push(entry);
    if (diagnostics.length > 12) diagnostics.shift();
    // Never record exception messages, URLs, user details or authentication payloads.
    try { sessionStorage.setItem('nmood:recovery', JSON.stringify(diagnostics)); } catch { /* unavailable */ }
    reference.textContent = `Reference: ${failureStage}/${safeReason}${suffix ? "/" + suffix : ""}`;
    message.textContent = profileFailure && localStage === 'profile-edit' ? 'Profile editing could not finish. Your draft is kept. Please try again.' : 'Nmood could not finish opening. Please try again, or sign out on this device.';
    document.getElementById('nmood-loading').hidden = true;
    panel.hidden = false;
    document.getElementById('root').inert = true;
  }
  function begin(next, timeout = 45000) {
    if (failed) return () => {};
    stage = stages.has(next) ? next : 'bootstrap';
    const attempt = ++generation;
    clearTimeout(timer);
    timer = setTimeout(() => fail('timeout'), timeout);
    return () => { if (attempt === generation) clearTimeout(timer); };
  }
  window.NmoodRecovery = {
    begin, fail,
    failure(error, path = 'ROOT', reason = 'unexpected') { fail(reason, codeFor(error, path)); },
    profileRetry(handler, scope = 'profile-form') {
      localStage = scope === 'profile-edit' ? scope : 'profile-form';
      localPath = 'GLOBAL';
      localRetry = handler;
      if (!failed) { stage = localStage; clearTimeout(timer); }
      return () => { if (localRetry === handler) { localRetry = null; localPath = 'GLOBAL'; if (stage === localStage) stage = 'app-ready'; } };
    },
    profileField(path) {
      if (localRetry && ['PROFILE-GENDER', 'PROFILE-COUNTRY', 'PROFILE-ZODIAC', 'PROFILE-SAVE'].includes(path)) localPath = path;
    },
    renderFailure(error, path = 'ROOT') { fail('render', codeFor(error, path)); },
    record(error, path) {
      diagnostics.push({ stage, reason: 'nonfatal', code: codeFor(error, path) });
      if (diagnostics.length > 12) diagnostics.shift();
      try { sessionStorage.setItem('nmood:recovery', JSON.stringify(diagnostics)); } catch { /* unavailable */ }
    },
    trace(path, action) {
      try { return action(); }
      catch (error) {
        if (paths.has(path) && error && (typeof error === 'object' || typeof error === 'function')) marked.set(error, path);
        throw error;
      }
    },
    ready(settle = false) {
      if (failed) return;
      if (settle || stage === 'render') clearTimeout(timer);
      if (settle) stage = 'app-ready';
      panel.hidden = true;
      document.getElementById('nmood-loading').hidden = true;
    },
  };
  document.getElementById('nmood-retry').onclick = () => {
    if (localRetry && !reportedRender && diagnostics.at(-1)?.stage === localStage && document.getElementById('root').textContent.trim()) {
      try {
        if (localRetry() === false) {
          message.textContent = 'A profile operation is still finishing. Your form is kept. Please try again shortly.';
          return;
        }
        failed = false;
        reportedRender = false;
        panel.hidden = true;
        document.getElementById('root').inert = false;
        clearTimeout(timer);
        return;
      } catch { fail('unexpected', 'GLOBAL-UNKNOWN'); return; }
    }
    // Revalidate the HTML after an asset failure instead of repeating a stale entrypoint.
    const retry = new URL(location.href);
    retry.searchParams.set('_nmood_retry', String(Date.now()));
    location.replace(retry.href);
  };
  document.getElementById('nmood-signout').onclick = () => {
    // Best effort per key: restricted storage must never disable navigation.
    // These are Nmood's existing auth keys, not a blanket storage clear.
    const keys = ['nmood.supabase.session', 'base44_access_token', 'token', 'nmood:auth_callback_result', 'nmood:post_auth_target', 'nmood:pending_registration', 'nmood:pending_verification_email'];
    for (const key of keys) {
      try { localStorage.removeItem(key); } catch { /* continue clearing other auth keys */ }
      try { sessionStorage.removeItem(key); } catch { /* restricted storage */ }
    }
    try { sessionStorage.removeItem('nmood.supabase.pkce_verifier'); } catch { /* restricted storage */ }
    try { localStorage.setItem('nmood:session_terminated', '1'); } catch { /* navigation still works */ }
    location.replace('/auth');
  };
  window.addEventListener('error', event => {
    // WebKit emits this layout-delivery notification as an ErrorEvent with
    // no Error object. It is not an uncaught application exception. A one-frame
    // resize must not cover a healthy app with fatal authentication recovery.
    if (event.target === window && event.error == null && (
      event.message === 'ResizeObserver loop completed with undelivered notifications.'
      || event.message === 'ResizeObserver loop limit exceeded'
    )) {
      const entry = { stage, reason: 'nonfatal', code: 'GLOBAL-RESIZE' };
      if (!diagnostics.some(item => item.stage === stage && item.code === entry.code)) {
        diagnostics.push(entry);
        if (diagnostics.length > 12) diagnostics.shift();
        try { sessionStorage.setItem('nmood:recovery', JSON.stringify(diagnostics)); } catch { /* unavailable */ }
      }
      return;
    }
    if (event.target?.tagName === 'SCRIPT') {
      // Analytics/optional scripts are not application modules. In particular,
      // a CSP-blocked Cloudflare beacon must not make a healthy app inert.
      const script = event.target;
      let required = false;
      try {
        const url = new URL(script.src, location.href);
        required = url.origin === location.origin && script.type === 'module';
      } catch { /* malformed optional resource */ }
      if (required) fail('module', 'MODULE-RESOURCE');
      return;
    }
    if (event.target === window) fail('unexpected', event.error
      ? codeFor(event.error, 'GLOBAL')
      : `${localRetry ? localPath : 'GLOBAL'}-${event.message === 'Script error.' ? 'OPAQUE' : 'NOERROR'}`);
  }, true);
  window.addEventListener('unhandledrejection', event => fail('unexpected', codeFor(event.reason, 'PROMISE')));
  window.addEventListener('vite:preloadError', () => fail('module'));
  let emptyTimer;
  new MutationObserver(() => {
    clearTimeout(emptyTimer);
    // Authentication and route transitions can briefly leave React's host
    // container empty while the signed-in session is reconciled. The app is
    // still opening at that point, so treating this as fatal produces the
    // misleading `auth-session/empty-root` screen. Module, render and auth
    // timeouts still have their own guarded recovery paths above. Only flag
    // an empty root after the application has explicitly settled.
    if (stage !== 'app-ready') return;
    if (!document.getElementById('root').textContent.trim()) {
      emptyTimer = setTimeout(() => fail('empty-root'), 10000);
    }
  }).observe(document.getElementById('root'), { childList: true, subtree: true, characterData: true });
  begin('bootstrap');
})();
