import React from 'react';
import CalendarActivityCard from './CalendarActivityCard';
import { formatDate } from '@/lib/calendar-data';

function groupActivities(activities) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next7 = new Date(today);
  next7.setDate(today.getDate() + 7);
  const next30 = new Date(today);
  next30.setDate(today.getDate() + 30);

  const groups = {
    'Next 7 Days': [],
    'Next 30 Days': [],
    'Later': [],
    'Completed': [],
  };

  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((a) => {
    if (a.status === 'completed') {
      groups['Completed'].unshift(a);
    } else {
      const d = new Date(a.date + 'T00:00:00');
      if (d < next7) groups['Next 7 Days'].push(a);
      else if (d < next30) groups['Next 30 Days'].push(a);
      else groups['Later'].push(a);
    }
  });

  return groups;
}

export default function AgendaView({ activities, onActivityClick }) {
  const groups = groupActivities(activities);
  const groupEntries = Object.entries(groups).filter(([, items]) => items.length > 0);

  if (groupEntries.length === 0) return null;

  return (
    <div className="space-y-6">
      {groupEntries.map(([label, items]) => (
        <div key={label}>
          <h3 className="text-sm font-semibold mb-3 px-1">{label}</h3>
          <div className="space-y-3">
            {items.map((a) => (
              <CalendarActivityCard key={a.id} activity={a} onClick={onActivityClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}