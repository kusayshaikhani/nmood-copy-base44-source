import { useEffect, useState, useCallback } from 'react';
import { getMyInvitations, supabaseSelect } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useCalendarActivities } from '@/lib/calendar-live';
import { expDateISO, expTimeLabel } from '@/lib/experience-utils';
import moment from 'moment';

// RC-005A/CRITICAL-5 — Real Social Planner data replacing mock planner items.
// Uses Attendance, Experience, CircleInvitation, and live calendar activities.

// Hook: fetch pending invitations for the current user (real CircleInvitation + PalRequest).
export function usePendingInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setInvitations([]);
      setLoading(false);
      return;
    }
    const uid = String(user.id);
    try {
      const [typedInvitations, palReqs] = await Promise.all([
        getMyInvitations('pending'),
        supabaseSelect('pal_requests', `select=id,sender_id,message,created_at&receiver_id=eq.${encodeURIComponent(uid)}&status=eq.pending&order=created_at.desc&limit=20`),
      ]);

      const mapped = [];

      // Typed circle and experience invitations
      for (const inv of typedInvitations || []) {
        mapped.push({
          id: `${inv.invitation_type === 'circle' ? 'ci' : 'ei'}-${inv.id}`,
          type: `${inv.invitation_type}_invitation`,
          experience_title: inv.target_title || 'Invitation',
          experience_image: inv.target_image || '',
          experience_date: '',
          experience_time: '',
          sender_name: inv.sender_name || 'Someone',
          sender_avatar: inv.sender_avatar || '',
          status: 'pending',
        });
      }

      // Pal requests (as "invitations" to connect)
      for (const r of palReqs || []) {
        mapped.push({
          id: `pr-${r.id}`,
          type: 'pal_request',
          experience_title: r.experience_title || 'Pal Request',
          experience_image: '',
          experience_date: '',
          experience_time: '',
          sender_name: r.sender_name || 'Someone',
          sender_avatar: r.sender_avatar || '',
          status: 'pending',
        });
      }

      setInvitations(mapped);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { invitations, loading, refresh: load };
}

// Hook: combined Social Planner data from real entities.
// Merges live calendar activities (Attendance + Experience) with pending invitations.
export function useSocialPlannerData() {
  const calendarActivities = useCalendarActivities();
  const { invitations, loading: invLoading } = usePendingInvitations();

  const todayStr = moment().format('YYYY-MM-DD');
  const tomorrowStr = moment().add(1, 'day').format('YYYY-MM-DD');
  const weekEnd = moment().add(6, 'days').format('YYYY-MM-DD');

  const todayActivities = (calendarActivities || []).filter(
    (a) => a.date === todayStr && a.status !== 'cancelled' && a.status !== 'completed'
  );
  const todaySuggestions = (calendarActivities || []).filter(
    (a) => a.date === todayStr && a.status === 'suggested'
  );
  const thisWeekExperiences = (calendarActivities || []).filter(
    (a) => a.date > todayStr && a.date <= weekEnd && a.type === 'experience' && a.status !== 'cancelled' && a.status !== 'completed'
  );
  const thisWeekCommunity = (calendarActivities || []).filter(
    (a) => a.date > todayStr && a.date <= weekEnd && a.community && a.status !== 'cancelled' && a.status !== 'completed'
  );
  const thisWeekCircles = (calendarActivities || []).filter(
    (a) => a.date > todayStr && a.date <= weekEnd && a.type === 'circle' && a.status !== 'cancelled' && a.status !== 'completed'
  );

  const calendarSummary = [
    {
      id: 'today',
      label: 'Today',
      date: todayStr,
      count: todayActivities.length,
      highlight: todayActivities[0]?.title || 'Nothing scheduled',
      items: todayActivities,
    },
    {
      id: 'tomorrow',
      label: 'Tomorrow',
      date: tomorrowStr,
      count: (calendarActivities || []).filter((a) => a.date === tomorrowStr && a.status !== 'cancelled').length,
      highlight: (calendarActivities || []).find((a) => a.date === tomorrowStr)?.title || 'Nothing scheduled',
      items: (calendarActivities || []).filter((a) => a.date === tomorrowStr && a.status !== 'cancelled'),
    },
    {
      id: 'weekend',
      label: 'This Weekend',
      date: moment().day(6).format('YYYY-MM-DD'),
      count: (calendarActivities || []).filter((a) =>
        [moment().day(6).format('YYYY-MM-DD'), moment().day(7).format('YYYY-MM-DD')].includes(a.date) &&
        a.status !== 'cancelled' && a.status !== 'completed'
      ).length,
      highlight: (calendarActivities || []).find((a) => a.date === moment().day(7).format('YYYY-MM-DD'))?.title || 'Free weekend',
      items: (calendarActivities || []).filter((a) =>
        [moment().day(6).format('YYYY-MM-DD'), moment().day(7).format('YYYY-MM-DD')].includes(a.date) &&
        a.status !== 'cancelled' && a.status !== 'completed'
      ),
    },
    {
      id: 'next_week',
      label: 'Next Week',
      date: moment().add(7, 'day').format('YYYY-MM-DD'),
      count: (calendarActivities || []).filter((a) =>
        a.date >= moment().add(7, 'day').format('YYYY-MM-DD') &&
        a.date <= moment().add(13, 'day').format('YYYY-MM-DD') &&
        a.status !== 'cancelled' && a.status !== 'completed'
      ).length,
      highlight: (calendarActivities || []).find((a) =>
        a.date >= moment().add(7, 'day').format('YYYY-MM-DD') &&
        a.date <= moment().add(13, 'day').format('YYYY-MM-DD')
      )?.title || 'Quiet week ahead',
      items: (calendarActivities || []).filter((a) =>
        a.date >= moment().add(7, 'day').format('YYYY-MM-DD') &&
        a.date <= moment().add(13, 'day').format('YYYY-MM-DD') &&
        a.status !== 'cancelled' && a.status !== 'completed'
      ),
    },
  ];

  return {
    todayActivities,
    todayInvitations: invitations,
    todaySuggestions,
    thisWeekExperiences,
    thisWeekCommunity,
    thisWeekCircles,
    pendingInvitations: invitations,
    calendarSummary,
    loading: invLoading,
  };
}