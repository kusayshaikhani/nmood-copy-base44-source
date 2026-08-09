import React from 'react';
import { Calendar, Users } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const options = [
  { id: 'experience', label: 'Experience', description: 'A one-time activity with a date & location', icon: Calendar },
  { id: 'circle', label: 'Circle', description: 'An ongoing group around a shared interest', icon: Users },
];

export default function StepHostType({ onSelect }) {
  const { t } = useLocalization();
  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.step_type.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step.host_type_desc')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className="flex flex-col items-start gap-2 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-default text-start"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}