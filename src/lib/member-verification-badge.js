import { callSupabaseRpc } from '@/api/supabaseClient';

export function verificationSummary(value) {
 if (!value || !['email','photo','phone'].every(k=>typeof value[k]==='boolean')) return {verified:false,known:false,label:'Verification status unavailable',detail:'Email, photo and phone checks are required for full verification.'};
 const missing=['email','photo','phone'].filter(k=>!value[k]);
 return {verified:missing.length===0,known:true,count:3-missing.length,missing,label:missing.length?`${3-missing.length} of 3 verified`:'Verified',detail:missing.length?`Complete ${missing.join(', ')} verification.`:'Email, photo and phone verified.'};
}
export async function fetchMemberVerification(memberId) {
 if (!memberId) return verificationSummary(null);
 try { return verificationSummary(await callSupabaseRpc('nmood_member_verification_status',{p_member_id:memberId})); }
 catch { return verificationSummary(null); }
}
// Compatibility name: a public Verified badge now requires all three checks.
export async function fetchMemberIdentityVerified(memberId) {
 return (await fetchMemberVerification(memberId)).verified;
}
