import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSafeBack } from '@/lib/safe-navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flag, Users, MapPin, Lock, Shield, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommunityDetail } from '@/lib/communities-live';
import { normalizeCircle } from '@/lib/circle-store';
import CommunityAbout from '@/components/communities/CommunityAbout';
import CommunityChat from '@/components/communities/CommunityChat';
import CommunityCalendar from '@/components/communities/CommunityCalendar';
import CommunityMembers from '@/components/communities/CommunityMembers';
import CommunityInsights from '@/components/communities/CommunityInsights';
import CommunityRules from '@/components/communities/CommunityRules';
import CircleSection from '@/components/circles/CircleSection';
import { useLocalization } from '@/lib/i18n/useLocalization';

const tabIds = ['about', 'circles', 'chat', 'calendar', 'members', 'insights', 'rules'];
const tabLabelMap = { about: 'community.detail.tab_about', circles: 'community.detail.tab_circles', chat: 'community.detail.tab_chat', calendar: 'community.detail.tab_calendar', members: 'community.detail.tab_members', insights: 'community.detail.tab_insights', rules: 'community.detail.tab_rules' };

const joinConfig = {
  public: { label: 'community.detail.join_community', class: 'flex-1 bg-success hover:bg-success/90' },
  approval: { label: 'community.detail.request_join', class: 'flex-1' },
  private: { label: 'community.detail.private', class: 'flex-1', disabled: true },
  invite: { label: 'community.detail.invitation_only', class: 'flex-1', disabled: true },
};

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleBack = useSafeBack('/communities');
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState('about');
  const [joined, setJoined] = useState(false);
  const { community, loading, circles } = useCommunityDetail(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">{t('community.detail.not_found')}</p>
        <Link to="/communities"><Button>{t('community.detail.back')}</Button></Link>
      </div>
    );
  }

  const cfg = joinConfig[community.join_type] || joinConfig.public;
  const normalizedCircles = circles.map(normalizeCircle).filter(Boolean);

  return (
    <div className="space-y-5 pb-32">
      <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden">
        <img src={community.cover_photo} alt={community.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button onClick={handleBack} className="absolute top-4 start-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-default" type="button">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute bottom-4 start-4 end-4">
          <div className="flex gap-1.5 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur px-2 py-1 rounded-full">{community.category}</span>
            <span className="text-[10px] font-semibold bg-primary/80 backdrop-blur text-primary-foreground px-2 py-1 rounded-full capitalize">
              {community.join_type === 'invite' ? t('community.detail.invite_only') : community.join_type}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white text-balance">{community.name}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-white/80"><Users className="w-3 h-3" /> {t('community.detail.members', { count: community.member_count })}</span>
            {community.location && <span className="flex items-center gap-1 text-xs text-white/80"><MapPin className="w-3 h-3" /> {community.location}</span>}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto no-scrollbar">
        {tabIds.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
            className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-default whitespace-nowrap ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(tabLabelMap[tab])}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'about' && <CommunityAbout community={community} />}
          {activeTab === 'circles' && (
            <CircleSection title={t('community.detail.active_circles')} circles={normalizedCircles} />
          )}
          {activeTab === 'chat' && (
            <div className="h-[55vh]"><CommunityChat community={community} /></div>
          )}
          {activeTab === 'calendar' && <CommunityCalendar community={community} />}
          {activeTab === 'members' && <CommunityMembers community={community} />}
          {activeTab === 'insights' && <CommunityInsights community={community} />}
          {activeTab === 'rules' && <CommunityRules community={community} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => navigate('/safety-center')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-default" type="button">
          <Shield className="w-3.5 h-3.5" /> {t('common.safety_center')}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-default" type="button">
          <Flag className="w-3.5 h-3.5" /> {t('common.report')}
        </button>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-x-0 bottom-[63px] z-[100] px-4 pt-3 pb-0 bg-background border-t border-border">
          <div className="max-w-2xl mx-auto">
            {!joined ? (
              <div className="flex gap-2">
                <Button
                  size="lg"
                  className={cfg.class}
                  disabled={cfg.disabled}
                  onClick={() => !cfg.disabled && setJoined(true)}
                >
                  {cfg.disabled && community.join_type === 'private' && <Lock className="w-4 h-4 me-1" />}
                  {t(cfg.label)}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-1">
                <Crown className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">{t('community.detail.youre_member')}</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}