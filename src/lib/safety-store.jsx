import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { callSupabaseRpc, getMyMemberBlocks } from '@/api/supabaseClient';
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
      const records = await getMyMemberBlocks();
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

  const blockedList = Array.isArray(blocked) ? blocked : [];
  const blockedIds = useMemo(() => new Set(blockedList.map((b) => String(b.blocked_member_id))), [blockedList]);

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
        await callSupabaseRpc('block_member', { p_member_id: String(member.id) });
        await load();
      } catch {
        // best-effort — the confirmation UI still shows
      }
    },
    [isBlocked, load]
  );

  const unblock = useCallback(
    async (blockedUserId) => {
      setBlocked((prev) => prev.filter((b) => String(b.blocked_member_id) !== String(blockedUserId)));
      try {
        await callSupabaseRpc('unblock_member', { p_member_id: String(blockedUserId) });
      } catch {
        await load();
      }
    },
    [blocked, load]
  );

  // Reporting stays unavailable in the independent preview until its
  // moderation workflow is ported. It must never fall back to the old stack.
  const report = useCallback(async () => {
    throw new Error('Reporting is being moved to Nmood’s new safety service.');
  }, []);

  const value = { blocked, blockedIds, isBlocked, block, unblock, report, loading, refresh: load };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider');
  return ctx;
}
