import React from 'react';
import { Lightbulb, TrendingUp, Languages, Calendar, Crown, Sparkles, Activity, Bot } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ICONS = { TrendingUp, Languages, Calendar, Crown, Sparkles, Activity };
const TONE = { success: 'text-success', info: 'text-info', neutral: 'text-muted-foreground' };

/** FM-010 — Strategic insights generated from current platform data. */
export default function BiInsights({ insights }) {
  const { t } = useLocalization();
  const list = insights || [];
  return (
    <div className="space-y-4">
      <MCSection icon={Lightbulb} title={t('mission.strategic_platform_insights')}>
        <div className="space-y-2">
          {list.map((it, idx) => {
            const Icon = ICONS[it.icon] || Activity;
            return (
              <div key={idx} className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <Icon className={'w-4 h-4 mt-0.5 flex-shrink-0 ' + (TONE[it.tone] || TONE.neutral)} />
                <p className="text-sm">{it.text}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground/70 mt-3">
          {t('mission.insights_are_generated_from_current')}
        </p>
      </MCSection>
      <MCSection icon={Bot} title={t('mission.aigenerated_intelligence_coming_soon')}>
        <p className="text-sm text-muted-foreground">
          {t('mission.predictive_trends_anomaly_explanations_and')}
        </p>
      </MCSection>
    </div>
  );
}