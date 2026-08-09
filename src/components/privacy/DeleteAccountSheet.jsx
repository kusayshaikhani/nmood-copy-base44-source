import React, { useState } from 'react';
import { AlertTriangle, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { softDeleteAccount } from '@/lib/account-deletion';
import { requestAccountDeletion } from '@/lib/account-state';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isPaidSubscriptionsEnabled } from '@/lib/launch-mode';

// LC-002 Part 1 — Self-service account deletion sheet.
export default function DeleteAccountSheet({ open, onOpenChange }) {
  const { member, user, logout } = useAuth();
  const { t } = useLocalization();
  const [step, setStep] = useState('explain');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const isEmailAccount = !!user?.email && !user?.email?.includes('@phone.');
  const canConfirm = !isEmailAccount || password.length > 0;

  const handleDelete = async () => {
    setError('');
    if (isEmailAccount && !password) {
      setError(t('lc002.delete.password_required'));
      return;
    }
    if (confirmText !== 'DELETE') {
      setError(t('lc002.delete.type_required'));
      return;
    }
    setStep('deleting');
    try {
      await requestAccountDeletion(member, user, password);
      setStep('done');
      setTimeout(() => { logout(true); }, 2500);
    } catch (err) {
      setStep('confirm');
      setError(err.message || t('lc002.delete.type_required'));
    }
  };

  const handleReset = () => {
    setStep('explain');
    setPassword('');
    setConfirmText('');
    setError('');
  };

  const steps = [
    'Your profile is immediately hidden from everyone and removed from discovery.',
    'Login is disabled and you are signed out of all devices.',
    'Pending Pal requests are cancelled automatically.',
    ...(isPaidSubscriptionsEnabled() ? [
      'If you have an active Apple App Store or Google Play subscription, it is NOT automatically cancelled. You must cancel it separately in your store account settings to avoid future charges.',
    ] : []),
    'Your data is preserved for a 30-day recovery window in case you change your mind.',
    'Security logs, safety reports, support records, and consent records are retained as required by policy.',
    'Within 30 days you can recover your account by contacting support.',
    'After 30 days, your remaining personal data is permanently removed from active systems. Backup copies are removed within 90 days.',
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-3xl p-0 flex flex-col">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted mt-3 flex-shrink-0" />

        {step === 'explain' && (
          <div className="p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <SheetTitle className="text-lg font-bold">{t('lc002.delete.title')}</SheetTitle>
            </div>

            <SheetDescription className="sr-only">
              Before you continue, please understand what happens when you delete your Nmood account.
            </SheetDescription>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Before you continue, please understand what happens when you delete your Nmood account:
            </p>

            <div className="space-y-3 mb-6">
              {steps.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-muted/50 border border-border p-3 mb-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <Shield className="w-3.5 h-3.5 inline me-1 -mt-0.5" />
                {t('lc002.delete.export_hint')}
              </p>
            </div>

            <div className="space-y-2.5">
              <Button variant="outline" className="w-full h-11" onClick={() => onOpenChange(false)}>
                {t('lc002.delete.keep')}
              </Button>
              <Button variant="destructive" className="w-full h-11" onClick={() => setStep('confirm')}>
                {t('lc002.delete.continue')}
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-lg font-bold">{t('lc002.delete.confirm_title')}</h2>
            </div>

            {isEmailAccount && (
              <div className="mb-4">
                <Label htmlFor="del-password" className="mb-1.5 block">
                  {t('lc002.delete.password_label')}
                </Label>
                <Input
                  id="del-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                  autoFocus
                />
              </div>
            )}

            <div className="mb-4">
              <Label className="mb-1.5 block">
                {t('lc002.delete.type_delete')}
              </Label>
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="h-11 font-bold"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <Button variant="outline" className="w-full h-11" onClick={handleReset}>
                {t('lc002.delete.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="w-full h-11"
                onClick={handleDelete}
                disabled={!canConfirm || confirmText !== 'DELETE'}
              >
                {t('lc002.delete.permanently_delete')}
              </Button>
            </div>
          </div>
        )}

        {step === 'deleting' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-destructive animate-spin mb-4" />
            <h3 className="text-lg font-bold mb-1">{t('lc002.delete.deleting')}</h3>
            <p className="text-sm text-muted-foreground">{t('lc002.delete.deleting_desc')}</p>
          </div>
        )}

        {step === 'done' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <h3 className="text-lg font-bold mb-1">{t('lc002.delete.success_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('lc002.delete.success_desc')}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}