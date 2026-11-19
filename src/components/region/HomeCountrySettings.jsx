import CountrySuggestion from './CountrySuggestion';
import React, { useEffect, useState } from 'react';
import { passportAvailable } from '@/lib/passport-contract';

// Server-authorized state only. No generic Premium/admin bypass, local storage,
// location service, or legacy profile inference. Submit is explicit confirmation.
export default function HomeCountrySettings({ initial = {}, countries = [], onSave, setup = false, unavailable = false, revalidating = false, requestCountrySuggestion }) {
 const [draft, setDraft] = useState(() => ({ home_country: initial.home_country || '',
  browse_everywhere: initial.browse_everywhere === true, share_everywhere: initial.share_everywhere === true }));
 const [search, setSearch] = useState('');
 const [countryChoice, setCountryChoice] = useState(0);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [saved, setSaved] = useState(false);
 const [revision, setRevision] = useState(initial.scope_revision ?? null);
 const [passport, setPassport] = useState(initial.passport);
 const [now, setNow] = useState(Date.now());
 const premium = passportAvailable(passport, now);
 // Revalidation may suspend eligibility without changing the consent generation.
 // Keep the country draft, but never keep an older authorization snapshot.
 useEffect(() => { setPassport(initial.passport); }, [initial.passport]);
 useEffect(() => {
  if (!passportAvailable(passport)) return;
  const tick = () => setNow(Date.now());
  const timer = setTimeout(tick, Math.min(2147483647, Math.max(1, Date.parse(passport.valid_until) - Date.now())));
  window.addEventListener('focus', tick);
  return () => { clearTimeout(timer); window.removeEventListener('focus', tick); };
 }, [passport, now]);
 useEffect(() => {
  if (!premium) setDraft(old => ({ ...old, browse_everywhere: false, share_everywhere: false }));
 }, [premium]);
 const change = patch => { setDraft(old => ({ ...old, ...patch })); setSaved(false); setError(''); };
 const chooseCountry = code => {
  setCountryChoice(n => n + 1);
  change({ home_country: code, browse_everywhere: false, share_everywhere: false });
 };
 async function save(event) {
  event.preventDefault(); setError(''); setSaved(false);
  if (!countries.some(country => country.code === draft.home_country)) {
   setError('Choose your Home country to continue.'); return;
  }
  if (revalidating) return;
  if (unavailable) { setError('Country settings are not available yet. Nothing has been saved.'); return; }
  if ((draft.browse_everywhere || draft.share_everywhere) && !passportAvailable(passport)) {
   setError('Global Passport requires a current verified Premium subscription.'); return;
  }
  setBusy(true);
  try {
   const changes = setup ? { home_country: draft.home_country } : { ...draft };
   const result = await onSave(changes, revision, passport?.generation);
   if (result?.needs_confirmation !== false || result.home_country !== draft.home_country
    || Object.keys(changes).some(key => result[key] !== changes[key])
    || !Number.isSafeInteger(result.scope_revision) || result.scope_revision <= (revision ?? 0)) throw new Error('Unconfirmed save');
   setRevision(result.scope_revision); setPassport(result.passport); setSaved(true);
  } catch { setError('Your country settings could not be saved. Your choices are still here. Please retry.'); }
  finally { setBusy(false); }
 }
 const filtered = countries.filter(c => c.code === draft.home_country || c.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) || c.code.toLowerCase() === search.trim().toLowerCase());
 return <form onSubmit={save} className="space-y-4" aria-label="Home country and visibility">
  <h2 className="text-lg font-semibold">Country Strict</h2>
  <p className="text-sm text-muted-foreground">Choose and confirm your Home country. Country Strict covers the full country, not a city or distance radius. We never choose it from your existing profile or location.</p>
  <p className="text-sm text-muted-foreground">Only your confirmed country is saved for this feature. No precise coordinates, city, IP location or location history.</p>
  {unavailable && <p role="status">Country Strict and Global Passport are not yet available. Server protection must be enabled before these choices can be saved or applied.</p>}
  {revalidating && <p role="status">Rechecking country and Premium access. Your choices are kept; Apply is unavailable until confirmed.</p>}
  <fieldset disabled={busy} className="space-y-4">
   <CountrySuggestion countries={countries} onConfirm={chooseCountry} resetKey={countryChoice} requestSuggestion={requestCountrySuggestion}/>
   <label className="block">Search countries<input type="search" className="mt-2 block min-h-11 w-full rounded-xl border p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-600" value={search} onChange={event => setSearch(event.target.value)}/></label>
   <label className="block">Home country<select aria-label="Home country" className="mt-2 block min-h-11 w-full rounded-xl border p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-600" value={draft.home_country} onChange={event => chooseCountry(event.target.value)}>
    <option value="">Choose a country</option>{filtered.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
   </select></label>
   {!filtered.length && <p role="status">No countries match. Try another name or clear your search.</p>}
   {!setup && <section className="space-y-3 rounded-2xl border border-purple-200 p-4" aria-label="Global Passport">
    <h3 className="font-semibold">Global Passport · Premium</h3>
    {!premium && <p>A verified Premium subscription is required. Administrator or founder access does not unlock Passport.</p>}
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" disabled={!premium || unavailable || revalidating} checked={premium && draft.browse_everywhere} onChange={event => change({ browse_everywhere: event.target.checked })}/>Browse Everywhere</label>
    <p className="text-sm text-muted-foreground">Browse eligible people and content abroad only when their owners also have Premium and choose Share Everywhere.</p>
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" disabled={!premium || unavailable || revalidating} checked={premium && draft.share_everywhere} onChange={event => change({ share_everywhere: event.target.checked })}/>Share Everywhere</label>
    <p className="text-sm text-muted-foreground">Let eligible Premium members who choose Browse Everywhere discover you and your confirmed content. Existing privacy and blocking rules still apply.</p>
    <p className="text-sm text-muted-foreground">Both choices start off. After subscription access ends, confirm them again when eligible. Turning a choice off withdraws its global access.</p>
   </section>}
   {initial.home_country && draft.home_country !== initial.home_country && <p role="status">Changing Home country turns both Passport choices off. Your earlier content needs country confirmation again before it appears in discovery.</p>}
   <p className="text-sm">By confirming, you choose this country for Country Strict discovery and sharing.</p>
   <button disabled={unavailable || revalidating} type="submit" className="min-h-11 rounded-full bg-primary px-5 text-primary-foreground disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-600">{busy ? 'Saving…' : error ? 'Retry' : setup ? 'Confirm Home country' : 'Confirm country and save'}</button>
  </fieldset>
  {error && <p role="alert">{error}</p>}{saved && <p role="status">Country settings saved.</p>}
 </form>;
}
