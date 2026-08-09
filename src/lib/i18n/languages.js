/**
 * LOC-001 — Supported languages registry (Release 1.0).
 * Single source of truth for language metadata. Adding a future language only
 * requires appending an entry here plus its translation resources — no
 * architecture changes.
 *
 * Native names use each language's own writing system. Arabic (ar) is an RTL
 * language; all others are LTR. The LocalizationProvider sets document.dir
 * based on each language's `dir` property.
 */
export const LANGUAGES = [
  { code: 'en', nativeName: 'English', englishName: 'English', flag: '🇬🇧', dir: 'ltr', aliases: ['english', 'en-us', 'en-gb'] },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', flag: '🇸🇦', dir: 'rtl', aliases: ['arabic', 'ar-sa', 'ar-ae'] },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', flag: '🇪🇸', dir: 'ltr', aliases: ['spanish', 'es-es'] },
  { code: 'fr', nativeName: 'Français', englishName: 'French', flag: '🇫🇷', dir: 'ltr', aliases: ['french', 'fr-fr'] },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', flag: '🇩🇪', dir: 'ltr', aliases: ['german', 'de-de'] },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian', flag: '🇮🇹', dir: 'ltr', aliases: ['italian', 'it-it'] },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian', flag: '🇷🇺', dir: 'ltr', aliases: ['russian', 'ru-ru'] },
];

export const SUPPORTED_CODES = new Set(LANGUAGES.map((l) => l.code));

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

/** Detect the device language and return its supported code, or null. */
export function detectDeviceLanguage() {
  if (typeof navigator === 'undefined') return null;
  const candidates = [navigator.language, ...(navigator.languages || [])]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  for (const c of candidates) {
    const base = c.split('-')[0];
    const match = LANGUAGES.find(
      (l) => l.code === base || l.aliases.includes(c) || c.startsWith(l.code + '-')
    );
    if (match) return match.code;
  }
  return null;
}

// First-launch "has explicitly chosen a language" flag — separate from the
// current language value so the manager can pre-select a device language while
// still prompting new members once before onboarding.
const CHOSEN_KEY = 'nmood:lang-chosen';
export function hasChosenLanguage() {
  try {
    return localStorage.getItem(CHOSEN_KEY) === '1';
  } catch {
    return false;
  }
}
export function markLanguageChosen() {
  try {
    localStorage.setItem(CHOSEN_KEY, '1');
  } catch {
    /* storage may be unavailable */
  }
}