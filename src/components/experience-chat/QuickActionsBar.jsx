import React from 'react';

const actions = [
  { emoji: '👍', label: "I'm Coming" },
  { emoji: '📍', label: "I'm Here" },
  { emoji: '🚗', label: 'Running Late' },
  { emoji: '👋', label: 'See You Soon' },
];

export default function QuickActionsBar({ onAction }) {
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-border bg-card/50 flex-shrink-0">
      {actions.map(({ emoji, label }) => (
        <button
          key={label}
          onClick={() => onAction(`${emoji} ${label}`)}
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-xs font-medium flex-shrink-0 transition-default"
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}