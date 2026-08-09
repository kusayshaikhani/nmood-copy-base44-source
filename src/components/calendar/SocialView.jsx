import React from 'react';
import { Heart, Users, Cake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SocialView({ activities = [], onActivityClick }) {
  const { t } = useLocalization();
  const palActivities = activities.filter((a) => a.palsAttending && a.palsAttending.length > 0);
  const communityEvents = activities.filter((a) => a.community);
  const circleEvents = activities.filter((a) => a.circle);

  const sections = [
    { icon: Heart, label: 'Pals Attending', color: 'text-primary', bg: 'bg-primary/10', items: palActivities },
    { icon: Users, label: 'Community Events', color: 'text-info', bg: 'bg-info/10', items: communityEvents },
    { icon: Cake, label: 'Circle Events', color: 'text-accent-foreground', bg: 'bg-accent/20', items: circleEvents },
  ];

  const hasContent = sections.some((s) => s.items.length > 0);
  if (!hasContent) return null;

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-sm font-semibold mb-3">{t('calendar.social.highlights')}</h3>
      <div className="space-y-4">
        {sections.map((section) => {
          if (section.items.length === 0) return null;
          const Icon = section.icon;
          return (
            <div key={section.label}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-lg ${section.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${section.color}`} />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{section.label}</span>
              </div>
              <div className="space-y-1.5">
                {section.items.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onActivityClick?.(a)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-default text-start"
                  >
                    <img src={a.coverImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {a.palsAttending?.length > 0 && `${a.palsAttending.join(', ')} · `}
                        {a.time}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">{t('calendar.social.birthdays')}</p>
    </Card>
  );
}