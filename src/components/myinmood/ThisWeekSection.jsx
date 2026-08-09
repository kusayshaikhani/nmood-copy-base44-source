import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Mail, Heart, Sparkles, ChevronRight } from 'lucide-react';
import { useThisWeekData } from '@/lib/myinmood-live';

function SubSection({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ThisWeekSection() {
  const navigate = useNavigate();
  const { data, loading } = useThisWeekData();

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">This Week</h2>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const hasAny = data.upcomingExperiences.length > 0 || data.pendingInvitations.length > 0 || data.reconnectSuggestions.length > 0 || data.suggestedExperiences.length > 0;
  if (!hasAny) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">This Week</h2>
      <div className="space-y-4">
        {data.upcomingExperiences.length > 0 && (
          <SubSection icon={Clock} title="Upcoming Experiences">
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {data.upcomingExperiences.map((exp) => (
                <motion.div
                  key={exp.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/my-experiences')}
                  className="w-44 flex-shrink-0 rounded-2xl overflow-hidden border border-border bg-card cursor-pointer hover-lift"
                >
                  {exp.image ? (
                    <img src={exp.image} alt={exp.title} className="w-full h-20 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-20 bg-muted flex items-center justify-center">
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="font-semibold text-xs line-clamp-1">{exp.title}</p>
                    <p className="text-[11px] text-primary font-medium">{exp.date} · {exp.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </SubSection>
        )}

        {data.pendingInvitations.length > 0 && (
          <SubSection icon={Mail} title="Pending Invitations">
            <div className="space-y-2">
              {data.pendingInvitations.map((inv) => (
                <motion.div
                  key={inv.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/notifications')}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card cursor-pointer hover-lift"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{inv.title}</p>
                    <p className="text-xs text-muted-foreground">from {inv.from}{inv.date ? ' · ' + inv.date : ''}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          </SubSection>
        )}

        {data.reconnectSuggestions.length > 0 && (
          <SubSection icon={Heart} title="Reconnect Suggestions">
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {data.reconnectSuggestions.map((pal) => (
                <motion.div
                  key={pal.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/pals')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border bg-card cursor-pointer hover-lift w-28 flex-shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                    {pal.name?.charAt(0) || '?'}
                  </div>
                  <p className="font-medium text-xs truncate w-full text-center">{pal.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pal.lastMet}</p>
                </motion.div>
              ))}
            </div>
          </SubSection>
        )}

        {data.suggestedExperiences.length > 0 && (
          <SubSection icon={Sparkles} title="Suggested Experiences">
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {data.suggestedExperiences.map((exp) => (
                <motion.div
                  key={exp.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/explore')}
                  className="w-44 flex-shrink-0 rounded-2xl overflow-hidden border border-border bg-card cursor-pointer hover-lift"
                >
                  {exp.image ? (
                    <img src={exp.image} alt={exp.title} className="w-full h-20 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-20 bg-muted flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="font-semibold text-xs line-clamp-1">{exp.title}</p>
                    <p className="text-[11px] text-muted-foreground">{exp.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </SubSection>
        )}
      </div>
    </section>
  );
}