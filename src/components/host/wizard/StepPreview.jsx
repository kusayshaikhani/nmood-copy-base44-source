import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users, DollarSign, Tag, TrendingUp, Globe, AlertCircle, Hourglass, Shirt, Baby, PawPrint, Accessibility } from 'lucide-react';
import moment from 'moment';
import { getBudgetCardLabel } from '@/lib/budget-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

const experienceErrorSteps = {
  title: 1, category: 2, date: 3, startTime: 3,
  location: 4, capacity: 5, budgetOption: 6, customAmount: 6, description: 7,
};
const circleErrorSteps = {
  title: 1, category: 2, location: 3, capacity: 4, budgetOption: 5, customAmount: 5, description: 6,
};

export default function StepPreview({ data, errors = {}, onEdit, isCircle }) {
  const { t } = useLocalization();
  const errorSteps = isCircle ? circleErrorSteps : experienceErrorSteps;
  const budgetLabel = getBudgetCardLabel(data);

  const computeDuration = (start, end) => {
    if (!start || !end) return null;
    const s = moment(start, 'HH:mm');
    const e = moment(end, 'HH:mm');
    if (!s.isValid() || !e.isValid()) return null;
    let diff = e.diff(s, 'hours', true);
    if (diff <= 0) {
      if (data.overnight === true) diff += 24;
      else return null;
    }
    const hours = Math.floor(diff);
    const mins = Math.round((diff - hours) * 60);
    if (mins === 0) return `${hours}h`;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };
  const duration = computeDuration(data.startTime, data.endTime);

  const rows = [
    data.category && { step: 2, icon: Tag, label: 'Category', value: data.category },
    data.date && { step: 3, icon: Calendar, label: 'Date', value: data.date },
    data.startTime && { step: 3, icon: Clock, label: 'Time', value: data.startTime + (data.endTime ? ' – ' + data.endTime : '') + (data.overnight ? ' (+1 day)' : '') },
    duration && { step: 3, icon: Hourglass, label: 'Duration', value: duration },
    data.location?.venueName && { step: isCircle ? 3 : 4, icon: MapPin, label: 'Location', value: [data.location.venueName, data.location.area, data.location.city].filter(Boolean).join(', ') },
    data.capacity && { step: isCircle ? 4 : 5, icon: Users, label: 'Capacity', value: data.capacity + ' spots' },
    budgetLabel && { step: isCircle ? 5 : 6, icon: DollarSign, label: 'Budget', value: budgetLabel },
    data.dressCode && { step: isCircle ? 6 : 7, icon: Shirt, label: 'Dress Code', value: data.dressCode },
    data.familyFriendly !== null && data.familyFriendly !== undefined && { step: isCircle ? 6 : 7, icon: Baby, label: 'Family Friendly', value: data.familyFriendly ? 'Yes' : 'No' },
    data.petsAllowed !== null && data.petsAllowed !== undefined && { step: isCircle ? 6 : 7, icon: PawPrint, label: 'Pets Allowed', value: data.petsAllowed ? 'Yes' : 'No' },
    data.wheelchairAccessible !== null && data.wheelchairAccessible !== undefined && { step: isCircle ? 6 : 7, icon: Accessibility, label: 'Wheelchair', value: data.wheelchairAccessible ? 'Yes' : 'No' },
    data.difficulty && { step: isCircle ? 6 : 7, icon: TrendingUp, label: 'Difficulty', value: data.difficulty },
    data.languages?.length > 0 && { step: isCircle ? 6 : 7, icon: Globe, label: 'Languages', value: data.languages.join(', ') },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.step_preview.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step_preview.exact_view')}</p>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <p className="text-xs font-medium text-destructive">{t('hosting.step.preview_required')}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(errors).map((field) => (
              <button
                key={field}
                onClick={() => onEdit(errorSteps[field] || 0)}
                className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-default"
                type="button"
              >
                {field}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {data.coverPhoto && (
          <div className="h-36">
            <img src={data.coverPhoto} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {data.category && <span className="text-xs font-medium text-primary">{data.category}</span>}
            <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">{isCircle ? 'New' : 'Upcoming'}</span>
          </div>
          <h3 className="font-bold text-lg mb-2">{data.title || (isCircle ? 'Untitled Circle' : 'Untitled Experience')}</h3>
          {data.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{data.description}</p>
          )}

          <div className="space-y-2.5">
            {rows.map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{row.value}</span>
                    <button onClick={() => onEdit(row.step)} className="text-xs text-primary hover:underline" type="button">{t('hosting.activity.edit')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}