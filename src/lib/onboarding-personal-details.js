import { serializeWorkDraft } from './work-profile';

export const PERSONAL_FIELDS = {
  nationality: { label: 'Nationality', share: 'share_nationality' },
  marital_status: { label: 'Marital status', share: 'share_marital_status' },
  family_plan: { label: 'Children preference', share: 'share_family_plan' },
  smoking: { label: 'Smoking', share: 'share_smoking' },
  drinking: { label: 'Drinking', share: 'share_drinking' },
  height_cm: { label: 'Height', share: 'share_height' },
  work_text: { label: 'Work', share: 'share_work' },
};
export const PERSONAL_KEYS = new Set([...Object.keys(PERSONAL_FIELDS), ...Object.values(PERSONAL_FIELDS).map(field => field.share).filter(Boolean), 'show_age', '_workDraft', '_personalChanges']);
const supplied = value => value != null && (typeof value !== 'string' || value.trim() !== '');

// Only an explicit field edit implies inclusion. Mounting/loading existing values
// must never opt an existing member into sharing or rewrite their preferences.
export function personalSelectionPatch(patch) {
  const result = { ...patch };
  for (const [key, field] of Object.entries(PERSONAL_FIELDS)) {
    if (field.share && Object.hasOwn(patch, key) && !Object.hasOwn(patch, field.share)) result[field.share] = supplied(patch[key]);
  }
  if (patch._workDraft != null) {
    try { result.share_work = supplied(serializeWorkDraft(patch._workDraft)); }
    catch { /* Keep the incomplete Work draft; it is not a supplied value yet. */ }
  }
  return result;
}
export function mergePersonalChanges(previous, patch) {
  const next = { ...previous };
  if (Object.hasOwn(patch, '_workDraft') && patch._workDraft == null) {
    delete next._workDraft; delete next.work_text; delete next.share_work;
  }
  for (const [key, value] of Object.entries(patch)) {
    if (PERSONAL_KEYS.has(key) && !['show_age', '_personalChanges'].includes(key) && !(key === '_workDraft' && value == null)) next[key] = value;
  }
  return next;
}
export function recoverPersonalChanges(existing, prior) {
  if (prior?._personalChanges) return mergePersonalChanges({}, prior._personalChanges);
  const changes = {};
  for (const key of Object.keys(PERSONAL_FIELDS)) {
    if (Object.hasOwn(prior || {}, key) && (prior[key] ?? '') !== (existing?.[key] ?? '')) Object.assign(changes, personalSelectionPatch({ [key]: prior[key] }));
  }
  if (prior?._workDraft != null) Object.assign(changes, personalSelectionPatch({ _workDraft: prior._workDraft }));
  return changes;
}
export function withoutPersonalDetails(data) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => !PERSONAL_KEYS.has(key)));
}

const memory = new Map();
const storageKey = userId => `nmood.pending-personal-details.v1:${userId}`;
export function readPendingPersonalDetails(userId) {
  if (!userId) return {};
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? mergePersonalChanges({}, stored) : {};
  } catch { /* Memory fallback when device storage is unavailable. */ }
  return memory.get(userId) || {};
}
export function storePendingPersonalDetails(userId, changes) {
  if (!userId) return false;
  const safe = mergePersonalChanges({}, changes);
  memory.set(userId, safe);
  try {
    if (Object.keys(safe).length) localStorage.setItem(storageKey(userId), JSON.stringify(safe));
    else localStorage.removeItem(storageKey(userId));
    return true;
  } catch { return false; }
}

// Save independent field/visibility pairs separately. A missing optional server
// extension must not undo confirmed fields or poison required onboarding writes.
export async function savePersonalDetails(changes, save) {
  const remaining = { ...changes }, saved = {}, errors = [];
  await Promise.all(Object.entries(PERSONAL_FIELDS).map(async ([key, field]) => {
    const hasWorkDraft = key === 'work_text' && changes._workDraft != null;
    if (!Object.hasOwn(changes, key) && !hasWorkDraft) return;
    let patch;
    try {
      const value = hasWorkDraft ? serializeWorkDraft(changes._workDraft) : changes[key];
      patch = { [key]: typeof value === 'string' ? value.trim() : value };
      if (field.share) patch[field.share] = changes[field.share] ?? supplied(value);
    } catch (error) {
      errors.push(`Work is not saved yet: ${error.message} You can continue and finish it later.`);
      return;
    }
    try {
      const row = await save(patch);
      // Never treat a writer that ignores a field as successful persistence.
      if (!row || Object.entries(patch).some(([name, value]) => (row[name] ?? '') !== (value ?? ''))) {
        throw Object.assign(new Error('Optional value not confirmed'), { code: 'PROFILE_SAVE_MISMATCH' });
      }
      Object.assign(saved, patch);
      delete remaining[key];
      if (field.share) delete remaining[field.share];
      if (hasWorkDraft) { delete remaining._workDraft; saved._workDraft = null; }
    } catch (error) {
      errors.push(error?.code === 'PROFILE_SAVE_MISMATCH'
        ? `${field.label} could not be confirmed by the profile service. Your choice is kept for retry.`
        : `We couldn’t save ${field.label.toLowerCase()}. Your choice is kept; you can continue and retry.`);
    }
  }));
  return { remaining, saved, error: errors.join(' ') };
}
