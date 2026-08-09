import React from 'react';
import { Card } from '@/components/ui/card';
import { UserCheck, Flag, Megaphone, ToggleRight, ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const actions = [
  { label: 'Approve Host', icon: UserCheck, description: '2 pending', color: 'bg-success/10 text-success' },
  { label: 'Review Reports', icon: Flag, description: '23 open', color: 'bg-destructive/10 text-destructive' },
  { label: 'Send Announcement', icon: Megaphone, description: 'Broadcast', color: 'bg-info/10 text-info' },
  { label: 'Feature Flags', icon: ToggleRight, description: '8 active', color: 'bg-primary/10 text-primary' },
];

export default function QuickActions() {
  const { t } = useLocalization();
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{t('admin.quick_actions')}</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="text-left"
          >
            <Card className="p-4 hover:shadow-md transition-default cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <div className={'w-9 h-9 rounded-lg flex items-center justify-center ' + action.color}>
                  <action.icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}