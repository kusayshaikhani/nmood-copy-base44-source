// Local presentation only. Never grants access or changes server allowances.
export const PROMPT_INTERVAL = 24 * 60 * 60 * 1000;
export const PREMIUM_MOMENTS = {
 profile: { title: 'Get to know a little more', body: 'Premium opens full permitted profile details and photo galleries. Every member’s privacy choices still apply.' },
 filters: { title: 'Find more of what matters to you', body: 'Combining relationship goals, interests and languages? Premium helps refine discovery using permitted profile details. Basic browsing stays available. Distance filtering is not currently available.' },
 limit: { title: 'A little time between introductions', body: 'Your current introduction allowance is used. You can wait for it to renew or explore Premium. Keep browsing Nmoods and chatting with your existing connections.' },
 passport: { title: 'Meet your next destination', body: 'Explore Nmoods before you travel. Premium Passport lets you discover one destination country, with an optional city. Turn it off to return home.' },
 incoming: { title: 'Get to know incoming interest', body: 'Premium lets you view and respond to permitted incoming requests. Their details stay private until access is confirmed.' },
};
export function advancedFilterIntent(filters) {
 return ['looking_for_tags','interests','languages'].filter(key=>filters[key]?.length>0).length>=2;
}
export function claimPremiumMoment(storage, account, moment, now=Date.now()) {
 if (!account || !PREMIUM_MOMENTS[moment]) return false;
 try {
  const key=`nmood.premium-moments.v1:${account}`;
  const state=JSON.parse(storage.getItem(key)||'{}');
  if (state.seen?.includes(moment) || (state.last!=null && now-state.last<PROMPT_INTERVAL)) return false;
  storage.setItem(key,JSON.stringify({seen:[...(state.seen||[]),moment],last:now}));
  return true;
 } catch { return false; } // Unavailable storage must never cause repeated prompts.
}
export function isIntroductionLimit(error) {
 return error?.detail==='NMOOD_LIKE_LIMIT_REACHED' || error?.detail==='NMOOD_EXPLORER_DISCOVERY_LOCKED' || /(?:used your (?:30 likes|two requests)|like limit reached|current introduction allowance is used)/i.test(error?.message||'');
}
