import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getQuickInsights, getConciergeSettings } from '@/lib/concierge-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConciergeCard({ member, user, onOpen }) {
  const { t } = useLocalization();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const loadInsights = useCallback(async () => {
    const settings = getConciergeSettings();
    if (!settings.ai_suggestions) {
      setLoading(false);
      return;
    }
    try {
      const result = await getQuickInsights(member, user);
      setInsights(result);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [member, user]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    if (!insights?.insights?.length || insights.insights.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % insights.insights.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [insights]);

  const currentInsight = insights?.insights?.[activeIndex];
  const disabled = !getConciergeSettings().ai_suggestions;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      type="button"
      className="w-full text-left"
    >
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 overflow-hidden">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t('ai.concierge.your_concierge')}</p>
            <p className="text-[11px] text-muted-foreground">{t('ai.concierge.personalized')}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>

        {disabled ? (
          <p className="text-sm text-muted-foreground py-2">{t('ai.concierge.paused')}</p>
        ) : loading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('ai.concierge.thinking_day')}</p>
          </div>
        ) : currentInsight ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 py-1"
            >
              {currentInsight.emoji && <span className="text-lg flex-shrink-0">{currentInsight.emoji}</span>}
              <p className="text-sm font-medium leading-snug">{currentInsight.message}</p>
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-sm text-muted-foreground py-2">{t('ai.concierge.tap_recommendations')}</p>
        )}

        {!loading && insights?.insights?.length > 1 && (
          <div className="flex gap-1 mt-2">
            {insights.insights.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${i === activeIndex ? 'w-4 bg-primary' : 'w-1 bg-muted'}`}
              />
            ))}
          </div>
        )}
      </Card>
    </motion.button>
  );
}