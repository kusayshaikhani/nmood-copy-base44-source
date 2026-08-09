// RM-003 Structured application logging.
// Levels: debug / info / warning / error / critical.
// Production suppresses debug. Sensitive fields are redacted before any output.
import { IS_PROD, LOG_LEVEL } from './runtime-env';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, critical: 50 };
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'apikey', 'api_key', 'authorization',
  'card', 'cvv', 'receipt', 'private_key', 'session',
];

function redact(obj) {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const minLevel = LEVELS[LOG_LEVEL] || LEVELS.warn;

export function log(level, message, meta = {}) {
  const lvl = LEVELS[level] || LEVELS.info;
  if (lvl < minLevel) return null; // suppressed by environment level (no debug in prod)
  const safeMeta = redact(meta);
  const entry = { level, message, meta: safeMeta, ts: new Date().toISOString() };
  if (!IS_PROD) {
    const fn = level === 'debug' ? 'log' : level;
    // eslint-disable-next-line no-console
    console[fn]?.(`[${level.toUpperCase()}]`, message, safeMeta);
  } else if (lvl >= LEVELS.error) {
    // eslint-disable-next-line no-console
    console.error(`[${level.toUpperCase()}]`, message);
  }
  return entry;
}

export const logger = {
  debug: (m, meta) => log('debug', m, meta),
  info: (m, meta) => log('info', m, meta),
  warn: (m, meta) => log('warn', m, meta),
  error: (m, meta) => log('error', m, meta),
  critical: (m, meta) => log('critical', m, meta),
};

export default logger;