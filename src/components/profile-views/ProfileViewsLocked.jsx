import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeOff, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfileViewsLocked({ reason }) {
  const navigate = useNavigate();
  const isPrivate = reason === 'private';
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        {isPrivate ? <EyeOff className="w-8 h-8 text-primary" /> : <Crown className="w-8 h-8 text-primary" />}
      </div>
      <h3 className="text-lg font-semibold mb-1.5">
        {isPrivate ? 'Private Browsing is On' : 'Profile Views is a Premium Feature'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {isPrivate
          ? "You've enabled Private Browsing, so your Profile Views list is hidden. Turn it off in Privacy to see who viewed your profile."
          : 'Upgrade to Connect or Inspire to see who recently viewed your profile.'}
      </p>
      <Button onClick={() => navigate(isPrivate ? '/privacy' : '/membership')} className="gap-2">
        {isPrivate ? 'Manage Privacy' : 'View Plans'}
      </Button>
    </div>
  );
}