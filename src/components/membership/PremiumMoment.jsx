import React, {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Sparkles,X} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {useMembershipAccess} from './MembershipProvider';
import {MAIN_PASSPORT} from '@/lib/passport/enabled';
import {claimPremiumMoment,PREMIUM_MOMENTS} from '@/lib/premium-prompt-policy';

export function PremiumMomentCard({moment,onDismiss}) {
 const copy=PREMIUM_MOMENTS[moment];
 return <aside aria-label="Explore Premium" className="relative min-w-0 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] to-card p-4 text-foreground sm:p-5">
  <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles size={19} aria-hidden="true"/></span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-primary">Nmood Premium</p><h3 className="mt-1 text-base font-semibold leading-snug">{copy.title}</h3></div><button type="button" aria-label="Dismiss Premium suggestion" onClick={onDismiss} className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"><X size={18}/></button></div>
  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
  <div className="mt-4 flex flex-wrap gap-2"><Link to="/upgrade" onClick={onDismiss} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Explore Premium</Link><button type="button" onClick={onDismiss} className="min-h-11 rounded-xl px-4 text-sm font-medium">{moment==='limit'?'I’ll wait':'Not now'}</button></div>
 </aside>;
}
export default function PremiumMoment({moment,intent=true,eligible=undefined}) {
 const {user}=useAuth();const {isPremium,entitlementState}=useMembershipAccess();
 const [shown,setShown]=useState(null);
 const allowed=MAIN_PASSPORT && intent && !!user?.id && !isPremium && entitlementState==='explorer' && eligible!==false;
 useEffect(()=>{
  if(allowed){let storage;try{storage=window.localStorage;}catch{return;}
   if(claimPremiumMoment(storage,user.id,moment))setShown(`${user.id}:${moment}`);
  }
 },[allowed,user?.id,moment]);
 if(!allowed||shown!==`${user?.id}:${moment}`)return null;
 return <PremiumMomentCard moment={moment} onDismiss={()=>setShown(null)}/>;
}
