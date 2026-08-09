import React from 'react';
import { Plus } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SharedMomentsStrip({ moments, onAddPhoto }) {
  const { t } = useLocalization();
  return (
    <div className="px-3 py-2.5 border-b border-border bg-card flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground">{t('experiences.chat.shared_moments')}</h3>
        <label className="cursor-pointer flex items-center gap-1 text-xs text-primary font-medium">
          <Plus className="w-3 h-3" /> {t('common.add')}
          <input type="file" accept="image/*" className="hidden" onChange={onAddPhoto} />
        </label>
      </div>
      {moments.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 py-2">{t('experience_chat.no_photos')}</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {moments.map((url, i) => (
            <div key={i} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img src={url} alt={t('experiences.chat.moment')} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}