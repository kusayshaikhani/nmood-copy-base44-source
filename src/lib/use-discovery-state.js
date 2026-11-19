import {useCallback, useEffect, useState} from 'react';

const resetEvent='nmood:discovery-reset';
const cleared={kind:'all',filters:{},text:'',dismissed:[],view:'cards',search:'',activeFilter:'for_you',typeFilter:'All',advancedFilters:null,peopleFilters:{},sort:'recent',selected:''};
const prefix = 'nmood:discovery:v1:';
function read(key, fallback) {
  if (!key) return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw || raw.length > 12000) return fallback;
    const parsed=JSON.parse(raw);
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:fallback;
  } catch { return fallback; }
}

// Store user-selected UI state only, never results, authorization, or request IDs.
// A new account gets its own state and all results are fetched under its live scope.
export function useDiscoveryState(actor, surface, initial) {
  const key = actor ? `${prefix}${actor}:${surface}` : null;
  const [entry, setEntry] = useState(() => ({key, value: read(key, initial)}));
  const value = entry.key === key ? entry.value : read(key, initial);
  const setValue = useCallback(update => setEntry(previous => {
    const current = previous.key === key ? previous.value : read(key, initial);
    return {key, value: typeof update === 'function' ? update(current) : update};
  }), [key, initial]);
  useEffect(() => {
    if (key && entry.key === key) {
      try { sessionStorage.setItem(key, JSON.stringify(entry.value)); } catch { /* Storage may be disabled. */ }
    }
  }, [key, entry]);
  useEffect(()=>{const reset=event=>{if(event.detail===actor)setEntry({key,value:cleared});};window.addEventListener(resetEvent,reset);return()=>window.removeEventListener(resetEvent,reset);},[actor,key]);
  return [value, setValue];
}

export function clearDiscoveryState(actor) {
  if (!actor) return;
  try {
    const accountPrefix=`${prefix}${actor}:`;
    for (const key of Object.keys(sessionStorage)) if (key.startsWith(accountPrefix)) sessionStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent(resetEvent,{detail:actor}));
  } catch { /* Storage may be disabled. */ }
}
