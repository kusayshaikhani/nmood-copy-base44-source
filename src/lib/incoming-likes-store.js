import { useEffect, useState } from 'react';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const state = { uid: null, total: 0, unread: 0, likes: [], premium: false, loading: false };
const subscribers = new Set();
let inFlight = null;
let refreshQueued = false;
let timer = null;
let installed = false;

const emit = () => subscribers.forEach((listener) => listener());
const set = (patch) => { Object.assign(state, patch); emit(); };

export async function refreshIncomingLikes() {
  if (!state.uid) return state;
  // A Like-back can finish while the initial screen read is still in flight.
  // Queue one fresh read so that older response cannot put the resolved Like
  // back on screen after the match is created.
  if (inFlight) { refreshQueued = true; return inFlight; }
  const uid = state.uid;
  set({ loading: true });
  inFlight = callSupabaseRpc('nmood_get_my_likes_summary')
    .then((result) => {
      if (state.uid === uid) {
        set({
          total: Number(result?.total) || 0,
          unread: Number(result?.unread_count) || 0,
          likes: Array.isArray(result?.likes) ? result.likes : [],
          premium: result?.premium === true,
          loading: false,
        });
      }
      return state;
    })
    .catch(() => {
      if (state.uid === uid) set({ loading: false });
      return state;
    })
    .finally(() => {
      inFlight = null;
      if (refreshQueued) {
        refreshQueued = false;
        void refreshIncomingLikes();
      }
    });
  return inFlight;
}

export async function markIncomingLikesSeen() {
  if (!state.uid) return;
  // Finish any summary read first so a stale response cannot restore the
  // unread badge after this acknowledgement has completed.
  if (inFlight) await inFlight;
  await callSupabaseRpc('nmood_mark_my_likes_seen').catch(() => null);
  if (state.uid) set({ unread: 0 });
}

function bind(user) {
  const uid = user?.id ? String(user.id) : null;
  if (state.uid !== uid) set({ uid, total: 0, unread: 0, likes: [], premium: false, loading: !!uid });
  if (!uid) return;
  if (!installed) {
    window.addEventListener('nmood:likes-changed', refreshIncomingLikes);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void refreshIncomingLikes(); });
    installed = true;
  }
  if (!timer) timer = window.setInterval(() => { if (!document.hidden) void refreshIncomingLikes(); }, 30_000);
  void refreshIncomingLikes();
}

export function useIncomingLikes() {
  const { user } = useAuth();
  const [, render] = useState(0);
  useEffect(() => { const listener = () => render((v) => v + 1); subscribers.add(listener); return () => subscribers.delete(listener); }, []);
  useEffect(() => bind(user), [user?.id]);
  return { ...state, refresh: refreshIncomingLikes };
}
