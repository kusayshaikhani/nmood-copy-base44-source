import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';

export default function ProfileViewsMenuCard() {
  const { can } = useMembershipAccess();
  const navigate = useNavigate();

  if (!can(FEATURES.PROFILE_VIEWS)) return null;

  return (
    <Card className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => navigate('/profile-views')}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-default text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
          👀
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Profile Views</p>
          <p className="text-xs text-muted-foreground">See who recently viewed your profile</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>
    </Card>
  );
}