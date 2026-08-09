/**
 * LOC-001 — Regional formatting helpers (Intl-based). Locale is derived from
 * the selected language; date/time honor the member's format preferences.
 */
const LOCALE_MAP = {
  en: 'en-US', ar: 'ar-AE', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
  it: 'it-IT', ru: 'ru-RU',
};

export function localeFor(lang) {
  return LOCALE_MAP[lang] || 'en-US';
}

export function date(d, lang, settings = {}, opts = {}) {
  if (!d) return '';
  const locale = localeFor(lang);
  const format = opts.format || settings.date_format || 'medium';
  const style = format === 'long' ? 'long' : format === 'short' ? 'short' : 'medium';
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(new Date(d));
  } catch {
    return String(d);
  }
}

export function time(d, lang, settings = {}, opts = {}) {
  if (!d) return '';
  const locale = localeFor(lang);
  const use12h = (settings.time_format || opts.format) !== '24h';
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: use12h }).format(new Date(d));
  } catch {
    return String(d);
  }
}

export function number(n, lang, opts = {}) {
  try {
    return new Intl.NumberFormat(localeFor(lang), opts).format(n);
  } catch {
    return String(n);
  }
}

export function currency(n, lang, currencyCode = 'USD', opts = {}) {
  try {
    return new Intl.NumberFormat(localeFor(lang), { style: 'currency', currency: currencyCode, ...opts }).format(n);
  } catch {
    return String(n);
  }
}

// MP-001 — Pluralization (Intl.PluralRules, future-proof for any language).
const pluralRulesCache = {};
export function pluralCategory(n, lang) {
  if (!pluralRulesCache[lang]) pluralRulesCache[lang] = new Intl.PluralRules(localeFor(lang));
  return pluralRulesCache[lang].select(Number(n));
}

/**
 * LOC-001 — ICU MessageFormat plural resolver.
 * Handles {name, plural, selector{...} ...} with:
 * - Exact match selectors (=0, =1, …) that take precedence over plural rules
 * - Plural categories (zero, one, two, few, many, other) via Intl.PluralRules
 * - Nested {var} placeholders inside branches (left for regular interpolation)
 * - # placeholder replaced by the count value
 * Runs before ordinary {var} interpolation so nested placeholders survive.
 */
function findMatchingBrace(str, openPos) {
  let depth = 1;
  let i = openPos + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') depth--;
    if (depth === 0) return i;
    i++;
  }
  return -1;
}

function parsePluralBranches(body) {
  const branches = {};
  let i = 0;
  const n = body.length;
  while (i < n) {
    while (i < n && /\s/.test(body[i])) i++;
    if (i >= n) break;
    let sel = '';
    while (i < n && body[i] !== '{') { sel += body[i]; i++; }
    sel = sel.trim();
    if (i >= n || body[i] !== '{') break;
    const close = findMatchingBrace(body, i);
    if (close === -1) break;
    branches[sel] = body.slice(i + 1, close);
    i = close + 1;
  }
  return branches;
}

export function resolvePlurals(str, lang, vars) {
  if (!str || str.indexOf(', plural,') === -1) return str;
  const pluralRe = /\{(\w+),\s*plural,\s*/g;
  let result = '';
  let lastIdx = 0;
  let m;
  while ((m = pluralRe.exec(str)) !== null) {
    const exprStart = m.index;
    const name = m[1];
    const bodyStart = m.index + m[0].length;
    const closeIdx = findMatchingBrace(str, exprStart);
    if (closeIdx === -1) { pluralRe.lastIndex = bodyStart; continue; }
    const body = str.slice(bodyStart, closeIdx);
    const branches = parsePluralBranches(body);
    const count = Number(vars?.[name] ?? 0);
    let chosen = branches[`=${count}`] ?? null;
    if (chosen === null) {
      const cat = pluralCategory(count, lang);
      chosen = branches[cat] ?? null;
    }
    if (chosen === null) chosen = branches['other'] ?? '';
    result += str.slice(lastIdx, exprStart);
    result += chosen.replace(/#/g, String(count));
    lastIdx = closeIdx + 1;
    pluralRe.lastIndex = closeIdx + 1;
  }
  result += str.slice(lastIdx);
  return result;
}

/**
 * MP-008 — Localized relative-time formatter. Returns a compact, human-
 * readable relative timestamp (e.g. "Now", "5m", "3h", "2d") or a locale-
 * formatted date for older entries. Uses the `messaging.time.*` keys.
 */
export function relativeTime(d, lang, t) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return t ? t('messaging.time.now') : 'Now';
  if (diff < 3600) return (t ? t('messaging.time.minutes', { count: Math.floor(diff / 60) }) : Math.floor(diff / 60) + 'm');
  if (diff < 86400) return (t ? t('messaging.time.hours', { count: Math.floor(diff / 3600) }) : Math.floor(diff / 3600) + 'h');
  if (diff < 604800) return (t ? t('messaging.time.days', { count: Math.floor(diff / 86400) }) : Math.floor(diff / 86400) + 'd');
  return date(d, lang);
}

export default { date, time, number, currency, localeFor, pluralCategory, resolvePlurals, relativeTime };