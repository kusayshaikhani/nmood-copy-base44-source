import React from 'react';
import { Globe, Map as MapIcon } from 'lucide-react';
import CommandSection from './CommandSection';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

const loc = (v) => (v && v.name ? `${v.name} (${v.count})` : '—');

/**
 * MC-R1 — Global Insights. Shows regional rows when member geography data
 * exists; otherwise a single empty state.
 */
export default function GlobalInsights({ insights, loading }) {
  const { t } = useLocalization();
  const hasData = insights && (insights.topCountry || insights.topCity || insights.topLanguage);
  return (
    <CommandSection icon={Globe} title={t('mission.global_insights')} action={<span className="text-[10px] text-muted-foreground">{t('mission.world_map_soon')}</span>}>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-9 shimmer rounded" />)}</div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Globe className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{t('mission.regional_insights_will_appear_as')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Row icon={Globe} label="Top Country" value={loc(insights.topCountry)} />
          <Row icon={MapIcon} label="Top City" value={loc(insights.topCity)} />
          <Row icon={Globe} label="Top Language" value={loc(insights.topLanguage)} />
          <Row icon={Globe} label="Fastest Growing Region" value={loc(insights.fastestGrowingRegion)} />
          <Row icon={Globe} label="Most Active Region" value={loc(insights.mostActiveRegion)} />
        </div>
      )}
    </CommandSection>
  );
}