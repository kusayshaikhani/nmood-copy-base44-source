import { withTimeout } from './bounded-operation';

export const COUNTRY_SUGGESTION_TIMEOUT_MS = 8000;

// No approved device-only country resolver exists in this repository. Existing
// geocoders transmit coordinates and/or return city/address data: never use them
// here. Future native integration requires review and an explicit source change;
// no global registry, remote fallback, locale/IP inference or plugin auto-discovery.
const APPROVED_DEVICE_RESOLVER = null;

export function createCountrySuggestionRequester(resolver = null, timeoutMs = COUNTRY_SUGGESTION_TIMEOUT_MS) {
 return async function request({ consented = false, countryCodes = [], signal } = {}) {
  if (consented !== true) return { status: 'consent_required' };
  if (signal?.aborted) return { status: 'cancelled' };
  if (resolver?.contract !== 'device-country-only-v1' || resolver?.source !== 'device-local'
   || typeof resolver.requestCountry !== 'function') return { status: 'unavailable' };
  try {
   const code = await withTimeout(async timeoutSignal => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    timeoutSignal.addEventListener('abort', abort, { once: true });
    signal?.addEventListener('abort', abort, { once: true });
    try {
     if (signal?.aborted || timeoutSignal.aborted) controller.abort();
     return await resolver.requestCountry({ signal: controller.signal });
    } finally {
     timeoutSignal.removeEventListener('abort', abort);
     signal?.removeEventListener('abort', abort);
    }
   }, timeoutMs);
   if (signal?.aborted) return { status: 'cancelled' };
   // Accept only a primitive ISO code. Never spread, stringify, render, retain,
   // or forward an object that might carry coordinates or other location data.
   if (typeof code !== 'string' || !/^[A-Z]{2}$/.test(code) || !countryCodes.includes(code)) return { status: 'unavailable' };
   return { status: 'suggested', code };
  } catch (error) {
   if (signal?.aborted) return { status: 'cancelled' };
   if (error?.code === 'TIMEOUT') return { status: 'timeout' };
   if (error?.code === 1 || error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') return { status: 'denied' };
   return { status: 'unavailable' };
  }
 };
}

export const requestDeviceCountrySuggestion = createCountrySuggestionRequester(APPROVED_DEVICE_RESOLVER);
