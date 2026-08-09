import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

export default function SpecialMoments({ milestones }) {
  if (!milestones || milestones.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Special Moments</h2>
      <div className="space-y-3">
        {milestones.map(ms => (
          <div
            key={ms.id}
            className={`rounded-2xl border p-4 flex items-center gap-3 ${
              ms.achieved ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
              ms.achieved ? 'bg-primary/10' : 'bg-muted'
            }`}>
              {ms.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm">{ms.title}</p>
                {ms.achieved ? (
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{ms.description}</p>
              {ms.achieved && <p className="text-[10px] text-success mt-0.5">Achieved · {ms.date}</p>}
              {!ms.achieved && ms.date && <p className="text-[10px] text-muted-foreground/70 mt-0.5">Target · {ms.date}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}