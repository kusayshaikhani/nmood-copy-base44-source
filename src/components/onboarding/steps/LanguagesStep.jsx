import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import LanguagesSelect from '@/components/profile/LanguagesSelect';
export default function LanguagesStep({data,update,onNext}) {
 const [error,setError]=useState('');
 return <div className="space-y-5">
  <LanguagesSelect value={data.languages||[]} onChange={languages=>{update({languages});setError('');}} />
  {error&&<p role="alert">{error}</p>}
  <Button className="h-12 w-full" onClick={()=>{if(!data.languages?.length){setError('Choose at least one language.');return;}onNext();}}>Continue</Button>
 </div>;
}
