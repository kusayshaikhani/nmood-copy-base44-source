import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Globe, ChevronDown } from 'lucide-react';
import SectionReveal from '@/components/experience/SectionReveal';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';

/**
 * UI-017 — Interests as elegant chips, collapsed to ~2 rows with expand.
 * Languages shown as a secondary chip group.
 */
export default function ProfileInterests({ member }) {
  const { t } = useLocalization();
  const interests = member?.interests || [];
  const languages = member?.languages || [];
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    setOverflows(ref.current.scrollHeight > 88);
  }, [interests]);

  return (
    <SectionReveal>
      <div className="px-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-primary" />
          <h2 className="text-section-title font-semibold">{t('profile.premium.interests.title')}</h2>
        </div>
        {interests.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('profile.premium.interests.empty')}</p>
        ) : (
          <>
            <div className="relative">
              <div
                ref={ref}
                className={`flex flex-wrap gap-2 transition-all duration-300 overflow-hidden ${
                  !expanded && overflows ? 'max-h-[88px]' : 'max-h-none'
                }`}
              >
                {interests.map((interest, i) => (
                  <motion.span
                    key={interest}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {categoryLabel(t, interest)}
                  </motion.span>
                ))}
              </div>
              {!expanded && overflows && (
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              )}
            </div>
            {overflows && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 mt-2 text-sm font-semibold text-primary active:scale-95 transition-transform"
              >
                {expanded ? t('profile.premium.interests.show_less') : t('profile.premium.interests.show_all')}
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </>
        )}

        {languages.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2.5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">{t('profile.premium.interests.languages')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span key={lang} className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-foreground text-sm font-medium">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionReveal>
  );
}