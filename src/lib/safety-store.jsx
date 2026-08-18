import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Central Trust & Safety store: persisted blocked members + report submissions,
// shared across Discovery, Search, Pals, Messaging and profiles so blocking
// hides a member everywhere in real time.
const SafetyContext = createContext(null);

export function SafetyProvider({ children }) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setBlocked([]);
      setLoading(false);
      return;
    }
    try {
      const records = await base44.entities.BlockedMember.filter({ created_by_id: String(user.id) });
      setBlocked(Array.isArray(records) ? records : []);
    } catch {
      setBlocked([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time sync so blocking on one device surfaces everywhere instantly.
  useEffect(() => {
    if (!user?.id) return;
    const unsub = base44.entities.BlockedMember.subscribe((event) => {
      if (event.type === 'create') setBlocked((prev) => [event.data, ...prev]);
      else if (event.type === 'delete') setBlocked((prev) => prev.filter((b) => b.id !== event.id));
      else if (event.type === 'update') setBlocked((prev) => prev.map((b) => (b.id === event.id ? event.data : b)));
    });
    return unsub;
  }, [user?.id]);

  const blockedList = Array.isArray(blocked) ? blocked : [];
  const blockedIds = useMemo(() => new Set(blockedList.map((b) => String(b.blocked_user_id))), [blockedList]);

  // Self-block guard: a user can never be blocked from their own id, and
  // empty/undefined ids never match. This prevents stale self-block records
  // (from demo data or test runs) from producing false positives.
  const isBlocked = useCallback(
    (id) => {
      if (!id || !user?.id) return false;
      if (String(id) === String(user.id)) return false;
      return blockedIds.has(String(id));
    },
    [blockedIds, user?.id]
  );

  const block = useCallback(
    async (member) => {
      if (!member?.id || isBlocked(member.id)) return;
      try {
        await base44.functions.invoke('authorizationGate', {
          action: 'blockMember',
          targetMemberId: String(member.id),
        });
        await load();
      } catch {
        // best-effort — the confirmation UI still shows
      }
    },
    [isBlocked, load]
  );

  const unblock = useCallback(
    async (blockedUserId) => {
      setBlocked((prev) => prev.filter((b) => String(b.blocked_user_id) !== String(blockedUserId)));
      try {
        await base44.functions.invoke('authorizationGate', {
          action: 'unblockMember',
          targetUserId: String(blockedUserId),
        });
      } catch {
        await load();
      }
    },
    [blocked, load]
  );

  const report = useCallback(async (payload) => {
    try {
      await base44.functions.invoke('authorizationGate', {
        action: 'createSafetyReport',
        target_type: payload.targetType || 'member',
        target_id: payload.targetId ? String(payload.targetId) : '',
        reason: payload.reason || '',
        details: payload.details || '',
        evidence_url: payload.evidenceUrl || '',
        also_blocked: !!(payload.alsoBlock && payload.targetId),
      });
      // createSafetyReport triggers blockMember server-side when also_blocked
      // is true, so no separate client-side block call is needed.
      if (payload.alsoBlock && payload.targetId) await load();
    } catch {
      // best-effort — the confirmation UI still shows
    }
  }, [load]);

  const value = { blocked, blockedIds, isBlocked, block, unblock, report, loading, refresh: load };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider');
  return ctx;
}
