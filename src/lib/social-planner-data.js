// RC-005A: mockIncomingInvitations import removed — replaced by real
// CircleInvitation/PalRequest queries in social-planner-live.js.
// Calendar activity functions now delegate to calendar-live.js via the
// useSocialPlannerData hook; the static calendar-data fallback remains
// only for empty-state display when no real Attendance records exist.
import { findFreeSlots, formatDate } from '@/lib/calendar-data';

// PB-001: calendarActivities mock removed — all functions below return [] when no real data exists.
const calendarActivities = [];

// RC-005A: dates now computed dynamically via formatDate.
function _todayStr() { return formatDate(new Date()); }
function _tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return formatDate(d); }
function _weekEndStr() { const d = new Date(); d.setDate(d.getDate() + 6); return formatDate(d); }

export function getTodayActivities() {
  return calendarActivities.filter(a => a.date === _todayStr() && a.status !== 'cancelled' && a.status !== 'completed');
}

// RC-005A: getTodayInvitations removed — was returning mock invitations.
// Today's invitations now come from real CircleInvitation/PalRequest via
// useSocialPlannerData() in social-planner-live.js.

export function getTodaySuggestions() {
  return calendarActivities.filter(a => a.date === _todayStr() && a.status === 'suggested');
}

export function getTodayFreeTime() {
  return findFreeSlots(calendarActivities, 1);
}

export function getThisWeekExperiences() {
  return calendarActivities.filter(a => a.date > _todayStr() && a.date <= _weekEndStr() && a.type === 'experience' && a.status !== 'cancelled' && a.status !== 'completed');
}

export function getThisWeekCommunityActivities() {
  return calendarActivities.filter(a => a.date > _todayStr() && a.date <= _weekEndStr() && a.community && a.status !== 'cancelled' && a.status !== 'completed');
}

export function getThisWeekCircleActivities() {
  return calendarActivities.filter(a => a.date > _todayStr() && a.date <= _weekEndStr() && a.type === 'circle' && a.status !== 'cancelled' && a.status !== 'completed');
}

// RC-005A: getPendingInvitations removed — was returning mock invitations.
// Pending invitations now come from real CircleInvitation/PalRequest via
// useSocialPlannerData() in social-planner-live.js.

// RC-005A: getReconnectSuggestions removed — was returning mock data.
// Reconnect suggestions now derive from real PalConnection entities
// via useRealPals() in real-pals.js.

// RC-005A: suggestedHosts removed — was fabricated data.
// Now derived from real Experience host queries at the component layer.
export const suggestedHosts = [];

// RC-005A: Social energy insights — generic, non-fabricated observations.
// No fabricated metrics (no fake counts, no fake names).
export const socialEnergyInsights = [
  { id: 'e1', icon: '☕', text: 'Explore experiences that match your current mood.' },
  { id: 'e2', icon: '🧘', text: 'Try a new category to discover what resonates.' },
  { id: 'e3', icon: '🌅', text: 'Your calendar holds your next adventure.' },
];

// RC-005A: Social goals — static goal templates with zeroed progress.
// Progress is derived from real entity counts at the component layer (future enhancement).
export const socialGoals = [
  { id: 'g1', label: 'Meeting New People', icon: 'Users', progress: 0, current: 'Set a goal to track your connections', color: 'primary' },
  { id: 'g2', label: 'Hosting Experiences', icon: 'Crown', progress: 0, current: 'Host your first experience to get started', color: 'accent' },
  { id: 'g3', label: 'Trying New Categories', icon: 'Sparkles', progress: 0, current: 'Explore new categories to grow', color: 'info' },
  { id: 'g4', label: 'Exploring New Places', icon: 'MapPin', progress: 0, current: 'Visit new places around your city', color: 'success' },
  { id: 'g5', label: 'Building Friendships', icon: 'Heart', progress: 0, current: 'Deepen connections with shared experiences', color: 'warning' },
];

// RC-005A: Smart suggestions — generic, non-fabricated. No fake person references.
export const smartSuggestions = [
  { id: 's1', icon: '🌅', text: 'Explore what matches your mood today.', action: 'Find an experience', link: '/explore' },
  { id: 's2', icon: '☕', text: 'Browse experiences by your interests.', action: 'Browse all', link: '/explore' },
  { id: 's3', icon: '⭕', text: 'Discover circles near you.', action: 'View circles', link: '/communities' },
];

// Quick actions
export const quickActions = [
  { id: 'qa1', label: 'Host an Experience', icon: 'CalendarPlus', link: '/host/create', color: 'primary' },
  { id: 'qa2', label: 'Invite Again', icon: 'Send', link: '/pals', color: 'accent' },
  { id: 'qa3', label: 'Find Something New', icon: 'Compass', link: '/explore', color: 'info' },
  { id: 'qa4', label: 'Join Nearby', icon: 'MapPin', link: '/explore', color: 'success' },
];

// Calendar summary
export function getCalendarSummary() {
  const today = _todayStr();
  const tomorrow = _tomorrowStr();
  const weekendSat = (() => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return formatDate(d); })();
  const weekendSun = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay() + 7) % 7 || 7)); return formatDate(d); })();
  const nextWeekStart = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return formatDate(d); })();
  const nextWeekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 13); return formatDate(d); })();
  return [
    {
      id: 'today',
      label: 'Today',
      date: today,
      count: getTodayActivities().length,
      highlight: getTodayActivities()[0]?.title || 'Nothing scheduled',
      items: getTodayActivities(),
    },
    {
      id: 'tomorrow',
      label: 'Tomorrow',
      date: tomorrow,
      count: calendarActivities.filter(a => a.date === tomorrow && a.status !== 'cancelled').length,
      highlight: calendarActivities.find(a => a.date === tomorrow)?.title || 'Nothing scheduled',
      items: calendarActivities.filter(a => a.date === tomorrow && a.status !== 'cancelled'),
    },
    {
      id: 'weekend',
      label: 'This Weekend',
      date: weekendSat,
      count: calendarActivities.filter(a => [weekendSat, weekendSun].includes(a.date) && a.status !== 'cancelled' && a.status !== 'completed').length,
      highlight: calendarActivities.find(a => a.date === weekendSun)?.title || 'Free weekend',
      items: calendarActivities.filter(a => [weekendSat, weekendSun].includes(a.date) && a.status !== 'cancelled' && a.status !== 'completed'),
    },
    {
      id: 'next_week',
      label: 'Next Week',
      date: nextWeekStart,
      count: calendarActivities.filter(a => a.date >= nextWeekStart && a.date <= nextWeekEnd && a.status !== 'cancelled' && a.status !== 'completed').length,
      highlight: calendarActivities.find(a => a.date >= nextWeekStart && a.date <= nextWeekEnd)?.title || 'Quiet week ahead',
      items: calendarActivities.filter(a => a.date >= nextWeekStart && a.date <= nextWeekEnd && a.status !== 'cancelled' && a.status !== 'completed'),
    },
  ];
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}