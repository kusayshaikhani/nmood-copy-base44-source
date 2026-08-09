import React from 'react';
import { EyeOff, Trash2 } from 'lucide-react';

export default function TimelineCard({ event, removedPhotos, onRemovePhoto }) {
  if (event.hidden) return null;
  const visiblePhotos = (event.photos || []).filter(p => !removedPhotos?.has(p));

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg ring-4 ring-background">
          {event.icon}
        </div>
        <div className="w-0.5 flex-1 bg-border mt-1 min-h-[20px]" />
      </div>
      <div className="flex-1 pb-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm">{event.title}</p>
              {event.experience && <p className="text-sm text-foreground/80 mt-0.5">{event.experience}</p>}
              <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
            </div>
          </div>

          {event.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">"{event.notes}"</p>
          )}

          {visiblePhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {visiblePhotos.map((photo, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden">
                  <img src={photo} alt="Memory" className="w-full h-32 object-cover" loading="lazy" />
                  <button
                    onClick={() => onRemovePhoto?.(photo)}
                    type="button"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}