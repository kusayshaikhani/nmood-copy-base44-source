import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Award, Users, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getWeeklyReview } from '@/lib/concierge-engine';
import ConciergeSuggestion from './ConciergeSuggestion';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConciergeWeekly({ member, user }) {
  const { t } = useLocalization();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getWeeklyReview(member, user);
      setReview(result);
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
        <p className="text-sm text-muted-foreground">{t('ai.weekly.reviewing')}</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <p className="text-sm text-muted-foreground">{t('ai.weekly.error')}</p>
        <button onClick={load} className="text-sm text-primary font-medium" type="button">{t('ai.weekly.try_again')}</button>
      </div>
    );
  }

  const stats = review.stats || {};
  const statCards = [
    { icon: Calendar, label: t('ai.weekly.stats.experiences'), value: stats.experiences_attended ?? 0 },
    { icon: Users, label: t('ai.weekly.stats.new_pals'), value: stats.new_pals ?? 0 },
    { icon: Award, label: t('ai.weekly.stats.goals_achieved'), value: stats.goals_achieved ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('ai.weekly.your_week')}</h3>
          </div>
          <p className="text-sm leading-relaxed">{review.summary}</p>
        </Card>
      </motion.div>

      <div className="grid grid-cols-3 gap-2.5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-3 text-center">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {review.highlights?.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">{t('ai.weekly.highlights')}</h3>
          <ul className="space-y-1.5">
            {review.highlights.map((h, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2">{t('ai.weekly.new_recommendations')}</h3>
        <div className="space-y-2">
          {review.recommendations?.map((rec, i) => (
            <ConciergeSuggestion key={i} recommendation={rec} />
          ))}
        </div>
      </div>
    </div>
  );
}