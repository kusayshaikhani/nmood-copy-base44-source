import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, ChevronRight, Bookmark, MoreHorizontal } from 'lucide-react';
import ConnectButton from '@/components/connections/ConnectButton';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { resolveMemberPhoto } from '@/lib/member-photo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WhyRecommendedSheet from './WhyRecommendedSheet';
import MemberActionsSheet from './MemberActionsSheet';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { memberSubtitle } from '@/lib/member-display';

/**
 * UI-005 — Premium people discovery card.
 * Compact, scannable layout for mobile. All connect / why / actions / save /
 * premium-gating logic preserved exactly. Demo members render their real
 * display_name (resolved upstream in matchmaker-data); non-demo members are
 * server-gated to "Member" for non-subscribers.
 */
export default function MemberDiscoveryCard({ member, index = 0, compact = false }) {
  const [showWhy, setShowWhy] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [saved, setSaved] = useState(false);
  const { isPremium } = useMembershipAccess();
  const { t } = useLocalization();

  // RC-002A/BUG-007 — Explorer members never see recommendation scoring.
  const showScore = isPremium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.28, ease: 'easeOut' }}
      className={
        'rounded-card border border-border/40 bg-card p-4 shadow-card hover-lift ' +
        (compact ? 'w-72 flex-shrink-0' : 'w-full')
      }
    >
      {/* Header — avatar + identity + save */}
      <div className="flex items-start gap-3 mb-2.5">
        <div className="relative flex-shrink-0">
          <ProfileAvatar
            src={resolveMemberPhoto(member)}
            alt={member.name}
            initials={member.name?.charAt(0) || 'M'}
            className="w-12 h-12 border border-border shadow-sm"
            fallbackClassName="bg-primary/10 text-primary text-base font-semibold"
          />
          {member.verified && <VerifiedBadge variant="overlay" />}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{member.name}</p>
            {showScore && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                {member.score}%
              </span>
            )}
          </div>
          {(() => {
            const sub = memberSubtitle(member);
            if (!sub) return null;
            if (sub.kind === 'new') {
              return (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  <Sparkles className="w-2.5 h-2.5" />
                  {t('discovery.card.new_member')}
                </div>
              );
            }
            return (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0 text-primary" />
                <span className="truncate">{sub.label}</span>
              </div>
            );
          })()}
        </div>

        <button
          type="button"
          onClick={() => setSaved(!saved)}
          className="p-1.5 -m-1 rounded-lg hover:bg-muted flex-shrink-0 transition-default"
          aria-label={t('discovery.card.aria.save')}
        >
          <Bookmark className={'w-4 h-4 ' + (saved ? 'fill-primary text-primary' : 'text-muted-foreground')} />
        </button>
      </div>

      {/* Current InMood — slim pill */}
      {member.currentInMood && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 mb-2.5">
          <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
          <p className="text-[11px] font-medium text-primary truncate">
            {t('discovery.card.current_inmood', { mood: member.currentInMood })}
          </p>
        </div>
      )}

      {/* Shared interests */}
      {member.sharedInterests?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {member.sharedInterests.slice(0, 3).map((interest) => (
            <Badge key={interest} variant="secondary" className="text-[10px] py-0.5">
              {interest}
            </Badge>
          ))}
          {member.sharedCommunities?.length > 0 && (
            <Badge variant="outline" className="text-[10px] py-0.5 text-primary border-primary/30">
              {member.sharedCommunities[0]}
            </Badge>
          )}
        </div>
      )}

      {/* AI "Why recommended" — compact single-line hint */}
      {!compact && member.reasons?.length > 0 && (
        <button
          type="button"
          onClick={() => setShowWhy(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-default text-left mb-2.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <p className="text-xs text-foreground truncate flex-1">
            {member.reasons[0] ? t(member.reasons[0].key, member.reasons[0].params) : t('discovery.card.why_recommended')}
          </p>
          {member.reasons.length > 1 && (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <ConnectButton member={member} />
        <Button size="sm" variant="outline" onClick={() => setShowWhy(true)}>
          {t('discovery.card.why')}
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setShowActions(true)}
          aria-label={t('discovery.card.aria.more_actions')}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <WhyRecommendedSheet open={showWhy} onOpenChange={setShowWhy} member={member} />
      <MemberActionsSheet open={showActions} onOpenChange={setShowActions} member={member} />
    </motion.div>
  );
}