import React from 'react';
import { Sunrise, Sun, Moon, Sparkles } from 'lucide-react';
import CommandSection from './CommandSection';
import { greeting } from '@/lib/command-center-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * MC-R1 — Executive Brief. Every cell shows a live value or zero; metrics whose
 * backing module is not yet implemented display a "Feature Available Later"
 * note. Never "Awaiting data".
 */
function BriefItem({ label, value, unavailable }) {
  const { t } = useLocalization();
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {unavailable ? (
        <p className="text-[11px] leading-tight font-medium text-muted-foreground/70 pt-1">{t('mission.feature_available_later')}</p>
      ) : (
        <p className="text-lg font-bold leading-tight">{value}</p>
      )}
    </div>
  );
}

export default function ExecutiveBrief({ brief, adminName }) {
  const { t } = useLocalization();
  const h = new Date().getHours();
  const Icon = h < 12 ? Sunrise : h < 18 ? Sun : Moon;
  const loc = (v) => (v && v.name ? `${v.name} (+${v.count})` : '—');
  return (
    <CommandSection icon={Icon} title={`${greeting()}${adminName ? ', ' + adminName : ''}`} action={<span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('mission.ai_summary_soon')}</span>}>
      <p className="text-xs text-muted-foreground mb-3">{t('mission.activity_since_your_previous_login')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        <BriefItem label="New Members" value={brief.newMembers} />
        <BriefItem label="Premium Upgrades" value={brief.premiumUpgrades} />
        <BriefItem label="New Experiences" value={brief.newExperiences} />
        <BriefItem label="New Circles" value={brief.newCircles} />
        <BriefItem label="New Connections" value={brief.newConnections} />
        <BriefItem label="Reports Submitted" value={brief.reportsSubmitted} />
        <BriefItem label="Reports Resolved" value={brief.reportsResolved} />
        <BriefItem label="Verification Requests" value={brief.verificationRequests} unavailable={!brief.verificationRequests} />
        <BriefItem label="Trust Score Changes" value={brief.trustScoreChanges} unavailable={!brief.trustScoreChanges} />
        <BriefItem label="Fastest Growing Country" value={loc(brief.fastestGrowingCountry)} />
        <BriefItem label="Fastest Growing City" value={loc(brief.fastestGrowingCity)} />
      </div>
    </CommandSection>
  );
}