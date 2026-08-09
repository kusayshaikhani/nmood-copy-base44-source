import {
  Coffee,
  Users,
  Sparkles,
  Heart,
  Award,
  UserCheck,
  Circle as CircleIcon,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Engagement & Retention engine — computes real personal statistics,
// achievements, milestones, activity history and weekly recap from the
// user's actual records. Everything here is private to the current user
// (filtered by created_by_id), encouraging real-life participation
// without addictive patterns.

const COMPLETENESS_CHECKS = [
  { key: 'display_name', min: 1 },
  { key: 'date_of_birth', min: 1 },
  { key: 'gender', min: 1 },
  { key: 'country', min: 1 },
  { key: 'city', min: 1 },
  { key: 'languages', min: 1, array: true },
  { key: 'interests', min: 3, array: true },
  { key: 'bio', min: 1 },
  { key: 'photo_url', min: 1 },
  { key: 'lifestyle', min: 1 },
];

export function computeProfileCompletion(member) {
  if (!member) return 0;
  const filled = COMPLETENESS_CHECKS.filter((c) => {
    const val = member[c.key];
    const len = Array.isArray(val) ? val.length : val ? String(val).trim().length : 0;
    return len >= c.min;
  }).length;
  return Math.round((filled / COMPLETENESS_CHECKS.length) * 100);
}

// --- Achievement definitions (meaningful participation only) ---
export const ACHIEVEMENT_DEFS = [
  { id: 'first_connection', icon: UserCheck, title: 'First Connection', description: 'You made your first connection.', check: (s) => s.pals >= 1 },
  { id: 'first_pal', icon: Heart, title: 'First Pal', description: 'You became pals with someone.', check: (s) => s.pals >= 1 },
  { id: 'first_circle', icon: CircleIcon, title: 'First Circle', description: 'You joined your first Circle.', check: (s) => s.circlesJoined >= 1 },
  { id: 'first_experience', icon: Coffee, title: 'First Experience', description: 'You joined your first experience.', check: (s) => s.experiencesJoined >= 1 },
  { id: 'profile_completed', icon: Award, title: 'Profile Completed', description: 'Your profile is 100% complete.', check: (s) => s.profileCompletion >= 100 },
  { id: 'first_hosted_experience', icon: Sparkles, title: 'First Hosted Experience', description: 'You brought people together.', check: (s) => s.experiencesHosted >= 1 },
];

export const CELEBRATION_ACHIEVEMENT_IDS = ['first_pal', 'first_experience', 'first_circle', 'profile_completed'];

// --- Milestone definitions (progress only visible to the member) ---
export const MILESTONE_DEFS = [
  { id: 'experiences_joined', icon: Coffee, label: 'Experiences Joined', valueKey: 'experiencesJoined', thresholds: [1, 5, 10, 25, 50] },
  { id: 'circles_joined', icon: CircleIcon, label: 'Circles Joined', valueKey: 'circlesJoined', thresholds: [1, 3, 5, 10] },
  { id: 'connections_made', icon: Heart, label: 'Connections Made', valueKey: 'pals', thresholds: [1, 5, 10, 25] },
  { id: 'experiences_hosted', icon: Sparkles, label: 'Experiences Hosted', valueKey: 'experiencesHosted', thresholds: [1, 3, 5, 10] },
  { id: 'circles_created', icon: Users, label: 'Circles Created', valueKey: 'circlesCreated', thresholds: [1, 3, 5] },
];

const safeFilter = async (entity, query) => {
  try {
    return await entity.filter(query);
  } catch {
    return [];
  }
};

export async function computeStats(user, member) {
  if (!user?.id) {
    return { experiencesJoined: 0, circlesJoined: 0, pals: 0, experiencesHosted: 0, circlesCreated: 0, profileCompletion: computeProfileCompletion(member) };
  }
  const uid = String(user.id);
  const [attendance, circleMemberships, pals, hostedExperiences, circlesCreated] = await Promise.all([
    safeFilter(base44.entities.Attendance, { created_by_id: uid }),
    safeFilter(base44.entities.CircleMembership, { created_by_id: uid }),
    safeFilter(base44.entities.PalConnection, { created_by_id: uid }),
    safeFilter(base44.entities.Experience, { created_by_id: uid }),
    safeFilter(base44.entities.Circle, { created_by_id: uid }),
  ]);
  return {
    experiencesJoined: (attendance || []).filter((a) => a.status !== 'left').length,
    circlesJoined: (circleMemberships || []).filter((m) => m.status === 'member').length,
    pals: (pals || []).filter((p) => p.is_active !== false).length,
    experiencesHosted: (hostedExperiences || []).length,
    circlesCreated: (circlesCreated || []).length,
    profileCompletion: computeProfileCompletion(member),
  };
}

export function computeAchievements(stats) {
  return ACHIEVEMENT_DEFS.map((def) => ({
    id: def.id,
    icon: def.icon,
    title: def.title,
    description: def.description,
    unlocked: !!def.check(stats),
  }));
}

export function computeMilestones(stats) {
  return MILESTONE_DEFS.map((def) => {
    const value = stats[def.valueKey] || 0;
    const next = def.thresholds.find((t) => value < t);
    const prev = [...def.thresholds].reverse().find((t) => value >= t) || 0;
    const target = next || prev;
    const progress = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 100;
    return {
      id: def.id,
      icon: def.icon,
      label: def.label,
      value,
      next: next || null,
      currentTier: prev,
      progress,
      complete: !next,
    };
  });
}

export async function computeActivityHistory(user) {
  if (!user?.id) return [];
  const uid = String(user.id);
  const [attendance, circleMemberships, pals, hostedExperiences] = await Promise.all([
    safeFilter(base44.entities.Attendance, { created_by_id: uid }),
    safeFilter(base44.entities.CircleMembership, { created_by_id: uid }),
    safeFilter(base44.entities.PalConnection, { created_by_id: uid }),
    safeFilter(base44.entities.Experience, { created_by_id: uid }),
  ]);
  const items = [];
  (attendance || []).forEach((a) => {
    if (a.status === 'left') return;
    items.push({
      id: `exp-${a.id}`,
      type: 'joined_experience',
      icon: Coffee,
      title: 'Joined an experience',
      detail: a.member_name || '',
      date: a.created_date || a.updated_date,
    });
  });
  (circleMemberships || []).forEach((m) => {
    if (m.status !== 'member') return;
    items.push({
      id: `circle-${m.id}`,
      type: 'joined_circle',
      icon: CircleIcon,
      title: 'Joined a Circle',
      detail: '',
      date: m.created_date || m.joined_date || m.updated_date,
    });
  });
  (hostedExperiences || []).forEach((e) => {
    items.push({
      id: `host-${e.id}`,
      type: 'hosted_activity',
      icon: Sparkles,
      title: 'Hosted an experience',
      detail: e.title || '',
      date: e.created_date || e.updated_date,
    });
  });
  (pals || []).forEach((p) => {
    if (p.is_active === false) return;
    items.push({
      id: `pal-${p.id}`,
      type: 'connection_milestone',
      icon: Heart,
      title: 'New connection',
      detail: p.pal_name || '',
      date: p.connected_date || p.created_date || p.updated_date,
    });
  });
  return items.filter((i) => i.date).sort((a, b) => new Date(b.date) - new Date(a.date));
}

const isWithinLastDays = (dateStr, days) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d >= new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

export async function computeWeeklyRecap(user, member, stats) {
  if (!user?.id) return null;
  const uid = String(user.id);
  const [attendance, circleMemberships, pals] = await Promise.all([
    safeFilter(base44.entities.Attendance, { created_by_id: uid }),
    safeFilter(base44.entities.CircleMembership, { created_by_id: uid }),
    safeFilter(base44.entities.PalConnection, { created_by_id: uid }),
  ]);
  const newPals = (pals || []).filter((p) => isWithinLastDays(p.connected_date || p.created_date, 7) && p.is_active !== false).length;
  const experiencesJoined = (attendance || []).filter((a) => isWithinLastDays(a.created_date, 7) && a.status !== 'left').length;
  const circlesJoined = (circleMemberships || []).filter((m) => isWithinLastDays(m.created_date || m.joined_date, 7) && m.status === 'member').length;
  const upcoming = (attendance || []).filter((a) => a.status === 'going').length;
  const newAchievement = computeAchievements(stats).find((a) => a.unlocked && CELEBRATION_ACHIEVEMENT_IDS.includes(a.id)) || null;
  return {
    newPals,
    experiencesJoined,
    circlesJoined,
    upcoming,
    achievement: newAchievement,
    profileCompletion: stats.profileCompletion,
  };
}