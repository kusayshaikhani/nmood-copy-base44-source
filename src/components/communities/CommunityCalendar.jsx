import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Repeat, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityCalendar({ community }) {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const Section = ({ icon: Icon, title, items, renderItem }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/experience/${item.id}`)}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover-lift"
          >
            {item.image && <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" />}
            {!item.image && (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.schedule || `${item.date} · ${item.time || ''}`}
                {item.host && ` · ${item.host}`}
                {item.attendance && ` · ${item.attendance} attended`}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Section icon={Calendar} title={t('community.calendar.upcoming')} items={community.upcoming_experiences || []} />
      <Section icon={Clock} title={t('community.calendar.past')} items={community.past_experiences || []} />
      <Section icon={Repeat} title={t('hosting.dashboard.recurring')} items={community.recurring_experiences || []} />
    </div>
  );
}