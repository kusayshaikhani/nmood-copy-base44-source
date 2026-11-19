import React from 'react';
import { LEGAL_CONTACTS } from '@/lib/legal-config';
export default function DeletionConfirmation({state, historical=false}){
 const immediate=state?.deletion_mode==='immediate';
 const deadline=Number.isFinite(Date.parse(state?.recovery_until))?new Date(state.recovery_until).toISOString():null;
 return <section aria-labelledby="deletion-confirmation-title" className="space-y-4">
  <h1 id="deletion-confirmation-title" className="text-xl font-semibold">{state?.status==='COMPLETE'?'Account permanently deleted':state?.status==='RECOVERED'?'Account recovery confirmed':immediate?'Permanent deletion in progress':'Account deletion scheduled'}</h1>
  {historical&&<p role="status">Last confirmed response. Checking the current server state is required before assuming any change.</p>}
  {state?.status==='COMPLETE'?<p>Your account and personal data have completed permanent erasure under the retention policy. Recovery of this account is no longer possible.</p>:state?.status==='RECOVERED'?<p>Support has completed account recovery. Sign in again to continue; your previous sessions remain signed out.</p>:immediate?<><p>Your account is locked and you are signed out. Permanent erasure has started with no recovery period. This action cannot be undone.</p><p role="status">Some deletion steps have not yet completed. We will not show completion until the server confirms it. Contact Support if this status persists.</p></>:<>
   <p>Your account is locked and you are signed out. Permanent deletion is scheduled after the recovery period.</p>
   {deadline?<p>Recovery deadline: <time dateTime={deadline}>{new Date(deadline).toUTCString()}</time> (UTC).</p>:<p role="status">The exact recovery deadline is unavailable. Contact Support to confirm it; do not assume you have a new 30-day period.</p>}
   {state?.status==='PURGE_PENDING'?<p>The recovery period has ended. Permanent erasure is being processed; recovery is no longer available.</p>:<p>To request recovery before this deadline, email Support from the address linked to your account. An authorized administrator must verify your identity and approve recovery. Signing in does not cancel deletion.</p>}
  </>}
  {immediate&&<p>Permanent deletion, including invalidation of hosted media links, can take up to 60 seconds after server erasure. Copies already downloaded or stored in a browser cache cannot be recalled. If a service fails, deletion remains in progress while we retry.</p>}
  {state?.status!=='RECOVERED'&&<aside aria-labelledby="apple-access-heading" className="rounded-xl border p-4 space-y-2">
   <h2 id="apple-access-heading" className="font-semibold">If you used Sign in with Apple</h2>
   <p>Your Nmood deletion proceeds even if automatic Apple-access revocation is unavailable. This step does not delay or cancel permanent deletion.</p>
   <p>To remove any remaining Apple access, open your iPhone or iPad Settings, tap your name, then Sign in with Apple. Select Nmood, tap Delete, then Stop Using. Menu names can vary by system version.</p>
   <p>You can also visit account.apple.com, open Sign-In and Security, then Sign in with Apple, and select Nmood to stop using it.</p>
   <p>If the entry is shared with other apps, review those apps before removing access. Removing Apple access does not cancel a paid subscription.</p>
   <a className="inline-block underline" href="https://support.apple.com/102571" target="_blank" rel="noopener noreferrer">Apple’s instructions for managing app access</a>
  </aside>}
  <p>Support: <a className="underline" href={`mailto:${LEGAL_CONTACTS.support}`}>{LEGAL_CONTACTS.support}</a>. Never send a password, sign-in code or recovery receipt.</p>
  <a className="inline-block underline" href="/account-deletion">Deletion and retention policy</a>
 </section>;
}
