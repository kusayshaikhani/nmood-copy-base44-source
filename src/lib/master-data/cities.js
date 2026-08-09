// Master City Dataset — scalable, country-grouped source of truth for all
// city references across the recommendation filter system (concierge, people
// discovery, experiences). Extend by adding entries here; every filter UI
// derives from this list so the product is regionally scalable, not demo-
// limited or UAE-only.
//
// `key` is a stable slug (use for storage/matching); `name` is the display
// label used in filter chips and autocomplete. `country_code` is ISO 3166-1
// alpha-2 so cities can be grouped or filtered by country later.

export const CITIES = [
  // ── United Arab Emirates ──
  { key: 'dubai', name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  { key: 'abu_dhabi', name: 'Abu Dhabi', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  { key: 'sharjah', name: 'Sharjah', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  { key: 'ajman', name: 'Ajman', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  { key: 'fujairah', name: 'Fujairah', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  { key: 'ras_al_khaimah', name: 'Ras Al Khaimah', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  { key: 'umm_al_quwain', name: 'Umm Al Quwain', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  { key: 'al_ain', name: 'Al Ain', country: 'United Arab Emirates', country_code: 'AE', region: 'GCC' },
  // ── Qatar ──
  { key: 'doha', name: 'Doha', country: 'Qatar', country_code: 'QA', region: 'GCC' },
  // ── Kuwait ──
  { key: 'kuwait_city', name: 'Kuwait City', country: 'Kuwait', country_code: 'KW', region: 'GCC' },
  // ── Saudi Arabia ──
  { key: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', country_code: 'SA', region: 'GCC' },
  { key: 'jeddah', name: 'Jeddah', country: 'Saudi Arabia', country_code: 'SA', region: 'GCC' },
  // ── Bahrain ──
  { key: 'manama', name: 'Manama', country: 'Bahrain', country_code: 'BH', region: 'GCC' },
  // ── Oman ──
  { key: 'muscat', name: 'Muscat', country: 'Oman', country_code: 'OM', region: 'GCC' },
  // ── Levant & North Africa ──
  { key: 'amman', name: 'Amman', country: 'Jordan', country_code: 'JO', region: 'MENA' },
  { key: 'beirut', name: 'Beirut', country: 'Lebanon', country_code: 'LB', region: 'MENA' },
  { key: 'cairo', name: 'Cairo', country: 'Egypt', country_code: 'EG', region: 'MENA' },
  { key: 'istanbul', name: 'Istanbul', country: 'Türkiye', country_code: 'TR', region: 'MENA' },
  // ── Global hubs ──
  { key: 'london', name: 'London', country: 'United Kingdom', country_code: 'GB', region: 'Global' },
  { key: 'new_york', name: 'New York', country: 'United States', country_code: 'US', region: 'Global' },
  { key: 'singapore', name: 'Singapore', country: 'Singapore', country_code: 'SG', region: 'Global' },
  { key: 'kuala_lumpur', name: 'Kuala Lumpur', country: 'Malaysia', country_code: 'MY', region: 'Global' },
  { key: 'toronto', name: 'Toronto', country: 'Canada', country_code: 'CA', region: 'Global' },
  { key: 'sydney', name: 'Sydney', country: 'Australia', country_code: 'AU', region: 'Global' },
];

export const CITY_NAMES = CITIES.map((c) => c.name);
export const CITY_MAP = Object.fromEntries(CITIES.map((c) => [c.key, c]));
export const CITIES_BY_COUNTRY = CITIES.reduce((acc, c) => {
  (acc[c.country] = acc[c.country] || []).push(c);
  return acc;
}, {});