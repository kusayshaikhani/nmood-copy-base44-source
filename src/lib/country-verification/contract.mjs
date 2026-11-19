import isoCodes from './iso-codes.json' with {type:'json'};
// Country-only values. No coordinate, IP, address or history field is accepted.
export const ERRORS = Object.freeze({
 status: "We couldn’t load your country-verification status. Account access remains blocked. This check has not requested your location. Try again later or contact support.",
 unsupported: 'This device cannot complete secure country verification. Update iPadOS and try again, or sign in to this same account on a supported iPhone or iPad. Your account has not been deleted. Verification is still required.',
 recovery: 'Device verification needs recovery. Return to sign in and contact Nmood support for device-registration recovery. Do not create another account. Support cannot bypass country verification.',
 mismatch: 'Your selected country does not match your verified device location. Choose your current country to continue.',
 denied: 'Location verification is required to create an active Nmood account. Enable location access and try again.',
 unavailable: 'We couldn’t verify your country. Check your connection and location settings, then try again.',
});
export const COUNTRY_VERIFICATION_RELEASED = false;
export function countryCode(value) {return typeof value==='string' && /^[A-Z]{2}$/.test(value) && isoCodes.includes(value) ? value : null;}
export function safeDetection(result, now=Date.now()) {
 if(!result || Object.keys(result).sort().join(',')!=='country,detectedAt,method' || !countryCode(result.country)
   || result.method!=='device-offline-country-v1' || !Number.isSafeInteger(result.detectedAt)
   || result.detectedAt>now || now-result.detectedAt>120000) throw Error('unavailable');
 return {country:result.country,detectedAt:result.detectedAt,method:result.method};
}
export function matchCountry(selected,result,now) {
 const detection=safeDetection(result,now);
 if(selected!==detection.country)throw Error('mismatch');
 return detection;
}
export function safeState(value, actor, now=Date.now()) {
 const fields=['actor','verified','country','verifiedAt','method','countryStrict','browseEverywhere','shareEverywhere','premiumUntil','entitlementVersion'];
 if(!value || Object.keys(value).some(k=>!fields.includes(k)) || value.actor!==actor || typeof value.verified!=='boolean'
  || typeof value.countryStrict!=='boolean' || typeof value.browseEverywhere!=='boolean' || typeof value.shareEverywhere!=='boolean'
  || !Number.isSafeInteger(value.entitlementVersion) || value.entitlementVersion<0)throw Error('unavailable');
 if(value.verified ? !countryCode(value.country)||!Number.isSafeInteger(value.verifiedAt)||value.verifiedAt>now||value.method!=='device-offline-country-v1' : value.country!==null)throw Error('unavailable');
 const premium=value.verified&&Number.isSafeInteger(value.premiumUntil)&&value.premiumUntil>now;
 if((!premium&&(value.browseEverywhere||value.shareEverywhere)) || value.countryStrict===value.browseEverywhere)throw Error('unavailable');
 return Object.fromEntries(fields.map(k=>[k,value[k]]));
}
