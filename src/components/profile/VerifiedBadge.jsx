import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Public verified badge — requires authoritative email, photo and phone
// completion (see fetchMemberIdentityVerified). Carries no private metadata: no
// phone number, no selfie, no verification method, nothing beyond the fact
// that this member is verified.
export default function VerifiedBadge({ className = '' }) {
  const { t } = useLocalization();
  const label = t('profile.public.verified_badge') || 'Verified';
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center gap-1 text-xs font-semibold text-success ${className}`}
    >
      <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
