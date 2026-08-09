// RM-003 Global error handler — captures unexpected errors with context,
// categorizes them (validation/auth/authz/network/database/unexpected),
// surfaces friendly user messages, and never exposes sensitive information
// (tokens, secrets, stack traces) to members. Stack traces are logged
// server-side only.
import { APP_VERSION } from './system-config';

let installed = false;

const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'apikey', 'api_key', 'authorization',
  'card', 'cvv', 'receipt', 'private_key', 'session',
];

function detectPlatform() {
  if (typeof window === 'undefined') return 'server';
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'web';
}

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

// Categorize errors for structured logging without exposing internals.
export function classifyError(error) {
  const err = error instanceof Error ? error : new Error(String(error));
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || 0;
  if (msg.includes('valid') || msg.includes('required') || msg.includes('schema')) return 'validation';
  if (status === 401 || msg.includes('unauthenticated') || msg.includes('not logged in') || msg.includes('must be logged')) return 'authentication';
  if (status === 403 || msg.includes('forbidden') || msg.includes('not allowed') || msg.includes('permission')) return 'authorization';
  if (status >= 500 || msg.includes('database') || msg.includes('query') || msg.includes('entity')) return 'database';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || status === 0 || err.name === 'TypeError') return 'network';
  return 'unexpected';
}

const FRIENDLY_MESSAGES = {
  validation: 'Please check your input and try again.',
  authentication: 'Please sign in to continue.',
  authorization: "You don't have permission to do that.",
  network: 'Connection issue — please check your internet and retry.',
  database: "We're having trouble reaching our service. Please try again.",
  unexpected: 'Something went wrong. Please try again.',
};

export function friendlyMessage(error) {
  return FRIENDLY_MESSAGES[classifyError(error)] || FRIENDLY_MESSAGES.unexpected;
}

// RC1: produce a member-safe error result with a unique Error ID. Technical
// detail is logged server-side via captureError; only a friendly message and a
// support reference reach the UI — never a raw exception message.
export function toFriendlyResult(error, context = {}) {
  const errorId = 'ERR-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase();
  captureError(error, { ...context, errorId });
  return { message: `${friendlyMessage(error)} (Ref: ${errorId})`, errorId };
}

export function captureError(error, context = {}) {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const category = context.category || classifyError(err);
    import('@/api/base44Client').then(({ base44 }) => {
      base44.functions.invoke('systemOps', {
        mode: 'logError',
        message: err.message || 'Unknown error',
        stack_trace: err.stack || '',
        screen: context.screen || (window.location?.pathname || ''),
        platform: detectPlatform(),
        app_version: APP_VERSION,
        severity: context.severity || 'error',
        context: redact({ ...context, category, url: window.location?.href }),
      }).catch(() => {});
    });
  } catch {
    /* swallow — error logging must never break the app */
  }
}

export function installGlobalErrorHandler() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    captureError(e.error || new Error(e.message || 'window.error'), {
      screen: window.location?.pathname,
      type: 'window_error',
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
    captureError(err, { screen: window.location?.pathname, type: 'unhandled_promise' });
  });
}