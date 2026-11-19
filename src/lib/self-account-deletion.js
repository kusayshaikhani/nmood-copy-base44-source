import { invokeSupabaseFunction, supabaseAuth, getSupabaseSession } from '@/api/supabaseClient';
import { nativeDeletionProof } from '@/lib/native-social-auth';
const messages = {
  IMMEDIATE_CONFIRMATION_REQUIRED: 'Update Nmood to review and confirm irreversible deletion. Nothing was deleted.',
  TRY_LATER: 'Please wait before trying reauthentication again.',
  REAUTHENTICATION_FAILED: 'Reauthentication did not match this account. Nothing was deleted.',
  REAUTHENTICATION_REQUIRED: 'Please verify your identity using a sign-in method linked to this account.',
  DELETION_NOT_STARTED: 'Deletion could not safely start. Your account has not been deleted. Please contact Support.',
};
const safeError = error => new Error(messages[error?.error] || 'We could not confirm your deletion status. Please contact Support before trying again.');
export async function getSelfDeletionMethods(expectedId) {
  const user = await supabaseAuth.getUser();
  if (!expectedId || user?.id !== expectedId) throw new Error('Please sign in again before deleting your account.');
  try {
    const result = await invokeSupabaseFunction('delete-my-account', { action: 'methods' }, { retryAuth: false });
    if (getSupabaseSession()?.user?.id !== expectedId || !Array.isArray(result?.providers) || !result.providers.length || result.providers.some(p => !['password', 'apple', 'google'].includes(p))) throw Error('METHODS_UNAVAILABLE');
    return result.providers;
  } catch (error) { throw safeError(error); }
}
export async function deleteOwnAccount({ expectedId, provider, password, confirmation }) {
  if (!expectedId || getSupabaseSession()?.user?.id !== expectedId || confirmation !== 'DELETE') throw new Error('Confirm the signed-in account before continuing.');
  const proof = provider === 'password' ? { provider, password } : await nativeDeletionProof(provider);
  // A provider account picker may have taken time; never target a changed app session.
  try {
    if (getSupabaseSession()?.user?.id !== expectedId) throw new Error('ACCOUNT_CHANGED');
    const result = await invokeSupabaseFunction('delete-my-account', { action: 'delete', confirmation, proof, deletion_policy: 'immediate-v1' }, { retryAuth: false });
    if (result?.accepted !== true || !['COMPLETE', 'RECOVERY_PENDING', 'PURGE_PENDING'].includes(result.status)) throw Error('UNCONFIRMED');
    return result;
  } catch (error) { if (error.message === 'ACCOUNT_CHANGED') throw new Error('The signed-in account changed. Nothing was deleted.'); throw safeError(error); }
  finally { for (const key of Object.keys(proof)) delete proof[key]; }
}
