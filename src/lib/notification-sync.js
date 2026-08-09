// PB-001 — Cross-tab and offline notification state synchronization.
// BroadcastChannel provides instant cross-tab updates. localStorage persists
// an offline operation queue that survives page refresh and is replayed when
// the connection returns.

const CHANNEL_NAME = 'nmood-notifications';
const QUEUE_KEY = 'nmood_notif_queue';

let _channel = null;

function getChannel() {
  if (_channel) return _channel;
  if (typeof BroadcastChannel === 'undefined') return null;
  try { _channel = new BroadcastChannel(CHANNEL_NAME); } catch { _channel = null; }
  return _channel;
}

export function broadcastChange(type, key, uid) {
  const ch = getChannel();
  if (ch) ch.postMessage({ type, key, uid, ts: Date.now() });
}

export function onRemoteChange(callback) {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (e) => callback(e.data);
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}

export function queueOperation(op) {
  try {
    const queue = getQueue();
    if (queue.some((q) => q.type === op.type && q.key === op.key)) return;
    queue.push({ ...op, ts: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

export function removeFromQueue(type, key) {
  try {
    const queue = getQueue().filter((q) => !(q.type === type && q.key === key));
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}