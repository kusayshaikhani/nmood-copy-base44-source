import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Sparkles } from 'lucide-react';

export default function UpcomingExperiences({ upcoming, pal }) {
  const navigate = useNavigate();

  if (upcoming.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Upcoming Together</h2>
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No shared upcoming experiences. Explore something together!</p>
          <button onClick={() => navigate('/explore')} type="button" className="text-sm text-primary font-medium">Discover Experiences</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Upcoming Together</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {upcoming.map(exp => (
          <button
            key={exp.id}
            onClick={() => navigate(`/experience/${exp.id}`)}
            type="button"
            className="flex-shrink-0 w-56 text-left rounded-2xl border border-border bg-card overflow-hidden hover-lift"
          >
            <img src={exp.image} alt={exp.title} className="w-full h-28 object-cover" loading="lazy" />
            <div className="p-3">
              <p className="text-sm font-semibold truncate">{exp.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" /> {exp.date} · {exp.time}
              </p>
              <p className="text-[10px] text-primary mt-1.5">Matches both your interests</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}