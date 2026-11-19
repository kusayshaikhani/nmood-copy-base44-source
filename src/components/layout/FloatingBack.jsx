import React from 'react';
import {useLocation} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {useSafeBack} from '@/lib/safe-navigation';
import {useGuardedCallback} from '@/lib/use-guarded-back';
export const ROOT_TABS=['/','/explore','/nmood','/communities','/messages','/inmood','/inmood-v2'];
export function backFallback(path){
 if(path.startsWith('/messages/'))return '/messages';
 if(path === '/circles' || path === '/experiences')return '/explore';
 if(path === '/memories' || path === '/journey' || path === '/goals' || path === '/host' || path === '/calendar' || path === '/saved' || path === '/pals' || path === '/safety-center')return '/nmood';
 if(/^\/(circle|experience|community)/.test(path))return '/communities';
 if(/^\/(pal|discover|new-to)/.test(path))return '/explore';
 if(/^\/(settings|membership|account|edit)/.test(path))return '/profile';
 return '/';
}
// Reserved shell row stays outside scroll/transition containers: no overlay on
// Connect/Report/Block or bottom actions. Dialog portals remain above this row.
export default function FloatingBack(){
 const location=useLocation();const back=useSafeBack(backFallback(location.pathname));
 const go=useGuardedCallback(back,location.key);
 if(ROOT_TABS.includes(location.pathname))return null;
 return <nav aria-label="Back navigation" className="relative z-30 shrink-0 px-3 py-1" style={{paddingTop:'max(4px, env(safe-area-inset-top))',paddingLeft:'max(12px, env(safe-area-inset-left)'}}>
  <button type="button" aria-label="Back" onClick={go} className="inline-flex min-h-11 min-w-11 items-center justify-center bg-transparent text-foreground focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft aria-hidden="true" size={20}/></button>
 </nav>;
}
