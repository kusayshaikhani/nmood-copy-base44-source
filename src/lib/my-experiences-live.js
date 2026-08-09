import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useExperiences } from '@/lib/discover-store';
import { emitActivityChange } from '@/lib/activity-store';

/**
 * PB-004 — My Experiences live data.
 * Replaces my-experiences-data.js mock with real Attendance + Experience queries.
 */

export function useMyExperiences() {
  const { user } = useAuth();
  const { experiences } = useExperiences();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let active = true;
    (async () => {
      try {
        const records = await base44.entities.Attendance.filter({ member_user_id: user.id }, '-created_date', 100);
        if (active) setAttendance(records || []);
      } catch {
        if (active) setAttendance([]);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [user?.id]);

  // Build a lookup of experience by id
  const expById = (id) => experiences.find((e) => String(e.id) === String(id));

  const now = new Date();

  const joined = attendance
    .filter((a) => a.status === 'going')
    .map((a) => {
      const exp = expById(a.experience_id);
      return exp ? { ...exp, status: 'confirmed', joinedDate: a.created_date ? new Date(a.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '' } : null;
    })
    .filter(Boolean);

  const upcoming = joined.filter((e) => {
    if (!e.date) return true;
    const expDate = new Date(`${e.date} ${new Date().getFullYear()}`);
    return expDate >= now;
  });

  const past = attendance
    .filter((a) => a.status === 'going' || a.status === 'attended')
    .map((a) => {
      const exp = expById(a.experience_id);
      if (!exp) return null;
      const expDate = exp.date ? new Date(`${exp.date} ${new Date().getFullYear()}`) : null;
      if (expDate && expDate >= now) return null;
      return { ...exp, status: 'attended', isPast: true, date: exp.date };
    })
    .filter(Boolean);

  const hosted = experiences
    .filter((e) => e.host_user_id === user?.id)
    .map((e) => ({ ...e, status: 'host' }));

  const saved = (() => {
    try {
      const ids = JSON.parse(localStorage.getItem('inmood_wishlist') || '[]');
      return ids.map((id) => expById(id)).filter(Boolean).map((e) => ({ ...e, status: 'saved' }));
    } catch {
      return [];
    }
  })();

  return { upcoming, joined, hosted, saved, past, loading };
}