import { COUNTRIES } from '../master-data/countries';
import { CITIES } from '../master-data/cities';
export function countryCode(value) {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  return COUNTRIES.find(c => [c.key, c.iso2, c.iso3, c.name].some(v => v.toLowerCase() === key))?.iso2 || null;
}
export const citiesForCountry = country => CITIES.filter(c => c.country_code === countryCode(country));
export function cityKey(country, value) {
  if (!value) return null;
  return citiesForCountry(country).find(c => [c.key, c.name].some(v => v.toLowerCase() === String(value).trim().toLowerCase()))?.key || null;
}
export function destinationChange(country) { return { passport_country: countryCode(country), passport_city: null }; }
export function resolveScope(home, preference, premium) {
  const homeCountry = countryCode(home);
  const destination = countryCode(preference?.passport_country);
  const active = !!homeCountry && premium === true && preference?.passport_enabled === true && !!destination;
  return { country: active ? destination : homeCountry, city: active ? cityKey(destination, preference.passport_city) : null, active };
}
export const scopeKey = (actor, scope) => [actor, scope?.country || null, scope?.city || null];
