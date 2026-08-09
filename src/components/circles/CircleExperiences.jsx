import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CircleExperiences({ circle }) {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const Section = ({ icon: Icon, title, items }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
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
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.date} · {item.time || ''}
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
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate('/host/create')}>
        <Plus className="w-4 h-4" />{t('circles.experiences.create')}</Button>
      <Section icon={Calendar} title={t('community.calendar.upcoming')} items={circle.upcoming_experiences || []} />
      <Section icon={Clock} title={t('community.calendar.past')} items={circle.past_experiences || []} />
    </div>
  );
}