import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Users, Link2, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CircleAbout({ circle }) {
  const navigate = useNavigate();

  const { t } = useLocalization();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold mb-2">{t('circles.about.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{circle.description}</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">{t('circles.about.circle_host')}</h3>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={circle.host.avatar} alt={circle.host.name} />
            <AvatarFallback className="bg-primary/10 text-primary">{circle.host.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{circle.host.name}</p>
            <p className="text-xs text-muted-foreground">{t('circles.about.host_label')}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-2">{t('circles.about.budget')}</h3>
        {!circle.budget || circle.budget === 'Free' ? (
          <p className="text-sm font-medium text-success">{t('circles.about.free')}</p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">AED {circle.budget}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('circles.about.budget_each_own')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('circles.about.budget_no_payment')}</p>
          </div>
        )}
      </Card>

      <div>
        <h3 className="font-semibold text-sm mb-2">{t('circles.about.shared_interests')}</h3>
        <div className="flex flex-wrap gap-1.5">
          {(circle.shared_interests || []).map((interest) => (
            <span key={interest} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">{interest}</span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2">{t('circles.about.members_count', { count: circle.member_count })}</h3>
        <div className="space-y-2">
          {(circle.members || []).slice(0, 4).map((m, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Avatar className="w-8 h-8">
                <AvatarImage src={m.avatar} alt={m.name} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{m.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{m.name}</span>
              {m.role === 'host' && (
                <span className="text-[9px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t('circles.about.host_badge')}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}