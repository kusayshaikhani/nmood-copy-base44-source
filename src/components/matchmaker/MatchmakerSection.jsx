import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MemberDiscoveryCard from './MemberDiscoveryCard';
import { fetchTopRecommendations, buildMatchProfile } from '@/lib/matchmaker-data';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MatchmakerSection({ title, subtitle }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { member, user } = useAuth();
  const resolvedTitle = title || t('discovery.matchmaker.title');
  const resolvedSubtitle = subtitle || t('discovery.matchmaker.subtitle');
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const userProfile = buildMatchProfile(member);
    if (!userProfile) return;
    let active = true;
    fetchTopRecommendations(userProfile, 3, { currentUserId: member?.id || user?.id, currentUserEmail: member?.email || user?.email })
      .then((recs) => { if (active) setRecommendations(recs); })
      .catch(() => {});
    return () => { active = false; };
  }, [member, user]);

  if (recommendations.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" /> {resolvedTitle}
          </h2>
          <p className="text-xs text-muted-foreground">{resolvedSubtitle}</p>
        </div>
        <button
          onClick={() => navigate('/discover-people')}
          className="text-xs text-primary font-medium"
          type="button"
        >
          {t('common.see_all')}
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {recommendations.map((member, i) => (
          <div key={member.id} className="flex-shrink-0">
            <MemberDiscoveryCard member={member} index={i} compact />
          </div>
        ))}
      </div>
    </section>
  );
}