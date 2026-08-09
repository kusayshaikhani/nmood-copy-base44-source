import React from 'react';
import { languagesList } from '@/lib/host-data';
import YesNoToggle from '@/components/host/wizard/YesNoToggle';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function StepRequirements({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const selectedLanguages = data.languages || [];
  const inputClass = 'w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default';
  const taClass = inputClass + ' h-auto py-3 resize-none';
  const chipClass = (selected) =>
    'px-3.5 py-2 rounded-full text-sm transition-default ' +
    (selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground');

  const toggleLanguage = (lang) => {
    update(
      'languages',
      selectedLanguages.includes(lang) ? selectedLanguages.filter((l) => l !== lang) : [...selectedLanguages, lang]
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.wizard.step_details')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step_basic.tell_expect')}</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_basic.short_desc')}</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => update('description', e.target.value)}
          placeholder={t('hosting.step.about_placeholder')}
          rows={3}
          className={taClass}
          maxLength={200}
        />
        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_basic.what_to_expect')}</label>
        <textarea
          value={data.whatToExpect || ''}
          onChange={(e) => update('whatToExpect', e.target.value)}
          placeholder={t('hosting.step.experience_desc_placeholder')}
          rows={3}
          className={taClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step.bring_title')}</label>
        <textarea
          value={data.whatToBring || ''}
          onChange={(e) => update('whatToBring', e.target.value)}
          placeholder={t('hosting.step.bring_placeholder')}
          rows={2}
          className={taClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step.dress_code_title')}</label>
        <input
          value={data.dressCode || ''}
          onChange={(e) => update('dressCode', e.target.value)}
          placeholder={t('hosting.step.dress_code_placeholder')}
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_basic.family_friendly')}</label>
        <YesNoToggle value={data.familyFriendly} onChange={(v) => update('familyFriendly', v)} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_basic.pets_allowed')}</label>
        <YesNoToggle value={data.petsAllowed} onChange={(v) => update('petsAllowed', v)} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step.accessibility')}</label>
        <p className="text-xs text-muted-foreground mb-2">{t('hosting.step_basic.accessible')}</p>
        <YesNoToggle value={data.wheelchairAccessible} onChange={(v) => update('wheelchairAccessible', v)} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('profile.edit.languages')}</label>
        <div className="flex flex-wrap gap-2">
          {languagesList.map((lang) => (
            <button key={lang} onClick={() => toggleLanguage(lang)} type="button" className={chipClass(selectedLanguages.includes(lang))}>
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step.difficulty_title')}</label>
        <select value={data.difficulty || ''} onChange={(e) => update('difficulty', e.target.value)} className={inputClass}>
          <option value="">{t('experiences.budget.not_specified')}</option>
          <option value="Easy">{t('hosting.step.difficulty_easy')}</option>
          <option value="All Levels">{t('experiences.about.all_levels')}</option>
          <option value="Intermediate">{t('hosting.step.difficulty_intermediate')}</option>
          <option value="Advanced">{t('hosting.step.difficulty_advanced')}</option>
        </select>
      </div>
    </div>
  );
}