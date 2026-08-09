import React from 'react';
import { Card } from '@/components/ui/card';

/** FM-006 — Standard glassmorphic section card for the Command Center. */
export default function CommandSection({ icon: Icon, title, action, children, className = '' }) {
  return (
    <Card className={'glass p-4 ' + className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </Card>
  );
}