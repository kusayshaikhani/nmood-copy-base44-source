// Android-only proof-bound Apple flow. No provider tokens in URLs or persistent storage.
export const ANDROID_APPLE_SERVICE = 'com.nmood.app.web';
export const ANDROID_APPLE_CALLBACK = 'https://vudvrofhxwopgbldunky.supabase.co/functions/v1/apple-android-callback';
const HEX = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const bytesToHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const random = () => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
const hash = async s => bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));
const error = code => Object.assign(new Error('Apple sign-in could not be completed. Reference: ' + code + '.'), { code });
export function parseAndroidAppleHandoff(raw) {
  try {
    if (typeof raw !== 'string') return null;
    // Some Android WebViews parse non-special schemes as opaque paths, with
    // an empty hostname. Match the exact native route before parsing its query.
    let params;
    const native = /^nmood:\/\/apple-auth\/callback\?([^#]*)$/.exec(raw);
    if (native) {
      params = new URLSearchParams(native[1]);
    } else {
      const url = new URL(raw);
      if (url.username || url.password || url.port || url.origin !== 'https://app.nmood.app' ||
          url.pathname !== '/apple-android-return/' || url.search) return null;
      params = new URLSearchParams(url.hash.slice(1));
    }
    const id = params.get('transaction'), ticket = params.get('ticket');
    if ([...params.keys()].length !== 2 || !UUID.test(id) || !HEX.test(ticket)) return null;
    return { transactionId: id, ticket };
  } catch { return null; }
}
// Match the bounded native Google attempt. A browser/Custom Tab that cannot
// return control must never leave Android's sign-in screen indefinitely busy.
export function createAndroidAppleFlow({ app, browser, request = fetch, timeoutMs = 120000, closeGraceMs = 1500 }) {
  let busy = false;
  return async () => {
    if (busy) throw error('NMA-ANDROID-BUSY');
    busy = true;
    let rawNonce = random(), verifier = random();
    let transactionId = null, settled = false, redeeming = false, timer, closeTimer;
    const handles = [], controllers = new Set();
    let resolveResult, rejectResult;
    const result = new Promise((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
    // Attach immediately: cancellation may occur before browser.open resolves.
    result.catch(() => {});
    const fail = code => { if (!settled) { settled = true; rejectResult(error(code)); } };
    const post = async (route, body) => {
      const controller = new AbortController(); controllers.add(controller);
      const deadline = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await request(ANDROID_APPLE_CALLBACK + route, { method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw error(payload?.error === 'CANCELLED' ? 'NMA-ANDROID-CANCEL' : 'NMA-ANDROID-RESPONSE');
        return payload;
      } finally { clearTimeout(deadline); controllers.delete(controller); }
    };
    try {
      handles.push(await app.addListener('appUrlOpen', async ({ url }) => {
        const handoff = parseAndroidAppleHandoff(url);
        if (!handoff || handoff.transactionId !== transactionId || settled || redeeming) return;
        clearTimeout(closeTimer);
        redeeming = true;
        try {
          const response = await post('/redeem', { ...handoff, verifier });
          if (typeof response.idToken !== 'string' || !response.idToken || response.idToken.length > 16384) throw error('NMA-ANDROID-RESPONSE');
          if (!settled) { settled = true; resolveResult({ idToken: response.idToken, rawNonce }); }
        } catch (cause) { fail(cause?.code === 'NMA-ANDROID-CANCEL' ? cause.code : 'NMA-ANDROID-RESPONSE'); }
      }));
      // Custom Tab closure and appUrlOpen are separate bridge events. Closing
      // the tab on a successful app handoff is not an immediate cancellation.
      handles.push(await browser.addListener('browserFinished', () => {
        if (!settled && !redeeming && !closeTimer) {
          closeTimer = setTimeout(() => { if (!redeeming) fail('NMA-ANDROID-CANCEL'); }, closeGraceMs);
        }
      }));
      timer = setTimeout(() => fail('NMA-ANDROID-TIMEOUT'), timeoutMs);
      const response = await post('/start', { nonce: await hash(rawNonce), challenge: await hash(verifier) });
      if (!UUID.test(response.transactionId) || response.authorizationUrl !== ANDROID_APPLE_CALLBACK + '/authorize?transaction=' + response.transactionId) throw error('NMA-ANDROID-RESPONSE');
      transactionId = response.transactionId;
      if (!settled) await browser.open({ url: response.authorizationUrl });
      return await result;
    } catch (cause) {
      throw error(/^NMA-ANDROID-(BUSY|CANCEL|TIMEOUT|RESPONSE)$/.test(cause?.code || '') ? cause.code : 'NMA-ANDROID-UNAVAILABLE');
    } finally {
      settled = true; clearTimeout(timer); clearTimeout(closeTimer);
      for (const controller of controllers) controller.abort();
      for (const handle of handles) { try { await handle.remove(); } catch { /* no logging of callback state */ } }
      try { await browser.close(); } catch { /* Android browser close may not be implemented */ }
      rawNonce = null; verifier = null; transactionId = null; busy = false;
    }
  };
}
let flowPromise;
export async function signInWithAndroidAppleHandoff() {
  if (!flowPromise) {
    flowPromise = Promise.all([import('@capacitor/app'), import('@capacitor/browser')])
      .then(([{ App }, { Browser }]) => createAndroidAppleFlow({ app: App, browser: Browser }))
      .catch(cause => { flowPromise = null; throw cause; });
  }
  return (await flowPromise)();
}
