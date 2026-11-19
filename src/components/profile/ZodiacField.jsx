import { PROFILE_FIELD_CLASS } from './profile-field-style';
import React from 'react';
import { ZODIAC_SIGNS, zodiacLabel } from '@/lib/looking-for-tags';

// Native selection avoids a portalled nullable option inside the profile sheet.
// Unknown legacy values are never converted into a label or written implicitly.
export default function ZodiacField({value, onChange, t}) {
 return <>
  <label className="block text-sm font-medium mb-2" htmlFor="profile-zodiac">{t('profile.edit.zodiac')}</label>
  <select id="profile-zodiac" className={`${PROFILE_FIELD_CLASS} text-left`}
   value={ZODIAC_SIGNS.includes(value) ? value : ''}
   onChange={event => {
    const next = event.target.value;
    if (next !== '' && !ZODIAC_SIGNS.includes(next)) return;
    const apply = () => onChange(next);
    if (window.NmoodRecovery) window.NmoodRecovery.trace('PROFILE-ZODIAC', apply);
    else apply();
   }}>
   <option value="">{t('profile.edit.zodiac_none')}</option>
   {ZODIAC_SIGNS.map(sign => <option key={sign} value={sign}>{zodiacLabel(t, sign)}</option>)}
  </select>
 </>;
}
