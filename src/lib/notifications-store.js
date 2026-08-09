import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { broadcastChange, onRemoteChange, queueOperation, getQueue, removeFromQueue } from '@/lib/notification-sync';
import { useAuth } from '@/lib/AuthContext';
import {
  UserPlus, Clock, UserCheck, Users, Sparkles, MessageSquare,
  Calendar, Bell, AlertCircle, Mail, Crown, Tag,
} from 'lucide-react';

// PB-006 — Complete Notification Management.
// Read state AND soft-delete state are persisted to the NotificationReadState
// entity (one record per user × notification_key). A module-level cache +
// pub/sub shares data between the Notifications page (full list) and the
// MobileNav badge (unread count) so both update instantly without redundant
// fetches.

const groupOrder = ['today', 'yesterday', 'earlier_this_week', 'older'];
const groupLabels = { today: 'today', yesterday: 'yesterday', earlier_this_week: 'earlier_this_week', older: 'older' };

// ── Module-level shared store ────────────────────────────────────────────────
const _state = {
  items: [],
  loading: true,
  loaded: false,
  readKeys: new Set(),
  deletedKeys: new Set(),
  keyToRecord: new Map(), // notification_key -> NotificationReadState record
  unreadCount: 0,
};

// PB-001 — In-flight operation tracking. These sets contain keys whose
// persistence hasn't been confirmed by a DB reload yet. They override DB
// state during loadNotifications to prevent resurrection (the DB might not
// reflect the change yet). Once the DB confirms, the key is cleared.
const _inFlightReads = new Set();
const _inFlightUnreads = new Set();
const _inFlightDeletes = new Set();
let _broadcastHandler = null;
let _onlineHandler = null;

const _subscribers = new Set();
let _loadingPromise = null;
let _currentUid = null;
let _subsSetup = false;

function notify() {
  _subscribers.forEach((fn) => fn());
}

function setState(partial) {
  Object.assign(_state, partial);
  notify();
}

// ── Timestamp / grouping helpers ────────────────────────────────────────────
function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime();
}

function assignGroup(createdDate) {
  if (!createdDate) return 'older';
  const now = startOfDay(new Date());
  const created = startOfDay(new Date(createdDate));
  const dayMs = 86400000;
  if (created === now) return 'today';
  if (created === now - dayMs) return 'yesterday';
  if (created >= now - dayMs * 7) return 'earlier_this_week';
  return 'older';
}

function relTimestamp(createdDate) {
  if (!createdDate) return '';
  const diff = Date.now() - new Date(createdDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

// ── Entity → notification mappers (unchanged) ───────────────────────────────
function fromPalRequest(r, isIncoming) {
  if (isIncoming && r.status === 'pending') {
    return {
      id: `pr-in-${r.id}`,
      _entityId: r.id,
      _type: 'pal_request',
      _sortTime: r.created_date || r.updated_date || 0,
      tab: 'pals',
      icon: UserPlus,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      title: `${r.sender_name || 'Someone'} sent you a Pal request`,
      description: r.experience_title ? `Shared experience: ${r.experience_title}` : (r.message || 'Wants to be your pal'),
      timestamp: relTimestamp(r.created_date),
      read: false,
      group: assignGroup(r.created_date),
      actions: [
        { label: 'Accept', variant: 'primary', action: 'accept' },
        { label: 'View Profile', variant: 'outline', action: 'view_profile' },
      ],
    };
  }
  if (!isIncoming && r.status === 'accepted') {
    return {
      id: `pr-out-${r.id}`,
      _entityId: r.id,
      _type: 'pal_accepted',
      _sortTime: r.created_date || r.updated_date || 0,
      tab: 'pals',
      icon: UserCheck,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      title: `${r.receiver_name || 'Someone'} accepted your Pal request`,
      description: 'You are now pals',
      timestamp: relTimestamp(r.created_date),
      read: false,
      group: assignGroup(r.created_date),
      actions: [
        { label: 'View Profile', variant: 'primary', action: 'view_profile' },
        { label: 'Send Message', variant: 'outline', action: 'send_message' },
      ],
    };
  }
  return null;
}

function fromCircleInvitation(inv) {
  if (inv.status !== 'pending') return null;
  return {
    id: `ci-${inv.id}`,
    _entityId: inv.id,
    _type: 'circle_invitation',
    _sortTime: inv.created_date || inv.updated_date || 0,
    tab: 'activities',
    icon: Users,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: `${inv.sender_name || 'Someone'} invited you to join ${inv.circle_name || 'a circle'}`,
    description: inv.personal_message || 'Circle invitation',
    timestamp: relTimestamp(inv.created_date),
    read: false,
    group: assignGroup(inv.created_date),
    actions: [
      { label: 'Open Circle', variant: 'primary', action: 'open_circle' },
      { label: 'Decline', variant: 'outline', action: 'decline_invitation' },
    ],
  };
}

function fromAttendance(a, exp) {
  if (!exp || a.status !== 'going') return null;
  const title = exp.title || 'Your experience';
  const time = exp.time || '';
  const location = exp.location || exp.location_address || '';
  return {
    id: `att-${a.id}`,
    _entityId: a.id,
    _type: 'experience_reminder',
    _sortTime: a.created_date || a.updated_date || 0,
    tab: 'activities',
    icon: Clock,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    title: `Your experience: ${title}`,
    description: [time, location].filter(Boolean).join(' · ') || 'Upcoming experience',
    timestamp: relTimestamp(a.created_date),
    read: false,
    group: assignGroup(a.created_date),
    actions: [
      { label: 'Open Experience', variant: 'primary', action: 'open_activity' },
    ],
  };
}

function fromAnnouncement(ann) {
  return {
    id: `ann-${ann.id}`,
    _entityId: ann.id,
    _type: 'announcement',
    _sortTime: ann.created_date || ann.updated_date || 0,
    tab: 'system',
    icon: Bell,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    title: ann.title || 'Announcement',
    description: ann.body || '',
    timestamp: relTimestamp(ann.created_date),
    read: false,
    group: assignGroup(ann.created_date),
    actions: [],
  };
}

function fromMembership(m) {
  if (m.status === 'grace_period') {
    return {
      id: `mem-grace-${m.id}`,
      _entityId: m.id,
      _type: 'membership_grace',
      _sortTime: m.updated_date || m.created_date || 0,
      tab: 'system',
      icon: AlertCircle,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      title: 'Your Premium subscription is in grace period',
      description: 'Renew to keep your Premium benefits',
      timestamp: relTimestamp(m.updated_date),
      read: false,
      group: assignGroup(m.updated_date),
      actions: [{ label: 'Renew', variant: 'primary', action: 'renew_membership' }],
    };
  }
  if (m.status === 'expired' && m.type === 'premium') {
    return {
      id: `mem-exp-${m.id}`,
      _entityId: m.id,
      _type: 'membership_expired',
      _sortTime: m.updated_date || m.created_date || 0,
      tab: 'system',
      icon: Crown,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      title: 'Your Premium subscription has expired',
      description: 'Upgrade to restore Premium benefits',
      timestamp: relTimestamp(m.updated_date),
      read: false,
      group: assignGroup(m.updated_date),
      actions: [{ label: 'Upgrade', variant: 'primary', action: 'upgrade' }],
    };
  }
  return null;
}

// NOTIF-003 — Demo fallback removed. An empty list triggers the NotificationsEmpty
// component in the UI; a fake "Welcome" notification caused the badge to show 1
// unread and reappeared as unread after all real notifications were deleted.

// ── Core load — fetches source entities + read/delete states, derives notifications ─
async function loadNotifications(uid, force = false) {
  if (!uid) {
    setState({ items: [], loading: false, loaded: false, readKeys: new Set(), deletedKeys: new Set(), keyToRecord: new Map(), unreadCount: 0 });
    return;
  }

  // Reset on user change so stale data from a previous account never leaks.
  if (_currentUid !== uid) {
    _currentUid = uid;
    _state.readKeys = new Set();
    _state.deletedKeys = new Set();
    _state.keyToRecord = new Map();
    _state.items = [];
    _state.loaded = false;
  }

  if (_loadingPromise && !force) return _loadingPromise;

  setState({ loading: true });

  _loadingPromise = (async () => {
    try {
      const [incomingReqs, outgoingReqs, circleInvs, attendance, announcements, memberships, readStates] = await Promise.all([
        base44.entities.PalRequest.filter({ receiver_user_id: uid }, '-created_date', 50).catch(() => []),
        base44.entities.PalRequest.filter({ sender_user_id: uid, status: 'accepted' }, '-created_date', 20).catch(() => []),
        base44.entities.CircleInvitation.filter({ pal_user_id: uid, status: 'pending' }, '-created_date', 20).catch(() => []),
        base44.entities.Attendance.filter({ status: 'going' }, '-created_date', 30).catch(() => []),
        base44.entities.Announcement.filter({ status: 'sent', audience: 'all' }, '-created_date', 10).catch(() => []),
        base44.entities.Membership.filter({ user_id: uid }, '-updated_date', 5).catch(() => []),
        base44.entities.NotificationReadState.filter({ user_id: uid }, '-read_at', 500).catch(() => []),
      ]);

      // Build read keys, deleted keys, and record map from persisted states.
      const fetchedReadKeys = new Set();
      const fetchedDeletedKeys = new Set();
      const keyToRecord = new Map();
      for (const r of readStates || []) {
        keyToRecord.set(r.notification_key, r);
        if (r.read_at) fetchedReadKeys.add(r.notification_key);
        if (r.deleted_at) fetchedDeletedKeys.add(r.notification_key);
      }
      // PB-001 — DB is source of truth. In-flight overrides prevent
      // resurrection when a reload races with an ongoing persistence:
      //   - _inFlightReads:   DB might not show read yet → force read
      //   - _inFlightUnreads: DB might still show read    → force unread
      //   - _inFlightDeletes: DB might not show deleted   → force deleted
      const readKeys = new Set(fetchedReadKeys);
      for (const k of _inFlightReads) readKeys.add(k);
      for (const k of _inFlightUnreads) readKeys.delete(k);
      const deletedKeys = new Set(fetchedDeletedKeys);
      for (const k of _inFlightDeletes) deletedKeys.add(k);

      // Clear in-flight keys that the DB has now confirmed.
      for (const k of _inFlightReads) if (fetchedReadKeys.has(k)) _inFlightReads.delete(k);
      for (const k of _inFlightUnreads) if (!fetchedReadKeys.has(k)) _inFlightUnreads.delete(k);
      for (const k of _inFlightDeletes) if (fetchedDeletedKeys.has(k)) _inFlightDeletes.delete(k);

      const notifs = [];

      for (const r of incomingReqs || []) {
        const n = fromPalRequest(r, true);
        if (n) notifs.push(n);
      }
      for (const r of outgoingReqs || []) {
        const n = fromPalRequest(r, false);
        if (n) notifs.push(n);
      }
      for (const inv of circleInvs || []) {
        const n = fromCircleInvitation(inv);
        if (n) notifs.push(n);
      }

      const expIds = [...new Set((attendance || []).map((a) => Number(a.experience_id)).filter(Boolean))];
      const exps = await Promise.all(
        expIds.slice(0, 15).map((id) => base44.entities.Experience.get(id).catch(() => null))
      );
      const expMap = {};
      exps.forEach((e) => { if (e) expMap[e.id] = e; });
      for (const a of attendance || []) {
        const exp = expMap[Number(a.experience_id)];
        if (exp) {
          const n = fromAttendance(a, exp);
          if (n) notifs.push(n);
        }
      }

      for (const ann of announcements || []) {
        notifs.push(fromAnnouncement(ann));
      }

      for (const m of memberships || []) {
        const n = fromMembership(m);
        if (n) notifs.push(n);
      }

      // PB-001 — Deduplicate by notification id (prevents duplicate entries
      // when source entities have overlapping records).
      const _seen = new Set();
      const uniqueNotifs = notifs.filter((n) => {
        if (_seen.has(n.id)) return false;
        _seen.add(n.id);
        return true;
      });

      // Filter out soft-deleted notifications (PB-006)
      const visibleNotifs = uniqueNotifs.filter((n) => !deletedKeys.has(n.id));

      // Apply persisted read states
      visibleNotifs.forEach((n) => { n.read = readKeys.has(n.id); });

      visibleNotifs.sort((a, b) => {
        const ga = groupOrder.indexOf(a.group);
        const gb = groupOrder.indexOf(b.group);
        if (ga !== gb) return ga - gb;
        const ta = a._sortTime ? new Date(a._sortTime).getTime() : 0;
        const tb = b._sortTime ? new Date(b._sortTime).getTime() : 0;
        return tb - ta;
      });

      const finalItems = visibleNotifs;
      const unreadCount = visibleNotifs.filter((n) => !n.read).length;

      setState({ items: finalItems, loading: false, loaded: true, readKeys, deletedKeys, keyToRecord, unreadCount });
    } catch {
      setState({ items: [], loading: false, loaded: true });
    } finally {
      _loadingPromise = null;
    }
  })();

  return _loadingPromise;
}

// ── Real-time subscriptions (set up once per session) ───────────────────────
function setupSubscriptions() {
  if (_subsSetup) return;
  _subsSetup = true;
  const reload = () => { if (_currentUid) loadNotifications(_currentUid, true); };
  try { base44.entities.PalRequest.subscribe(reload); } catch {}
  try { base44.entities.CircleInvitation.subscribe(reload); } catch {}
  try { base44.entities.Announcement.subscribe(reload); } catch {}
  // PB-001 — Do NOT subscribe to NotificationReadState. Self-triggered
  // reloads race with optimistic UI, causing read/deleted notifications to
  // resurrect. Read/delete state is managed locally; source-entity
  // subscriptions still trigger reloads when new notifications arrive.
}

// ── Persist read state (with rollback on failure) ────────────────────────────
// Every persistence call returns a Promise<boolean>: true on success, false on
// failure. Failures are logged to console.error (audit) and trigger an
// optimistic-UI rollback so the display never drifts from the database.

function persistRead(uid, key) {
  // PB-001 — Offline: queue for replay instead of failing and rolling back.
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueOperation({ type: 'read', key, uid });
    return Promise.resolve(true);
  }
  const existing = _state.keyToRecord.get(key);
  if (existing) {
    if (!existing.read_at) {
      return base44.entities.NotificationReadState.update(existing.id, { read_at: new Date().toISOString() })
        .then(() => { existing.read_at = new Date().toISOString(); return true; })
        .catch((err) => { console.error('[NotificationReadState] persistRead update failed:', key, err); return false; });
    }
    return Promise.resolve(true);
  }
  const now = new Date().toISOString();
  return base44.entities.NotificationReadState.create({
    user_id: uid,
    notification_key: key,
    read_at: now,
  })
    .then((record) => { if (record) _state.keyToRecord.set(key, record); return true; })
    .catch((err) => { console.error('[NotificationReadState] persistRead create failed:', key, err); return false; });
}

function persistReadAll(uid, keys) {
  const toCreate = keys.filter((k) => !_state.keyToRecord.has(k));
  const toUpdate = keys.filter((k) => {
    const rec = _state.keyToRecord.get(k);
    return rec && !rec.read_at;
  });
  const promises = [];
  if (toCreate.length > 0) {
    const now = new Date().toISOString();
    promises.push(
      base44.entities.NotificationReadState.bulkCreate(
        toCreate.map((k) => ({ user_id: uid, notification_key: k, read_at: now }))
      )
        .then((records) => {
          if (records) records.forEach((r) => { if (r) _state.keyToRecord.set(r.notification_key, r); });
          return true;
        })
        .catch((err) => { console.error('[NotificationReadState] persistReadAll bulkCreate failed:', toCreate, err); return false; })
    );
  }
  toUpdate.forEach((k) => {
    const rec = _state.keyToRecord.get(k);
    if (rec) {
      promises.push(
        base44.entities.NotificationReadState.update(rec.id, { read_at: new Date().toISOString() })
          .then(() => { rec.read_at = new Date().toISOString(); return true; })
          .catch((err) => { console.error('[NotificationReadState] persistReadAll update failed:', k, err); return false; })
      );
    }
  });
  return Promise.all(promises).then((results) => results.every(Boolean));
}

// ── Persist unread state ─────────────────────────────────────────────────────
function persistUnread(uid, key) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueOperation({ type: 'unread', key, uid });
    return Promise.resolve(true);
  }
  const existing = _state.keyToRecord.get(key);
  if (existing && existing.read_at) {
    return base44.entities.NotificationReadState.update(existing.id, { read_at: null })
      .then(() => { existing.read_at = null; return true; })
      .catch((err) => { console.error('[NotificationReadState] persistUnread failed:', key, err); return false; });
  }
  // If no existing record, the notification is already unread — no-op
  return Promise.resolve(true);
}

function persistUnreadAll(uid, keys) {
  return Promise.all(keys.map((k) => persistUnread(uid, k))).then((results) => results.every(Boolean));
}

// ── Persist deleted state (soft delete) ─────────────────────────────────────
function persistDeleted(uid, key) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueOperation({ type: 'delete', key, uid });
    return Promise.resolve(true);
  }
  const now = new Date().toISOString();
  const existing = _state.keyToRecord.get(key);
  if (existing) {
    return base44.entities.NotificationReadState.update(existing.id, { deleted_at: now, read_at: existing.read_at || now })
      .then(() => { existing.deleted_at = now; return true; })
      .catch((err) => { console.error('[NotificationReadState] persistDeleted update failed:', key, err); return false; });
  }
  return base44.entities.NotificationReadState.create({
    user_id: uid,
    notification_key: key,
    read_at: now,
    deleted_at: now,
  })
    .then((record) => { if (record) _state.keyToRecord.set(key, record); return true; })
    .catch((err) => { console.error('[NotificationReadState] persistDeleted create failed:', key, err); return false; });
}

function persistDeletedAll(uid, keys) {
  return Promise.all(keys.map((k) => persistDeleted(uid, k))).then((results) => results.every(Boolean));
}

// ── Actions (module-level, optimistic UI + rollback on persistence failure) ──
function markRead(id) {
  if (_state.readKeys.has(id)) return;
  _state.readKeys.add(id);
  _inFlightReads.add(id);
  const prevItems = _state.items;
  const newItems = _state.items.map((n) => (n.id === id ? { ...n, read: true } : n));
  const unreadCount = newItems.filter((n) => !n.read).length;
  setState({ items: newItems, unreadCount });
  if (_currentUid) {
    persistRead(_currentUid, id).then((ok) => {
      _inFlightReads.delete(id);
      if (!ok) {
        _state.readKeys.delete(id);
        const reverted = prevItems.map((n) => (n.id === id ? { ...n, read: false } : n));
        setState({ items: reverted, unreadCount: reverted.filter((n) => !n.read).length });
      } else {
        broadcastChange('read', id, _currentUid);
      }
    });
  }
}

function markUnread(id) {
  _state.readKeys.delete(id);
  _inFlightUnreads.add(id);
  const prevItems = _state.items;
  const newItems = _state.items.map((n) => (n.id === id ? { ...n, read: false } : n));
  const unreadCount = newItems.filter((n) => !n.read).length;
  setState({ items: newItems, unreadCount });
  if (_currentUid) {
    persistUnread(_currentUid, id).then((ok) => {
      _inFlightUnreads.delete(id);
      if (!ok) {
        _state.readKeys.add(id);
        const reverted = prevItems.map((n) => (n.id === id ? { ...n, read: true } : n));
        setState({ items: reverted, unreadCount: reverted.filter((n) => !n.read).length });
      } else {
        broadcastChange('unread', id, _currentUid);
      }
    });
  }
}

function markAllRead() {
  const unreadKeys = _state.items.filter((n) => !n.read).map((n) => n.id);
  if (unreadKeys.length === 0) return;
  unreadKeys.forEach((k) => { _state.readKeys.add(k); _inFlightReads.add(k); });
  const prevItems = _state.items;
  const newItems = _state.items.map((n) => ({ ...n, read: true }));
  setState({ items: newItems, unreadCount: 0 });
  if (_currentUid) {
    persistReadAll(_currentUid, unreadKeys).then((ok) => {
      unreadKeys.forEach((k) => _inFlightReads.delete(k));
      if (!ok) {
        // Rollback: restore previous read states
        const reverted = prevItems;
        _state.readKeys = new Set(prevItems.filter((n) => n.read).map((n) => n.id));
        setState({ items: reverted, unreadCount: reverted.filter((n) => !n.read).length });
      } else {
        unreadKeys.forEach((k) => broadcastChange('read', k, _currentUid));
      }
    });
  }
}

function markSelectedAsRead(ids) {
  const idSet = new Set(ids);
  const toRead = _state.items.filter((n) => idSet.has(n.id) && !n.read).map((n) => n.id);
  if (toRead.length === 0) return;
  toRead.forEach((k) => { _state.readKeys.add(k); _inFlightReads.add(k); });
  const prevItems = _state.items;
  const newItems = _state.items.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n));
  const unreadCount = newItems.filter((n) => !n.read).length;
  setState({ items: newItems, unreadCount });
  if (_currentUid) {
    persistReadAll(_currentUid, toRead).then((ok) => {
      toRead.forEach((k) => _inFlightReads.delete(k));
      if (!ok) {
        // Rollback: restore previous read states for selected items
        const reverted = prevItems.map((n) => (idSet.has(n.id) ? { ...n, read: prevItems.find((x) => x.id === n.id)?.read ?? n.read } : n));
        toRead.forEach((k) => _state.readKeys.delete(k));
        setState({ items: reverted, unreadCount: reverted.filter((n) => !n.read).length });
      } else {
        toRead.forEach((k) => broadcastChange('read', k, _currentUid));
      }
    });
  }
}

function markSelectedAsUnread(ids) {
  const idSet = new Set(ids);
  const toUnread = _state.items.filter((n) => idSet.has(n.id) && n.read).map((n) => n.id);
  if (toUnread.length === 0) return;
  toUnread.forEach((k) => { _state.readKeys.delete(k); _inFlightUnreads.add(k); });
  const prevItems = _state.items;
  const newItems = _state.items.map((n) => (idSet.has(n.id) ? { ...n, read: false } : n));
  const unreadCount = newItems.filter((n) => !n.read).length;
  setState({ items: newItems, unreadCount });
  if (_currentUid) {
    persistUnreadAll(_currentUid, toUnread).then((ok) => {
      toUnread.forEach((k) => _inFlightUnreads.delete(k));
      if (!ok) {
        // Rollback: restore previous read states for selected items
        const reverted = prevItems.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n));
        toUnread.forEach((k) => _state.readKeys.add(k));
        setState({ items: reverted, unreadCount: reverted.filter((n) => !n.read).length });
      } else {
        toUnread.forEach((k) => broadcastChange('unread', k, _currentUid));
      }
    });
  }
}

function deleteNotification(id) {
  _state.deletedKeys.add(id);
  _inFlightDeletes.add(id);
  const prevItems = _state.items;
  const newItems = _state.items.filter((n) => n.id !== id);
  const unreadCount = newItems.filter((n) => !n.read).length;
  setState({ items: newItems, unreadCount });
  if (_currentUid) {
    persistDeleted(_currentUid, id).then((ok) => {
      _inFlightDeletes.delete(id);
      if (!ok) {
        _state.deletedKeys.delete(id);
        setState({ items: prevItems, unreadCount: prevItems.filter((n) => !n.read).length });
      } else {
        broadcastChange('delete', id, _currentUid);
      }
    });
  }
}

function deleteSelected(ids) {
  const idSet = new Set(ids);
  ids.forEach((id) => { _state.deletedKeys.add(id); _inFlightDeletes.add(id); });
  const prevItems = _state.items;
  const newItems = _state.items.filter((n) => !idSet.has(n.id));
  const unreadCount = newItems.filter((n) => !n.read).length;
  setState({ items: newItems, unreadCount });
  if (_currentUid) {
    persistDeletedAll(_currentUid, ids).then((ok) => {
      ids.forEach((id) => _inFlightDeletes.delete(id));
      if (!ok) {
        ids.forEach((id) => _state.deletedKeys.delete(id));
        setState({ items: prevItems, unreadCount: prevItems.filter((n) => !n.read).length });
      } else {
        ids.forEach((id) => broadcastChange('delete', id, _currentUid));
      }
    });
  }
}

// ── Cross-tab remote change handler ──────────────────────────────────────────
function applyRemoteChange(data) {
  if (!data || data.uid !== _currentUid) return;
  const { type, key } = data;
  if (type === 'read') {
    _state.readKeys.add(key);
    _state.items = _state.items.map((n) => (n.id === key ? { ...n, read: true } : n));
  } else if (type === 'unread') {
    _state.readKeys.delete(key);
    _state.items = _state.items.map((n) => (n.id === key ? { ...n, read: false } : n));
  } else if (type === 'delete') {
    _state.deletedKeys.add(key);
    _state.items = _state.items.filter((n) => n.id !== key);
  }
  _state.unreadCount = _state.items.filter((n) => !n.read).length;
  notify();
}

// ── Offline queue replay ──────────────────────────────────────────────────────
async function replayQueue() {
  if (!_currentUid) return;
  const queue = getQueue();
  if (queue.length === 0) return;
  for (const op of queue) {
    if (op.uid !== _currentUid) continue;
    let ok = false;
    try {
      if (op.type === 'read') ok = await persistRead(op.uid, op.key);
      else if (op.type === 'unread') ok = await persistUnread(op.uid, op.key);
      else if (op.type === 'delete') ok = await persistDeleted(op.uid, op.key);
    } catch { ok = false; }
    if (ok) removeFromQueue(op.type, op.key);
    else break;
  }
  loadNotifications(_currentUid, true);
}

// ── Hooks ──────────────────────────────────────────────────────────────────
function useStoreSubscription() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _subscribers.add(fn);

    // PB-001 — Cross-tab sync: listen for changes from other tabs
    if (!_broadcastHandler) {
      _broadcastHandler = onRemoteChange(applyRemoteChange);
    }

    // PB-001 — Offline reconciliation: replay queued operations when online
    if (!_onlineHandler) {
      _onlineHandler = () => replayQueue();
      window.addEventListener('online', _onlineHandler);
      if (typeof navigator !== 'undefined' && navigator.onLine) replayQueue();
    }

    return () => { _subscribers.delete(fn); };
  }, []);
}

export function useNotifications() {
  const { user } = useAuth();
  useStoreSubscription();

  useEffect(() => {
    if (user?.id) {
      loadNotifications(String(user.id));
      setupSubscriptions();
    }
  }, [user?.id]);

  const refresh = useCallback(() => {
    if (user?.id) loadNotifications(String(user.id), true);
  }, [user?.id]);

  return {
    items: _state.items,
    loading: _state.loading,
    groupOrder,
    groupLabels,
    markAllRead,
    markRead,
    markUnread,
    markSelectedAsRead,
    markSelectedAsUnread,
    deleteNotification,
    deleteSelected,
    removeItem: deleteNotification, // backward compat
    refresh,
  };
}

export function useUnreadCount() {
  const { user } = useAuth();
  useStoreSubscription();

  useEffect(() => {
    if (user?.id) {
      loadNotifications(String(user.id));
      setupSubscriptions();
    }
  }, [user?.id]);

  return _state.unreadCount;
}