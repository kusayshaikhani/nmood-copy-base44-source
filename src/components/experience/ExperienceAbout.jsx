import React, { useState } from 'react';
import { Languages as LangIcon, TrendingUp, ChevronDown } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Nmood Premium description — clean typography, comfortable spacing,
 * expandable when long.
 */
export default function ExperienceAbout({ experience }) {
  const { t } = useLocalization();
  const { description, about, difficulty, languages } = experience;
  const [expanded, setExpanded] = useState(false);

  const sections = [
    { title: t('community.detail.tab_about'), text: description },
    { title: 'What to expect', text: about?.expect },
    { title: 'What to bring', text: about?.bring },
  ].filter((s) => s.text);

  // Show expand toggle only when the main description is long.
  const mainText = description || '';
  const isLong = mainText.length > 240;

  return (
    <div className="space-y-5">
      <h2 className="text-section-title text-foreground">{t('community.detail.tab_about')}</h2>

      <div className="space-y-4">
        {sections.map((s, idx) => {
          const isMain = idx === 0;
          const showFull = !isMain || !isLong || expanded;
          return (
            <div key={s.title}>
              {!isMain && <h3 className="text-sm font-semibold mb-1.5 text-foreground">{s.title}</h3>}
              <p
                className={`text-body-lg text-muted-foreground leading-relaxed ${
                  isMain && !expanded && isLong ? 'line-clamp-3' : ''
                }`}
              >
                {s.text}
              </p>
              {isMain && isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="pressable flex items-center gap-1 mt-2 text-sm font-semibold text-primary"
                >
                  {expanded ? t('experiences.attendees.show_less') : t('common.more')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-1">
        {difficulty && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {t('experiences.about.difficulty')} <span className="font-semibold text-foreground">{difficulty}</span>
            </span>
          </div>
        )}
        {languages && languages.length > 0 && (
          <div className="flex items-center gap-2">
            <LangIcon className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {t('experiences.about.languages')} <span className="font-semibold text-foreground">{languages.join(', ')}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}