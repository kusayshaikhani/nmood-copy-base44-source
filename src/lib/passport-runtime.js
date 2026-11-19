import { REGION_ENABLED } from './region-config';

export const PASSPORT_RUNTIME_CONTRACT = 'country-passport-runtime-v1';
export const PASSPORT_ENFORCEMENT_REVISION = 'passport-29-v1';
const unavailable = () => new Error('Country visibility is unavailable. Reconnect and retry.');

// This is a withdrawal gate, never an alternative to server authorization.
// No persistence, provider entitlement, country filtering or optimistic access.
export function createPassportRuntime({ enabled = REGION_ENABLED, now = () => Date.now(), monotonic = () => performance.now() } = {}) {
 let state = Object.freeze({ ready: false, actor: null, revision: 0 });
 const listeners = new Set();
 const publish = value => { state = Object.freeze(value); listeners.forEach(fn => fn()); };
 return {
  enabled,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  getSnapshot: () => state,
  withdraw() { publish({ ready: false, actor: null, revision: state.revision + 1 }); },
  confirm(value, actor, { startedAt = monotonic() } = {}) {
   const time = now(), stamp = value?.scope;
   if (!enabled || !actor || value?.contract !== PASSPORT_RUNTIME_CONTRACT || value.enabled !== true
    || value.actor !== actor || value.enforcement_revision !== PASSPORT_ENFORCEMENT_REVISION
    || value.adapter_count !== 29 || value.revocation_transport !== 'private-broadcast-v1'
    || stamp?.contract !== 'passport-scope-v1' || !Number.isSafeInteger(stamp.epoch) || stamp.epoch < 1
    || !Number.isFinite(Date.parse(value.server_time)) || Math.abs(Date.parse(value.server_time) - time) > 30000
    || !Number.isFinite(Date.parse(stamp.valid_until)) || Date.parse(stamp.valid_until) <= time
    || Date.parse(stamp.valid_until) - Date.parse(value.server_time) > 30000) {
    this.withdraw(); throw unavailable();
   }
   const ttl = Math.min(Date.parse(stamp.valid_until) - time, Date.parse(stamp.valid_until) - Date.parse(value.server_time) - Math.max(0, monotonic() - startedAt));
   if (ttl <= 0) { this.withdraw(); throw unavailable(); }
   publish({ ready: true, actor, revision: state.revision + 1, epoch: stamp.epoch, expires: time + ttl, monotonicExpiry: monotonic() + ttl });
   return state;
  },
  ticket(actor) {
   if (!enabled) return null;
   if (!state.ready || state.actor !== actor || state.expires <= now() || state.monotonicExpiry <= monotonic()) throw unavailable();
   return { actor, revision: state.revision };
  },
  accept(ticket, actor) {
   if (!enabled) return;
   this.ticket(actor);
   if (!ticket || ticket.actor !== actor || ticket.revision !== state.revision) throw unavailable();
  },
 };
}
export const passportRuntime = createPassportRuntime();
