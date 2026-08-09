import React from 'react';
import { Clock, MapPin, DollarSign, Calendar, Sparkles, Navigation } from 'lucide-react';

/**
 * Itinerary card — displays a multi-step inspirational plan.
 * Clearly labeled as "Inspirational" — never presented as a verified plan.
 * Does not claim live opening hours, prices, ratings, or travel times.
 */
export default function ItineraryCard({ itinerary }) {
  if (!itinerary || !itinerary.steps?.length) return null;

  const handleStepDirections = (area) => {
    if (area) window.open(`https://www.google.com/maps/search/${encodeURIComponent(area)}`, '_blank');
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] overflow-hidden">
      <div className="px-4 py-3 bg-primary/[0.05] flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{itinerary.title || 'Your Plan'}</h3>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> Inspirational
        </span>
      </div>

      <div className="p-4 space-y-3">
        {itinerary.steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                {i + 1}
              </div>
              {i < itinerary.steps.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-primary">{step.start_time}</span>
                <span className="text-sm font-semibold text-foreground">{step.activity}</span>
              </div>
              {step.venue && (
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 flex-1">
                    <MapPin className="w-3 h-3" /> {step.venue}
                  </p>
                  <button type="button" onClick={() => handleStepDirections(step.venue)}
                    className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-default"
                    title="Search in Google Maps">
                    <Navigation className="w-2.5 h-2.5" /> Search
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                {step.estimated_cost && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {step.estimated_cost}</span>}
              </div>
              {step.notes && (
                <p className="text-[11px] text-muted-foreground/80 italic mt-1">{step.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total cost */}
      {itinerary.total_cost && (
        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Estimated total</span>
          <span className="text-sm font-bold text-primary">{itinerary.total_cost}</span>
        </div>
      )}

      {/* Inspirational notice */}
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/15 border-t border-amber-200 dark:border-amber-800/30">
        <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-snug">
          Suggestions are inspirational. Please verify current details, prices, opening hours, and availability.
        </p>
      </div>
    </div>
  );
}