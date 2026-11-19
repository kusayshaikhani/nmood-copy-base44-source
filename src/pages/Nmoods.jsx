import {ShareInvitations} from '@/components/nmoods/ShareAccess';
import ContractSearch from '@/components/discover/ContractSearch';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React,{useMemo,useState} from 'react';
import {Plus,Sparkles} from 'lucide-react';
import PublishedNmoodCard from '@/components/nmoods/PublishedNmoodCard';
import NmoodCardSkeleton from '@/components/nmoods/NmoodCardSkeleton';
import NmoodFilterChips from '@/components/nmoods/NmoodFilterChips';
import CreateNmoodFlow from '@/components/nmoods/CreateNmoodFlow';
import EmptyState from '@/components/shared/EmptyState';
import {useNmoodPosts} from '@/lib/nmood-posts';
import {filterNmoods} from '@/lib/nmoods-data';
import {useLocalization} from '@/lib/i18n/useLocalization';

const PAGE_SIZE=24;
function LegacyNmoods(){
 const {t}=useLocalization();const [activeChip,setActiveChip]=useState('all');const [showShare,setShowShare]=useState(false);const [visible,setVisible]=useState(PAGE_SIZE);
 const {posts,loading,error,unavailable,refresh}=useNmoodPosts();
 const filtered=useMemo(()=>filterNmoods(posts,activeChip),[posts,activeChip]);const shown=filtered.slice(0,visible);
 const changeFilter=value=>{setActiveChip(value);setVisible(PAGE_SIZE);};
 return <div className="min-h-screen bg-background nav-safe-bottom">
  <div className="border-b border-border/30 bg-background px-5 pb-3 pt-4"><div className="flex items-start justify-between gap-2"><div><h1 className="text-2xl font-bold tracking-tight">{t('nmoods.title')}</h1><p className="text-sm text-muted-foreground">{t('nmoods.subtitle')}</p></div><button type="button" onClick={()=>setShowShare(true)} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-nmood-cta px-4 text-sm font-semibold text-primary-foreground shadow-card"><Plus className="h-4 w-4"/><span>{t('nmoods.share')}</span></button></div></div>
  <ShareInvitations/><NmoodFilterChips active={activeChip} onChange={changeFilter}/>
  <div className="px-5 pt-4 pb-28">
   {loading?<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{[0,1,2,3].map(i=><NmoodCardSkeleton key={i}/>)}</div>:unavailable?<div role="status"><p>Sharing Nmoods is not available in this rehearsal build yet.</p></div>:error?<div role="alert"><p>Nmoods could not be loaded.</p><button className="min-h-11" onClick={()=>refresh()}>Try again</button></div>:filtered.length===0?<EmptyState icon={Sparkles} title={t('nmoods.empty.title')} description={t('nmoods.empty.desc')} actionLabel={t('nmoods.empty.cta')} onAction={()=>setShowShare(true)}/>:<><div className="discovery-grid">{shown.map((post,index)=><PublishedNmoodCard key={post.id} post={post} index={index}/>)}</div>{shown.length<filtered.length&&<button type="button" className="mx-auto mt-5 flex min-h-11 rounded-xl border px-5 font-semibold text-primary" onClick={()=>setVisible(n=>n+PAGE_SIZE)}>Load more Nmoods</button>}</>}
  </div><CreateNmoodFlow open={showShare} onClose={()=>setShowShare(false)}/>
 </div>;
}

export default function Nmoods(){
 const [open,setOpen]=useState(false);
 if(!MAIN_PASSPORT)return <LegacyNmoods/>;
 return <><ShareInvitations/><ContractSearch initialKind="posts" lockedKind actionBelowHeader={<div className="flex"><button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm" onClick={()=>setOpen(true)}>Share Nmood</button></div>} /><CreateNmoodFlow open={open} onClose={()=>setOpen(false)}/></>;
}
