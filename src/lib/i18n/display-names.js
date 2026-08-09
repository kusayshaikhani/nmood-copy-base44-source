/**
 * MP-004 — Native display-name rendering for reference data (countries).
 * Uses Intl.DisplayNames so country names render natively in the active UI
 * language with zero per-locale translation entries. Additive helper — the
 * Localization Engine (format.js / provider) is untouched.
 */
import { COUNTRY_NAME_TO_CODE } from '@/lib/onboarding-data';

const LOCALE_MAP = {
  en: 'en-US', es: 'es-ES', fr: 'fr-FR',
  de: 'de-DE', it: 'it-IT', ru: 'ru-RU',
};

const regionCache = {};
function regionFormatter(lang) {
  const loc = LOCALE_MAP[lang] || 'en-US';
  if (regionCache[loc] === undefined) {
    try {
      regionCache[loc] = new Intl.DisplayNames([loc], { type: 'region' });
    } catch {
      regionCache[loc] = null;
    }
  }
  return regionCache[loc];
}

export function countryNameByCode(code, lang) {
  if (!code) return null;
  const f = regionFormatter(lang);
  try {
    return f ? f.of(code) : code;
  } catch {
    return code;
  }
}

/** Render a stored English country name into the active UI language. */
export function countryNameFromEnglish(englishName, lang) {
  if (!englishName) return '';
  const code = COUNTRY_NAME_TO_CODE[englishName];
  if (!code) return englishName; // "Other" / unknown → keep as-is (caller may localize "Other")
  return countryNameByCode(code, lang) || englishName;
}

export default { countryNameByCode, countryNameFromEnglish };