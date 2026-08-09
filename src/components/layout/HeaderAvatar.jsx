import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/AuthContext';
import { resolveMemberName, resolveMemberInitials } from '@/lib/member-display';

/**
 * Top-right profile entry. Keeps profile one tap away after the bottom-nav
 * Profile tab was replaced by Circles. `variant="hero"` styles it for
 * gradient heroes (white ring + translucent fallback); `variant="solid"`
 * styles it for standard surfaces.
 */
export default function HeaderAvatar({ variant = 'solid' }) {
  const { user, member } = useAuth();
  const navigate = useNavigate();
  const memberName = resolveMemberName(member, user);
  const initials = resolveMemberInitials(member, user) || 'U';
  const hero = variant === 'hero';
  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      aria-label="Profile"
      className={
        hero
          ? 'rounded-full active:scale-95 transition-transform duration-200'
          : 'flex items-center rounded-full hover:ring-2 hover:ring-primary/20 transition-default'
      }
    >
      <Avatar className={hero ? 'w-9 h-9 ring-2 ring-white/30' : 'w-9 h-9'}>
        <AvatarImage src={member?.photo_url || user?.image_url} alt={memberName || undefined} />
        <AvatarFallback className={hero ? 'bg-white/20 text-white text-xs font-semibold' : 'bg-primary/10 text-primary text-xs font-semibold'}>
          {initials}
        </AvatarFallback>
      </Avatar>
    </button>
  );
}