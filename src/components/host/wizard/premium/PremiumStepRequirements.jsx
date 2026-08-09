import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Check, X, Plus, PawPrint, Baby, Accessibility, Car, Trees, BarChart, DollarSign } from 'lucide-react';
import { budgetOptions } from '@/lib/budget-utils';
import { languagesList } from '@/lib/host-data';
import { useLocalization } from '@/lib/i18n/useLocalization';
import FloatingInput from './FloatingInput';
import FloatingTextarea from './FloatingTextarea';
import CircleStepRules from '@/components/host/wizard/circle/CircleStepRules';

const featureChips = [
  { key: 'petsAllowed', icon: PawPrint, label: 'Pets Allowed' },
  { key: 'familyFriendly', icon: Baby, label: 'Family Friendly' },
  { key: 'wheelchairAccessible', icon: Accessibility, label: 'Wheelchair Accessible' },
  { key: 'outdoor', icon: Trees, label: 'Outdoor' },
  { key: 'parking', icon: Car, label: 'Parking' },
];

const difficultyOptions = [
  { value: 'Easy', label: 'Beginner Friendly' },
  { value: 'All Levels', label: 'All Levels' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

/**
 * UI-020 — Step 5: Requirements (budget, feature chips, custom tags, extras).
 */
export default function PremiumStepRequirements({ data, update, errors = {}, isCircle }) {
  const { t } = useLocalization();
  const [tagInput, setTagInput] = useState('');
  if (isCircle) {
    return <CircleStepRules data={data} update={update} />;
  }
  const selected = data.budgetOption || '';
  const isCustom = selected === 'custom';
  const customTags = data.customTags || [];

  const toggleFeature = (key) => {
    update(key, data[key] === true ? null : true);
  };

  const toggleLanguage = (lang) => {
    const langs = data.languages || [];
    update('languages', langs.includes(lang) ? langs.filter((l) => l !== lang) : [...langs, lang]);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || customTags.includes(tag)) return;
    update('customTags', [...customTags, tag]);
    setTagInput('');
  };

  const removeTag = (tag) => {
    update('customTags', customTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-7">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('hosting.wizard.step_details')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('create.premium.requirements_subtitle')}</p>
      </div>

      {/* Budget */}
      <div>
        <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-primary" /> {t('hosting.step.budget_question')}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {budgetOptions.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => update('budgetOption', opt.id)}
                type="button"
                className={`relative flex items-center gap-2 p-3.5 rounded-2xl border-2 text-start transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}
              >
                {isSelected && <Check className="absolute top-2 end-2 w-3.5 h-3.5 text-primary" />}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary' : 'border-muted-foreground/30'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span className={`text-sm ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}>{opt.label}</span>
              </motion.button>
            );
          })}
        </div>
        {errors.budgetOption && <p className="text-xs text-destructive mt-2">{errors.budgetOption}</p>}
      </div>

      {/* Custom budget amount */}
      {isCustom && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 p-4 rounded-card border border-border bg-muted/20">
          <FloatingInput
            label={t('hosting.step.amount')}
            type="number"
            value={data.customAmount}
            onChange={(e) => update('customAmount', e.target.value)}
            error={errors.customAmount}
            placeholder={t('hosting.step_budget.enter_amount')}
          />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => update('budgetType', 'estimated')} type="button"
              className={`h-11 rounded-button border-2 text-sm font-medium transition-all ${(data.budgetType || 'estimated') === 'estimated' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}>
              Estimated
            </button>
            <button onClick={() => update('budgetType', 'fixed')} type="button"
              className={`h-11 rounded-button border-2 text-sm font-medium transition-all ${data.budgetType === 'fixed' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}>
              Fixed
            </button>
          </div>
        </motion.div>
      )}

      {/* Feature chips */}
      <div>
        <p className="text-sm font-medium mb-3">{t('hosting.step.accessibility')}</p>
        <div className="flex flex-wrap gap-2.5">
          {featureChips.map((chip) => {
            const active = data[chip.key] === true;
            const Icon = chip.icon;
            return (
              <motion.button
                key={chip.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleFeature(chip.key)}
                type="button"
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all border-2 ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {chip.label}
                {active && <Check className="w-3 h-3" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
          <BarChart className="w-4 h-4 text-primary" /> {t('hosting.step.difficulty_title')}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {difficultyOptions.map((opt) => {
            const active = data.difficulty === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => update('difficulty', active ? '' : opt.value)}
                type="button"
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border-2 ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom tags */}
      <div>
        <p className="text-sm font-medium mb-3">{t('create.premium.requirements_add_tag')}</p>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder={t('create.premium.requirements_tag_placeholder')}
            className="flex-1 h-11 px-4 rounded-button bg-card border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button onClick={addTag} type="button" className="w-11 h-11 rounded-button bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform flex-shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {customTags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                {tag}
                <button onClick={() => removeTag(tag)} type="button" className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Languages */}
      <div>
        <p className="text-sm font-medium mb-3">{t('profile.edit.languages')}</p>
        <div className="flex flex-wrap gap-2">
          {languagesList.map((lang) => {
            const active = (data.languages || []).includes(lang);
            return (
              <button key={lang} onClick={() => toggleLanguage(lang)} type="button"
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border-2 ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}>
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extras */}
      <div className="space-y-4">
        <FloatingTextarea
          label={t('hosting.step.bring_title')}
          value={data.whatToBring}
          onChange={(e) => update('whatToBring', e.target.value)}
          rows={2}
          placeholder={t('hosting.step.bring_placeholder')}
        />
        <FloatingInput
          label={t('hosting.step.dress_code_title')}
          value={data.dressCode}
          onChange={(e) => update('dressCode', e.target.value)}
          placeholder={t('hosting.step.dress_code_placeholder')}
        />
      </div>

      {/* Budget disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-card bg-muted/20 border border-border">
        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground leading-relaxed">{t('circles.about.budget_each_own')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('circles.about.budget_no_payment')}</p>
        </div>
      </div>
    </div>
  );
}