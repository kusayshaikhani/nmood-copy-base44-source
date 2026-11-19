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
        await callSupabaseRpc('nmood_block_member', { p_member_id: String(member.id) });
        await load();
      } catch (error) { throw error; }
    },
    [isBlocked, load]
  );

  const unblock = useCallback(
    async (blockedUserId) => {
      try {
        await callSupabaseRpc('nmood_unblock_member', { p_member_id: String(blockedUserId) });
        await load();
        return true;
      } catch (error) {
        throw error;
      }
    },
    [load]
  );

  const report = useCallback(async ({ targetType, targetId, reason, details, evidence, alsoBlock, reportedMemberId }) => {
    if (!targetId || !reason) throw new Error('Choose a category before submitting your report.');
    const id = await callSupabaseRpc('nmood_submit_safety_report', {
      p_target_type: targetType === 'member' ? 'profile' : targetType,
      p_target_id: String(targetId), p_category: reason, p_details: details || '', p_evidence: evidence || {},
    });
    if (alsoBlock && reportedMemberId) await block({ id: reportedMemberId });
    return id;
  }, [block]);

  const setConversationMuted = useCallback((scope, conversationId, muted) => callSupabaseRpc('nmood_set_conversation_muted', { p_scope: scope, p_conversation_id: conversationId, p_muted: !!muted }), []);
  const isConversationMuted = useCallback((scope, conversationId) => callSupabaseRpc('nmood_is_conversation_muted', { p_scope: scope, p_conversation_id: conversationId }), []);

  const value = { blocked, blockedIds, isBlocked, block, unblock, report, setConversationMuted, isConversationMuted, loading, refresh: load };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider');
  return ctx;
}
