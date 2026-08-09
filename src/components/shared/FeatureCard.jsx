import React from 'react';

export default function FeatureCard({ icon: Icon, title, description, color = 'primary', comingSoon = false }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  };

  return (
    <div className="group relative rounded-card border border-border bg-card p-6 shadow-card hover-lift cursor-default">
      {comingSoon && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Soon
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}