import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AnalyticsExportBar() {
  const { t } = useLocalization();
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-2 h-8"><Download className="w-3.5 h-3.5" />{t('admin.csv')}</Button>
      <Button variant="outline" size="sm" className="gap-2 h-8"><FileSpreadsheet className="w-3.5 h-3.5" />{t('admin.excel')}</Button>
      <Button variant="outline" size="sm" className="gap-2 h-8"><FileText className="w-3.5 h-3.5" />{t('admin.pdf')}</Button>
    </div>
  );
}