import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Mail, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { statusColors } from '@/lib/calendar-data';
import { useSocialPlannerData } from '@/lib/social-planner-live';

function MiniActivity({ activity, index }) {
  const status = statusColors[activity.status] || statusColors.joined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-card"
    >
      <div className={'w-1.5 h-8 rounded-full ' + status.dot} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{activity.title}</p>
        <p className="text-[11px] text-muted-foreground">{activity.date} · {activity.time}</p>
      </div>
    </motion.div>
  );
}

function GroupBlock({ title, icon: Icon, items, accent }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {title}
        {items.length > 0 && <span className="ml-auto text-[10px]">{items.length}</span>}
      </p>
      {items.length > 0 ? (
        <div className="space-y-1.5">
          {items.slice(0, 3).map((a, i) => <MiniActivity key={a.id} activity={a} index={i} />)}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground p-2.5 rounded-xl border border-dashed">Nothing this week.</p>
      )}
    </div>
  );
}

export default function ThisWeekSection() {
  const { thisWeekExperiences: experiences, thisWeekCommunity: community, thisWeekCircles: circles, pendingInvitations: invitations } = useSocialPlannerData();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-semibold">This Week</h2>
      </div>

      <GroupBlock title="Upcoming Experiences" icon={CalendarDays} items={experiences} />
      <GroupBlock title="Community Activities" icon={CalendarDays} items={community} />
      <GroupBlock title="Circle Activities" icon={CalendarDays} items={circles} />

      {/* Pending Invitations */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Mail className="w-3 h-3" /> Pending Invitations
        </p>
        {invitations.length > 0 ? (
          <div className="space-y-1.5">
            {invitations.slice(0, 3).map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-card"
              >
                {inv.experience_image ? (
                  <img src={inv.experience_image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{inv.experience_title}</p>
                  <p className="text-[11px] text-muted-foreground">from {inv.sender_name}</p>
                </div>
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">Pending</Badge>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground p-2.5 rounded-xl border border-dashed">No pending invitations.</p>
        )}
      </div>
    </section>
  );
}