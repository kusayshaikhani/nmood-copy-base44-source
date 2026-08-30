// Supabase-backed persistence for user-created Circles and Experiences.
//
// These used to be written and read through the Base44 entity SDK, which does
// not answer on the independently-hosted build — creation appeared to succeed
// and the new item never showed up in any feed. Both the write and the read now
// go to the same Supabase table (public.app_records), so a created item is
// visible immediately and survives an app restart.
import {
  createOwnedRecord,
  listReadableRecords,
  toEntity,
} from '@/api/supabaseRecords';

export const CIRCLE_ENTITY = 'Circle';
export const EXPERIENCE_ENTITY = 'Experience';

async function create(entityType, data) {
  const record = await createOwnedRecord(entityType, data);
  const entity = toEntity(record);
  // Only a row that came back with an id is a confirmed write.
  if (!entity?.id) throw new Error('Nmood could not save that. Please try again.');
  return entity;
}

export function createCircle(data) {
  return create(CIRCLE_ENTITY, data);
}

export function createExperience(data) {
  return create(EXPERIENCE_ENTITY, data);
}

export async function listCircles({ limit = 100 } = {}) {
  const rows = await listReadableRecords(CIRCLE_ENTITY, { limit });
  return (rows || []).map(toEntity).filter(Boolean);
}

export async function getCircleById(id) {
  const row = await import('@/api/supabaseRecords').then(({ getReadableRecord }) => getReadableRecord(CIRCLE_ENTITY, id));
  return row ? toEntity(row) : null;
}

export async function listExperiences({ limit = 100 } = {}) {
  const rows = await listReadableRecords(EXPERIENCE_ENTITY, { limit });
  return (rows || []).map(toEntity).filter(Boolean);
}

export async function getExperienceById(id) {
  const row = await import('@/api/supabaseRecords').then(({ getReadableRecord }) => getReadableRecord(EXPERIENCE_ENTITY, id));
  return row ? toEntity(row) : null;
}
