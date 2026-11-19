import { normalizeLookingForTags } from '@/lib/looking-for-tags';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import LookingForTagsSelect from '@/components/profile/LookingForTagsSelect';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function LookingForStep({ data, update, onNext, saving = false }) {
  const { t } = useLocalization();
  const [error, setError] = useState('');
  const selected = normalizeLookingForTags(data?.looking_for_tags);

  const handleChange = (tags) => {
    update({ looking_for_tags: tags });
    if (tags.length > 0) setError('');
  };

  const handleNext = () => {
    if (saving) return;
    if (selected.length === 0) {
      setError(t('onboarding.looking_for.required'));
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LookingForTagsSelect value={selected} onChange={handleChange} />
        <p className="text-xs text-muted-foreground">{t('onboarding.looking_for.hint')}</p>
        {error && <p role="alert" className="text-[13px] font-medium text-destructive">{error}</p>}
      </div>
      <div className="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 bg-background/95 py-2 backdrop-blur">
      <Button disabled={saving} className="h-12 w-full shadow-elevated" onClick={handleNext}>
        {saving ? 'Saving…' : selected.length > 0
          ? t('onboarding.looking_for.continue_count', { count: selected.length })
          : t('common.continue')}
      </Button>
      </div>
    </div>
  );
}
