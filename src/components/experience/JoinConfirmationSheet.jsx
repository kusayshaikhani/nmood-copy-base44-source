import React from 'react';
import { Calendar, Clock, MapPin, Users, Wallet, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { getBudgetDetailLabel } from '@/lib/budget-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function JoinConfirmationSheet({ experience, open, onOpenChange, onConfirm, spotsFilled }) {
  const { t } = useLocalization();
  if (!experience) return null;
  const { image, title, date, time, venue, spotsTotal } = experience;
  const remaining = spotsTotal - (spotsFilled ?? experience.spotsFilled);
  const budgetLabel = getBudgetDetailLabel(experience);

  const details = [
    { icon: Calendar, label: 'Date', value: date },
    { icon: Clock, label: 'Time', value: time },
    { icon: MapPin, label: 'Location', value: venue.name },
    { icon: Wallet, label: 'Expected Budget', value: budgetLabel },
    { icon: Users, label: 'Remaining Spots', value: `${remaining} of ${spotsTotal}` },
  ];

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="relative h-32 rounded-xl overflow-hidden mb-4">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <h2 className="absolute bottom-2.5 start-3 end-3 text-white font-semibold text-base">{title}</h2>
      </div>

      <div className="space-y-2.5 mb-4">
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5 text-sm">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium ml-auto">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-4">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80">
          {t('experiences.confirm.about_to_join')}
        </p>
      </div>

      <div className="flex gap-3 pb-2">
        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t('hosting.create.cancel')}</Button>
        <Button className="flex-1 bg-success hover:bg-success/90" onClick={onConfirm}>{t('experiences.confirm.join')}</Button>
      </div>
    </BottomSheet>
  );
}