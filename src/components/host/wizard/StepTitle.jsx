import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const examples = [
  'Sunrise Coffee at Kite Beach',
  'Padel After Work',
  'Friday Networking Dinner',
  'Live Music at The Courtyard',
  'Morning Yoga at Zabeel Park',
  'Photography Walk – Al Seef',
];

export default function StepTitle({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const inputClass = 'w-full h-14 px-4 rounded-2xl bg-muted/50 border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default';

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.step_title.experience_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step_title.name_hint')}</p>
      </div>

      <div>
        <input
          value={data.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder={t('hosting.step.title_placeholder')}
          className={inputClass}
          maxLength={80}
        />
        <p className="text-xs text-muted-foreground text-end mt-1">{80 - (data.title || '').length} characters left</p>
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      <div>
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('hosting.step.title_inspiration')}
        </p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button key={ex} onClick={() => update('title', ex)} type="button"
              className="px-3 py-2 rounded-full text-xs bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-default">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {data.title && (
        <div className="p-4 rounded-2xl border border-border bg-card">
          <p className="text-[10px] text-muted-foreground mb-1">{t('hosting.step_preview.title')}</p>
          <h3 className="text-lg font-bold">{data.title}</h3>
        </div>
      )}
    </div>
  );
}