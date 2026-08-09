import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Heart, Sparkles, Users, Target, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConciergeSuggestion({ recommendation }) {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const typeConfig = {
    experience: { icon: MapPin, label: t('ai.suggestion.experience'), color: 'text-primary', bg: 'bg-primary/10' },
    reconnect: { icon: Heart, label: t('ai.suggestion.reconnect'), color: 'text-chart-5', bg: 'bg-chart-5/10' },
    host: { icon: Sparkles, label: t('ai.suggestion.hosting'), color: 'text-chart-4', bg: 'bg-chart-4/10' },
    people: { icon: Users, label: t('ai.suggestion.people'), color: 'text-chart-2', bg: 'bg-chart-2/10' },
    goal: { icon: Target, label: t('ai.suggestion.goal'), color: 'text-chart-3', bg: 'bg-chart-3/10' },
  };

  const config = typeConfig[recommendation.type] || typeConfig.experience;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-3.5">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {recommendation.emoji && <span className="text-sm">{recommendation.emoji}</span>}
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${config.color}`}>{config.label}</span>
            </div>
            <p className="font-semibold text-sm mb-1">{recommendation.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{recommendation.reason}</p>
            {recommendation.action_label && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 mt-2 text-xs gap-1 -ml-2"
                onClick={() => navigate(recommendation.action_path || '/explore')}
              >
                {recommendation.action_label}
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}