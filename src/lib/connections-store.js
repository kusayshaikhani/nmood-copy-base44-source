import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

// Module-level shared store so every screen (Pals, Connected Profile, Discover)
// sees the same connection/request state and updates in real time.
let store = { incoming: [], outgoing: [], connections: [], loading: true };
const listeners = new Set();
let inFlight = null;
let activeUser = null;
let subscribed = false;

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

export async function loadConnections(user) {
  if (!user?.id) { set({ loading: false, incoming: [], outgoing: [], connections: [] }); return; }
  activeUser = user;
  const uid = String(user.id);
  if (inFlight) return;
  inFlight = (async () => {
    set({ loading: true });
    try {
      const [incoming, outgoing, connections] = await Promise.all([
        base44.entities.PalRequest.filter({ receiver_user_id: uid, status: 'pending' }, '-created_date', 100).catch(() => []),
        base44.entities.PalRequest.filter({ sender_user_id: uid }, '-created_date', 100).catch(() => []),
        base44.entities.PalConnection.filter({ created_by_id: uid, is_active: true }, '-updated_date', 200).catch(() => []),
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
      set({ loading: false });
    } finally {
      inFlight = null;
    }
  })();
}

export async function sendRequest({ user, receiver, experienceId, experienceTitle, mutualInterests, message }) {
  if (!user?.id || !receiver?.id) return null;
  try {
    // SEC-001A — server-side authorization (quota + block isolation).
    const res = await base44.functions.invoke('authorizationGate', {
      action: 'requestConnection',
      receiverId: String(receiver.id),
      receiverName: receiver.name,
      receiverAvatar: receiver.avatar || '',
      experienceId: experienceId || 0,
      experienceTitle: experienceTitle || '',
      mutualInterests: mutualInterests || [],
      message: message || '',
    });
    const req = res?.data?.request;
    if (!req) return null;
    set({ outgoing: [req, ...(store.outgoing || [])] });
    trackProductEvent(PRODUCT_EVENTS.CONNECTION_REQUEST_SENT);
    return req;
  } catch { return null; }
}

export async function cancelRequest(request) {
  try {
    await base44.functions.invoke('authorizationGate', {
      action: 'cancelConnectionRequest',
      requestId: request.id,
    });
  } catch {}
  set({ outgoing: store.outgoing.map((r) => (r.id === request.id ? { ...r, status: 'cancelled' } : r)) });
}

export async function acceptRequest(request, user) {
  // SEC-001A — server-side block check + connection creation.
  let conn = null;
  try {
    const res = await base44.functions.invoke('authorizationGate', {
      action: 'acceptConnection',
      requestId: request.id,
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
  try { await base44.entities.PalConnection.update(connection.id, { is_active: false }); } catch {}
  set({ connections: store.connections.filter((c) => c.id !== connection.id) });
}

function ensureSubscribed() {
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
    return () => listeners.delete(fn);
  }, []);
  useEffect(() => {
    loadConnections(user);
    ensureSubscribed();
  }, [user?.id]);
  return store;
}