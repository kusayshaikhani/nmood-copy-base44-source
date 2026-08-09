import React, { useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Premium About section — comfortable reading width, expandable description.
 */
export default function CircleAboutSection({ circle }) {
  const { t } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const description = circle.description || '';
  const isLong = description.length > 280;

  return (
    <div className="space-y-3">
      <h2 className="text-section-title font-semibold">{t('circles.about.title')}</h2>
      <div className="space-y-3">
        <p className={`text-body-lg text-foreground/90 leading-relaxed ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
          {description || t('circles.detail.tagline_default')}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-sm font-semibold text-primary hover:underline transition-default"
          >
            {expanded ? t('experiences.attendees.show_less') : t('common.more')}
          </button>
        )}
      </div>
      {(circle.shared_interests || []).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {circle.shared_interests.map((interest) => (
            <span key={interest} className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full">{interest}</span>
          ))}
        </div>
      )}
    </div>
  );
}