import React from 'react';
import { HOME_LAYOUT } from './home-layout';

export default function HomeSkeleton(){
 return <div role="status" aria-label="Loading Home" className="min-h-screen bg-background">
  <span className="sr-only">Loading Home…</span>
  <div aria-hidden="true" className="animate-pulse">
   <div className="h-60 bg-nmood-gradient"/>
   <div className={`relative -mt-8 rounded-t-[32px] bg-card pt-6 pb-28 ${HOME_LAYOUT.pagePadding} ${HOME_LAYOUT.sections}`}>
    {Array.from({length:4},(_,i)=><div key={i}><div className="mb-3 h-5 w-32 rounded bg-muted"/><div className="flex gap-2 overflow-hidden">{Array.from({length:3},(_,j)=><div key={j} className={`${HOME_LAYOUT.card} h-48 rounded-2xl bg-muted`}/>)}</div></div>)}
   </div>
  </div>
 </div>;
}
