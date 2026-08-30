import moment from 'moment';
import { isUnlimitedCapacity, spotsRemaining } from '@/lib/capacity';

// Date helpers that accept BOTH mock experiences (date "Jul 5", time "7:00 AM")
// and real Experience entities (date ISO "2026-07-05", time "07:00").
export function expStartMoment(exp) {
  if (!exp || !exp.date) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(exp.date)) {
    return moment(`${exp.date} ${exp.time || '00:00'}`, 'YYYY-MM-DD HH:mm');
  }
  return moment(`${exp.date} ${new Date().getFullYear()} ${exp.time || ''}`, 'MMM D YYYY h:mm A');
}

export function expEndMoment(exp) {
  const start = expStartMoment(exp);
  if (!start || !start.isValid()) return null;
  const hours = (typeof exp.duration_hours === 'number' && exp.duration_hours) || parseFloat(exp.duration) || 1;
  return start.clone().add(hours, 'hours');
}

export function expDateLabel(exp) {
  const m = expStartMoment(exp);
  return m && m.isValid() ? m.format('MMM D') : (exp?.date || '');
}

export function expTimeLabel(exp) {
  if (exp?.date && /^\d{4}-\d{2}-\d{2}$/.test(exp.date)) {
    const m = expStartMoment(exp);
    return m && m.isValid() ? m.format('h:mm A') : (exp.time || '');
  }
  return exp?.time || '';
}

export function expDateISO(exp) {
  const m = expStartMoment(exp);
  return m && m.isValid() ? m.format('YYYY-MM-DD') : null;
}

export function isExperienceEnded(exp) {
  const end = expEndMoment(exp);
  if (!end || !end.isValid()) return false;
  return moment().isAfter(end);
}

export function isExperienceCancelled(exp) {
  return exp?.status === 'cancelled';
}

export function isExperienceClosed(exp) {
  return exp?.status === 'closed';
}

export function isChatReadOnly(exp) {
  return isExperienceEnded(exp) || exp?.status === 'cancelled' || exp?.status === 'completed';
}

// Map a real Experience entity into the mock-shaped view used by all detail/chat
// sub-components, so they don't need to know about the entity shape.
export function toExperienceView(entity) {
  if (!entity) return null;
  const hasCoords = typeof entity.location_lat === 'number' && typeof entity.location_lng === 'number';
  return {
    ...entity,
    _real: true,
    _entity: entity,
    id: entity.id,
    image: entity.cover_image || '',
    gallery: entity.cover_image ? [entity.cover_image] : [],
    title: entity.title,
    description: entity.description,
    host: { name: entity.host_name, avatar: entity.host_avatar, bio: '', trustScore: null, hostedCount: null },
    verified: false,
    time: expTimeLabel(entity),
    date: expDateLabel(entity),
    duration: entity.duration || `${entity.duration_hours || 2}h`,
    budget: entity.budget || 'Free',
    category: entity.category || '',
    spotsTotal: isUnlimitedCapacity(entity.max_participants) ? null : entity.max_participants,
    spotsFilled: entity.spots_filled || 0,
    spots: isUnlimitedCapacity(entity.max_participants)
      ? 'Unlimited spots'
      : `${spotsRemaining(entity.max_participants, entity.spots_filled)} spots left`,
    mood: '',
    coordinates: hasCoords ? [entity.location_lat, entity.location_lng] : null,
    venue: { name: entity.location || '', address: entity.location_address || '' },
    joinType: 'instant',
    attendees: [],
    about: { what: entity.description || '', who: '', expect: '', bring: '' },
    tags: [],
    status: entity.status,
  };
}