import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import {
  isToday,
  isThisWeek,
  getConnectionState,
} from '@/lib/profile-views';
import ProfileViewsFilters from '@/components/profile-views/ProfileViewsFilters';
import ProfileViewRow from '@/components/profile-views/ProfileViewRow';
import ProfileViewsEmpty from '@/components/profile-views/ProfileViewsEmpty';
import ProfileViewsLocked from '@/components/profile-views/ProfileViewsLocked';
import { getProfileCompleteness } from '@/lib/profile-completeness';

export default function ProfileViews() {
  const { user, member } = useAuth();
  const { can } = useMembershipAccess();
  const navigate = useNavigate();
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const hasAccess = can(FEATURES.PROFILE_VIEWS);
  const privateBrowsing = member?.profile_view_visibility === 'private';
  const profileComplete = getProfileCompleteness(member, user).pct >= 100;

  const loadViews = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const records = await base44.entities.ProfileView.filter({ profile_owner_id: String(user.id) }, '-viewed_at', 100);
      setViews(records);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadViews(); }, [loadViews]);

  const counts = useMemo(() => {
    const c = { All: views.length, Today: 0, 'This Week': 0, Connected: 0, 'Not Connected': 0 };
    views.forEach((v) => {
      if (isToday(v.viewed_at)) c.Today++;
      if (isThisWeek(v.viewed_at)) c['This Week']++;
      if (getConnectionState(v) === 'connected') c.Connected++;
      else c['Not Connected']++;
    });
    return c;
  }, [views]);

  const filtered = useMemo(() => {
    let list = [...views].sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at));
    if (filter === 'Today') list = list.filter((v) => isToday(v.viewed_at));
    else if (filter === 'This Week') list = list.filter((v) => isThisWeek(v.viewed_at));
    else if (filter === 'Connected') list = list.filter((v) => getConnectionState(v) === 'connected');
    else if (filter === 'Not Connected') list = list.filter((v) => getConnectionState(v) !== 'connected');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        (v.viewer_name || '').toLowerCase().includes(q) ||
        (v.viewer_location || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [views, filter, search]);

  return (
    <div className="max-w-2xl mx-auto pb-4">
      <button
        onClick={() => navigate(-1)}
        type="button"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-default mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">👀 Profile Views</h1>
        <p className="text-muted-foreground mt-1 text-sm">See who recently viewed your profile.</p>
      </div>

      {!hasAccess ? (
        <ProfileViewsLocked reason="access" />
      ) : privateBrowsing ? (
        <ProfileViewsLocked reason="private" />
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full h-12 pl-12 pr-4 text-sm rounded-2xl bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default"
            />
          </div>

          <div className="mb-4">
            <ProfileViewsFilters active={filter} onChange={setFilter} counts={counts} />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl shimmer" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <ProfileViewsEmpty profileComplete={profileComplete} />
          ) : (
            <div className="space-y-3">
              {filtered.map((v, i) => (
                <ProfileViewRow
                  key={v.id || i}
                  view={v}
                  onConnect={() => navigate('/discover-people')}
                  onMessage={() => navigate('/messages')}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}