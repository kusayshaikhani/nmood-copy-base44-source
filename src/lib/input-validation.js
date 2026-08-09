// SEC-001 Input validation — defense in depth for all user input.
// The server remains authoritative; these helpers stop obviously malicious
// or malformed input before it reaches an API call.

const SQL_PATTERNS = /(\b(union|select|insert|update|delete|drop|alter|exec)\b.*\b(from|into|table|where)\b)|(--|\/\*|\*\/|;)/i;
const NOSQL_PATTERNS = /(\$\w+\s*:)|(\$\$where)|(\b(where|gt|lt|gte|lte|ne|in|nin)\s*:\s*)/i;
const HTML_PATTERNS = /<\s*(script|iframe|object|embed|img|a|svg|on\w+)|javascript:/i;
const CMD_PATTERNS = /(\|\||&&|;\s*\w+|`|\$\(|>\s*\/)/i;

export function sanitizeText(str, max = 2000) {
  if (str == null) return '';
  let s = String(str);
  s = s.replace(/<[^>]*>/g, ''); // strip HTML tags
  s = s.replace(/javascript:/gi, '');
  s = s.replace(/on\w+\s*=/gi, '');
  if (s.length > max) s = s.slice(0, max);
  return s.trim();
}

export function sanitizeFilename(name) {
  if (!name) return '';
  const base = String(name).replace(/[\/\\]/g, '').replace(/\.\.+/g, '.');
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.slice(0, 200);
}

export function detectInjection(str) {
  if (!str) return null;
  const s = String(str);
  if (SQL_PATTERNS.test(s)) return 'sql';
  if (NOSQL_PATTERNS.test(s)) return 'nosql';
  if (HTML_PATTERNS.test(s)) return 'xss';
  if (CMD_PATTERNS.test(s)) return 'command';
  return null;
}

export function validateJson(raw, maxBytes = 256 * 1024) {
  if (typeof raw !== 'string') return { ok: false, error: 'Expected string input.' };
  if (raw.length > maxBytes) return { ok: false, error: 'Payload too large.' };
  try { return { ok: true, value: JSON.parse(raw) }; }
  catch (e) { return { ok: false, error: 'Malformed JSON.' }; }
}

export function enforcePayloadSize(obj, maxBytes = 256 * 1024) {
  try {
    const len = JSON.stringify(obj || {}).length;
    if (len > maxBytes) return { ok: false, error: 'Payload exceeds size limit.' };
    return { ok: true };
  } catch { return { ok: false, error: 'Unserializable payload.' }; }
}

// Reject fields not declared in the allowed set (unexpected field injection).
export function validateStructuredInput(data, allowedFields) {
  if (!data || typeof data !== 'object') return { ok: false, error: 'Invalid input.' };
  const allowed = new Set(allowedFields);
  const unexpected = Object.keys(data).filter((k) => !allowed.has(k));
  if (unexpected.length) return { ok: false, error: `Unexpected fields: ${unexpected.join(', ')}` };
  return { ok: true };
}