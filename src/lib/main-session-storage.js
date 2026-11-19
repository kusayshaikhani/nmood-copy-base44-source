import { Capacitor, registerPlugin } from '@capacitor/core';
export const usesMainKeychain = () => typeof __NMOOD_MAIN_DEVICE__ !== 'undefined' && __NMOOD_MAIN_DEVICE__ && Capacitor.getPlatform() === 'ios';
const keychain = registerPlugin('NmoodSession');
// Only Nmood credentials are retained; provider identity/access tokens are discarded.
export function sessionMaterial(value) {
  if (!value?.access_token) throw Error('SESSION_INVALID');
  const { access_token, refresh_token, expires_at, expires_in, token_type, user } = value;
  return { access_token, refresh_token, expires_at, expires_in, token_type,
    ...(user ? { user: { id: user.id, email: user.email } } : {}) };
}
export function createSessionVault(plugin) {
  let snapshot = null, loading, generation = 0, queue = Promise.resolve();
  return {
    snapshot: () => snapshot,
    hydrate() {
      if (loading) return loading;
      const started = generation;
      return loading = plugin.read().then(({ value }) => {
        if (started === generation) snapshot = value ? sessionMaterial(JSON.parse(value)) : null;
      }).catch(() => {
        if (started !== generation) return;
        loading = null; throw Error('SESSION_STORAGE_UNAVAILABLE');
      });
    },
    save(value) {
      generation += 1;
      loading = Promise.resolve();
      snapshot = value ? sessionMaterial(value) : null;
      const serialized = snapshot && JSON.stringify(snapshot);
      const next = queue.catch(() => {}).then(() => serialized ? plugin.write({ value: serialized }) : plugin.clear());
      queue = next;
      return next.catch(() => { throw Error('SESSION_STORAGE_UNAVAILABLE'); });
    },
  };
}
export const mainSessionVault = createSessionVault(keychain);
export async function hydrateMainSession() {
  if (usesMainKeychain()) await mainSessionVault.hydrate();
}
