import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, Sparkles, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statusColors } from '@/lib/calendar-data';
import { useSocialPlannerData } from '@/lib/social-planner-live';

function ActivityRow({ activity, index }) {
  const status = statusColors[activity.status] || statusColors.joined;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
    >
      <div className={'w-2 h-10 rounded-full ' + status.dot} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.title}</p>
        <p className="text-xs text-muted-foreground">{activity.time} · {activity.location}</p>
      </div>
      <Badge variant="secondary" className={'text-[10px] ' + status.badge}>{status.label}</Badge>
    </motion.div>
  );
}

function InvitationRow({ invitation, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
    >
      {invitation.experience_image ? (
        <img src={invitation.experience_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{invitation.experience_title}</p>
        <p className="text-xs text-muted-foreground">from {invitation.sender_name}</p>
      </div>
      <Badge variant="outline" className="text-[10px] text-warning border-warning/30">Pending</Badge>
    </motion.div>
  );
}

export default function TodaySection() {
  const { todayActivities: experiences, todayInvitations: invitations, todaySuggestions: suggestions } = useSocialPlannerData();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-semibold">Today</h2>
        <span className="text-xs text-muted-foreground">· {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </div>

      {/* Today's Experiences */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Today's Experiences</p>
        {experiences.length > 0 ? (
          <div className="space-y-2">
            {experiences.map((a, i) => <ActivityRow key={a.id} activity={a} index={i} />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground p-3 rounded-xl border border-dashed">Nothing scheduled today.</p>
        )}
      </div>

      {/* Today's Invitations */}
      {invitations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Today's Invitations
          </p>
          <div className="space-y-2">
            {invitations.map((inv, i) => <InvitationRow key={inv.id} invitation={inv} index={i} />)}
          </div>
        </div>
      )}

      {/* Today's Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Today's Suggestions
          </p>
          <div className="space-y-2">
            {suggestions.map((a, i) => <ActivityRow key={a.id} activity={a} index={i} />)}
          </div>
        </div>
      )}

      {/* Today's Free Time */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Today's Free Time
        </p>
        <Card className="p-3 bg-accent/5 border-accent/20">
          <p className="text-sm text-accent-foreground">
            Your evening looks open — a good time for something social.
          </p>
        </Card>
      </div>
    </section>
  );
}