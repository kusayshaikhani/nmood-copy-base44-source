import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Plane, Camera, Briefcase, Dumbbell, Cpu, Gamepad2, Palette, Languages, Users, BookOpen, Music, UtensilsCrossed, Heart, Gift, MoreHorizontal, Check, Sparkles } from 'lucide-react';
import { languagesList } from '@/lib/host-data';
import { useLocalization } from '@/lib/i18n/useLocalization';
import FloatingInput from '../premium/FloatingInput';
import FloatingTextarea from '../premium/FloatingTextarea';

const categories = [
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

const moods = [
  { id: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🧭' },
];

/**
 * UI-021 — Circle Step 2: Basic Information.
 * Name, Category, Tagline, Description, Primary Language, Mood/Theme.
 */
export default function CircleStepBasics({ data, update, errors = {} }) {
  const { t } = useLocalization();

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('create.circle.basics_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('create.circle.basics_subtitle')}</p>
      </div>

      <FloatingInput
        label={t('create.circle.name_label')}
        value={data.title}
        onChange={(e) => update('title', e.target.value)}
        error={errors.title}
        maxLength={60}
        placeholder={t('create.circle.name_placeholder')}
      />

      {/* Category cards */}
      <div>
        <p className="text-sm font-medium mb-3">{t('create.circle.category_label')}</p>
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

      <FloatingInput
        label={t('create.circle.tagline_label')}
        value={data.whatToExpect}
        onChange={(e) => update('whatToExpect', e.target.value)}
        maxLength={100}
        placeholder={t('create.circle.tagline_placeholder')}
      />
      <p className="text-xs text-muted-foreground -mt-4 ps-1">{t('create.circle.tagline_hint')}</p>

      <FloatingTextarea
        label={t('create.circle.description_label')}
        value={data.description}
        onChange={(e) => update('description', e.target.value)}
        error={errors.description}
        maxLength={500}
        rows={4}
        placeholder={t('create.circle.description_placeholder')}
      />

      {/* Primary Language */}
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

      {/* Mood / Theme */}
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
    </div>
  );
}