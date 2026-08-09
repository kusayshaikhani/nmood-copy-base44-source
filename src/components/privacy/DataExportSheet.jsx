import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, FileJson } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { compileMemberData, downloadDataExport } from '@/lib/data-export';
import { useLocalization } from '@/lib/i18n/useLocalization';

// LC-002 Part 2 — Data export sheet.
export default function DataExportSheet({ open, onOpenChange }) {
  const { member, user } = useAuth();
  const { t } = useLocalization();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleExport = async () => {
    setStatus('preparing');
    setError('');
    try {
      const data = await compileMemberData(member, user);
      downloadDataExport(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err.message || t('lc002.export.error_default'));
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setError('');
  };

  const dataCategories = [
    t('lc002.export.cat_profile'), t('lc002.export.cat_interests'),
    t('lc002.export.cat_experiences'), t('lc002.export.cat_circles'),
    t('lc002.export.cat_connections'), t('lc002.export.cat_messages'),
    t('lc002.export.cat_privacy'), t('lc002.export.cat_trust'),
    t('lc002.export.cat_membership'), t('lc002.export.cat_safety'),
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl p-0 flex flex-col">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted mt-3 flex-shrink-0" />

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <SheetTitle className="text-lg font-bold">{t('lc002.export.title')}</SheetTitle>
          </div>

          <SheetDescription className="sr-only">
            {t('lc002.export.intro')}
          </SheetDescription>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {t('lc002.export.intro')}
          </p>

          {status === 'idle' && (
            <>
              <div className="rounded-xl bg-muted/50 border border-border p-4 mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  {t('lc002.export.includes')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dataCategories.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      {cat}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 mb-5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <FileJson className="w-3.5 h-3.5 inline me-1 -mt-0.5" />
                  {t('lc002.export.download_hint')}
                </p>
              </div>

              <div className="space-y-2.5">
                <Button className="w-full h-11" onClick={handleExport}>
                  <Download className="w-4 h-4 me-2" />
                  {t('lc002.export.prepare')}
                </Button>
                <Button variant="outline" className="w-full h-11" onClick={() => onOpenChange(false)}>
                  {t('lc002.export.close')}
                </Button>
              </div>
            </>
          )}

          {status === 'preparing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-bold mb-1">{t('lc002.export.preparing')}</h3>
              <p className="text-sm text-muted-foreground">{t('lc002.export.preparing_desc')}</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-lg font-bold mb-1">{t('lc002.export.ready')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-5">
                {t('lc002.export.ready_desc')}
              </p>
              <Button variant="outline" className="w-full h-11" onClick={() => onOpenChange(false)}>
                {t('lc002.export.done')}
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <Download className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold mb-1">{t('lc002.export.failed')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-5">
                {error}
              </p>
              <div className="w-full space-y-2.5">
                <Button variant="outline" className="w-full h-11" onClick={handleExport}>
                  {t('lc002.export.try_again')}
                </Button>
                <Button variant="ghost" className="w-full h-11" onClick={() => onOpenChange(false)}>
                  {t('lc002.export.close')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}