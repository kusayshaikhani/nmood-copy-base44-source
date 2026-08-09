import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Lightweight pub/sub for "activity changed" events (join / leave / create / cancel).
// Any screen can emit; subscribers (Home, Nmood, Calendar, Magic Door) refresh instantly
// without a manual page reload.
let version = 0;
const listeners = new Set();

export function emitActivityChange() {
  version += 1;
  listeners.forEach((l) => l(version));
}

export function useActivityRefresh() {
  const [v, setV] = useState(version);
  useEffect(() => {
    const fn = (nv) => setV(nv);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return v;
}

// Set of experience ids the current user has joined (Attendance status = going).
// Refreshes automatically whenever an activity change is emitted (join / leave).
export function useJoinedExperienceIds() {
  const refreshKey = useActivityRefresh();
  const [ids, setIds] = useState(() => new Set());
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const records = await base44.entities.Attendance.filter({ status: 'going' }, '-created_date', 100);
        if (!active) return;
        setIds(new Set((records || []).map((r) => Number(r.experience_id)).filter((n) => !isNaN(n))));
      } catch {
        /* ignore — keep empty set */
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);
  return ids;
}