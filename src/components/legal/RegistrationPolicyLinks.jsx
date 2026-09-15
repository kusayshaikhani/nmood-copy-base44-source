import {useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {Browser} from '@capacitor/browser';
import {getAppLink} from '@/lib/app-links';

export const REGISTRATION_POLICIES = [
  {path:'/terms',label:'Terms of Service'},
  {path:'/privacy',label:'Privacy Policy'},
  {path:'/community-guidelines',label:'Community Rules'},
];
export default function RegistrationPolicyLinks() {
  const [error,setError]=useState(false);
  const open=async(event,path)=>{
    if(!Capacitor.isNativePlatform())return;
    event.preventDefault();setError(false);
    try { await Browser.open({url:getAppLink(path)}); }
    catch { setError(true); }
  };
  return <nav aria-label="Policies" className="mt-4 text-sm">
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {REGISTRATION_POLICIES.map(({path,label})=><a key={path} href={path} target="_blank" rel="noopener noreferrer"
        onClick={event=>open(event,path)} className="inline-flex min-h-11 items-center underline text-foreground">{label}</a>)}
    </div>
    <p className="text-xs text-muted-foreground">Policies open separately so you can return to your form.</p>
    {error&&<p role="alert">The policy could not open. Please try the link again.</p>}
  </nav>;
}
