import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CommandSection from './CommandSection';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ICON = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const COLOR = { up: 'text-success', down: 'text-destructive', neutral: 'text-muted-foreground' };

export default function FounderInsights({ insights }) {
  const { t } = useLocalization();
  return (
    <CommandSection icon={Lightbulb} title={t('mission.founder_insights')} action={<span className="text-[10px] text-muted-foreground">{t('mission.ai_bi_soon')}</span>}>
      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{t('mission.founder_insights_will_become_available')}</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((it, i) => {
            const Icon = ICON[it.trend] || Minus;
            return (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                <Icon className={'w-4 h-4 ' + (COLOR[it.trend] || COLOR.neutral)} />
                <span className="text-sm">{it.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </CommandSection>
  );
}