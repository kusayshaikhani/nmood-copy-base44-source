import { useContext, useEffect, useRef } from 'react';
import { UNSAFE_LocationContext } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useQueryClient } from '@tanstack/react-query';

export const FEED_INTERVAL = 10 * 60 * 1000;
export const AUTOMATIC_REFRESH_INTERVAL = 45 * 1000;
const clients = new WeakMap();
// One coordinator per QueryClient: route overlaps and multiple Home sections
// share lifecycle listeners and a debounced, cancellation-safe refresh.
export function subscribeFeeds(client, onForeground = () => {}) {
 let state = clients.get(client);
 if (!state) {
  const listeners = new Set();
  let foreground = document.visibilityState !== 'hidden';
  let nativeActive = true;
  let pending;
  let mutationPending = false;
  let lastAutomaticRefreshAt = -AUTOMATIC_REFRESH_INTERVAL;
  let disposed = false;
  const predicate = q => ['discovery', 'nmoodPosts'].includes(q.queryKey[0]);
  const refresh = (event, { automatic = false } = {}) => {
   const isMutation = ['nmood:feed-changed', 'nmood:nmood-posts-changed', 'nmood:access-changed', 'nmood:request-policy-changed'].includes(event?.type);
   const isManual = event?.type === 'nmood:refresh';
   // Returning to a screen, focusing the app, and reconnecting are automatic
   // refreshes. Keep them at least 45 seconds apart. Explicit user refreshes
   // and completed mutations remain immediate.
   if ((automatic || (!isMutation && !isManual)) && Date.now() - lastAutomaticRefreshAt < AUTOMATIC_REFRESH_INTERVAL) return;
   if (automatic || (!isMutation && !isManual)) lastAutomaticRefreshAt = Date.now();
   mutationPending ||= isMutation;
   clearTimeout(pending);
   pending = setTimeout(async () => {
    if (!foreground || disposed) return;
    const force = mutationPending; mutationPending = false;
    // A mutation during the initial load also needs a new request; otherwise
    // React Query would reuse the pre-mutation in-flight promise.
    if (force) await client.cancelQueries({ predicate });
    if (!disposed && foreground) await client.invalidateQueries({ predicate, refetchType: 'active' });
   }, 50);
  };
  const update = () => {
   const next = nativeActive && document.visibilityState !== 'hidden';
   if (next && !foreground) refresh(undefined, { automatic: true });
   foreground = next;
   listeners.forEach(fn => fn(next));
  };
  const visibility = () => update();
  const focus = () => { if (foreground) refresh(undefined, { automatic: true }); };
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('focus', focus);
  window.addEventListener('online', focus);
  const events = ['nmood:refresh', 'nmood:nmood-posts-changed', 'nmood:feed-changed', 'nmood:access-changed', 'nmood:request-policy-changed'];
  events.forEach(event => window.addEventListener(event, refresh));
  let native;
  let nativeEventReceived = false;
  if (Capacitor.isNativePlatform()) {
   void App.addListener('appStateChange', ({ isActive }) => { nativeEventReceived = true; nativeActive = isActive; update(); }).then(handle => { if (disposed) void handle.remove(); else native = handle; }).catch(() => {});
   void App.getState().then(({ isActive }) => { if (!disposed && !nativeEventReceived) { nativeActive = isActive; update(); } }).catch(() => {});
  }
  const interval = setInterval(() => { if (foreground) refresh(undefined, { automatic: true }); }, FEED_INTERVAL);
  state = { listeners, refresh, dispose: () => {
   disposed = true; clearTimeout(pending); clearInterval(interval); void native?.remove();
   document.removeEventListener('visibilitychange', visibility);
   window.removeEventListener('focus', focus); window.removeEventListener('online', focus);
   events.forEach(event => window.removeEventListener(event, refresh));
  } };
  clients.set(client, state);
 }
 state.listeners.add(onForeground);
 return () => { state.listeners.delete(onForeground); if (!state.listeners.size) { state.dispose(); clients.delete(client); } };
}

export function useFeedRefresh(enabled) {
 const client = useQueryClient();
 const location = useContext(UNSAFE_LocationContext)?.location;
 useEffect(() => enabled ? subscribeFeeds(client) : undefined, [client, enabled]);
 // Route keys include returning via Back and navigation to the same screen.
 const previousRoute = useRef(location?.key);
 useEffect(() => {
  if (enabled && previousRoute.current !== location?.key) clients.get(client)?.refresh();
  previousRoute.current = location?.key;
 }, [client, enabled, location?.key]);
}

export function rotateFeed(rows, { people = false, random = Math.random, now = Date.now() } = {}) {
 const unique = [...new Map(rows.filter(row => row?.id != null).map(row => [String(row.id), row])).values()];
 const recent = people ? unique.filter(row => {
  const age = now - Date.parse(row.created_at || row.created_date);
  return age >= 0 && age <= 72 * 60 * 60 * 1000;
 }).sort((a,b) => Date.parse(b.created_at || b.created_date) - Date.parse(a.created_at || a.created_date)) : [];
 const priority = new Set(recent.map(row => String(row.id)));
 const rest = unique.filter(row => !priority.has(String(row.id)));
 for (let i = rest.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [rest[i], rest[j]] = [rest[j], rest[i]];
 }
 return [...recent, ...rest];
}
