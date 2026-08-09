import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodAboutSection({ post }) {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{t('nmoods.detail.about')}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.about}</p>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm font-semibold">{t('nmoods.detail.looking_for')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(post.looking_for_chips || []).map((chip) => (
          <span key={chip} className="text-sm font-medium px-3.5 py-1.5 rounded-full bg-primary/10 text-primary">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}