import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, UserPlus, Bookmark, Heart, MessageCircle, Flag, Ban } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { sendRequest } from '@/lib/connections-store';
import { useHaptic } from '@/lib/haptics';
import { SUCCESS_COPY, ERROR_COPY } from '@/lib/copy';
import ReportSheet from '@/components/safety/ReportSheet';
import BlockConfirmSheet from '@/components/safety/BlockConfirmSheet';
import ExplorerLimitNotice from '@/components/connections/ExplorerLimitNotice';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useServerPremium } from '@/hooks/useServerPremium';

export default function MemberActionsSheet({ open, onOpenChange, member }) {
  const navigate = useNavigate();
  const { check, showUpgrade, recordUsage, isPremium } = useMembershipAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const haptic = useHaptic();
  const { t } = useLocalization();
  const [action, setAction] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);

  // RC-002A/BUG-007 — Reuse the same server-authorized premium check as
  // WhyRecommendedSheet so Explorer members never see the compatibility score.
  const { canSee: canSeeExplanation } = useServerPremium('getMatchExplanation', open);

  if (!member) return null;

  const canBecomePals = member.sharedCircles?.length > 0 || member.sharedCommunities?.length > 0;

  const actions = [
    { id: 'invite_experience', icon: Calendar, color: 'text-primary' },
    { id: 'invite_circle', icon: Users, color: 'text-accent-foreground' },
    { id: 'become_pals', icon: UserPlus, color: 'text-success', disabled: !canBecomePals },
    { id: 'follow', icon: Heart, color: 'text-primary' },
    { id: 'message', icon: MessageCircle, color: 'text-info' },
    { id: 'save', icon: Bookmark, color: 'text-muted-foreground' },
    { id: 'report', icon: Flag, color: 'text-destructive' },
    { id: 'block', icon: Ban, color: 'text-destructive' },
  ];

  const actionLabel = (a) => t('discovery.actions.' + a.id + '.label');
  const actionDesc = (a) => a.id === 'become_pals'
    ? t(canBecomePals ? 'discovery.actions.become_pals.desc.yes' : 'discovery.actions.become_pals.desc.no')
    : t('discovery.actions.' + a.id + '.desc');

  // MP-007.2: when an Explorer hits the connection-request limit, only
  // Save / Report / Block remain available; Become Pals, invites, follow and
  // message are hidden and a live countdown banner is shown.
  const connectionPerm = check(FEATURES.CONNECTION_REQUEST);
  const limitReached = !isPremium && !connectionPerm.allowed && connectionPerm.reason === 'limit_reached';
  const visibleActions = limitReached
    ? actions.filter((a) => ['save', 'report', 'block'].includes(a.id))
    : actions;

  const handleAction = async (a) => {
    if (a.id === 'become_pals') {
      const perm = check(FEATURES.CONNECTION_REQUEST);
      if (!perm.allowed) {
        trackMembershipEvent(MEMBERSHIP_EVENTS.LIMIT_REACHED, { feature: 'connection_request', used: perm.used, limit: perm.limit });
        toast({ title: t('discovery.actions.explorer_limit.title'), description: t('discovery.actions.explorer_limit.desc') });
        showUpgrade('connection_request');
        return;
      }
      setAction(a.id);
      const req = await sendRequest({
        user,
        receiver: { id: member.id, name: member.name, avatar: member.avatar },
        mutualInterests: member.sharedInterests,
      });
      recordUsage('connection_request');
      setAction(null);
      onOpenChange(false);
      if (req) {
        haptic('success');
        toast({ title: SUCCESS_COPY.requestSent.title, description: t('discovery.actions.request_sent', { name: member.name }) });
      } else {
        haptic('error');
        toast(ERROR_COPY.generic);
      }
      return;
    }
    if (a.id === 'report') { setShowReport(true); return; }
    if (a.id === 'block') { setShowBlock(true); return; }
    haptic('light');
    setAction(a.id);
    setTimeout(() => {
      setAction(null);
      onOpenChange(false);
      if (a.id === 'invite_experience') navigate('/explore');
      if (a.id === 'invite_circle') navigate('/communities');
    }, 1200);
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-4">
          <SheetTitle>{t('discovery.actions.title', { name: member.name })}</SheetTitle>
          <SheetDescription>{t('discovery.actions.desc')}</SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{member.name}</p>
            {/* RC-002A/BUG-007 — Explorer members see city only; the compatibility
                percentage is gated by the same server-authorized premium check
                used in WhyRecommendedSheet. */}
            {canSeeExplanation ? (
              <p className="text-xs text-muted-foreground">{t('discovery.actions.match', { score: member.score, city: member.city })}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{member.city}</p>
            )}
          </div>
          {!canSeeExplanation && (
            <button
              type="button"
              onClick={() => showUpgrade('match_explanation')}
              className="text-xs font-medium text-primary hover:underline flex-shrink-0"
            >
              {t('discovery.why.explorer_locked_cta')}
            </button>
          )}
        </div>

        {limitReached && <ExplorerLimitNotice />}

        <div className="space-y-2">
          {visibleActions.map((a) => {
            const Icon = a.icon;
            return (
              <motion.button
                key={a.id}
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={a.disabled || action === a.id}
                onClick={() => handleAction(a)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-default text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className={'w-4 h-4 ' + a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{actionLabel(a)}</p>
                  <p className="text-xs text-muted-foreground">{actionDesc(a)}</p>
                </div>
                {action === a.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Heart className="w-4 h-4 text-success fill-success" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            {t('common.maybe_later')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

      <ReportSheet open={showReport} onOpenChange={setShowReport} target={{ type: 'member', id: member.id, name: member.name, image: member.avatar }} />
      <BlockConfirmSheet open={showBlock} onOpenChange={setShowBlock} member={{ id: member.id, name: member.name, avatar: member.avatar }} />
    </>
  );
}