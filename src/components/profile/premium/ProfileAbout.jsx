import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import SectionReveal from '@/components/experience/SectionReveal';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — Expandable About Me with premium typography and comfortable
 * spacing. Collapses long bios with a smooth height transition + toggle.
 */
export default function ProfileAbout({ member }) {
  const { t } = useLocalization();
  const bio = member?.bio || '';
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    setOverflows(ref.current.scrollHeight > 120);
  }, [bio]);

  return (
    <SectionReveal>
      <div className="px-6">
        <h2 className="text-section-title font-semibold mb-3">{t('profile.premium.about.title')}</h2>
        <div className="relative">
          <p
            ref={ref}
            className={`text-body leading-relaxed text-muted-foreground transition-all duration-300 overflow-hidden ${
              !expanded && overflows ? 'max-h-[120px]' : 'max-h-none'
            }`}
          >
            {bio || t('profile.premium.about.empty')}
          </p>
          {!expanded && overflows && (
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          )}
        </div>
        {overflows && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 mt-2 text-sm font-semibold text-primary active:scale-95 transition-transform"
          >
            {expanded ? t('profile.premium.about.show_less') : t('profile.premium.about.read_more')}
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </SectionReveal>
  );
}