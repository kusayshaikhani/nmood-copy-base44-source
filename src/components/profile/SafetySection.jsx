import React from 'react';
import { ShieldCheck, BookOpen, Flag, Ban, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SafetySection() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const items = [
    { icon: ShieldCheck, label: t('profile.safety.guidelines_accepted'), status: t('profile.safety.accepted'), positive: true, action: null },
    { icon: BookOpen, label: t('profile.safety.tips'), status: null, positive: false, action: t('profile.safety.view_tips') },
    { icon: Flag, label: t('profile.safety.report'), status: null, positive: false, action: t('profile.safety.report_action') },
    { icon: Ban, label: t('profile.safety.block'), status: null, positive: false, action: t('profile.safety.block_action') },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('profile.safety.title')}</h2>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-default">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.positive ? 'bg-success/10' : 'bg-muted'
              }`}>
                <Icon className={`w-4 h-4 ${item.positive ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.status && (
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                  {item.status}
                </span>
              )}
              {item.action && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  {item.action}
                  <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigate('/safety-center')}>
        {t('profile.safety.open_center')}
      </Button>
    </Card>
  );
}