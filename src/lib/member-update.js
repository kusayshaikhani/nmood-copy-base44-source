import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { revokeMemberIndicatorsForProfilePatch, persistExplicitMemberIndicatorConsent } from './member-indicator-runtime';
import {SETTING_KEYS,saveOnboardingSettings} from './onboarding-settings';
import { prepareWorkFields } from '@/lib/work-profile';
// AGE-001 — Centralized member self-update helpers.
//
// All member self-updates MUST go through the backend authorizationGate
// `updateProfile` action, which strips protected fields (date_of_birth,
// eligibility_status, eligibility_verified_at, dob_change_requested_at).
// Direct Member.update() calls are blocked by RLS — the Member entity's
// update rule only allows admin/founder roles.
//
// DOB updates go through `updateDob` (derives eligibility_status server-side).
// Account deletion goes through `deleteAccount` with an explicit DELETE
// confirmation and permanently removes the authenticated account.
//
// SDK result normalization: base44.functions.invoke may return the backend
// response body directly ({ ok, member }) OR wrapped in { data: { ok, member } }
// depending on the SDK version / edge configuration. unwrap() handles both so
// success/failure is based on the normalized payload, never on assuming
// res vs res.data.

import { withTimeout } from '@/lib/bounded-operation';
import { base44 } from '@/api/base44Client';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { useSupabase } from '@/config/supabase-config';


/**
 * Unwrap a backend function response.
 * Supports both a direct response object and a { data } wrapper.
 * Returns null for empty responses.
 */
function firstRow(value) {
  return Array.isArray(value) ? value[0] || null : value;
}

function unwrap(res) {
  if (!res) return null;
  // Wrapped form: { data: { ok, member, ... } }
  if (
    res.data &&
    typeof res.data === 'object' &&
    !Array.isArray(res.data) &&
    ('ok' in res.data || 'error' in res.data || 'member' in res.data)
  ) {
    return res.data;
  }
  // Direct form: { ok, member, ... }
  return res;
}

/**
 * Resolve the normalized payload, throwing a friendly error when the backend
 * reported failure (ok === false) or returned no payload at all.
 */
function requireOk(res, fallbackMessage) {
  const body = unwrap(res);
  if (!body) {
    throw new Error(fallbackMessage);
  }
  if (body.ok === false || body.error) {
    throw new Error(body.message || body.error || fallbackMessage);
  }
  return body;
}

/**
 * Update the authenticated user's own Member profile.
 * Protected fields are stripped server-side by the backend.
 * @param {Object} fields - Non-protected fields to update.
 * @returns {Promise<Object>} The updated member record.
 */
export async function updateMemberProfile(fields, requestOptions) {
  fields = prepareWorkFields(fields);
  const indicatorConsent={
    distance:fields?.show_distance===false||fields?.location_enabled===false?false:fields?.indicator_distance_consent,
    presence:fields?.show_online_status===false?false:fields?.indicator_presence_consent,
    calculation:fields?.show_distance===false||fields?.location_enabled===false?false:fields?.indicator_distance_calculation,
  };
  delete fields.indicator_distance_consent;delete fields.indicator_presence_consent;delete fields.indicator_distance_calculation;
  if (useSupabase) {
    const settingsUpdates=Object.fromEntries(Object.entries(fields||{}).filter(([key])=>SETTING_KEYS.includes(key)));
    fields=Object.fromEntries(Object.entries(fields||{}).filter(([key])=>!SETTING_KEYS.includes(key)&&key!=='_settingsChanges'));
    const detailKeys = ['height_cm','work_text','share_height','share_work','smoking','drinking','share_smoking','share_drinking'];
    const detailUpdates = Object.fromEntries(Object.entries(fields || {}).filter(([key]) => detailKeys.includes(key)));
    const familyKeys = ["marital_status", "family_plan", "share_marital_status", "share_family_plan", "share_nationality"];
    const promptUpdates = Object.hasOwn(fields || {}, 'prompts') ? fields.prompts : null;
    fields = Object.fromEntries(Object.entries(fields || {}).filter(([key]) => key !== 'prompts'));
    const familyUpdates = Object.fromEntries(Object.entries(fields || {}).filter(([key]) => familyKeys.includes(key)));
    const profileUpdates = Object.fromEntries(Object.entries(fields || {}).filter(([key]) => !familyKeys.includes(key) && !detailKeys.includes(key)));
    const save = async (name, updates, stage) => {
      if (!Object.keys(updates).length) return {};
      try {
        const row = firstRow(await withTimeout(() => requestOptions ? callSupabaseRpc(name, { p_updates: updates }, requestOptions) : callSupabaseRpc(name, { p_updates: updates })));
        if (!row || typeof row !== 'object') throw Object.assign(new Error('Profile save was not confirmed.'), { code: 'PROFILE_SAVE_EMPTY' });
        if (stage === 'profile-write' && Object.hasOwn(updates, 'gender') && (row.gender ?? '') !== (updates.gender ?? '')) {
          throw Object.assign(new Error('Gender persistence was not confirmed.'), { code: 'PROFILE_SAVE_MISMATCH' });
        }
        if (stage === 'prompt-write' && JSON.stringify(row.prompts ?? []) !== JSON.stringify(updates.prompts ?? [])) {
          throw Object.assign(new Error('Profile prompt persistence was not confirmed.'), { code: 'PROFILE_SAVE_MISMATCH' });
        }
        if (Object.hasOwn(updates, 'photo_gallery') && JSON.stringify(row.photo_gallery) !== JSON.stringify(updates.photo_gallery)) {
          throw Object.assign(new Error('Gallery persistence was not confirmed.'), { code: 'PROFILE_SAVE_MISMATCH' });
        }
        if (['family-write','details-write'].includes(stage) && Object.entries(updates).some(([key,value]) => (row[key] ?? '') !== (typeof value === 'string' && key === 'work_text' ? value.trim() : (value ?? '')))) {
          throw Object.assign(new Error('Family preferences were not confirmed.'), { code: 'PROFILE_SAVE_MISMATCH' });
        }
        return row;
      } catch (error) {
        const failure = new Error('Profile save could not finish. Please retry.');
        failure.code = error?.code;
        failure.profileSaveStage = stage;
        throw failure;
      }
    };
    const profile = await save('save_my_onboarding_progress', profileUpdates, 'profile-write');
    let prompts = null;
    if (promptUpdates) {
      try {
        prompts = await withTimeout(() => callSupabaseRpc('nmood_save_my_profile_prompts', promptUpdates));
        if (!Array.isArray(prompts) || JSON.stringify(prompts) !== JSON.stringify(promptUpdates)) {
          throw Object.assign(new Error('Profile prompt persistence was not confirmed.'), { code: 'PROFILE_SAVE_MISMATCH' });
        }
      } catch (error) {
        const failure = new Error('Profile save could not finish. Please retry.');
        failure.code = error?.code;
        failure.profileSaveStage = 'prompt-write';
        throw failure;
      }
    }
    const family = await save('nmood_save_my_family_preferences', familyUpdates, 'family-write');
    const details = await save('nmood_save_my_profile_details', detailUpdates, 'details-write');
    const settings=await saveOnboardingSettings(settingsUpdates,requestOptions);
    await revokeMemberIndicatorsForProfilePatch(fields);
    await persistExplicitMemberIndicatorConsent(indicatorConsent,requestOptions);
    return { ...(firstRow(profile) || {}), ...(prompts ? { prompts } : {}), ...(firstRow(family) || {}), ...details, ...(settings||{}) };
  }
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'updateProfile',
    fields,
  });
  const body = requireOk(res, 'Could not update your profile. Please try again.');
  return body.member;
}

/**
 * Create the authenticated user's Member profile during onboarding.
 * Server-side validates that a profile photo is present before creating.
 * Protected fields are stripped server-side by the backend.
 * @param {Object} fields - Non-protected fields for the new member.
 * @returns {Promise<Object>} The created member record.
 */
export async function createMemberProfile(fields) {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'createProfile',
    fields,
  });
  const body = requireOk(res, 'Could not create your profile. Please try again.');
  return body.member;
}

/** Return the authenticated account's single resumable onboarding profile. */
export async function ensureOnboardingProfile(requestOptions = {}) {
  if (useSupabase) {
    // Provisioning is idempotent on the server. A connection can drop after
    // the profile was created but before Android receives the response, so a
    // single immediate retry is safe and avoids stranding a new account on
    // the onboarding load screen.
    const rpc = (name, options = requestOptions) => Object.keys(options).length
      ? callSupabaseRpc(name, {}, options)
      : callSupabaseRpc(name);
    let profile;
    let failure;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        profile = firstRow(await rpc('ensure_my_onboarding_profile'));
        if (!profile?.id) throw new Error('PROFILE_UNAVAILABLE');
        break;
      } catch (error) {
        failure = error;
        if (requestOptions.signal?.aborted || attempt === 1) throw failure;
      }
    }
    try {
      const family = firstRow(await rpc('nmood_get_my_family_preferences'));
      let prompts = [];
      try { prompts = await withTimeout(() => callSupabaseRpc('nmood_read_profile_prompts', { p_member_id: profile.id }, requestOptions)); } catch { /* optional profile detail unavailable */ }
      let details = {};
      try { details = await withTimeout(signal => rpc('nmood_get_my_profile_details', { ...requestOptions, signal })); } catch { /* optional extension not activated */ }
      return { ...(profile || {}), ...(family || {}), ...(details || {}), prompts: Array.isArray(prompts) ? prompts : [] };
    } catch {
      return profile;
    }
  }
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'ensureOnboardingProfile',
  });
  const body = requireOk(res, 'Could not prepare your onboarding profile. Please try again.');
  return body.member;
}

/** Mark the already-provisioned profile complete after server-side validation. */
export async function completeOnboardingProfile(options = {}) {
  if (useSupabase) {
    return callSupabaseRpc(MAIN_PASSPORT ? 'nmood_main_complete_onboarding' : 'complete_my_onboarding', {}, options);
  }
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'updateProfile',
    fields: { onboarding_completed: true },
  });
  return requireOk(res, 'Could not finish onboarding. Please try again.').member;
}

/**
 * Idempotent find-or-create Member profile at signup (email flow).
 * Called after OTP verification with the first name, last name, email, and
 * DOB collected on the Create Account form. The backend derives eligibility
 * server-side and sets onboarding_completed, so the user goes directly to
 * Home — no duplicate name/DOB onboarding screens, no standalone DOB gate.
 * @param {Object} params - { first_name, last_name, email, dob }
 * @returns {Promise<Object>} The backend response body ({ ok, member, created }).
 */
export async function registerMemberProfile({ first_name, last_name, display_name, email, dob }) {
  if (useSupabase) {
    return updateMemberProfile({ first_name, last_name, ...(display_name ? { display_name } : {}), ...(dob ? { date_of_birth: dob } : {}) });
  }
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'registerProfile',
    first_name,
    last_name,
    email,
    dob,
  });
  const body = requireOk(res, 'Could not create your profile. Please try again.');
  return body;
}

/**
 * Update the authenticated user's date of birth.
 * The backend derives eligibility_status server-side — the client never
 * sets eligibility_status directly. Verified members cannot self-serve a
 * DOB change (must contact Support).
 * @param {string} dob - ISO date string (YYYY-MM-DD).
 * @returns {Promise<Object>} The backend response body ({ ok, member, eligibility_status }).
 */
export async function updateMemberDob(dob) {
  if (useSupabase) {
    return firstRow(await callSupabaseRpc('save_my_onboarding_progress', {
      p_updates: { date_of_birth: dob },
    }));
  }
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'updateDob',
    dob,
  });
  const body = requireOk(res, 'Could not update your date of birth. Please try again.');
  return body;
}

/**
 * Delete the authenticated user's own account.
 * Permanently removes the authenticated account after server confirmation.
 * @returns {Promise<Object>} The completed deletion response.
 */
export async function deleteMemberAccount(confirmation) {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'deleteAccount',
    confirmation,
  });
  const body = requireOk(res, 'Could not delete your account. Please try again.');
  return body;
}

/**
 * Fetch the server-side filtered, eligibility-verified member list for
 * Discover, Search, and AI recommendations.
 *
 * Re-exported from `@/lib/member-discovery`, which reads Supabase directly.
 * The previous Base44 `authorizationGate` implementation does not answer in
 * the independently hosted build and silently returned an empty list.
 */
export { fetchDiscoverableMembers } from '@/lib/member-discovery';
