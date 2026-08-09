import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CalendarCheck, Heart, Link2, Crown, CheckCircle, Circle as CircleIcon, Sparkles } from 'lucide-react';

/**
 * PB-004 — Relationship Hub live data.
 * Replaces relationship-data.js mock with real entity queries.
 * Never fabricates history, stats, or connections.
 */

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function initials(name) {
  if (!name) return '';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function useRelationshipHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: [],
    timeline: [],
    sharedJourneys: [],
    milestones: [],
    reflections: [],
    suggestions: [],
  });

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let active = true;

    (async () => {
      try {
        // Fetch all data in parallel
        const [pals, attendance, hosted, memberships, memberRec, ratings] = await Promise.all([
          base44.entities.PalConnection.filter({ is_active: true }, '-connected_date', 50).catch(() => []),
          base44.entities.Attendance.filter({ created_by_id: user.id }, '-created_date', 50).catch(() => []),
          base44.entities.Experience.filter({ host_user_id: user.id }, '-created_date', 50).catch(() => []),
          base44.entities.CircleMembership.filter({ created_by_id: user.id, status: 'member' }, '-created_date', 50).catch(() => []),
          base44.entities.Member.filter({ created_by_id: user.id }).catch(() => []),
          base44.entities.ExperienceRating.filter({ created_by_id: user.id }, '-created_date', 20).catch(() => []),
        ]);

        if (!active) return;

        const palList = pals || [];
        const attList = attendance || [];
        const hostList = hosted || [];
        const membList = memberships || [];
        const member = (memberRec && memberRec[0]) || null;
        const ratingList = ratings || [];

        // --- Stats ---
        const memberSince = member?.created_date || user.created_date;
        const stats = [
          { id: 'pals', label: 'Pals', value: String(palList.length), icon: Heart },
          { id: 'joined', label: 'Activities Joined', value: String(attList.length), icon: CalendarCheck },
          { id: 'hosted', label: 'Activities Hosted', value: String(hostList.length), icon: Crown },
          { id: 'communities', label: 'Communities', value: String(membList.length), icon: CircleIcon },
          { id: 'member_since', label: 'Member Since', value: memberSince ? new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', icon: CalendarCheck },
        ];

        // --- Timeline events ---
        const timeline = [];
        attList.forEach((a) => {
          if (a.status === 'going') {
            timeline.push({
              id: `att-${a.id}`,
              type: 'joined',
              title: `You joined an experience`,
              description: a.experience_title || '',
              date: timeAgo(a.created_date),
              icon: CalendarCheck,
              sortDate: a.created_date,
            });
          }
        });
        palList.forEach((p) => {
          timeline.push({
            id: `pal-${p.id}`,
            type: 'pals',
            title: `You became Pals with ${p.pal_name || 'someone'}`,
            description: p.first_experience_title || '',
            date: timeAgo(p.connected_date || p.created_date),
            icon: Link2,
            sortDate: p.connected_date || p.created_date,
          });
        });
        hostList.forEach((e) => {
          timeline.push({
            id: `host-${e.id}`,
            type: 'hosted',
            title: `You hosted ${e.title || 'an experience'}`,
            description: '',
            date: timeAgo(e.created_date),
            icon: Crown,
            sortDate: e.created_date,
          });
        });
        timeline.sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));
        const timelineEvents = timeline.slice(0, 10).map(({ sortDate, ...rest }) => rest);

        // --- Shared Journeys ---
        const sharedJourneys = palList.map((p) => ({
          id: p.id,
          name: p.pal_name || 'Pal',
          initials: initials(p.pal_name),
          avatar: p.pal_avatar || '',
          activitiesTogether: p.mutual_experiences_count || 0,
          activityNames: [p.first_experience_title, p.last_experience_title].filter(Boolean),
          circlesTogether: 0,
          circleNames: [],
          sharedInterests: p.mutual_interests || [],
          languages: [],
          firstMet: p.first_experience_title
            ? `${p.first_experience_title} · ${timeAgo(p.connected_date || p.created_date)}`
            : timeAgo(p.connected_date || p.created_date) || 'Recently',
        }));

        // --- Milestones (computed from real activity) ---
        const attCount = attList.length;
        const palCount = palList.length;
        const hostCount = hostList.length;
        const milestones = [
          { id: 1, title: 'First Activity', description: 'You joined your first experience', icon: CalendarCheck, achieved: attCount > 0, date: attCount > 0 ? timeAgo(attList[attList.length - 1]?.created_date) : null },
          { id: 2, title: 'First Pal', description: 'You made your first connection', icon: Heart, achieved: palCount > 0, date: palCount > 0 ? timeAgo(palList[palList.length - 1]?.connected_date || palList[palList.length - 1]?.created_date) : null },
          { id: 3, title: 'First Hosted Activity', description: 'You hosted your first experience', icon: Crown, achieved: hostCount > 0, date: hostCount > 0 ? timeAgo(hostList[hostList.length - 1]?.created_date) : null },
          { id: 4, title: '10 Activities', description: 'You joined 10 activities', icon: Sparkles, achieved: attCount >= 10, date: attCount >= 10 ? 'Achieved' : null },
          { id: 5, title: '25 Activities', description: 'You joined 25 activities', icon: Sparkles, achieved: attCount >= 25, date: attCount >= 25 ? 'Achieved' : null },
          { id: 6, title: '100 Activities', description: 'A century of experiences', icon: Sparkles, achieved: attCount >= 100, date: attCount >= 100 ? 'Achieved' : null },
        ];

        // --- Reflections (from real ExperienceRating reviews) ---
        const reflections = ratingList
          .filter((r) => r.review && r.review.trim())
          .map((r) => ({
            id: r.id,
            activity: r.experience_title || 'An experience',
            date: timeAgo(r.created_date),
            mood: '',
            text: r.review,
          }));

        // --- Connection Suggestions (computed from real data) ---
        const suggestions = [];
        // Reconnect: pals not seen in 14+ days
        const now = Date.now();
        palList.forEach((p) => {
          const lastActivity = p.last_activity_at || p.connected_date || p.created_date;
          if (lastActivity) {
            const daysSince = Math.floor((now - new Date(lastActivity)) / 86400000);
            if (daysSince >= 14) {
              suggestions.push({
                id: `reconnect-${p.id}`,
                type: 'reconnect',
                title: `Reconnect with ${p.pal_name || 'your pal'}`,
                description: `You haven't connected in ${daysSince} days. A quick message might be nice.`,
                action: 'Send Message',
                icon: Heart,
              });
            }
          }
        });
        // Host: suggest hosting if user has attended but not hosted
        if (attCount > 0 && hostCount === 0) {
          suggestions.push({
            id: 'host-first',
            type: 'create',
            title: 'Host your first activity',
            description: "You've joined a few experiences — consider hosting one yourself.",
            action: 'Create',
            icon: Crown,
          });
        }
        // Explore: suggest finding experiences if user has few activities
        if (attCount < 3) {
          suggestions.push({
            id: 'explore-more',
            type: 'invite',
            title: 'Find more experiences',
            description: 'Discover activities that match your interests.',
            action: 'Explore',
            icon: CalendarCheck,
          });
        }

        if (active) {
          setData({ stats, timeline: timelineEvents, sharedJourneys, milestones, reflections, suggestions });
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user?.id]);

  return { ...data, loading };
}