import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, LifeBuoy, FileText, Trash2, LogOut, Loader2 } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';
import { signOutFromGate, useGateBackToLogin } from '@/lib/gate-escape';
import { Button } from '@/components/ui/button';

/**
 * AGE-001 — Screen shown to users whose date of birth indicates
 * they are under 18, or whose account is admin-restricted.
 *
 *  - Respectful message: Nmood is available only to people aged 18+.
 *  - Does NOT delete, suspend or modify the account automatically.
 *  - Preserves access to Support, legal pages and Account Deletion.
 *  - Does not reveal whether a particular email belongs to an underage user.
 *  - Provides a visible Sign-out escape so the user is never trapped.
 *  - Android hardware back signs out to login instead of trapping.
 */
export default function UnderageScreen() {
  const { t } = useLocalization();
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    setSigningOut(true);
    signOutFromGate(logout);
  };

  // Android hardware back escapes the gate to login.
  useGateBackToLogin(handleSignOut);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 bg-background overflow-y-auto momentum-scroll">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center mb-3 text-balance">
          {t('eligibility.underage.title')}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed text-balance">
          {t('eligibility.underage.message')}
        </p>

        {/* Sign out — escape the gate if you cannot continue */}
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full h-12"
        >
          {signingOut ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('eligibility.required.verifying')}</>
          ) : (
            <><LogOut className="w-4 h-4 mr-2" />{t('eligibility.required.sign_out')}</>
          )}
        </Button>

        {/* Access to Support, legal, account deletion */}
        <div className="mt-8 pt-6 border-t border-border space-y-2">
          <Link
            to="/support"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <LifeBuoy className="w-4 h-4" /> {t('eligibility.underage.support_link')}
          </Link>
          <Link
            to="/terms"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <FileText className="w-4 h-4" /> {t('eligibility.underage.terms_link')}
          </Link>
          <Link
            to="/privacy"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <FileText className="w-4 h-4" /> {t('eligibility.underage.privacy_link')}
          </Link>
          <Link
            to="/account-deletion"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-default"
          >
            <Trash2 className="w-4 h-4" /> {t('eligibility.underage.deletion_link')}
          </Link>
        </div>
      </div>
    </div>
  );
}