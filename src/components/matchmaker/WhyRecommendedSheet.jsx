import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowLeft, X, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { haptic } from '@/lib/haptics';
import { useServerPremium } from '@/hooks/useServerPremium';
import PhotoViewer from '@/components/matchmaker/PhotoViewer';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function WhyRecommendedSheet({ open, onOpenChange, member }) {
  const { showUpgrade } = useMembershipAccess();
  const { t } = useLocalization();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const poppedRef = useRef(false);

  // RC-002A/BUG-007 — Server-side authorization: the explanation is gated by
  // the authorizationGate backend, not just the client-side isPremium flag.
  const { canSee: canSeeExplanation, checking: checkingAuth } = useServerPremium('getMatchExplanation', open);

  // Browser/Android Back closes the viewer first, then the sheet — never trapped.
  useEffect(() => {
    if (!open) return;
    poppedRef.current = false;
    window.history.pushState({ nmoodSheet: 1 }, '');
    const onPop = () => {
      poppedRef.current = true;
      if (viewerOpen) setViewerOpen(false);
      else onOpenChange(false);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!poppedRef.current && window.history.state?.nmoodSheet) window.history.back();
    };
  }, [open, viewerOpen, onOpenChange]);

  if (!member) return null;

  const gallery =
    Array.isArray(member.photoGallery) && member.photoGallery.length
      ? member.photoGallery
      : [member.avatar].filter(Boolean);

  const close = () => onOpenChange(false);
  const openViewer = (i) => { setViewerIndex(i); setViewerOpen(true); haptic('light'); };
  const tapPhoto = () => {
    haptic('light');
    if (canSeeExplanation) openViewer(0);
    else showUpgrade('full_profile');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)] max-h-[92vh] overflow-y-auto">
          <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-3" />

          {/* Navigation bar — Back + Close, never trapped */}
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" aria-label={t('discovery.why.aria.back')} onClick={close}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t('discovery.why.aria.close')} onClick={close}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Sparkles className="w-4 h-4 text-accent" />
              {t('discovery.why.title', { name: canSeeExplanation ? member.name : '…' })}
            </SheetTitle>
            {canSeeExplanation ? (
              <SheetDescription className="text-left">
                <span className="font-semibold text-foreground">{t('discovery.why.compatibility', { score: member.score })}</span> — {t('discovery.why.desc')}
              </SheetDescription>
            ) : (
              <SheetDescription className="text-left">{t('discovery.why.desc')}</SheetDescription>
            )}
          </SheetHeader>

          {/* Photo — Explorer blurred + locked, Premium opens full viewer / gallery */}
          <button
            onClick={tapPhoto}
            className="block w-full mb-4 text-left"
            aria-label={canSeeExplanation ? t('discovery.why.aria.view_photo') : t('discovery.why.aria.unlock_photo')}
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              <img
                src={member.avatar}
                alt={member.name}
                loading="lazy"
                className={'w-full h-full object-cover ' + (canSeeExplanation ? '' : 'blur-xl scale-110')}
              />
              {!canSeeExplanation && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/25">
                  <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-white font-medium px-3 text-center">{t('discovery.why.unlock_photo')}</span>
                </div>
              )}
              {canSeeExplanation && gallery.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {gallery.map((_, i) => (
                    <span key={i} className={'w-1.5 h-1.5 rounded-full ' + (i === 0 ? 'bg-white' : 'bg-white/50')} />
                  ))}
                </div>
              )}
            </div>
          </button>

          {/* Gallery thumbnails — Premium only, when multiple photos */}
          {canSeeExplanation && gallery.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => openViewer(i)}
                  className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted"
                  aria-label={t('discovery.why.aria.photo_n', { n: i + 1 })}
                >
                  <img src={g} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Member chip */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted mb-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{canSeeExplanation ? member.name : '…'}</p>
              <p className="text-xs text-muted-foreground">{member.city} · {member.distance}</p>
            </div>
          </div>

          {canSeeExplanation ? (
            <>
              {/* Genuine matching reasons — Premium only */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('discovery.why.reasons_title')}</p>
                {member.reasons?.length ? (
                  member.reasons.map((reason, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl border bg-card"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-accent-foreground" />
                      </div>
                      <p className="text-sm leading-snug pt-0.5">{t(reason.key, reason.params)}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-3">{t('discovery.why.no_signals')}</p>
                )}
              </div>

              {/* What you share — Premium only */}
              <div className="space-y-2 mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('discovery.why.share_title')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.sharedInterests?.map((i) => (
                    <Badge key={'i-' + i} variant="secondary" className="text-xs">🎯 {i}</Badge>
                  ))}
                  {member.sharedCommunities?.map((c) => (
                    <Badge key={'c-' + c} variant="outline" className="text-xs text-primary border-primary/30">🏘️ {c}</Badge>
                  ))}
                  {member.sharedCircles?.map((c) => (
                    <Badge key={'ci-' + c} variant="outline" className="text-xs text-accent-foreground border-accent/40">⭕ {c}</Badge>
                  ))}
                  {member.sharedLanguages?.map((l) => (
                    <Badge key={'l-' + l} variant="outline" className="text-xs">🌐 {l}</Badge>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* RC-002A/BUG-007 — Explorer upgrade gate: no score, reasons, or shared signals */
            <div className="space-y-3 mb-5">
              <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{t('discovery.why.explorer_locked_title')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t('discovery.why.explorer_locked_desc')}</p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => showUpgrade('match_explanation')}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('discovery.why.explorer_locked_cta')}
                </Button>
              </div>
            </div>
          )}

          {/* Transparency disclaimer */}
          <p className="text-[11px] text-muted-foreground text-center px-3 leading-relaxed">
            {t('discovery.why.disclaimer')}
          </p>
        </SheetContent>
      </Sheet>

      <PhotoViewer
        open={viewerOpen}
        photos={gallery}
        index={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}