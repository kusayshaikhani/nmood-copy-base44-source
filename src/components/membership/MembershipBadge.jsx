import React from 'react';
import { getTier } from '@/lib/membership';

export default function MembershipBadge({ tier, size = 'md' }) {
  const tierData = getTier(tier);
  const sizeClass = size === 'sm'
    ? 'w-6 h-6 text-[10px] rounded-lg'
    : size === 'lg'
      ? 'w-14 h-14 text-lg rounded-2xl'
      : 'w-10 h-10 text-sm rounded-xl';

  return (
    <div className={'flex items-center justify-center font-bold flex-shrink-0 ' + sizeClass + ' ' + tierData.bgColor + ' ' + tierData.color}>
      {tierData.badge}
    </div>
  );
}