import React from 'react';
import LocalProfileChoice from './LocalProfileChoice';
import ZodiacField from './ZodiacField';
import { lifestyleOptions } from '@/lib/onboarding-data';
import { lifestyleLabel } from '@/lib/i18n/label-resolvers';
import { useLocalization } from '@/lib/i18n/useLocalization';
export default function LifestyleFields({data,update}) {
 const {t}=useLocalization();
 return <div className="space-y-5">
  <div id="edit-section-lifestyle" className="space-y-2 [&_button]:text-left"><h2 className="text-sm font-medium">Lifestyle (optional)</h2>
   <LocalProfileChoice label="Lifestyle" value={data.lifestyle} placeholder={t('profile.edit.lifestyle_placeholder')} options={lifestyleOptions.map(option=>({value:option.value,label:lifestyleLabel(t,option.value)}))} onChange={lifestyle=>update({lifestyle})}/>
  </div>
  <div id="edit-section-zodiac"><ZodiacField value={data.zodiac} onChange={zodiac=>update({zodiac})} t={t}/></div>
 </div>;
}
