import React from 'react';
import { motion } from 'framer-motion';
import { Award, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionReveal from '@/components/experience/SectionReveal';
import { useMemoriesData } from '@/lib/myinmood-live';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — Elegant vertical timeline of recent experiences and milestones.
 * Reuses the existing useMemoriesData hook (no new data logic).
 */
export default function ProfileActivityTimeline() {
  const { data, loading } = useMemoriesData();
  const navigate = useNavigate();
  const { t } = useLocalization();

  if (loading) {
    return (
      <SectionReveal>
        <div className="px-6">
          <h2 className="text-section-title font-semibold mb-3">{t('profile.premium.timeline.title')}</h2>
          <div className="space-y-3">
            <div className="h-16 rounded-card bg-muted shimmer" />
            <div className="h-16 rounded-card bg-muted shimmer" />
          </div>
        </div>
      </SectionReveal>
    );
  }

  const hasAny = data.recentExperiences.length > 0 || data.recentMilestones.length > 0;

  return (
    <SectionReveal>
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-section-title font-semibold">{t('profile.premium.timeline.title')}</h2>
          {hasAny && (
            <button type="button" onClick={() => navigate('/journey')} className="flex items-center gap-0.5 text-sm font-semibold text-primary active:scale-95 transition-transform">
              {t('profile.premium.timeline.see_all')} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {!hasAny ? (
          <div className="text-center py-8 rounded-card border border-dashed border-border/60 bg-muted/20">
            <p className="text-sm text-muted-foreground">{t('profile.premium.timeline.empty')}</p>
          </div>
        ) : (
          <div className="relative ps-6">
            <div className="absolute start-0 top-2 bottom-2 w-px bg-border/60" />
            <div className="space-y-4">
              {data.recentExperiences.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <div className="absolute -start-6 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card shadow-sm" />
                  <div className="flex items-center gap-3 p-3 rounded-card border border-border/50 bg-card">
                    <span className="text-lg">{exp.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">{t('profile.premium.timeline.joined_exp')}</p>
                    </div>
                    {exp.date && <span className="text-xs text-muted-foreground flex-shrink-0">{exp.date}</span>}
                  </div>
                </motion.div>
              ))}
              {data.recentMilestones.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (data.recentExperiences.length + i) * 0.05 }}
                  className="relative"
                >
                  <div className="absolute -start-6 top-1.5 w-3 h-3 rounded-full bg-chart-3 border-2 border-card shadow-sm" />
                  <div className="flex items-center gap-3 p-3 rounded-card bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15">
                    <div className="w-9 h-9 rounded-full bg-nmood-gradient flex items-center justify-center text-base flex-shrink-0">
                      {m.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{t('profile.premium.timeline.milestone')}</p>
                    </div>
                    <Award className="w-4 h-4 text-primary/40 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionReveal>
  );
}