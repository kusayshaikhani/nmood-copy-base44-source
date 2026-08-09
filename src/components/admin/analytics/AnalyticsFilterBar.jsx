import React, { useState } from 'react';
import { Calendar, MapPin, Tag, Crown, Sparkles } from 'lucide-react';

export default function AnalyticsFilterBar() {
  const [values, setValues] = useState({ date: '30d', city: 'all', category: 'all', organizer: 'all', experience: 'all' });

  const filters = [
    { key: 'date', icon: Calendar, options: [{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }, { value: '1y', label: 'Last year' }] },
    { key: 'city', icon: MapPin, options: [{ value: 'all', label: 'All Cities' }, { value: 'dubai', label: 'Dubai' }, { value: 'london', label: 'London' }, { value: 'tokyo', label: 'Tokyo' }, { value: 'seoul', label: 'Seoul' }] },
    { key: 'category', icon: Tag, options: [{ value: 'all', label: 'All Categories' }, { value: 'wellness', label: 'Wellness' }, { value: 'social', label: 'Social' }, { value: 'arts', label: 'Arts' }, { value: 'outdoor', label: 'Outdoor' }] },
    { key: 'organizer', icon: Crown, options: [{ value: 'all', label: 'All Organizers' }, { value: 'sarah', label: 'Sarah Kim' }, { value: 'aisha', label: 'Aisha Patel' }, { value: 'yuki', label: 'Yuki Tanaka' }] },
    { key: 'experience', icon: Sparkles, options: [{ value: 'all', label: 'All Experiences' }, { value: 'yoga', label: 'Sunset Yoga' }, { value: 'artwalk', label: 'Art Walk' }, { value: 'wine', label: 'Wine Tasting' }] },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(f => {
        const Icon = f.icon;
        return (
          <div key={f.key} className="relative">
            <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
            <select
              value={values[f.key]}
              onChange={(e) => setValues(p => ({ ...p, [f.key]: e.target.value }))}
              className="h-8 pl-8 pr-7 text-xs rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default appearance-none cursor-pointer"
            >
              {f.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}