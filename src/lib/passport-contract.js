// Transport contract only. This is not a client-side discovery filter or authority.
export const PASSPORT_CONTRACT = 'country-passport-v1';
export const PASSPORT_COUNTRY_RPC = { read: 'nmood_get_my_passport', save: 'nmood_save_my_passport' };

export function passportAvailable(passport, now = Date.now()) {
 return passport?.eligible === true && Number.isSafeInteger(passport.generation) && passport.generation > 0
  && Number.isFinite(Date.parse(passport.valid_until)) && Date.parse(passport.valid_until) > now;
}

export function checkedPassport(passport) {
 if (!passport || typeof passport.eligible !== 'boolean'
  || !Number.isSafeInteger(passport.generation) || passport.generation < 1
  || (passport.eligible && !passportAvailable(passport))
  || (!passport.eligible && passport.valid_until !== null)) throw new Error('Passport eligibility could not be confirmed.');
 return { eligible: passport.eligible, generation: passport.generation, valid_until: passport.valid_until };
}

// Country confirmation is explicit; historical country/city/location are never inputs.
export function passportUpdate(changes, revision, generation) {
 const keys = Object.keys(changes || {});
 if (!keys.length || keys.some(k => !['home_country', 'browse_everywhere', 'share_everywhere'].includes(k))
  || keys.some(k => k === 'home_country' ? !/^[A-Z]{2}$/.test(changes[k]) : typeof changes[k] !== 'boolean')
  || (revision !== null && (!Number.isSafeInteger(revision) || revision < 1))
  || !Number.isSafeInteger(generation) || generation < 1) throw new Error('Review your country choices.');
 return { p_updates: { ...changes }, p_country_confirmed: keys.includes('home_country'),
  p_expected_revision: revision, p_expected_generation: generation };
}
