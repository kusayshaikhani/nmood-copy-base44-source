import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, LifeBuoy, FileText, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { validateDob, eligibilityPayload, ELIGIBILITY_STATUS } from '@/lib/eligibility';
import { updateMemberDob } from '@/lib/member-update';
import { signOutFromGate, useGateBackToLogin } from '@/lib/gate-escape';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { feedback } from '@/lib/feedback';

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
 * AGE-001 — Screen shown to authenticated users who have not yet
 * provided their date of birth.
 *
 *  - Collects a complete date of birth (not a checkbox).
 *  - Calculates age accurately; must have reached 18th birthday.
 *  - Prevents future and invalid dates.
 *  - Until confirmed, the user cannot access Discover, profiles,
 *    messaging, Circles, Experiences or AI Concierge.
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

    const { valid, error: validationError } = validateDob(dob);
    if (!valid) {
      const messages = {
        missing: t('eligibility.error.missing'),
        invalid: t('eligibility.error.invalid'),
        future: t('eligibility.error.future'),
        underage: t('eligibility.error.underage'),
      };
      setError(messages[validationError] || t('eligibility.error.invalid'));
      return;
    }

    setSaving(true);
    try {
      // AGE-001 — DOB is set through the backend updateDob action, which
      // derives eligibility_status server-side. Never write date_of_birth
      // or eligibility_status directly via Member.update(). The DOB value
      // is preserved across a save failure (state is not cleared) so the
      // user can retry without re-entering the date.
      const body = await updateMemberDob(dob);
      const updated = body?.member;
      await refreshMember(updated);
      feedback.success('eligibilityVerified');
      onSaved?.(updated);
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
          {t('eligibility.required.title')}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed text-balance">
          {t('eligibility.required.subtitle')}
        </p>

        {/* DOB Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eligibility-dob">
              {t('eligibility.required.dob_label')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eligibility-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={today}
              required
              className="h-12 rounded-input"
              autoComplete="bday"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('eligibility.required.dob_hint')}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-input bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-12" disabled={saving || !dob}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('eligibility.required.verifying')}</>
            ) : (
              t('eligibility.required.submit')
            )}
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
          {t('eligibility.required.privacy_note')}
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