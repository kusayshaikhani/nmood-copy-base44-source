import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ProfileLocationFields from '@/components/profile/ProfileLocationFields';
import { getCountry } from '@/lib/master-data';
import { detectLocaleSettings } from '@/lib/master-data/detect-locale-settings';
export function buildManualLocationPatch(countryKey, city) {
  const country = getCountry(countryKey);
  const normalizedCity = typeof city === 'string' ? city.trim() : '';
  if (!country || !normalizedCity) return null;

  return {
    country: country.key,
    country_code: country.key.toUpperCase(),
    state: '',
    city: normalizedCity,
    latitude: null,
    longitude: null,
    location_enabled: false,
    timezone: detectLocaleSettings().timezone,
  };
}


export default function LocationStep({data,update,onNext}) {
 const [error,setError]=useState('');
 return <div className="space-y-5">
  <ProfileLocationFields onboarding data={data} update={update}/>
  {error&&<p role="alert">{error}</p>}
  <Button className="w-full h-12" onClick={()=>{if(!data.country||!data.city?.trim()){setError('Choose your country and enter your city.');return;}onNext();}}>Continue</Button>
 </div>;
}
