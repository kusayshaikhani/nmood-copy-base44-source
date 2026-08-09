// Smart Onboarding — automatic detection of device language, region, country, timezone.
// Used during onboarding to pre-fill values; the user can review and edit before continuing.

import { COUNTRIES, COUNTRY_MAP } from './countries';
import { LANGUAGE_MAP } from './languages';

// Best-effort timezone → country key map for common zones. Extend as needed.
const TZ_TO_COUNTRY = {
  'Asia/Dubai': 'ae', 'Asia/Qatar': 'qa', 'Asia/Kuwait': 'kw', 'Asia/Riyadh': 'sa',
  'Asia/Bahrain': 'bh', 'Asia/Muscat': 'om', 'Asia/Tehran': 'ir', 'Asia/Baghdad': 'iq',
  'Asia/Jerusalem': 'il', 'Asia/Amman': 'jo', 'Asia/Beirut': 'lb', 'Asia/Damascus': 'sy',
  'Asia/Karachi': 'pk', 'Asia/Kolkata': 'in', 'Asia/Dhaka': 'bd', 'Asia/Colombo': 'lk',
  'Asia/Kathmandu': 'np', 'Asia/Bangkok': 'th', 'Asia/Jakarta': 'id', 'Asia/Kuala_Lumpur': 'my',
  'Asia/Singapore': 'sg', 'Asia/Manila': 'ph', 'Asia/Hong_Kong': 'hk', 'Asia/Taipei': 'tw',
  'Asia/Shanghai': 'cn', 'Asia/Seoul': 'kr', 'Asia/Tokyo': 'jp', 'Asia/Tashkent': 'uz',
  'Asia/Almaty': 'kz', 'Asia/Yerevan': 'am', 'Asia/Baku': 'az', 'Asia/Tbilisi': 'ge',
  'Europe/London': 'gb', 'Europe/Paris': 'fr', 'Europe/Berlin': 'de', 'Europe/Madrid': 'es',
  'Europe/Rome': 'it', 'Europe/Amsterdam': 'nl', 'Europe/Brussels': 'be', 'Europe/Vienna': 'at',
  'Europe/Zurich': 'ch', 'Europe/Dublin': 'ie', 'Europe/Lisbon': 'pt', 'Europe/Athens': 'gr',
  'Europe/Warsaw': 'pl', 'Europe/Prague': 'cz', 'Europe/Budapest': 'hu', 'Europe/Bucharest': 'ro',
  'Europe/Sofia': 'bg', 'Europe/Belgrade': 'rs', 'Europe/Zagreb': 'hr', 'Europe/Stockholm': 'se',
  'Europe/Oslo': 'no', 'Europe/Copenhagen': 'dk', 'Europe/Helsinki': 'fi', 'Europe/Moscow': 'ru',
  'Europe/Istanbul': 'tr', 'Europe/Kyiv': 'ua',
  'America/New_York': 'us', 'America/Chicago': 'us', 'America/Los_Angeles': 'us',
  'America/Denver': 'us', 'America/Toronto': 'ca', 'America/Vancouver': 'ca',
  'America/Mexico_City': 'mx', 'America/Sao_Paulo': 'br', 'America/Buenos_Aires': 'ar',
  'America/Bogota': 'co', 'America/Lima': 'pe', 'America/Santiago': 'cl', 'America/Caracas': 've',
  'Africa/Cairo': 'eg', 'Africa/Casablanca': 'ma', 'Africa/Tunis': 'tn', 'Africa/Algiers': 'dz',
  'Africa/Lagos': 'ng', 'Africa/Nairobi': 'ke', 'Africa/Johannesburg': 'za', 'Africa/Accra': 'gh',
  'Africa/Addis_Ababa': 'et', 'Africa/Dar_es_Salaam': 'tz', 'Africa/Kampala': 'ug',
  'Australia/Sydney': 'au', 'Australia/Perth': 'au', 'Pacific/Auckland': 'nz',
};

export function timezoneToCountry(tz) {
  return TZ_TO_COUNTRY[tz] || '';
}

// Detect device locale settings. Safe on SSR / non-browser environments.
export function detectLocaleSettings() {
  if (typeof navigator === 'undefined') {
    return { language: 'en', languages: ['en'], region: '', timezone: '', country: '' };
  }
  const nav = navigator;
  const primary = (nav.language || 'en').toLowerCase();
  const lang = primary.split('-')[0];
  const langs = Array.from(
    new Set((nav.languages || [primary]).map((l) => String(l).split('-')[0].toLowerCase()))
  );
  let region = '';
  try {
    region = (Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] || '').toLowerCase();
  } catch { /* ignore */ }
  let timezone = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch { /* ignore */ }
  const country = timezoneToCountry(timezone) || region || '';
  return { language: lang, languages: langs, region, timezone, country };
}

// Validate that a set of language keys are all known master languages.
export function validLanguageKeys(keys) {
  if (!Array.isArray(keys)) return [];
  return keys.filter((k) => LANGUAGE_MAP[k]);
}

// Validate that a country key is a known master country.
export function validCountryKey(key) {
  return key ? !!COUNTRY_MAP[key] : false;
}

// All country timezones present in the catalog (for timezone pickers).
export const COUNTRY_TIMEZONES = Array.from(new Set(COUNTRIES.map((c) => c.timezone).filter(Boolean))).sort();