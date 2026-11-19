import React, {useEffect,useState} from 'react';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {Switch} from '@/components/ui/switch';
export default function EmailDeliverySettings({memberId}) {
 const [prefs,setPrefs]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;setPrefs(null);setError('');if(memberId)callSupabaseRpc('nmood_email_preferences',{p_preferences:null}).then(v=>{if(active)setPrefs(v);}).catch(()=>{if(active)setError('Email preferences are unavailable. Please try again later.');});return()=>{active=false;};},[memberId]);
 const save=async(key,value)=>{setBusy(true);setError('');try{setPrefs(await callSupabaseRpc('nmood_email_preferences',{p_preferences:{[key]:value}}));}catch{setError('Your email choice could not be saved.');}finally{setBusy(false);}};
 return <div className="px-4 py-3 space-y-3"><p className="text-sm text-muted-foreground">Email categories follow your email-notification setting above. Marketing is optional and includes an unsubscribe link. Saved choices apply when email delivery is available.</p>{prefs&&[['email_welcome','Welcome email'],['email_activity','Activity notification emails'],['email_marketing','Marketing and announcement emails']].map(([key,label])=><label key={key} className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><Switch checked={prefs[key]===true} disabled={busy} onCheckedChange={v=>save(key,v)}/></label>)}{error&&<p role="status" className="text-sm">{error}</p>}</div>;
}
