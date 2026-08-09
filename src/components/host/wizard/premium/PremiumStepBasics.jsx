import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Plane, Camera, Briefcase, Dumbbell, Cpu, Gamepad2, Palette, Languages, Users, BookOpen, Music, UtensilsCrossed, Heart, Gift, MoreHorizontal, Check, Sparkles, Mountain } from 'lucide-react';
import { languagesList } from '@/lib/host-data';
import { useLocalization } from '@/lib/i18n/useLocalization';
import FloatingInput from './FloatingInput';
import FloatingTextarea from './FloatingTextarea';

const circleCategories = [
  { label: 'Coffee', icon: Coffee },
  { label: 'Travel', icon: Plane },
  { label: 'Photography', icon: Camera },
  { label: 'Business', icon: Briefcase },
  { label: 'Fitness', icon: Dumbbell },
  { label: 'Technology', icon: Cpu },
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Art', icon: Palette },
  { label: 'Languages', icon: Languages },
  { label: 'Networking', icon: Users },
  { label: 'Books', icon: BookOpen },
  { label: 'Music', icon: Music },
  { label: 'Food', icon: UtensilsCrossed },
  { label: 'Wellness', icon: Heart },
  { label: 'Volunteering', icon: Gift },
  { label: 'Other', icon: MoreHorizontal },
];

const experienceCategories = [
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

const moods = [
  { id: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🧭' },
];

/**
 * Step 2: Basics — title, category, tagline, description.
 * Circle-specific: language + mood selectors.
 * Experience-specific: suggested interests.
 */
export default function PremiumStepBasics({ data, update, errors = {}, isCircle }) {
  const { t } = useLocalization();
  const categories = isCircle ? circleCategories : experienceCategories;
  const interests = !isCircle && data.category ? suggestedInterests[data.category] || [] : [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('create.premium.basics_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('create.premium.basics_subtitle')}</p>
      </div>

      <FloatingInput
        label={isCircle ? t('create.circle.name_label') : t('hosting.step_title.experience_title')}
        value={data.title}
        onChange={(e) => update('title', e.target.value)}
        error={errors.title}
        maxLength={isCircle ? 60 : 80}
        placeholder={isCircle ? t('create.circle.name_placeholder') : t('hosting.step.title_placeholder')}
      />

      {/* Category chips */}
      <div>
        <p className="text-sm font-medium mb-3">{t('hosting.step_basic.category')}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {categories.map(({ label, icon: Icon }) => {
            const selected = data.category === label;
            return (
              <motion.button
                key={label}
                whileTap={{ scale: 0.95 }}
                onClick={() => update('category', label)}
                type="button"
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                {selected && <Check className="absolute top-1.5 end-1.5 w-3.5 h-3.5 text-primary" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </motion.button>
            );
          })}
        </div>
        {errors.category && <p className="text-xs text-destructive mt-2">{errors.category}</p>}
      </div>

      {/* Suggested interests (experience only) */}
      {!isCircle && interests.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('hosting.step.basic_info_suggested')}
          </p>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span key={interest} className="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <FloatingInput
        label={t('create.premium.basics_tagline')}
        value={data.whatToExpect}
        onChange={(e) => update('whatToExpect', e.target.value)}
        maxLength={100}
        placeholder={t('hosting.step.experience_desc_placeholder')}
      />

      <FloatingTextarea
        label={t('hosting.step_basic.short_desc')}
        value={data.description}
        onChange={(e) => update('description', e.target.value)}
        error={errors.description}
        maxLength={500}
        rows={4}
        placeholder={t('hosting.step.about_placeholder')}
      />

      {/* Circle-specific: Language + Mood */}
      {isCircle && (
        <>
          <div>
            <p className="text-sm font-medium mb-3">{t('create.circle.language_label')}</p>
            <div className="flex flex-wrap gap-2">
              {languagesList.map((lang) => {
                const active = (data.language || 'English') === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => update('language', lang)}
                    type="button"
                    className={`px-3.5 py-2.5 rounded-full text-sm font-medium transition-all border-2 ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('create.circle.mood_label')}
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {moods.map((mood) => {
                const selected = data.mood === mood.id;
                return (
                  <motion.button
                    key={mood.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => update('mood', selected ? '' : mood.id)}
                    type="button"
                    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className={`text-xs font-medium ${selected ? 'text-primary' : ''}`}>{mood.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}