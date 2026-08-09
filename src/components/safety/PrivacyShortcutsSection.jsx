import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { privacyShortcuts } from '@/lib/safety-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PrivacyShortcutsSection() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold mb-3">{t('safety.privacy_shortcuts')}</h2>
      <Card className="divide-y divide-border">
        {privacyShortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.id}
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/40 transition-default text-start"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{shortcut.label}</p>
                <p className="text-xs text-muted-foreground">{shortcut.value}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </Card>
    </section>
  );
}