import { queryClientInstance } from '@/lib/query-client';
import { App } from '@capacitor/app';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  loadSupabaseConnections,
  sendSupabasePalRequest,
  respondSupabasePalRequest,
  cancelSupabasePalRequest,
  removeSupabasePalConnection,
} from '@/lib/supabase-connections';
import { useSupabase } from '@/config/supabase-config';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

// Module-level shared store so every screen (Pals, Connected Profile, Discover)
// sees the same connection/request state and updates in real time.
let store = { error: false, incoming: [], outgoing: [], connections: [], loading: true };
const listeners = new Set();
let inFlight = null;
let activeUser = null;
let subscribed = false;
let automaticRefreshAt = 0;
const AUTOMATIC_REFRESH_INTERVAL = 45_000;

function emit() { for (const l of listeners) l(store); }
function set(partial) { store = { ...store, ...partial }; emit(); }

// MP-008 — Relative time now resolved in the component layer (RequestCard)
// via the centralized Localization Service. The store keeps the raw date so
// each language formats it natively.
function relTime(d) {
  return d || '';
}

export function mapIncoming(r) {
  return {
    id: r.id,
    raw: r,
    name: r.sender_name,
    avatar: r.sender_avatar,
    sharedInterests: r.mutual_interests || [],
    // Only show a mutual experience count when there is a confirmed shared experience
    mutualExperiences: r.experience_title ? 1 : 0,
    sharedExperience: r.experience_title || '',
    requestDate: relTime(r.created_date),
    type: 'incoming',
    status: r.status,
  };
}

export function mapOutgoing(r) {
  return {
    id: r.id,
    raw: r,
    name: r.receiver_name,
    avatar: r.receiver_avatar,
    sharedInterests: r.mutual_interests || [],
    // Only show a mutual experience count when there is a confirmed shared experience
    mutualExperiences: r.experience_title ? 1 : 0,
    sharedExperience: r.experience_title || '',
    requestDate: relTime(r.created_date),
    type: 'outgoing',
    status: r.status,
  };
}

export function mapConnection(c) {
  return {
    id: c.id,
    raw: c,
    name: c.pal_name,
    avatar: c.pal_avatar,
    city: c.pal_city || '',
    sharedInterests: c.mutual_interests || [],
    // Use real count from entity; 0 is correct when no shared experiences are recorded
    mutualExperiences: c.mutual_experiences_count || 0,
    lastExperienceTogether: c.last_experience_title || '',
    lastExperienceDate: c.connected_date || '',
    pal_user_id: c.pal_user_id,
    connectedDate: c.connected_date,
    lastActivityAt: c.last_activity_at || c.updated_date,
    updatedDate: c.updated_date,
  };
}

export async function loadConnections(user, { force = false } = {}) {
  if (!user?.id) { activeUser = null; set({ loading: false, incoming: [], outgoing: [], connections: [] }); return; }
  const changedUser = activeUser?.id !== user.id;
  if (changedUser) set({ loading: true, incoming: [], outgoing: [], connections: [] });
  activeUser = user;
  const uid = String(user.id);
  if (inFlight) {
    if (!force && !changedUser) return inFlight;
    await inFlight;
    if (activeUser?.id !== user.id) return;
  }
  inFlight = (async () => {
    set({ loading: true, error: false });
    try {
      if (useSupabase) {
        const data = await loadSupabaseConnections(uid);
        if (activeUser?.id === user.id) set({ ...data, loading: false });
        return;
      }
      const [incoming, outgoing, connections] = await Promise.all([
        base44.entities.PalRequest.filter({ receiver_user_id: uid, status: 'pending' }, '-created_date', 100).catch(() => []),
        base44.entities.PalRequest.filter({ sender_user_id: uid }, '-created_date', 100).catch(() => []),
        // Server-created records use a service role for created_by_id; user_id
        // is the authoritative owner field for connection state.
        base44.entities.PalConnection.filter({ user_id: uid, is_active: true }, '-updated_date', 200).catch(() => []),
      ]);

      // Reconcile: if an outgoing request was accepted by the receiver, ensure a
      // PalConnection exists on this (sender) side too — both members become pals.
      let conns = connections || [];
      const accepted = (outgoing || []).filter((r) => r.status === 'accepted' && r.receiver_user_id);
      const toCreate = [];
      for (const r of accepted) {
        const exists = conns.some((c) => c.pal_user_id === r.receiver_user_id && c.is_active !== false);
        if (!exists) {
          toCreate.push({
            user_id: uid,
            pal_user_id: r.receiver_user_id,
            pal_name: r.receiver_name,
            pal_avatar: r.receiver_avatar || '',
            pal_city: '',
            first_experience_title: r.experience_title || '',
            mutual_experiences_count: 1,
            mutual_interests: r.mutual_interests || [],
            last_experience_title: r.experience_title || '',
            last_activity_at: new Date().toISOString(),
            connected_date: new Date().toISOString().slice(0, 10),
            is_active: true,
          });
        }
      }
      if (toCreate.length) {
        try {
          const created = await base44.entities.PalConnection.bulkCreate(toCreate);
          conns = [...conns, ...created];
        } catch { /* ignore */ }
      }

      set({ incoming: incoming || [], outgoing: outgoing || [], connections: conns, loading: false });
    } catch {
      if(activeUser?.id===user.id)set({ loading: false, error: true, incoming: [], outgoing: [], connections: [] });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export async function sendRequest({ user, receiver, experienceId, experienceTitle, mutualInterests, message }) {
  if (!user?.id || !receiver?.id) return { request: null, error: 'A valid account is required.' };
  // A profile's id is the Member entity id, not an authentication-user id.
  // The server resolves that entity to its canonical account owner.  Keep the
  // old receiverId field for compatibility with older deployed functions.
  const targetMemberId = String(receiver.memberId || receiver.id);
  if (useSupabase) {
    try {
      const req = await sendSupabasePalRequest(targetMemberId, message);
      if (!req?.id) throw new Error('The server did not confirm this connection request.');
      const authoritative = {
        ...req,
        receiver_user_id: req.receiver_id || targetMemberId,
        receiver_name: receiver.name,
        receiver_avatar: receiver.avatar || '',
        mutual_interests: mutualInterests || [],
        created_date: req.created_at,
      };
      set({
        outgoing: [
          authoritative,
          ...(store.outgoing || []).filter((row) => row.id !== req.id),
        ],
      });
      // Reconcile after the authoritative row is visible. An earlier screen
      // load may still be in flight, so the optimistic server row remains the
      // immediate cross-screen source of truth.
      await loadConnections(user, { force: true });
      trackProductEvent(PRODUCT_EVENTS.CONNECTION_REQUEST_SENT);
      return { request: req, error: '' };
    } catch (error) {
      return { request: null, error: error?.message || 'Connection request failed.' };
    }
  }
  try {
    // SEC-001A — server-side authorization (quota + block isolation).
    const res = await base44.functions.invoke('authorizationGate', {
      action: 'requestConnection',
      targetMemberId,
      receiverId: targetMemberId,
      receiverName: receiver.name,
      receiverAvatar: receiver.avatar || '',
      experienceId: experienceId ? String(experienceId) : '',
      experienceTitle: experienceTitle || '',
      mutualInterests: mutualInterests || [],
      message: message || '',
    });
    const payload = res?.data || res || {};
    const req = payload.request;
    if (!req) {
      const diagnostic = await base44.functions.invoke('authorizationGate', {
        action: 'diagnoseConnection', targetMemberId, receiverId: targetMemberId,
      }).catch(() => null);
      const stage = diagnostic?.data?.stage || diagnostic?.stage;
      return { request: null, error: stage ? `Connection diagnostic: ${stage}` : (payload.message || payload.error || 'The request was not accepted by the server.') };
    }
    set({ outgoing: [req, ...(store.outgoing || [])] });
    trackProductEvent(PRODUCT_EVENTS.CONNECTION_REQUEST_SENT);
    return { request: req, error: '' };
  } catch (error) {
    const body = error?.response?.data || error?.data || {};
    const diagnostic = await base44.functions.invoke('authorizationGate', {
      action: 'diagnoseConnection', targetMemberId, receiverId: targetMemberId,
    }).catch(() => null);
    const stage = diagnostic?.data?.stage || diagnostic?.stage;
    return { request: null, error: stage ? `Connection diagnostic: ${stage}` : (body.message || body.error || error?.message || 'Connection request failed.') };
  }
}

export async function cancelRequest(request, user = activeUser) {
  const requestId = request?.id || request?.raw?.id;
  if (!requestId) throw new Error('This request is no longer pending. Refresh and try again.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('You appear to be offline. Reconnect and try again.');
  if (useSupabase) {
    const cancelled = await cancelSupabasePalRequest(requestId);
    if (!cancelled?.id || cancelled.status !== 'cancelled') throw new Error('The server did not confirm cancellation.');
    set({ outgoing: store.outgoing.filter((r) => r.id !== requestId) });
    if (user) await loadConnections(user, { force: true });
    return cancelled;
  }
  try {
    await base44.functions.invoke('authorizationGate', {
      action: 'cancelConnectionRequest',
      requestId: request.id,
    });
  } catch {}
  set({ outgoing: store.outgoing.map((r) => (r.id === request.id ? { ...r, status: 'cancelled' } : r)) });
}

export async function acceptRequest(request, user) {
  const requestId = request?.id || request?.raw?.id;
  if (!requestId) throw new Error('This connection request is no longer available. Refresh the profile.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('You appear to be offline. Reconnect and try again.');
  if (useSupabase) {
    const accepted = await respondSupabasePalRequest(requestId, true);
    if (accepted?.id !== requestId || accepted.status !== 'accepted') throw new Error('The server did not confirm acceptance.');
    await loadConnections(user, { force: true });
    await queryClientInstance.invalidateQueries({queryKey:['memberProfile']});
    await queryClientInstance.invalidateQueries({queryKey:['discovery']});
    trackProductEvent(PRODUCT_EVENTS.CONNECTION_ACCEPTED);
    trackProductEvent(PRODUCT_EVENTS.NEW_PAL_CREATED);
    return;
  }
  // SEC-001A — server-side block check + connection creation.
  let conn = null;
  try {
    const res = await base44.functions.invoke('authorizationGate', {
      action: 'acceptConnection',
      requestId,
    });
    conn = res?.data?.connection || null;
  } catch {}
  trackProductEvent(PRODUCT_EVENTS.CONNECTION_ACCEPTED);
  if (conn) trackProductEvent(PRODUCT_EVENTS.NEW_PAL_CREATED);
  set({
    incoming: store.incoming.filter((r) => r.id !== request.id),
    connections: conn ? [conn, ...(store.connections || [])] : store.connections,
  });
}

export async function declineRequest(request) {
  const requestId = request?.id || request?.raw?.id;
  if (!requestId) throw new Error('This connection request is no longer available. Refresh the profile.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('You appear to be offline. Reconnect and try again.');
  if (useSupabase) {
    const declined = await respondSupabasePalRequest(requestId, false);
    if (declined?.id !== requestId || declined.status !== 'declined') throw new Error('The server did not confirm decline.');
    set({ incoming: store.incoming.filter((r) => r.id !== requestId) });
    if (activeUser) await loadConnections(activeUser, { force: true });
    trackProductEvent(PRODUCT_EVENTS.CONNECTION_DECLINED);
    return;
  }
  try {
    await base44.functions.invoke('authorizationGate', {
      action: 'rejectConnection',
      requestId: request.id,
    });
  } catch {}
  trackProductEvent(PRODUCT_EVENTS.CONNECTION_DECLINED);
  set({ incoming: store.incoming.filter((r) => r.id !== request.id) });
}

export async function removeConnection(connection) {
  if (useSupabase) {
    await removeSupabasePalConnection(connection.pal_id || connection.pal_user_id);
    set({ connections: store.connections.filter((c) => c.id !== connection.id) });
    return;
  }
  try { await base44.entities.PalConnection.update(connection.id, { is_active: false }); } catch {}
  set({ connections: store.connections.filter((c) => c.id !== connection.id) });
}

function ensureSubscribed() {
  if (useSupabase) {
    if (subscribed) return;
    subscribed = true;
    // Focus, visibility, native resume, and the interval can arrive together.
    // They are all automatic refreshes, so share one 45-second guard. Explicit
    // connection actions continue to call loadConnections immediately.
    const refresh = () => {
      if (!activeUser || !listeners.size || document.hidden) return;
      const now = Date.now();
      if (now - automaticRefreshAt < AUTOMATIC_REFRESH_INTERVAL) return;
      automaticRefreshAt = now;
      void loadConnections(activeUser, { force: true });
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('nmood:notifications-changed', refresh);
    window.setInterval(refresh, AUTOMATIC_REFRESH_INTERVAL);
    App.addListener('appStateChange', ({ isActive }) => { if (isActive) refresh(); }).catch(() => {});
    return;
  }
  if (subscribed) return;
  subscribed = true;
  try { base44.entities.PalRequest.subscribe(() => { if (activeUser) loadConnections(activeUser); }); } catch {}
  try { base44.entities.PalConnection.subscribe(() => { if (activeUser) loadConnections(activeUser); }); } catch {}
}

export function useConnections(user) {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  useEffect(() => {
    loadConnections(user);
    ensureSubscribed();
  }, [user?.id]);
  return store;
}
