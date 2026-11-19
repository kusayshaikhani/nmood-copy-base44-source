import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import PremiumMoment from '@/components/membership/PremiumMoment';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import PassportCountryPicker from './PassportCountryPicker';
import { Globe2, Crown, LockKeyhole } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { COUNTRIES } from '@/lib/master-data';
import { citiesForCountry } from '@/lib/passport/scope';
import { MAIN_PASSPORT, usePassportScope, savePassportPreference } from '@/lib/passport/runtime';
export default function PassportSettings() {
  const { user } = useAuth(); const client = useQueryClient(); const { data, isPending, isError, isFetching, refetch } = usePassportScope();
  const entitlement = useMembershipAccess();
  const checking = isPending || (!data?.premium && (isFetching || entitlement.loading || entitlement.subscriptionPremium));
  const unavailable = isError || (!data?.premium && entitlement.entitlementState === 'unavailable');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [choosingFirst, setChoosingFirst] = useState(false);
  const lock = useRef(false);
  const hintId = useId();
  useEffect(() => { setChoosingFirst(false); }, [user?.id, data?.premium, data?.home_country, data?.active]);
  if (!MAIN_PASSPORT) return null;
  const save = async changes => { if (lock.current) return false; lock.current = true; setSaving(true); setError(''); try { await savePassportPreference(changes, client, user.id); setChoosingFirst(false); return true; } catch { setError('Passport could not be saved. Refresh membership status to confirm your destination, then try again.'); return false; } finally { lock.current = false; setSaving(false); } };
  const country = data?.passport_country || ''; const name = COUNTRIES.find(c => c.iso2 === country)?.name;
  const passportPaused = !checking && !unavailable && !data?.premium && data?.passport_enabled === true && !!country;
  const disabled = saving || checking || unavailable || !data?.premium || !data?.home_country;
  const enabled = data?.active === true || (choosingFirst && !checking && !unavailable && !!data?.premium && !!data?.home_country);
  return <section aria-label="Passport" className="min-w-0 overflow-hidden rounded-card border border-border/50 bg-card shadow-card">
    <header className="flex items-center gap-3 bg-primary/5 px-4 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Globe2 className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h2 className="font-semibold">Passport</h2><p className="text-xs text-muted-foreground">Your next destination, one place at a time</p></div>{data?.premium ? <Crown className="h-5 w-5 shrink-0 text-primary" aria-label="Premium active"/> : !checking && !unavailable && <LockKeyhole className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="Premium required"/>}</header><div className="space-y-4 p-4"><p className="text-xs font-semibold text-primary">{checking ? 'Checking membership…' : unavailable ? 'Membership unavailable' : data?.premium ? 'Premium active · Passport available' : 'Explorer · Passport locked'}</p><p className="text-sm text-muted-foreground">Explore one country, or one city in that country. Switching Passport off returns you to your home country.</p>
    {!data?.premium && !checking && !unavailable && <p>{passportPaused ? `Your saved destination (${name || country}) is paused until Premium is active again. Restore your purchase or upgrade to discover people there.` : 'An active Premium subscription is required to use Passport. Administrator access does not include a subscription.'}</p>}
    <PremiumMoment moment="passport" eligible={!!data && !data.premium && !checking && !unavailable && !isFetching}/>
    <button type="button" className="min-h-11 text-sm text-primary underline" disabled={isFetching} onClick={()=>void refetch()}>{isFetching?'Checking membership…':'Refresh membership status'}</button>
    {data && !data.home_country && <p>Set your home country in your profile first.</p>}
    <label className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-muted/40 p-3"><span className="text-sm font-medium">Passport on</span><span className="flex min-h-11 items-center"><Switch aria-label="Passport on" aria-describedby={hintId} checked={enabled} disabled={disabled} onCheckedChange={value => {
      if (value && !country) { setChoosingFirst(true); setError(''); }
      else if (!value && choosingFirst) setChoosingFirst(false);
      else void save({ passport_enabled: value });
    }}/></span></label>
    <PassportCountryPicker busy={saving} error={error} country={country} disabled={disabled || !enabled} descriptionId={hintId} onSelect={value => save(choosingFirst ? { passport_country: value, passport_enabled: true } : { passport_country: value })}/>
    <p id={hintId} className="text-sm leading-relaxed text-muted-foreground">{passportPaused ? 'Passport is paused, so discovery stays in your home country until Premium is restored.' : !enabled ? 'Turn on Passport to choose a destination.' : choosingFirst ? 'Choose a destination to activate Passport. Until then, discovery stays in your home country.' : 'Choose a country to update your Passport destination.'}</p>
    {country && <label className="block space-y-2 text-sm font-medium">Destination city<select aria-label="Destination city" className="block min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm" value={data?.passport_city || ''} disabled={disabled || !enabled} onChange={e => save({ passport_city: e.target.value || null })}>
      <option value="">All cities in {name}</option>{citiesForCountry(country).map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
    </select></label>}
    {saving && <p role="status" className="text-sm text-muted-foreground">Saving Passport settings…</p>}
    {(error || isError) && <p role="alert" className="text-sm leading-relaxed text-destructive">{error || 'Country settings could not be loaded.'}</p>}
    <p className="text-xs text-muted-foreground">{data?.active ? `Discovering ${name || country}${data?.passport_city ? ' · selected city' : ' · all cities'}` : passportPaused ? 'Passport is paused. Discovery stays in your home country.' : 'Passport is off. Discovery stays in your home country.'}</p>
  </div></section>;
}
