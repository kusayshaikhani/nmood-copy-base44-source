export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function getStartOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export const statusColors = {
  hosting: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary', label: 'Hosting' },
  joined: { dot: 'bg-success', badge: 'bg-success/10 text-success', label: 'Joined' },
  community: { dot: 'bg-info', badge: 'bg-info/10 text-info', label: 'Community' },
  circle: { dot: 'bg-accent', badge: 'bg-accent/20 text-accent-foreground', label: 'Circle' },
  suggested: { dot: 'bg-warning', badge: 'bg-warning/10 text-warning', label: 'Suggested' },
  cancelled: { dot: 'bg-destructive', badge: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
  completed: { dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground', label: 'Completed' },
  pending: { dot: 'bg-warning', badge: 'bg-warning/10 text-warning', label: 'Pending' },
};

export const reminderOptions = [
  { id: '24h', label: '24 hours before', value: 1440 },
  { id: '2h', label: '2 hours before', value: 120 },
  { id: '30m', label: '30 minutes before', value: 30 },
  { id: 'custom', label: 'Custom', value: 0 },
];

export const syncProviders = [
  { id: 'google', label: 'Google Calendar', icon: '📅' },
  { id: 'apple', label: 'Apple Calendar', icon: '🍏' },
  { id: 'outlook', label: 'Microsoft Outlook', icon: '📧' },
];

export function detectConflicts(activities) {
  const conflicts = [];
  const active = activities.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
  const sorted = [...active].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.date !== b.date) break;
      const aDur = parseFloat(a.duration) || 1;
      const bDur = parseFloat(b.duration) || 1;
      const aStart = parseTime(a.time);
      const bStart = parseTime(b.time);
      if (!aStart || !bStart) continue;
      const aEnd = aStart + aDur * 60;
      const bEnd = bStart + bDur * 60;
      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push({ type: 'overlap', activityA: a, activityB: b });
      }
    }
  }

  active.forEach((a) => {
    if (a.spotsFilled >= a.spotsTotal) {
      conflicts.push({ type: 'full', activity: a });
    }
    if (a.status === 'cancelled') {
      conflicts.push({ type: 'cancelled', activity: a });
    }
  });

  return conflicts;
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function findFreeSlots(activities, daysAhead = 7) {
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = formatDate(date);
    const dayActivities = activities.filter((a) => a.date === dateStr && a.status !== 'completed' && a.status !== 'cancelled');

    const eveningFree = !dayActivities.some((a) => {
      const t = parseTime(a.time);
      return t !== null && t >= 1020 && t < 1260;
    });

    if (d > 0 && eveningFree) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      slots.push({
        date: dateStr,
        dayName,
        label: `${dayName} evening`,
        suggestion: 'People are Nmood for Coffee nearby.',
      });
    }
  }

  return slots.slice(0, 3);
}

// PB-001: calendarActivities mock array removed — no fabricated calendar items.
