import React, { useEffect, useRef, useState } from 'react';
import { requestDeviceCountrySuggestion } from '@/lib/device-country-suggestion';

const messages = {
 denied: 'Location permission was declined. You can choose your country manually or try again.',
 timeout: 'The country suggestion timed out. Your manual selection is unchanged.',
 unavailable: 'Country suggestion unavailable. No approved device-only country resolver is available. Choose your country manually.',
};

export default function CountrySuggestion({ countries, onConfirm, resetKey, requestSuggestion = requestDeviceCountrySuggestion }) {
 const [status, setStatus] = useState('idle');
 const [suggestedCode, setSuggestedCode] = useState('');
 const pending = useRef(null);
 const sequence = useRef(0);
 const cancel = () => { sequence.current++; pending.current?.abort(); pending.current = null; };
 useEffect(() => {
  cancel(); setStatus('idle'); setSuggestedCode('');
  return cancel;
 }, [resetKey]);
 const manual = () => { cancel(); setSuggestedCode(''); setStatus('idle'); };
 const consent = () => { cancel(); setSuggestedCode(''); setStatus('consent'); };
 async function allow() {
  cancel(); const own = sequence.current;
  const controller = new AbortController(); pending.current = controller;
  setSuggestedCode(''); setStatus('pending');
  let result;
  try { result = await requestSuggestion({ consented: true, countryCodes: countries.map(c => c.code), signal: controller.signal }); }
  catch { result = { status: 'unavailable' }; }
  if (own !== sequence.current || controller.signal.aborted) return;
  pending.current = null;
  // Defense in depth at the form boundary: accept only the code/status pair.
  if (result?.status === 'suggested' && Object.keys(result).length === 2
   && typeof result.code === 'string' && countries.some(c => c.code === result.code)) {
   setSuggestedCode(result.code); setStatus('suggested');
  } else setStatus(['denied', 'timeout'].includes(result?.status) ? result.status : 'unavailable');
 }
 const name = countries.find(c => c.code === suggestedCode)?.name;
 return <section aria-label="Optional country suggestion" className="space-y-3 rounded-xl border p-3">
  <p className="text-sm">Manual selection is always available. A device suggestion is optional and never saves your country automatically.</p>
  {status === 'idle' && <button type="button" className="min-h-11 underline focus-visible:outline" onClick={consent}>Suggest my country</button>}
  {status === 'consent' && <>
   <p>Allow a device-only country suggestion? If supported, your device may ask for location permission. Only a country code may reach this form. No coordinates, city, address, IP location or history are saved, sent or shown. You must confirm the country yourself.</p>
   <button type="button" className="min-h-11 rounded-lg border px-3 focus-visible:outline" onClick={allow}>Allow country suggestion</button>
   <button type="button" className="min-h-11 px-3 underline focus-visible:outline" onClick={manual}>Choose manually</button>
  </>}
  {status === 'pending' && <><p role="status">Requesting a country suggestion…</p><button type="button" className="min-h-11 underline" onClick={manual}>Cancel suggestion</button></>}
  {messages[status] && <><p role="status">{messages[status]}</p><button type="button" className="min-h-11 underline" onClick={consent}>Retry suggestion</button><button type="button" className="min-h-11 px-3 underline" onClick={manual}>Choose manually</button></>}
  {status === 'suggested' && name && <>
   <p role="status">Suggested country: {name}. Nothing has been saved.</p>
   <button type="button" className="min-h-11 rounded-lg border px-3 focus-visible:outline" onClick={() => { const code = suggestedCode; manual(); onConfirm(code); }}>Use {name}</button>
   <button type="button" className="min-h-11 px-3 underline" onClick={consent}>Request another suggestion</button>
   <button type="button" className="min-h-11 underline" onClick={manual}>Choose manually</button>
   <p className="text-sm">Then confirm your Home country below to save it.</p>
  </>}
 </section>;
}
