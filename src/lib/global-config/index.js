/**
 * ACR-001 Global Configuration Framework — Resolver & Helpers
 *
 * Country-aware (not country-specific) entry point. Returns the active
 * regional configuration for a given member/context and exposes typed helpers.
 *
 * This module is additive foundation work. Existing screens, workflows,
 * business rules, and database schemas are unchanged. New country-aware
 * features may consume these helpers; nothing is forced to migrate today.
 */

import { COUNTRY_CONFIGS, DEFAULT_COUNTRY_CONFIG, REGIONS } from './countries';

export { REGIONS, COUNTRY_CONFIGS, DEFAULT_COUNTRY_CONFIG };

/** Launch-market default — UAE for the RC1 GCC launch. */
export const LAUNCH_COUNTRY_CODE = 'AE';

/**
 * Resolve a country config by ISO alpha-2 code.
 * Falls back to DEFAULT_COUNTRY_CONFIG for unknown codes (no crash).
 */
export function getCountryConfig(countryCode) {
  if (!countryCode) return DEFAULT_COUNTRY_CONFIG;
  return COUNTRY_CONFIGS[String(countryCode).toUpperCase()] || DEFAULT_COUNTRY_CONFIG;
}

/**
 * Resolve the active config for a member. Priority:
 *   1. member.country (ISO-2 or display name) — matched against configs
 *   2. LAUNCH_COUNTRY_CODE (RC1 default)
 * This keeps the platform country-aware per-user without hardcoding globally.
 */
export function getActiveConfig(member) {
  if (member?.country) {
    const code = String(member.country).trim();
    // Direct ISO-2 match
    if (COUNTRY_CONFIGS[code.toUpperCase()]) return COUNTRY_CONFIGS[code.toUpperCase()];
    // Display-name match (case-insensitive)
    const byName = Object.values(COUNTRY_CONFIGS).find(
      (c) => c.country.toLowerCase() === code.toLowerCase(),
    );
    if (byName) return byName;
  }
  return getCountryConfig(LAUNCH_COUNTRY_CODE);
}

/* --- Typed helpers (consume the resolved config) --- */

export function getCurrency(member) {
  return getActiveConfig(member).currency;
}
export function getCurrencySymbol(member) {
  return getActiveConfig(member).currencySymbol;
}
export function getTimezone(member) {
  return getActiveConfig(member).timezone;
}
export function getDateFormat(member) {
  return getActiveConfig(member).dateFormat;
}
export function getTimeFormat(member) {
  return getActiveConfig(member).timeFormat;
}
export function getMeasurementUnits(member) {
  return getActiveConfig(member).measurementUnits;
}
export function getPrimaryLanguage(member) {
  return getActiveConfig(member).primaryLanguage;
}
export function getSupportedLanguages(member) {
  return getActiveConfig(member).supportedLanguages;
}
export function getEmergencyNumbers(member) {
  return getActiveConfig(member).emergencyNumbers;
}
export function getMinimumLegalAge(member) {
  return getActiveConfig(member).minimumLegalAge;
}
export function getComplianceSettings(member) {
  return getActiveConfig(member).compliance;
}
export function getRegion(member) {
  return getActiveConfig(member).region;
}

/**
 * Feature availability gate. Returns true for features enabled in the member's
 * country. Unknown feature keys default to true (fail open) so new features do
 * not silently disappear; explicitly disable via the country's config.
 */
export function isFeatureAvailable(feature, member) {
  const cfg = getActiveConfig(member);
  const fa = cfg.featureAvailability || {};
  return fa[feature] !== false;
}

/** True when the member's country is in the GCC launch region. */
export function isGCCMarket(member) {
  return getRegion(member) === REGIONS.GCC;
}

/** List all configured country codes (for future country pickers / expansion). */
export function listAvailableCountries() {
  return Object.values(COUNTRY_CONFIGS).map((c) => ({
    code: c.countryCode,
    name: c.country,
    region: c.region,
  }));
}