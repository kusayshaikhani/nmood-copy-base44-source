import { useState, useEffect } from 'react';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
// PB-001: mock experience/activity fallbacks removed — all data comes from real DB entities.
import { useActivityRefresh } from '@/lib/activity-store';
import { expDateISO, expTimeLabel, expEndMoment } from '@/lib/experience-utils';

// Build a calendar activity from a joined Attendance record + its experience
// (either a mock experience or a real Experience entity fetched by id).
async function activityFromAttendance(record) {
  const expId = Number(record.experience_id);
  let exp = null;
  try {
    exp = await base44.entities.Experience.get(expId);
  } catch { exp = null; }
  if (!exp) return null;
  const date = expDateISO(exp);
  if (!date) return null;
  const start = moment(date, 'YYYY-MM-DD');
  const end = expEndMoment(exp);
  const hours = end && end.isValid() ? Math.max(1, Math.round(end.diff(start, 'hours', true) * 10) / 10) : 2;
  return {
    id: `live-${expId}`,
    title: exp.title,
    type: 'experience',
    date,
    time: expTimeLabel(exp),
    duration: `${hours} hour${hours > 1 ? 's' : ''}`,
    location: exp.venue?.name || exp.location || '',
    host: exp.host?.name || exp.host_name || 'Host',
    hostAvatar: exp.host?.avatar || exp.host_avatar || null,
    status: 'joined',
    coverImage: exp.image || exp.cover_image || null,
    community: exp.origin_name || null,
    spotsFilled: exp.spotsFilled ?? exp.spots_filled ?? null,
    spotsTotal: exp.spotsTotal ?? exp.max_participants ?? null,
    palsAttending: [],
    reminder: record.reminders_enabled ? '2h' : null,
  };
}

// Hook: returns real calendar activities from Attendance + Experience entities.
// Mock activities appear ONLY as an empty-state fallback when no real
// activities exist. Refreshes instantly whenever an activity change is
// emitted (join / leave / host update).
export function useCalendarActivities() {
  const refreshKey = useActivityRefresh();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const records = await base44.entities.Attendance.filter({ status: 'going' }, '-created_date', 100);
        if (!active) return;
        const joined = [];
        for (const r of records || []) {
          const a = await activityFromAttendance(r);
          if (a) joined.push(a);
        }
        if (!active) return;
        setActivities(joined);
      } catch {
        if (active) setActivities([]);
      }
    })();
    return () => { active = false; };
  }, [refreshKey]);

  return activities;
}