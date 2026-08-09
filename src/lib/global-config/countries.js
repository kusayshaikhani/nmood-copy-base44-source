/**
 * ACR-001 Global Configuration Framework — Country Registry
 *
 * Single source of truth for per-country regional configuration. Drives all
 * country-aware behavior so the platform can launch in additional countries
 * without changes to core application logic.
 *
 * This is a foundation for international expansion. No existing screens,
 * workflows, business rules, or database schemas are modified.
 *
 * To add a country: append an entry to COUNTRY_CONFIGS keyed by ISO 3166-1
 * alpha-2 code. The resolver (index.js) picks up new entries automatically.
 */

// Region groupings for regional rollups / future compliance rules.
export const REGIONS = {
  GCC: 'gcc',
  MENA: 'mena',
  EUROPE: 'europe',
  NORTH_AMERICA: 'north_america',
  ASIA_PACIFIC: 'asia_pacific',
  AFRICA: 'africa',
  GLOBAL: 'global',
};

/**
 * Per-country configuration. Each entry is self-contained and validated by the
 * resolver. `featureAvailability` gates features where required by law or
 * market readiness; defaults to enabled unless explicitly constrained.
 *
 * Fields:
 *  - country:           Display name
 *  - countryCode:        ISO 3166-1 alpha-2
 *  - region:             One of REGIONS
 *  - primaryLanguage:    ISO 639-1 default UI language
 *  - supportedLanguages: ISO 639-1 codes offered in this country
 *  - currency:           ISO 4217 currency code
 *  - currencySymbol:     Display symbol
 *  - timezone:           IANA tz database name
 *  - dateFormat:         day-first | month-first | year-first
 *  - timeFormat:         12h | 24h
 *  - measurementUnits:   metric | imperial | mixed
 *  - emergencyNumbers:   Map of service -> phone number
 *  - minimumLegalAge:   Minimum age to use the platform (years)
 *  - compliance:         Country-specific compliance flags
 *  - featureAvailability: Feature key -> boolean (true = enabled)
 */
export const COUNTRY_CONFIGS = {
  AE: {
    country: 'United Arab Emirates',
    countryCode: 'AE',
    region: REGIONS.GCC,
    primaryLanguage: 'en',
    supportedLanguages: ['en', 'ar'],
    currency: 'AED',
    currencySymbol: 'د.إ',
    timezone: 'Asia/Dubai',
    dateFormat: 'day-first',
    timeFormat: '12h',
    measurementUnits: 'metric',
    emergencyNumbers: { police: '999', ambulance: '998', fire: '997' },
    minimumLegalAge: 18,
    compliance: {
      dataLocalization: false,
      paymentRegion: 'ae',
      contentModerationLevel: 'standard',
    },
    featureAvailability: {
      circles: true,
      experiences: true,
      messaging: true,
      premiumMembership: true,
    },
  },
  SA: {
    country: 'Saudi Arabia',
    countryCode: 'SA',
    region: REGIONS.GCC,
    primaryLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    currency: 'SAR',
    currencySymbol: 'ر.س',
    timezone: 'Asia/Riyadh',
    dateFormat: 'day-first',
    timeFormat: '12h',
    measurementUnits: 'metric',
    emergencyNumbers: { police: '999', ambulance: '997', fire: '999' },
    minimumLegalAge: 18,
    compliance: { dataLocalization: true, paymentRegion: 'sa', contentModerationLevel: 'strict' },
    featureAvailability: { circles: true, experiences: true, messaging: true, premiumMembership: true },
  },
  QA: {
    country: 'Qatar',
    countryCode: 'QA',
    region: REGIONS.GCC,
    primaryLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    currency: 'QAR',
    currencySymbol: 'ر.ق',
    timezone: 'Asia/Qatar',
    dateFormat: 'day-first',
    timeFormat: '12h',
    measurementUnits: 'metric',
    emergencyNumbers: { police: '999', ambulance: '997', fire: '999' },
    minimumLegalAge: 18,
    compliance: { dataLocalization: false, paymentRegion: 'qa', contentModerationLevel: 'standard' },
    featureAvailability: { circles: true, experiences: true, messaging: true, premiumMembership: true },
  },
  KW: {
    country: 'Kuwait',
    countryCode: 'KW',
    region: REGIONS.GCC,
    primaryLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    currency: 'KWD',
    currencySymbol: 'د.ك',
    timezone: 'Asia/Kuwait',
    dateFormat: 'day-first',
    timeFormat: '12h',
    measurementUnits: 'metric',
    emergencyNumbers: { police: '112', ambulance: '112', fire: '112' },
    minimumLegalAge: 18,
    compliance: { dataLocalization: false, paymentRegion: 'kw', contentModerationLevel: 'standard' },
    featureAvailability: { circles: true, experiences: true, messaging: true, premiumMembership: true },
  },
  BH: {
    country: 'Bahrain',
    countryCode: 'BH',
    region: REGIONS.GCC,
    primaryLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    currency: 'BHD',
    currencySymbol: '.د.ب',
    timezone: 'Asia/Bahrain',
    dateFormat: 'day-first',
    timeFormat: '12h',
    measurementUnits: 'metric',
    emergencyNumbers: { police: '999', ambulance: '999', fire: '999' },
    minimumLegalAge: 18,
    compliance: { dataLocalization: false, paymentRegion: 'bh', contentModerationLevel: 'standard' },
    featureAvailability: { circles: true, experiences: true, messaging: true, premiumMembership: true },
  },
  OM: {
    country: 'Oman',
    countryCode: 'OM',
    region: REGIONS.GCC,
    primaryLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    currency: 'OMR',
    currencySymbol: 'ر.ع.',
    timezone: 'Asia/Muscat',
    dateFormat: 'day-first',
    timeFormat: '12h',
    measurementUnits: 'metric',
    emergencyNumbers: { police: '9999', ambulance: '9999', fire: '9999' },
    minimumLegalAge: 18,
    compliance: { dataLocalization: false, paymentRegion: 'om', contentModerationLevel: 'standard' },
    featureAvailability: { circles: true, experiences: true, messaging: true, premiumMembership: true },
  },
};

/**
 * Fallback configuration used when a member's country has no explicit entry.
 * Safe, neutral defaults so the platform never crashes on an unknown region.
 * New countries inherit these defaults until a specific entry is added.
 */
export const DEFAULT_COUNTRY_CONFIG = {
  country: 'Global',
  countryCode: 'XX',
  region: REGIONS.GLOBAL,
  primaryLanguage: 'en',
  supportedLanguages: ['en'],
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'UTC',
  dateFormat: 'day-first',
  timeFormat: '12h',
  measurementUnits: 'metric',
  emergencyNumbers: { police: '112', ambulance: '112', fire: '112' },
  minimumLegalAge: 18,
  compliance: { dataLocalization: false, paymentRegion: 'global', contentModerationLevel: 'standard' },
  featureAvailability: { circles: true, experiences: true, messaging: true, premiumMembership: true },
};