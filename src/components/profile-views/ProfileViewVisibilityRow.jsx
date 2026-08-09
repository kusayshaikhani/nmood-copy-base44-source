import React, { useState, useEffect } from 'react';
import { EyeOff } from 'lucide-react';
import { updateMemberProfile } from '@/lib/member-update';
import { useAuth } from '@/lib/AuthContext';

export default function ProfileViewVisibilityRow() {
  const { member, refreshMember } = useAuth();
  const [value, setValue] = useState(member?.profile_view_visibility || 'visible');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member?.profile_view_visibility) setValue(member.profile_view_visibility);
  }, [member?.profile_view_visibility]);

  const isPrivate = value === 'private';

  const toggle = async () => {
    const next = isPrivate ? 'visible' : 'private';
    setValue(next);
    if (member?.id) {
      setSaving(true);
      try {
        await updateMemberProfile({ profile_view_visibility: next });
        await refreshMember?.();
      } catch {
        // ignore
      }
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-3 py-4">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <EyeOff className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Profile View Visibility</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {isPrivate
            ? "Private Browsing is on — others can't see when you view their profile, and your own Profile Views list is hidden."
            : 'Visible — others can see when you view their profile, and you can see who views yours.'}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={`flex-shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-default ${
          isPrivate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {isPrivate ? 'Private Browsing' : 'Visible'}
      </button>
    </div>
  );
}