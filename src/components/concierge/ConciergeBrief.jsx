import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sunrise, Sparkles } from 'lucide-react';
import { getDailyBrief } from '@/lib/concierge-engine';
import ConciergeSuggestion from './ConciergeSuggestion';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConciergeBrief({ member, user }) {
  const { t } = useLocalization();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getDailyBrief(member, user);
      setBrief(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [member, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('ai.brief.preparing')}</p>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <p className="text-sm text-muted-foreground">{t('ai.brief.error')}</p>
        <button onClick={load} className="text-sm text-primary font-medium" type="button">{t('ai.brief.try_again')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sunrise className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-medium leading-snug">{brief.greeting}</p>
      </motion.div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{t('ai.brief.recommendations')}</h3>
        </div>
        <div className="space-y-2">
          {brief.recommendations?.map((rec, i) => (
            <ConciergeSuggestion key={i} recommendation={rec} />
          ))}
        </div>
      </div>
    </div>
  );
}