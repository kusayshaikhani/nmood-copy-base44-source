// One recovery budget per QueryClient/account, shared by all Explorer sections.
// A scope read succeeding does not reset it: a persistent conflict must stop.
export function createScopeRecovery(refresh, { schedule = setTimeout, cancel = clearTimeout, random = Math.random } = {}) {
  let attempts = 0, timer = null, running = false, stopped = false;
  return {
    request() {
      if (stopped || timer !== null || running || attempts >= 3) return false;
      const delay = 1000 * (2 ** attempts) + Math.floor(random() * 250);
      attempts++;
      timer = schedule(async () => {
        timer = null;
        if (stopped) return;
        running = true;
        try { await refresh(); } catch { /* Query state reports the failure; no recursive retry. */ }
        finally { running = false; }
      }, delay);
      return true;
    },
    reset() { if (timer !== null) cancel(timer); timer = null; attempts = 0; },
    stop() { stopped = true; if (timer !== null) cancel(timer); timer = null; },
  };
}
const clients = new WeakMap();
export function acquireScopeRecovery(client, actor) {
  let actors = clients.get(client);
  if (!actors) { actors = new Map(); clients.set(client, actors); }
  let entry = actors.get(actor);
  if (!entry) {
    const refresh = () => client.resetQueries({ queryKey: ['passportScope', actor] });
    const recovery = createScopeRecovery(refresh);
    const stale = () => recovery.request();
    const explicit = () => { recovery.reset(); void refresh(); };
    window.addEventListener('nmood:explorer-scope-stale', stale);
    window.addEventListener('nmood:access-changed', explicit);
    window.addEventListener('nmood:refresh', explicit);
    entry = { count: 0, release() {
      recovery.stop();
      window.removeEventListener('nmood:explorer-scope-stale', stale);
      window.removeEventListener('nmood:access-changed', explicit);
      window.removeEventListener('nmood:refresh', explicit);
    } };
    actors.set(actor, entry);
  }
  entry.count++;
  return () => { if (--entry.count === 0) { entry.release(); actors.delete(actor); } };
}
