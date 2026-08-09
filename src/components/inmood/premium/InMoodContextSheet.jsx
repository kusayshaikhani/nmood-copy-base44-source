import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, User, MessageCircle, Bookmark, Share2, Link2, EyeOff, ThumbsDown, Flag, Ban, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InMoodContextSheet({ open, experience, onClose, onInterested, onHide }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const navigate = useNavigate();

  const sharePlan = async () => {
    const url = `${window.location.origin}/experience/${experience?.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: experience?.title, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); toast({ title: t('inmood.context.copied') }); } catch { /* ignore */ }
    }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/experience/${experience?.id}`); toast({ title: t('inmood.context.copied') }); } catch { /* ignore */ }
    onClose();
  };

  const actions = [
    { key: 'interested', icon: Heart, onClick: () => { onInterested?.(); onClose(); } },
    { key: 'view_profile', icon: User, onClick: () => { navigate('/discover-people'); onClose(); } },
    { key: 'message_host', icon: MessageCircle, onClick: () => { toast({ title: t('inmood.context.message_host') }); onClose(); } },
    { key: 'save', icon: Bookmark, onClick: () => { toast({ title: t('inmood.context.save') + ' ✓' }); onClose(); } },
    { key: 'share', icon: Share2, onClick: () => { sharePlan(); onClose(); } },
    { key: 'copy_link', icon: Link2, onClick: copyLink },
    { key: 'hide', icon: EyeOff, onClick: () => { onHide?.(); onClose(); } },
    { key: 'not_interested', icon: ThumbsDown, onClick: () => { onHide?.(); onClose(); } },
    { key: 'report', icon: Flag, onClick: () => { navigate('/safety-center'); onClose(); } },
    { key: 'block_host', icon: Ban, onClick: () => { toast({ title: t('inmood.context.block_host') }); onClose(); } },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-card rounded-t-[28px] border-t border-border/50 shadow-dialog pb-[env(safe-area-inset-bottom)]"
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mt-2.5 mb-1" />
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{experience?.title}</h3>
              <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-3 pb-4">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={a.onClick}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-muted transition-default text-start min-h-[52px]"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium">{t(`inmood.context.${a.key}`)}</span>
                  </button>
                );
              })}
            </div>
            <div className="px-3 pb-3">
              <button type="button" onClick={onClose} className="w-full h-12 rounded-button border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-default">
                {t('inmood.context.cancel')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}