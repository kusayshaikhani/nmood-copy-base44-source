import React from 'react';
import CircleCard from './CircleCard';

export default function CircleSection({ title, circles }) {
  if (!circles || circles.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {circles.map((c) => (
          <CircleCard key={c.id} circle={c} />
        ))}
      </div>
    </div>
  );
}