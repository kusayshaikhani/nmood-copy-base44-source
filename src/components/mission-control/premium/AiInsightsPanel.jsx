import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import PremiumGlassCard from './PremiumGlassCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ICON = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const COLOR = { up: 'text-success', down: 'text-destructive', neutral: 'text-muted-foreground' };
const TONE_BG = { up: 'bg-success/10', down: 'bg-destructive/10', neutral: 'bg-muted/40' };

export default function AiInsightsPanel({ insights, ai }) {
  const { t } = useLocalization();

  return (
    <PremiumGlassCard
      icon={Brain}
      title={t('mission.ai_insights')}
      action={<Link to="/mission-control/ai-intelligence" className="text-xs text-primary hover:underline">{t('mission.open')}</Link>}
    >
      {!ai?.noHistory && (
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="rounded-xl border border-border/50 bg-card/60 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.ai_generated')}</p>
            <p className="text-xl font-bold mt-0.5">{ai?.recommendationsGenerated ?? 0}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/60 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.ai_acceptance')}</p>
            <p className="text-xl font-bold mt-0.5">{ai?.acceptanceRate ?? '—'}</p>
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('mission.ai_recommendations')}
      </p>

      {insights.length === 0 && ai?.noHistory ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Brain className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{t('mission.ai_no_insights')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {insights.map((it, i) => {
            const Icon = ICON[it.trend] || Minus;
            return (
              <li key={i} className={`flex items-center gap-2.5 rounded-xl ${TONE_BG[it.trend] || TONE_BG.neutral} px-3 py-2.5 animate-fade-in-up`} style={{ animationDelay: `${i * 50}ms` }}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${COLOR[it.trend] || COLOR.neutral}`} />
                <span className="text-sm">{it.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </PremiumGlassCard>
  );
}