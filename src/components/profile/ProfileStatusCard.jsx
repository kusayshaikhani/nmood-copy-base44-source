import React from 'react';
import { Star, ChevronRight, Sparkles, ShieldCheck, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-008 — Glass statistics cards (completion + trust) with prioritised
 * next steps. Props/logic unchanged.
 */
function starCount(pct) {
  return Math.min(5, Math.floor(pct / 20));
}

export default function ProfileStatusCard({ completenessPct, trustScore, steps }) {
  const { t } = useLocalization();
  const isComplete = completenessPct >= 100;
  const stars = starCount(completenessPct);
  const tone = trustScore >= 80 ? 'text-success' : trustScore >= 40 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Completion glass card */}
        <div className="glass rounded-card border border-white/40 shadow-card p-4">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          </div>
          <p className="text-2xl font-bold mt-3 leading-none">{completenessPct}%</p>
          <p className="text-xs text-muted-foreground mt-1.5">{t('profile.status.title')}</p>
        </div>

        {/* Trust glass card */}
        <div className="glass rounded-card border border-white/40 shadow-card p-4">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-success" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-3 leading-none ${tone}`}>{trustScore}%</p>
          <p className="text-xs text-muted-foreground mt-1.5">{t('profile.status.trust_score')}</p>
        </div>
      </div>

      {!isComplete && steps.length > 0 && (
        <div className="glass rounded-card border border-white/40 shadow-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">{t('profile.status.complete_these')}</p>
          <ul className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm">{s.label}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full h-10 mt-4 gap-1.5" onClick={steps[0].action}>
            {t('profile.status.complete_action')} <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {isComplete && (
        <div className="glass rounded-card border border-white/40 shadow-card p-4 text-center">
          <p className="text-sm text-success font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> {t('profile.status.complete_message')}
          </p>
        </div>
      )}
    </div>
  );
}