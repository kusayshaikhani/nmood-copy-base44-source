import {useCountryTestRuntime} from '@/lib/country-verification/runtime';
import GlobalPassport from '@/components/country-verification/GlobalPassport';
import DestinationDiscoveryGate, { DestinationSettings } from './DestinationPassport';
import { passportRuntime } from '@/lib/passport-runtime';
import { COUNTRIES } from '@/lib/master-data';
import { watchRegionRevocation } from '@/lib/region-revocation';
import LegacyContentConfirmation from './LegacyContentConfirmation';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import { REGION_ENABLED, getMyRegion, saveMyRegion } from '@/lib/region-settings';
import HomeCountrySettings from './HomeCountrySettings';

export function RegionControls(props) {
 const countryRuntime=useCountryTestRuntime();
 if(countryRuntime && props.settings)return <GlobalPassport actor={countryRuntime.actor} read={countryRuntime.read} save={countryRuntime.save}/>;
 if (REGION_ENABLED && props.settings) return <DestinationSettings />;
 return <LegacyRegionControls {...props}/>;
}

export function LegacyRegionControls({ children, settings = false, onboarding = false }) {
 const { user, logout } = useAuth();
 const client = useQueryClient();
 const authority = useSyncExternalStore(passportRuntime.subscribe, passportRuntime.getSnapshot);
 const confirmed = authority.ready && authority.actor === user?.id;
 const actor = useRef(user?.id);
 actor.current = user?.id;
 const [state, setState] = useState(null);
 const [error, setError] = useState(false);
 const [refreshing, setRefreshing] = useState(true);
 const [attempt, setAttempt] = useState(0);
 useEffect(() => {
  if (!REGION_ENABLED || !user?.id || !confirmed) return;
  let current = true;
  // Keep an existing form mounted during revalidation so unsaved choices survive.
  // Discovery and Apply remain gated until the authority read completes.
  setRefreshing(true); setError(false);
  getMyRegion(user.id).then(value => { if (current) setState({ ...value, _actor: user.id }); })
   .catch(() => { if (current) setError(true); })
   .finally(() => { if (current) setRefreshing(false); });
  return () => { current = false; };
 }, [user?.id, attempt, confirmed, authority.revision]);
 useEffect(() => {
  if (!REGION_ENABLED || !user?.id || !confirmed) return;
  const refresh = () => setAttempt(a => a + 1);
  const expiry = Date.parse(state?.passport?.valid_until);
  const timer = Number.isFinite(expiry) ? setTimeout(() => {
   window.dispatchEvent(new Event('nmood:passport-entitlement-changed'));
  }, Math.min(2147483647, Math.max(1, expiry - Date.now()))) : null;
  window.addEventListener('nmood:passport-entitlement-changed', refresh);
  window.addEventListener('focus', refresh);
  return () => { clearTimeout(timer); window.removeEventListener('nmood:passport-entitlement-changed', refresh); window.removeEventListener('focus', refresh); };
 }, [user?.id, state?.passport?.valid_until, confirmed]);
 // Optional Passport participation cannot trap the ordinary account/onboarding flow.
 // Only actor-bound server readiness makes country confirmation a prerequisite.
 // Discovery authorization remains enforced separately by RegionLiveBoundary.
 if (onboarding && (!REGION_ENABLED || !confirmed)) return children;
 if (!REGION_ENABLED) return settings ? <section className="p-4">{onboarding && <button onClick={() => logout()}>Sign out</button>}<HomeCountrySettings
  countries={COUNTRIES.map(c => ({ code: c.iso2, name: c.name }))} setup={onboarding} unavailable /></section> : children;
 if (!user?.id) return null;
 if (!confirmed && !state) return <section role="status">Country visibility is unavailable until server confirmation. <button onClick={() => window.dispatchEvent(new Event('focus'))}>Retry</button></section>;
 if (error && (!state || state._actor !== user.id || (!settings && !state.needs_confirmation))) return <section role="alert">Country settings are unavailable. <button onClick={() => setAttempt(a => a + 1)}>Retry</button><button onClick={() => logout()}>Sign out</button></section>;
 if (!state || state._actor !== user.id) return <p role="status">Loading your country settings…</p>;
 if (!settings && !state.needs_confirmation) return refreshing || !confirmed ? <p role="status">Rechecking your country settings…</p> : children;
 return <section className="p-4">{!settings && <button onClick={() => logout()}>Sign out</button>}<HomeCountrySettings key={`${user.id}:${state.scope_revision}:${state.passport?.generation}`} initial={state} countries={state.countries}
  setup={!settings} revalidating={refreshing || error} onSave={async (changes, revision, generation) => {
   if (refreshing || error || state._actor !== user.id) throw new Error('Country authority is being rechecked');
   const saved = await saveMyRegion(changes, revision, client, user.id, generation);
   if (actor.current !== user.id) throw new Error('Session changed');
   setState({ ...saved, _actor: user.id });
   return saved;
  }}/>{error && <p role="alert">Country settings could not be rechecked. Your draft is kept. <button onClick={() => setAttempt(a => a + 1)}>Retry checking</button></p>}{settings && confirmed && !state.needs_confirmation && <LegacyContentConfirmation region={state} onChanged={() => window.dispatchEvent(new Event('nmood:access-changed'))}/>}</section>;
}

function useRegionScope() {
 const { user } = useAuth();
 const client = useQueryClient();
 const [scope, setScope] = useState({ready:false,revision:0});
 useEffect(()=>{
  if(!REGION_ENABLED || !user?.id)return;
  return watchRegionRevocation({userId:user.id,client,onState:value=>setScope({...value,actor:user.id})});
 },[user?.id,client]);
 return {...scope,ready:scope.ready && scope.actor===user?.id};
}
function RegionLiveBoundary({ children, scope }) {
 if(!REGION_ENABLED)return children;
 if(!scope.ready)return <p role="status">{scope.error?'Visibility could not be confirmed. Reconnect to retry.':'Refreshing authorized visibility…'}</p>;
 return <React.Fragment key={scope.revision}>{children}</React.Fragment>;
}

export function LegacyRegionConfirmationGate({ children }) {
 const { pathname } = useLocation();
 const scope = useRegionScope();
 // Safety, support, logout and existing conversation routes are not discovery.
 const relevant = /^\/$|^\/(explore|discover-people|people|pals|nmoods?|inmood|my-experiences|new-to-nmood|circles|experiences|pal|circle|experience|inmood-v2|in-orbit|communities|host)(\/|$)/.test(pathname)
  && !/\/(chat|messages)(\/|$)/.test(pathname);
 return relevant ? <RegionControls><RegionLiveBoundary scope={scope}>{children}</RegionLiveBoundary></RegionControls> : /^\/notifications(\/|$)/.test(pathname) ? <RegionLiveBoundary scope={scope}>{children}</RegionLiveBoundary> : children;
}

export default function RegionConfirmationGate({children}) {
 return REGION_ENABLED ? <DestinationDiscoveryGate>{children}</DestinationDiscoveryGate> : children;
}
