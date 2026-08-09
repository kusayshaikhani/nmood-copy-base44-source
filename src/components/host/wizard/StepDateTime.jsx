import React from 'react';
import { Clock, Calendar, Hourglass, AlertCircle } from 'lucide-react';
import moment from 'moment';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function StepDateTime({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const inputClass = 'w-full h-12 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default';
  const today = moment().format('YYYY-MM-DD');

  const computeDuration = (start, end, overnight) => {
    if (!start || !end) return null;
    const s = moment(start, 'HH:mm');
    const e = moment(end, 'HH:mm');
    if (!s.isValid() || !e.isValid()) return null;
    let diff = e.diff(s, 'hours', true);
    if (diff <= 0) {
      if (overnight === true) diff += 24;
      else return null;
    }
    const hours = Math.floor(diff);
    const mins = Math.round((diff - hours) * 60);
    if (mins === 0) return `${hours}h`;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const isOvernightPossible = data.startTime && data.endTime && moment(data.endTime, 'HH:mm').isBefore(moment(data.startTime, 'HH:mm'));
  const duration = computeDuration(data.startTime, data.endTime, data.overnight);

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.step.date_time_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step.date_time_desc')}</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {t('hosting.step_datetime.date')}
        </label>
        <input type="date" min={today} value={data.date || ''} onChange={(e) => update('date', e.target.value)} className={inputClass} />
        {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />{t('hosting.step_datetime.start_time')}</label>
          <input type="time" value={data.startTime || ''} onChange={(e) => { update('startTime', e.target.value); update('overnight', null); }} className={inputClass} />
          {errors.startTime && <p className="text-xs text-destructive mt-1">{errors.startTime}</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {t('hosting.step.end_time')}
          </label>
          <input type="time" value={data.endTime || ''} onChange={(e) => { update('endTime', e.target.value); update('overnight', null); }} className={inputClass} />
        </div>
      </div>

      {isOvernightPossible && (
        <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">{t('hosting.step.ends_next_day')}</p>
              <div className="flex gap-2">
                <button onClick={() => update('overnight', true)} type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-default ${data.overnight === true ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {t('hosting.step_basic.yes')}
                </button>
                <button onClick={() => update('overnight', false)} type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-default ${data.overnight === false ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {t('hosting.step_basic.no')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {duration && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <Hourglass className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Duration: {duration}</span>
        </div>
      )}
    </div>
  );
}