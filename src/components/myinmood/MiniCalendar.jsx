import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useCalendarEvents } from '@/lib/myinmood-live';
import moment from 'moment';

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const eventColors = {
  today: 'bg-primary text-primary-foreground',
  hosted: 'bg-accent text-accent-foreground',
  joined: 'bg-primary/20 text-primary',
};

export default function MiniCalendar() {
  const navigate = useNavigate();
  const events = useCalendarEvents();

  const { cells, daysInMonth, firstDayOffset, today, monthLabel } = useMemo(() => {
    const now = moment();
    const startOfMonth = now.clone().startOf('month');
    const offset = startOfMonth.day();
    const dim = now.daysInMonth();
    const td = now.date();
    const cellsArr = [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: dim }, (_, i) => i + 1),
    ];
    return {
      cells: cellsArr,
      daysInMonth: dim,
      firstDayOffset: offset,
      today: td,
      monthLabel: now.format('MMMM YYYY'),
    };
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <button onClick={() => navigate('/calendar')} className="text-xs text-primary font-medium" type="button">Open</button>
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">{monthLabel}</p>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const event = events.find((e) => e.day === day);
            const isToday = day === today;
            return (
              <motion.div
                key={i}
                whileTap={event ? { scale: 0.9 } : undefined}
                onClick={() => event && navigate('/calendar')}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-default ${
                  event ? `${eventColors[event.type]} cursor-pointer` : 'text-foreground hover:bg-muted'
                } ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''}`}
              >
                {day}
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded bg-primary" /> Joined
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded bg-accent" /> Hosted
          </span>
        </div>
      </Card>
    </section>
  );
}