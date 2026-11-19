import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import InterestsFields, {MIN_INTERESTS,MAX_INTERESTS} from '@/components/profile/InterestsFields';
export default function InterestsStep({data,update,onNext}) {
 const [error,setError]=useState('');
 return <div className="space-y-5">
  <InterestsFields data={data} update={patch=>{update(patch);setError('');}} errors={{interests:error}}/>
  <Button className="w-full h-12" onClick={()=>{
   if(!Array.isArray(data.interests)||data.interests.length<MIN_INTERESTS||data.interests.length>MAX_INTERESTS){setError('Choose between 3 and 5 interests.');return;}
   onNext();
  }}>Continue</Button>
 </div>;
}
