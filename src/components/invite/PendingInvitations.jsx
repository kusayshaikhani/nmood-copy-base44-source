import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getMyInvitations } from '@/api/supabaseClient';
import { IncomingRequestGate } from '@/components/membership/ExplorerPolicyGate';
import InvitationCard from './InvitationCard';

function PendingInvitationList() {
  const { user } = useAuth();
  const [state, setState] = useState({ uid: null, rows: [], error: false });
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const uid = user?.id;
    setState({ uid, rows: [], error: false });
    if (uid) getMyInvitations('pending').then(rows => {
      if (active) setState({ uid, rows: rows || [], error: false });
    }).catch(() => { if (active) setState({ uid, rows: [], error: true }); });
    return () => { active = false; };
  }, [user?.id, refresh]);
  if (!user?.id || state.uid !== user.id) return null;
  if (state.error) return <div role="alert" className="mb-6 rounded-2xl border border-border p-4 text-sm">Invitations could not be loaded. <button type="button" className="min-h-11 font-medium text-primary" onClick={() => setRefresh(n => n + 1)}>Refresh invitations</button></div>;
  if (!state.rows.length) return null;
  return <section aria-label="Your invitations" className="mb-8 space-y-4">
    <h2 className="text-lg font-semibold">Your invitations</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {state.rows.map(row => <InvitationCard key={row.id} invitation={row} />)}
    </div>
  </section>;
}
export default function PendingInvitations() {
  return <IncomingRequestGate><PendingInvitationList /></IncomingRequestGate>;
}
