import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, LifeBuoy, FileText, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { validateDob } from '@/lib/eligibility';
import { updateMemberDob } from '@/lib/member-update';
import { signOutFromGate, useGateBackToLogin } from '@/lib/gate-escape';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Map an updateDob backend error to a friendly, non-sensitive reason.
// Never surfaces tokens, stack traces, or account existence details —
// only a category the user can act on (locked, restricted, not-found,
// network, or generic retry).
function describeDobError(err, t) {
  const code = err?.response?.data?.error || err?.error || '';
  const status = err?.status || err?.response?.status || 0;
  const msg = String(err?.message || '').toLowerCase();
  if (code === 'dob_locked') return t('eligibility.error.dob_locked');
  if (code === 'dob_restricted') return t('eligibility.error.dob_restricted');
  if (code === 'member_not_found') return t('eligibility.error.member_not_found');
  if (code === 'invalid_dob' || code === 'invalid_request') return t('eligibility.error.invalid');
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || status === 0) {
    return t('eligibility.error.network');
  }
  return t('eligibility.error.save_failed');
}

/**
 * Optional date-of-birth screen for members who want to add their age.
 * Date of birth is never required to use Nmood.
 *  - Provides access to Support, Privacy, Terms and Account Deletion.
 *  - Does NOT reveal whether any particular account is underage.
 */
export default function EligibilityRequiredScreen({ member, onSaved }) {
  const { t } = useLocalization();
  const { refreshMember, logout } = useAuth();
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Sign out of the current session and return to the sign-in screen.
  // Clears only Nmood auth/session transient state (access token in URL/
  // storage) — never user preferences, language, or consent. The real
  // logout is delegated to AuthContext.logout(), which terminates the
  // Base44 server session and hard-redirects to /auth.
  const handleSignOut = () => {
    setSigningOut(true);
    signOutFromGate(logout);
  };

  // Android hardware back escapes the gate to login instead of trapping.
  useGateBackToLogin(handleSignOut);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!dob) {
      await handleSkip();
      return;
    }

    const { valid, error: validationError } = validateDob(dob);
    if (!valid) {
      const messages = {
        invalid: t('eligibility.error.invalid'),
        future: t('eligibility.error.future'),
      };
      setError(messages[validationError] || t('eligibility.error.invalid'));
      return;
    }

    setSaving(true);
    try {
      const body = await updateMemberDob(dob);
      const updated = body?.member;
      await refreshMember(updated);
      onSaved?.(updated);
    } catch (err) {
      setError(describeDobError(err, t));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setError('');
    setSaving(true);
    try {
      await refreshMember(member);
      onSaved?.(member);
    } catch (err) {
      setError(describeDobError(err, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 bg-background overflow-y-auto momentum-scroll">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center mb-2 text-balance">
          Date of birth (optional)
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed text-balance">
          Adding your date of birth is optional. It is used only to calculate your age if you choose to show it. Your date of birth and birth year are never shown to other members.
        </p>

        {/* DOB Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eligibility-dob">
              Date of birth (optional)
            </Label>
            <Input
              id="eligibility-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={today}
              className="h-12 rounded-input"
              autoComplete="bday"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can skip this now and add it later from your profile.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-input bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-12" disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            ) : (
              'Save date of birth'
            )}
          </Button>
          <Button type="button" variant="outline" className="w-full h-12" onClick={handleSkip} disabled={saving}>
            Skip for now
          </Button>
        </form>

        {/* Sign out — escape the gate if you cannot continue */}
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={signingOut || saving}
          className="w-full h-12 mt-3"
        >
          {signingOut ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('eligibility.required.verifying')}</>
          ) : (
            <><LogOut className="w-4 h-4 mr-2" />{t('eligibility.required.sign_out')}</>
          )}
        </Button>

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
          We use a date of birth only to calculate the age you choose to display; the full date and year stay private.
        </p>

        {/* Access to Support, legal, account deletion */}
        <div className="mt-8 pt-6 border-t border-border space-y-2">
          <Link
            to="/support"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <LifeBuoy className="w-4 h-4" /> {t('eligibility.required.support_link')}
          </Link>
          <Link
            to="/terms"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <FileText className="w-4 h-4" /> {t('eligibility.required.terms_link')}
          </Link>
          <Link
            to="/privacy"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <FileText className="w-4 h-4" /> {t('eligibility.required.privacy_link')}
          </Link>
          <Link
            to="/account-deletion"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <Trash2 className="w-4 h-4" /> {t('eligibility.required.deletion_link')}
          </Link>
        </div>
      </div>
    </div>
  );
}
