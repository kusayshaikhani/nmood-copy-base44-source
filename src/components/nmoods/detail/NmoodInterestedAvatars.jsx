import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NmoodInterestedAvatars({ post }) {
  const { t } = useLocalization();
  const shown = (post.interested_members || []).slice(0, 6);
  const remaining = (post.interested_total || 0) - shown.length;

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('nmoods.detail.whos_interested')}</h2>
      <div className="flex items-center gap-2">
        {shown.map((m, i) => (
          <button key={`${m.name}-${i}`} type="button" className="relative shrink-0" aria-label={m.name}>
            <img
              src={m.avatar}
              alt={m.name}
              loading="lazy"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
              style={{ marginLeft: i > 0 ? '-8px' : 0 }}
            />
          </button>
        ))}
        {remaining > 0 && (
          <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-background shrink-0" style={{ marginLeft: shown.length > 0 ? '-8px' : 0 }}>
            +{remaining}
          </span>
        )}
      </div>
    </div>
  );
}