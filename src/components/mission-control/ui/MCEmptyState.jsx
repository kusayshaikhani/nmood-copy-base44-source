import React from 'react';

/**
 * FM-004 — Professional empty state with optional action suggestion.
 */
export default function MCEmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={'text-center py-10 ' + className}>
      {Icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/40 text-muted-foreground mb-3">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}