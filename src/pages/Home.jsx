import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
import HomeSkeleton from '@/components/home/HomeSkeleton';
import { startTimer } from '@/lib/performance-monitor';
import ContractSearch from '@/components/discover/ContractSearch';

export default function Home() {
  const { user, member: authenticatedMember } = useAuth();
  const navigate = useNavigate();
  const [_member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const timer = startTimer('home_load', 'home');
    const checkMember = async () => {
      try {
        // AuthContext already resolved the authenticated user's canonical
        // profile. Re-reading it here used to make a completed account look
        // incomplete when a direct RLS request was delayed or unavailable.
        const myMember = authenticatedMember || await getOwnMember(user.id, user.email);
        // Only a confirmed, incomplete profile belongs in onboarding. A
        // missing response is a recoverable profile-read problem, not a
        // logout or onboarding instruction for an existing account.
        if (myMember && !myMember.onboarding_completed) {
          navigate('/onboarding', { replace: true });
          return;
        }
        setMember(myMember || authenticatedMember || null);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        timer.end();
      }
    };
    checkMember();
  }, [user, authenticatedMember, navigate]);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#b2a1fc] to-[#3611db] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <ContractSearch initialKind="people" deckOnly />
    </div>
  );
}
