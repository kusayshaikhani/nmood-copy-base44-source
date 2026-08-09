import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Bookmark, Share2, MessageCircle, Navigation, LogOut, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useToast } from '@/components/ui/use-toast';

export default function NmoodBottomBar({ post }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [joined, setJoined] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleInterest = () => {
    setJoined(true);
    toast({ title: t('nmoods.detail.joined_title'), description: t('nmoods.detail.joined_desc') });
  };

  const handleLeave = () => {
    setJoined(false);
    toast({ description: t('nmoods.detail.left_desc') });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-md mx-auto bg-card/90 backdrop-blur-xl border-t border-border/30 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <AnimatePresence mode="wait">
          {joined ? (
            <motion.div key="joined" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex gap-2">
              <Button size="sm" className="flex-1 h-11"><MessageCircle className="w-4 h-4" /> {t('nmoods.detail.group_chat')}</Button>
              <Button variant="outline" size="sm" className="h-11 px-3" aria-label={t('nmoods.detail.directions')}><Navigation className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className="h-11 px-3" onClick={handleLeave} aria-label={t('nmoods.detail.leave_plan')}><LogOut className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className="h-11 px-3 relative" aria-label={t('nmoods.detail.invite_friend')}>
                <UserPlus className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 text-[8px] font-bold text-primary-foreground bg-primary px-1 rounded-full">{t('nmoods.detail.premium')}</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div key="default" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex gap-2">
              <Button size="lg" className="flex-1" onClick={handleInterest}><Sparkles className="w-4 h-4" /> {t('nmoods.detail.im_interested')}</Button>
              <Button variant="outline" size="lg" className="px-4" onClick={() => setSaved((s) => !s)} aria-label={t('nmoods.detail.save')}>
                {saved ? <Check className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="lg" className="px-4" aria-label={t('nmoods.detail.share')}><Share2 className="w-5 h-5" /></Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}