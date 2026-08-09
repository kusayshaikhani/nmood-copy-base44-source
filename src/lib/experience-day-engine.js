import moment from 'moment';

export const PHASES = {
  FAR: 'far',
  TOMORROW: 'tomorrow',
  GETTING_READY: 'getting_ready',
  TIME_TO_LEAVE: 'time_to_leave',
  LIVE: 'live',
  COMPLETED: 'completed',
  FOLLOW_UP: 'follow_up',
};

export const PHASE_LABELS = {
  [PHASES.FAR]: 'Upcoming',
  [PHASES.TOMORROW]: 'Tomorrow',
  [PHASES.GETTING_READY]: 'Getting Ready',
  [PHASES.TIME_TO_LEAVE]: 'Time to Leave',
  [PHASES.LIVE]: 'Happening Now',
  [PHASES.COMPLETED]: 'Just Finished',
  [PHASES.FOLLOW_UP]: 'Follow Up',
};

export const PHASE_ORDER = [PHASES.FAR, PHASES.TOMORROW, PHASES.GETTING_READY, PHASES.TIME_TO_LEAVE, PHASES.LIVE, PHASES.COMPLETED, PHASES.FOLLOW_UP];

export function getExperiencePhase(experience, now = moment()) {
  const year = now.year();
  const start = moment(`${experience.date} ${year} ${experience.time}`, 'MMM D YYYY h:mm A');
  if (!start.isValid()) return PHASES.FAR;

  const hours = parseFloat(experience.duration) || 1;
  const end = start.clone().add(hours, 'hours');

  const diffStartMin = start.diff(now, 'minutes');
  const diffEndMin = end.diff(now, 'minutes');

  if (diffEndMin < -1440) return PHASES.FOLLOW_UP;
  if (diffEndMin < 0) return PHASES.COMPLETED;
  if (diffStartMin < 0) return PHASES.LIVE;
  if (diffStartMin < 30) return PHASES.TIME_TO_LEAVE;
  if (diffStartMin < 120) return PHASES.GETTING_READY;
  if (diffStartMin < 1440) return PHASES.TOMORROW;
  return PHASES.FAR;
}

export function getCountdown(experience, now = moment()) {
  const year = now.year();
  const start = moment(`${experience.date} ${year} ${experience.time}`, 'MMM D YYYY h:mm A');
  if (!start.isValid()) return null;

  const diff = start.diff(now);
  if (diff < 0) return null;

  const duration = moment.duration(diff);
  if (duration.days() > 0) return `in ${duration.days()}d ${duration.hours()}h`;
  if (duration.hours() > 0) return `in ${duration.hours()}h ${duration.minutes()}m`;
  return `in ${duration.minutes()}m`;
}

export function openInMaps(experience) {
  const [lat, lng] = experience.coordinates || [];
  if (lat && lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  } else {
    const query = experience.venue?.name || experience.title;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  }
}