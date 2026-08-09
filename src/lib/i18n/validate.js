/**
 * MP-001 — Development-time translation validation. Surfaces missing keys,
 * malformed plural/placeholder syntax, and unbalanced braces so issues are
 * caught during development. Runs once on import in dev; no-op in production.
 *
 * Unused-key detection (scanning source `t()` call sites) is a build-time
 * concern and is intentionally omitted from this runtime check.
 */
import { translations } from './translations';

const IS_DEV = !!(import.meta && import.meta.env && import.meta.env.DEV);
const VALID_PLURAL_CATS = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

export function validateTranslations() {
  const en = translations.en || {};
  const enKeys = Object.keys(en);
  const issues = [];
  Object.keys(translations).forEach((lang) => {
    const dict = translations[lang] || {};
    if (lang !== 'en') {
      enKeys.forEach((k) => {
        if (!(k in dict)) issues.push({ type: 'missing', lang, key: k });
      });
    }
    Object.keys(dict).forEach((k) => {
      const v = dict[k];
      if (typeof v !== 'string') return;
      const opens = (v.match(/\{/g) || []).length;
      const closes = (v.match(/\}/g) || []).length;
      if (opens !== closes) issues.push({ type: 'malformed', lang, key: k, detail: 'unbalanced braces' });
      const pm = v.match(/\{(\w+),\s*plural,\s*((?:\w+\{[^{}]*\}\s*)+)\}/);
      if (pm) {
        const body = pm[2];
        const branchRe = /(\w+)\{([^{}]*)\}/g;
        let m;
        const cats = new Set();
        while ((m = branchRe.exec(body)) !== null) {
          cats.add(m[1]);
          if (!VALID_PLURAL_CATS.has(m[1])) {
            issues.push({ type: 'malformed', lang, key: k, detail: `invalid plural category '${m[1]}'` });
          }
        }
        if (!cats.has('other')) {
          issues.push({ type: 'malformed', lang, key: k, detail: 'plural missing other branch' });
        }
      }
      // MP-004A — invalid interpolation: after removing plural blocks, every
      // top-level {…} token must be a valid identifier placeholder.
      const stripped = v.replace(/\{\w+,\s*plural,\s*(?:\w+\{[^{}]*\}\s*)+\}/g, '');
      const tokens = stripped.match(/\{[^{}]*\}/g) || [];
      tokens.forEach((tok) => {
        const inner = tok.slice(1, -1);
        if (inner === '') {
          issues.push({ type: 'malformed', lang, key: k, detail: "empty interpolation '{}'" });
        } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(inner)) {
          issues.push({ type: 'malformed', lang, key: k, detail: `invalid interpolation '${tok}'` });
        }
      });
    });
  });
  return issues;
}

if (IS_DEV && typeof console !== 'undefined') {
  const issues = validateTranslations();
  if (issues.length) {
    const byType = {};
    issues.forEach((i) => { byType[i.type] = (byType[i.type] || 0) + 1; });
    console.warn(`[i18n] ${issues.length} translation issue(s) detected:`, byType);
    issues.slice(0, 50).forEach((i) => console.warn(`  - ${i.type} [${i.lang}] ${i.key}${i.detail ? ` — ${i.detail}` : ''}`));
    console.warn('[i18n] MP-004A: run `node src/lib/i18n/governance.cjs` for full diagnostics (duplicates, unused keys, hardcoded strings).');
  } else if (IS_DEV) {
    console.info('[i18n] MP-004A: runtime validation passed. Run `node src/lib/i18n/governance.cjs` for the full governance gate.');
  }
}

export default validateTranslations;