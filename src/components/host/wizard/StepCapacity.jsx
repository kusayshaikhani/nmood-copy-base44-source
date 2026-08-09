import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Users } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function StepCapacity({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const capacity = data.capacity || 20;

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.wizard.step_capacity')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step.capacity_desc')}</p>
      </div>

      <div className="flex flex-col items-center py-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <p className="text-4xl font-bold mb-1">{capacity}</p>
        <p className="text-sm text-muted-foreground">{t('hosting.step.spots_available')}</p>
      </div>

      <div className="px-2">
        <Slider value={[capacity]} onValueChange={(v) => update('capacity', v[0])} min={2} max={100} step={1} className="py-2" />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{t('hosting.step.min_capacity')}</span>
          <span className="text-xs text-muted-foreground">{t('hosting.step.max_capacity')}</span>
        </div>
      </div>

      {errors.capacity && <p className="text-xs text-destructive text-center">{errors.capacity}</p>}
    </div>
  );
}