import React from 'react';
import { Eye } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

/**
 * Empty state for the Profile Views page. The "Complete your profile" lead-in
 * is suppressed when the profile is already complete — only the discovery
 * suggestions (Circles, Experiences) remain, since those still help the user
 * become more visible.
 */
export default function ProfileViewsEmpty({ profileComplete = false }) {
  const description = profileComplete
    ? 'Join more Circles and participate in Experiences to become more discoverable.'
    : 'Complete your profile, join more Circles, and participate in Experiences to become more discoverable.';
  return (
    <EmptyState
      icon={Eye}
      title="No Profile Views Yet"
      description={description}
    />
  );
}