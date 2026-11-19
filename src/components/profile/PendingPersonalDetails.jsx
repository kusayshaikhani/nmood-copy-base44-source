import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import PersonalDetailsFields from './PersonalDetailsFields';
import { useAuth } from '@/lib/AuthContext';
import { updateMemberProfile } from '@/lib/member-update';
import { withTimeout } from '@/lib/bounded-operation';
import { mergePersonalChanges, readPendingPersonalDetails, storePendingPersonalDetails, savePersonalDetails } from '@/lib/onboarding-personal-details';

// Account-keyed by the parent. Retained optional onboarding drafts remain
// reviewable/retryable even after required onboarding has completed.
export default function PendingPersonalDetails() {
  const { user, member, refreshMember } = useAuth();
  const [changes, setChanges] = useState(() => readPendingPersonalDetails(user?.id));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(true), saving = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  if (!Object.keys(changes).length) return null;
  const retain = next => {
    setChanges(next);
    if (!storePendingPersonalDetails(user.id, next)) setError('This device cannot retain the optional draft after closing the app. Keep this page open to retry.');
  };
  const retry = async () => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      const result = await savePersonalDetails(changes, patch => withTimeout(signal => updateMemberProfile(patch, { expectedUserId: user.id, signal })));
      if (!active.current) return;
      setError(result.error); retain(result.remaining);
      // Refresh the canonical profile; never replace it with a partial patch.
      if (Object.keys(result.saved).length) await refreshMember().catch(() => {});
    } finally { saving.current = false; if (active.current) setBusy(false); }
  };
  return <section aria-label="Unsaved optional details" className="m-4 space-y-3 rounded-xl border border-border p-4">
    <h2 className="font-semibold">Your optional details draft</h2>
    <p className="text-sm">Some optional details are not saved yet. Your choices are kept on this device and have not been discarded.</p>
    {error && <p role="alert" className="text-sm">{error}</p>}
    <fieldset disabled={busy} className="space-y-3">
      <Button variant="outline" onClick={() => setEditing(value => !value)}>{editing ? 'Hide draft' : 'Review draft'}</Button>
      {editing && <PersonalDetailsFields data={{ ...member, ...changes }} update={patch => { setError(''); retain(mergePersonalChanges(changes, patch)); }} includeNationality selectionIncludesSharing />}
      <Button onClick={retry}>{busy ? 'Saving optional details…' : 'Retry optional details'}</Button>
    </fieldset>
  </section>;
}
