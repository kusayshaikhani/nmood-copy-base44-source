import React from 'react';
import { Shield } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SafetyHeader() {
  const { t } = useLocalization();
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{t('common.safety_center')}</h1>
        <p className="text-sm text-muted-foreground">Helping you connect with confidence.</p>
      </div>
    </div>
  );
}