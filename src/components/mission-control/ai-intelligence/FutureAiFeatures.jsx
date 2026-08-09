import React from 'react';
import { Sparkles } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { FileText, Cpu, FlaskConical, Sliders, ScanSearch, GraduationCap, Wrench, Eye } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ICONS = { FileText, Cpu, FlaskConical, Sliders, ScanSearch, GraduationCap, Wrench, Eye };

export default function FutureAiFeatures({ features }) {
  const { t } = useLocalization();
  return (
    <MCSection icon={Sparkles} title={t('mission.future_ai_features')}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {features.map((f) => {
          const Icon = ICONS[f.icon] || Sparkles;
          return (
            <div key={f.name} className="rounded-lg border border-dashed border-border bg-card/40 p-3 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-[11px] font-medium leading-tight">{f.name}</p>
              <span className="text-[9px] text-muted-foreground/70">{t('mission.coming_soon')}</span>
            </div>
          );
        })}
      </div>
    </MCSection>
  );
}