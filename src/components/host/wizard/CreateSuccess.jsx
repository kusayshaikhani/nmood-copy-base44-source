import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Share2, Plus, Home, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CreateSuccess({ type, createdId, data, onView, onInvite, onShare, onHostAnother, onGoHome }) {
  const { t } = useLocalization();
  const isCircle = type === 'circle';

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#AC5FDB', '#E3A2EE', '#7EC95F', '#FFB836'],
    });
  }, []);

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 text-4xl"
      >
        🎉
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold mb-2">{isCircle ? 'Your Circle is Ready!' : 'Your Experience is Live!'}</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          {isCircle
            ? `${data.title || 'Your circle'} is set up. Invite members to start gathering.`
            : `${data.title || 'Your experience'} is now live and ready for members to join.`}
        </p>

        <div className="space-y-3 w-full">
          <Button className="w-full h-12 gap-2" onClick={onView}>
            {isCircle ? <Users className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isCircle ? 'Open Circle' : 'View Experience'}
          </Button>
          {isCircle ? (
            <Button variant="outline" className="w-full h-12 gap-2" onClick={onInvite}>
              <UserPlus className="w-4 h-4" />{t('community.members.invite')}</Button>
          ) : (
            <Button variant="outline" className="w-full h-12 gap-2" onClick={onHostAnother}>
              <Plus className="w-4 h-4" /> {t('hosting.success.host_again')}
            </Button>
          )}
          <Button variant="outline" className="w-full h-12 gap-2" onClick={onShare}>
            <Share2 className="w-4 h-4" /> {isCircle ? 'Share Circle' : 'Share'}
          </Button>
          <Button variant="ghost" className="w-full h-12 gap-2" onClick={onGoHome}>
            <Home className="w-4 h-4" />{t('hosting.success.go_home')}</Button>
        </div>
      </motion.div>
    </div>
  );
}