import React, { useEffect, useMemo, useRef, useState } from 'react';
import {imagePresentation,applyImagePresentation} from '@/lib/profile-image-presentation';
import { Images, ImageIcon, Expand } from 'lucide-react';
import { normalizeGallery, normalizeImageUrl } from '@/lib/gallery-normalizer';
import GalleryLightbox from './tiers/GalleryLightbox';

// Inputs must already be authorized/signed by the existing profile/cover APIs.
// This component never reads storage, guesses paths or fetches another profile.
export function ProfileMediaImage({ src, alt, className = '', initials = '' }) {
 const [state,setState]=useState('loading');
 useEffect(()=>setState('loading'),[src]);
 return <span className={`relative block overflow-hidden bg-white/10 ${className}`}>
  {src && state!=='failed' && <img src={src} alt={alt} style={imagePresentation(src)} onLoad={event=>{applyImagePresentation(event,src);setState('ready');}} onError={()=>setState('failed')} draggable={false} className={`h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${state==='ready'?'opacity-100':'opacity-0'}`}/>}
  {(!src||state!=='ready') && <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-400/20 to-slate-900/30" aria-label={src&&state==='loading'?'Loading photo':src?'Photo unavailable':'No profile photo'}>
   {src&&state==='loading'?<span className="h-6 w-6 rounded-full border-2 border-white/25 border-t-white motion-safe:animate-spin"/>:initials?<span className="text-4xl font-semibold text-white/90">{initials}</span>:<ImageIcon className="h-6 w-6 text-white/60"/>}
  </span>}
 </span>;
}
export default function ProfileMediaHeader({ coverUrl, coverLoading=false, avatarUrl, gallery=[], displayName, age, location, badge, verified, indicators, sharedInterestNote }) {
 const cover=normalizeImageUrl(coverUrl), avatar=normalizeImageUrl(avatarUrl);
 const photos=useMemo(()=>normalizeGallery([...new Set([cover,avatar,...gallery.map(item=>normalizeImageUrl(item))].filter(Boolean))],displayName),[cover,avatar,gallery,displayName]);
 const [selected,setSelected]=useState(null); const trigger=useRef(null);
 const open=(src,event)=>{trigger.current=event.currentTarget;setSelected(src);};
 const index=photos.findIndex(photo=>photo.src===selected);
 const title=displayName||'Member';
 return <section aria-label="Profile spotlight" className="relative isolate w-full min-w-0 overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-[0_18px_48px_-20px_rgba(46,16,101,.55)]">
  <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#4c328c] via-[#292047] to-[#15192e]"/>
  {cover && <button type="button" aria-label="Open cover photo" onClick={event=>open(cover,event)} className="absolute inset-0 -z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"><ProfileMediaImage key={cover} src={cover} alt="Profile cover" className="h-full w-full"/></button>}
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/10 via-slate-950/60 to-[#171329]/95"/>
  <div className="pointer-events-none flex min-h-[124px] items-start justify-end p-4 pt-[max(1rem,env(safe-area-inset-top))]">
   {cover && <button type="button" onClick={event=>open(cover,event)} aria-label="View cover full screen" className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 text-xs font-medium backdrop-blur-md"><Expand size={15}/>View cover</button>}
   {!cover&&coverLoading&&<span className="text-xs text-white/70">Loading cover…</span>}
  </div>
  <div className="pointer-events-none relative px-5 pb-5 sm:px-6">
   <div className="flex min-w-0 items-end gap-4">
    <button type="button" disabled={!avatar} aria-label={avatar?'Open profile photo':'No profile photo'} onClick={event=>open(avatar,event)} className="pointer-events-auto w-[104px] shrink-0 overflow-hidden rounded-[22px] border-[3px] border-white/85 bg-slate-800 shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-32">
     <ProfileMediaImage key={avatar||'empty'} src={avatar} alt={title} initials={title.charAt(0)} className="aspect-[4/5] w-full"/>
    </button>
    <div className="min-w-0 flex-1 pb-1 [overflow-wrap:anywhere]">
     <div className="mb-2 flex flex-wrap gap-2 text-xs">{badge}</div>
     <h1 className="text-[26px] font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl">{title}{age!=null?`, ${age}`:''}</h1>
     {verified&&<div className="mt-2">{verified}</div>}
     {location&&<p className="mt-2 text-sm leading-relaxed text-white/85">{location}</p>}
    </div>
   </div>
   <div className="pointer-events-auto mt-4 text-white/90 [&_a]:text-white [&_a]:underline [&_span]:text-inherit">{indicators}</div>
   {photos.length>0 && <div className="pointer-events-auto mt-5 border-t border-white/15 pt-4">
    <div className="mb-3 flex items-center justify-between gap-2 text-xs text-white/80"><span className="flex items-center gap-2"><Images size={15}/>{photos.length} {photos.length===1?'photo':'photos'}</span><span>{photos.length>1?'Swipe to browse · Tap to expand':'Tap to expand'}</span></div>
    <div aria-label="Profile photos" className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain rounded-xl pb-2 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
     {photos.map((photo,i)=><button type="button" key={photo.src} aria-label={`Open photo ${i+1} of ${photos.length}`} onClick={event=>open(photo.src,event)} className="h-[88px] w-[72px] shrink-0 snap-start overflow-hidden rounded-[14px] border border-white/25 bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"><ProfileMediaImage src={photo.src} alt={photo.alt} className="h-full w-full"/></button>)}
    </div>
   </div>}
   {!photos.length&&<p className="mt-4 text-xs text-white/65">No photos to show yet.</p>}
   {sharedInterestNote&&<p className="mt-3 text-xs leading-relaxed text-white/80">{sharedInterestNote}</p>}
  </div>
  <GalleryLightbox photos={photos} startIndex={Math.max(0,index)} open={index>=0} onClose={()=>setSelected(null)} triggerRef={trigger} displayName={title}/>
 </section>;
}
