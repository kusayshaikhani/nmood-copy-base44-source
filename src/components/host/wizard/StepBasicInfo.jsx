import React from 'react';
import { Coffee, Dumbbell, Users, UtensilsCrossed, BookOpen, Mountain, Palette, Music, Gamepad2, Heart, Gift, Briefcase, MoreHorizontal, Check, Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const categories = [
  { label: 'Coffee', icon: Coffee },
  { label: 'Sports', icon: Dumbbell },
  { label: 'Networking', icon: Users },
  { label: 'Food', icon: UtensilsCrossed },
  { label: 'Learning', icon: BookOpen },
  { label: 'Outdoors', icon: Mountain },
  { label: 'Arts', icon: Palette },
  { label: 'Music', icon: Music },
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Wellness', icon: Heart },
  { label: 'Volunteering', icon: Gift },
  { label: 'Business', icon: Briefcase },
  { label: 'Other', icon: MoreHorizontal },
];

const suggestedInterests = {
  Coffee: ['Specialty Coffee', 'Brunch', 'Cafés', 'Networking'],
  Sports: ['Padel', 'Football', 'Running', 'Fitness'],
  Networking: ['Professional', 'Entrepreneurs', 'Mentorship', 'Social'],
  Food: ['Dining', 'Brunch', 'Foodie', 'Cuisine'],
  Learning: ['Workshops', 'Skills', 'Languages', 'Technology'],
  Outdoors: ['Beach', 'Hiking', 'Adventure', 'Nature'],
  Arts: ['Painting', 'Photography', 'Design', 'Creative'],
  Music: ['Live Music', 'Concerts', 'Jamming', 'Vinyl'],
  Gaming: ['Board Games', 'Esports', 'Retro', 'Card Games'],
  Wellness: ['Yoga', 'Meditation', 'Mindfulness', 'Self-Care'],
  Volunteering: ['Community', 'Charity', 'Environment', 'Giving Back'],
  Business: ['Startups', 'Investment', 'Marketing', 'Leadership'],
  Other: [],
};

export default function StepBasicInfo({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const interests = data.category ? suggestedInterests[data.category] || [] : [];

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.step_basic.category')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step.basic_info_kind')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {categories.map(({ label, icon: Icon }) => {
          const selected = data.category === label;
          return (
            <button key={label} onClick={() => update('category', label)} type="button"
              className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-default ${selected ? 'border-primary bg-primary/5' : 'border-border'}`}>
              {selected && <Check className="absolute top-1.5 end-1.5 w-3.5 h-3.5 text-primary" />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
      {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}

      {interests.length > 0 && (
        <div className="pt-2">
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('hosting.step.basic_info_suggested')}
          </p>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span key={interest} className="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}