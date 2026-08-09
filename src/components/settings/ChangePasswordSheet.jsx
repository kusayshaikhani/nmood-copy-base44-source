import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Check, AlertCircle, KeyRound } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * NM-AUTH-SETTINGS-LAUNCH-001 — Change Password sheet.
 *
 * For email/password accounts: verifies the current password server-side
 * via base44.auth.changePassword (which validates the current password
 * before setting the new one). Never compares passwords client-side.
 * Never stores plaintext. Password values are never logged.
 *
 * For Apple/Google-only accounts (no local password): the API returns an
 * error indicating no password is set; the sheet switches to a message
 * explaining that password management is handled by the sign-in provider.
 */
export default function ChangePasswordSheet({ open, onOpenChange }) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSocialAccount, setIsSocialAccount] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError('');
    setSuccess(false);
    setIsSocialAccount(false);
  };

  const handleClose = (next) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const validatePassword = (pw) => {
    if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw))
      return 'Password must include both letters and numbers.';
    return '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading || success) return;
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    const pwError = validatePassword(newPassword);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }
    if (!user?.id) {
      setError('Your session could not be verified. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.changePassword({
        userId: user.id,
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const status = err?.status || err?.statusCode;
      const msg = (err?.message || '').toLowerCase();
      if (status === 401) {
        setError('Current password is incorrect.');
      } else if (
        msg.includes('no password') ||
        msg.includes('social') ||
        msg.includes('provider') ||
        msg.includes('oauth') ||
        msg.includes('google') ||
        msg.includes('apple')
      ) {
        setIsSocialAccount(true);
      } else if (status === 422) {
        setError('New password does not meet requirements.');
      } else {
        setError(
          err?.message || 'Could not change password. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-sheet">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Change Password
          </SheetTitle>
          <SheetDescription>
            Update your account password. You remain signed in after
            changing.
          </SheetDescription>
        </SheetHeader>

        {isSocialAccount ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                Social Account
              </p>
              <p>
                Your account uses Apple or Google sign-in. Password
                management is handled by your sign-in provider.
              </p>
              <p className="mt-2">
                To change your password, please use your provider's account
                settings.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <Check className="w-7 h-7 text-success" />
              </div>
              <p className="text-base font-semibold">Password Changed</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your password has been updated successfully. You remain
                signed in.
              </p>
            </div>
            <Button className="w-full h-11" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters with letters and numbers.
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={
                loading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing password…
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}