import { PROFILE_FIELD_CLASS } from './profile-field-style';
import { personalSelectionPatch } from '@/lib/onboarding-personal-details';
import HeightWorkFields from './HeightWorkFields';
import React, { useId } from 'react';
import { maritalStatusOptions, familyPlanOptions, familyPlanLabel } from '@/lib/onboarding-data';
import NationalitySelect from './NationalitySelect';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { smokingOptions, drinkingOptions } from '@/lib/profile-habits';

// Shared by onboarding and edit. Rendering never writes defaults or opts in.
export default function PersonalDetailsFields({ data, update, includeNationality = false, selectionIncludesSharing = false }) {
  const change = patch => update(selectionIncludesSharing ? personalSelectionPatch(patch) : patch);
  const id = useId();
  const { t } = useLocalization();
  const fields = [
    { key: 'marital_status', sharing: 'share_marital_status', label: 'Marital status', options: maritalStatusOptions },
    { key: 'family_plan', sharing: 'share_family_plan', label: 'Children preference', options: familyPlanOptions },
    { key: 'smoking', sharing: 'share_smoking', label: 'Smoking', options: smokingOptions },
    { key: 'drinking', sharing: 'share_drinking', label: 'Drinking', options: drinkingOptions },
  ];
  return <section aria-label="Optional personal details" className="space-y-4 rounded-xl border border-border p-4">
    <div>
      <h2 className="text-base font-semibold">Optional personal details</h2>
      <p className="text-sm text-muted-foreground">{selectionIncludesSharing ? 'Every field is optional. Leave it blank to omit it. Choosing a value includes it in your profile, matching and discovery only where the existing privacy rules allow.' : 'Choose what to add and share. Premium never overrides these sharing choices.'}</p>
    </div>
    {!selectionIncludesSharing && <label className="flex min-h-11 items-center gap-3 text-sm">
      <input type="checkbox" checked={data.show_age === true} onChange={event => change({ show_age: event.target.checked })} />
      Show my age on my profile
    </label>}
    <p className="text-xs text-muted-foreground">Age is calculated from your verified date of birth. Your date of birth is never shown.</p>
    {fields.map(field => <div key={field.key} className="space-y-2">
      <label htmlFor={`${id}-${field.key}`} className="block text-sm font-medium">{field.label} (optional)</label>
      <select id={`${id}-${field.key}`} value={data[field.key] || ''} onChange={event => change({ [field.key]: event.target.value, ...(field.sharing ? { [field.sharing]: data[field.sharing] ?? event.target.value !== '' } : {}) })} className={PROFILE_FIELD_CLASS}>
        <option value="">Not supplied</option>
        {field.key === 'family_plan' && data.family_plan && !familyPlanOptions.some(option => option.value === data.family_plan) && <option value={data.family_plan} disabled>Saved: {familyPlanLabel(data.family_plan) || 'Previous preference'}</option>}
        {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {field.sharing && <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={data[field.sharing] === true} onChange={event => change({ [field.sharing]: event.target.checked })} />
        Show my {field.label.toLowerCase()} in my profile, matching and discovery
      </label>}
      {field.sharing && <p className="text-xs text-muted-foreground">{data[field.sharing] === true ? 'Only viewers permitted by Nmood’s profile rules can see this supplied detail.' : 'Private: other members cannot see this detail, including Premium members.'}</p>}
      {!field.sharing && <p className="text-xs text-muted-foreground">Optional. Choosing a value includes it for permitted viewers. Choose Not supplied to remove it.</p>}
    </div>)}
    <HeightWorkFields data={data} update={change} showSharingControls />
    {includeNationality && <div className="space-y-2">
      <label htmlFor={`${id}-nationality`} className="block text-sm font-medium">Nationality (optional)</label>
      <NationalitySelect value={data.nationality} onChange={nationality=>change({nationality, share_nationality: data.share_nationality ?? nationality !== ''})} t={t} />
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={data.share_nationality === true} onChange={event => change({ share_nationality: event.target.checked })} />Show my nationality in my profile, matching and discovery</label>
      <p className="text-xs text-muted-foreground">Nationality is separate from where you live. It is visible only when you supply it and leave Show turned on.</p>
    </div>}
  </section>;
}
