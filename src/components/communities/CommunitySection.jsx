import React from 'react';
import CommunityCard from './CommunityCard';

export default function CommunitySection({ title, communities }) {
  if (!communities || communities.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
        {communities.map((c) => (
          <div key={c.id} className="flex-shrink-0 w-72 snap-start">
            <CommunityCard community={c} />
          </div>
        ))}
      </div>
    </div>
  );
}