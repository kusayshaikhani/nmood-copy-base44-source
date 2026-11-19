import { readExplorerRows } from '@/lib/passport/response';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import {ISOLATED_APP_BUILD,isolatedAppAdapters} from '@/lib/isolated-app/active.mjs';
import { requireDiscoveryAccess } from '@/lib/explorer-policy';
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

const COVER_FIELDS = {
  [CIRCLE_ENTITY]: 'cover_photo',
  [EXPERIENCE_ENTITY]: 'cover_image',
};

export function isPersistedCoverUrl(value) {
  if(ISOLATED_APP_BUILD)return isolatedAppAdapters().media.isUploaded(value);
  return typeof value === 'string' && /^https:\/\/[^\s]+$/i.test(value.trim());
}

function requirePersistedCover(entityType, data) {
  const cover = data?.[COVER_FIELDS[entityType]];
  if (!isPersistedCoverUrl(cover)) {
    throw new Error('Add a cover photo before publishing.');
  }
}

async function create(entityType, data) {
  requirePersistedCover(entityType, data);
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

export async function listCircles({ limit = 100, signal } = {}) {
  await requireDiscoveryAccess();
  const rows = await (MAIN_PASSPORT ? readExplorerRows('records', {p_entity:CIRCLE_ENTITY,p_limit:limit}, signal) : listReadableRecords(CIRCLE_ENTITY, { limit, ...(signal ? { signal } : {}) }));
  return (rows || []).map(toEntity).filter(Boolean);
}

export async function getCircleById(id) {
  await requireDiscoveryAccess();
  const row = await import('@/api/supabaseRecords').then(({ getReadableRecord }) => getReadableRecord(CIRCLE_ENTITY, id));
  return row ? toEntity(row) : null;
}

export async function listExperiences({ limit = 100, signal } = {}) {
  await requireDiscoveryAccess();
  const rows = await (MAIN_PASSPORT ? readExplorerRows('records', {p_entity:EXPERIENCE_ENTITY,p_limit:limit}, signal) : listReadableRecords(EXPERIENCE_ENTITY, { limit, ...(signal ? { signal } : {}) }));
  return (rows || []).map(toEntity).filter(Boolean);
}

export async function getExperienceById(id) {
  await requireDiscoveryAccess();
  const row = await import('@/api/supabaseRecords').then(({ getReadableRecord }) => getReadableRecord(EXPERIENCE_ENTITY, id));
  return row ? toEntity(row) : null;
}
