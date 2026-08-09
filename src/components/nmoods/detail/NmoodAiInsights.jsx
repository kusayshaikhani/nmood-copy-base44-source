import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodAiInsights({ post }) {
  const { t } = useLocalization();
  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-accent/8 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('nmoods.detail.ai_insights')}</h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{t('nmoods.detail.ai_insights_desc')}</p>
      <div className="space-y-2">
        {(post.ai_insights || []).map((insight) => (
          <div key={insight.text} className="flex items-center gap-2.5">
            <span className="text-base leading-none">{insight.icon}</span>
            <span className="text-sm font-medium">{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}