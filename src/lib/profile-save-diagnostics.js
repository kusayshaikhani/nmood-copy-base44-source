// Fixed diagnostic vocabulary only: never show database messages or field values.
export function profileSaveReference(error, fallback = 'save') {
  const stages = ['gallery-upload','validation','profile-write','family-write','details-write','dob-write','refresh','save'];
  const stage = stages.includes(error?.profileSaveStage) ? error.profileSaveStage : stages.includes(fallback) ? fallback : 'save';
  const reasons = { TIMEOUT:'timeout', PROFILE_SAVE_EMPTY:'empty-response', PROFILE_SAVE_MISMATCH:'unconfirmed', '42501':'permission', '42804':'type-contract', '23514':'constraint', 'PGRST202':'rpc-unavailable', 'VALIDATION':'required-fields' };
  const reason = Object.hasOwn(reasons, error?.code) ? reasons[error.code] : 'unavailable';
  return `profile-edit/${stage}/${reason}`;
}
