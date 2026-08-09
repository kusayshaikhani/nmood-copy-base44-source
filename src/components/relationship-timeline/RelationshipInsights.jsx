import React from 'react';
import { Calendar, MapPin, Tag, Compass, Clock } from 'lucide-react';

export default function RelationshipInsights({ insights }) {
  if (!insights) return null;
  const items = [
    { icon: Calendar, label: 'Experiences Together', value: insights.experiencesTogether },
    { icon: MapPin, label: 'Cities Explored', value: insights.citiesExplored },
    { icon: Tag, label: 'Categories Explored', value: insights.categoriesExplored },
    { icon: Compass, label: 'Most Common Activity', value: insights.mostCommonActivity },
    { icon: Clock, label: 'Last Time Together', value: insights.lastTimeTogether },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Relationship Insights</h2>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 p-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground flex-1">{label}</span>
            <span className="text-sm font-semibold">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/60 mt-2 text-center">Based on your shared real-world experiences. No scores, no rankings.</p>
    </section>
  );
}