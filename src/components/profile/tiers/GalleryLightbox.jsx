import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {motion, useReducedMotion} from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { normalizeGallery } from '@/lib/gallery-normalizer';
import { clampZoom, IDENTITY_ZOOM, swipeDirection } from '@/lib/profile-media-gestures';

/** Uses only the same authorized image list as the hero. No URL/path discovery. */
export default function GalleryLightbox({photos,startIndex=0,open,onClose,onPhotoError,triggerRef,displayName,tapToClose=false,minimal=false}) {
 const items=useMemo(()=>normalizeGallery(photos,displayName||''),[photos,displayName]);
 const count=items.length;
 const reduce=useReducedMotion();
 const [dragX,setDragX]=useState(0),[direction,setDirection]=useState(0);
 const [index,setIndex]=useState(startIndex),[load,setLoad]=useState('loading'),[attempt,setAttempt]=useState(0);
 const [zoom,setZoom]=useState(IDENTITY_ZOOM); const zoomRef=useRef(IDENTITY_ZOOM);
 const dialog=useRef(null),stage=useRef(null),image=useRef(null),closeButton=useRef(null),gesture=useRef(null),tapMoved=useRef(false);
 const latest=useRef({onClose,triggerRef});latest.current={onClose,triggerRef};
 const safeIndex=Math.min(Math.max(0,index),Math.max(0,count-1)); const current=items[safeIndex];
 const setView=useCallback(value=>{zoomRef.current=value;setZoom(value);},[]);
 useEffect(()=>{if(open)setIndex(Math.min(Math.max(0,startIndex),Math.max(0,count-1)));},[open,startIndex,count]);
 useEffect(()=>{setView(IDENTITY_ZOOM);gesture.current=null;setLoad('loading');},[current?.src,open,setView]);
 useEffect(()=>{
  if(!open||!current)return;
  let active=true;setLoad('loading');const img=new Image();
  img.onload=()=>{if(active)setLoad('ready');};img.onerror=()=>{if(active)setLoad('failed');};img.src=current.src;
  return()=>{active=false;img.onload=null;img.onerror=null;};
 },[open,current?.src,attempt]);
 const navigate=useCallback(direction=>{if(count>1){setDirection(direction);setDragX(0);setView(IDENTITY_ZOOM);setIndex(i=>(i+direction+count)%count);}},[count,setView]);
 const navRef=useRef(navigate);navRef.current=navigate;
 useEffect(()=>{
  if(!open||!count)return;
  const previous=document.activeElement,oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';closeButton.current?.focus();
  const key=event=>{
   if(event.key==='Escape'){event.preventDefault();latest.current.onClose?.();}
   else if(event.key==='ArrowLeft'){event.preventDefault();navRef.current(-1);}
   else if(event.key==='ArrowRight'){event.preventDefault();navRef.current(1);}
   else if(event.key==='Tab'){
    const buttons=[...dialog.current.querySelectorAll('button:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);
    if(event.shiftKey&&(document.activeElement===first||!dialog.current.contains(document.activeElement))){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!dialog.current.contains(document.activeElement))){event.preventDefault();first?.focus();}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=oldOverflow;const target=latest.current.triggerRef?.current||previous;if(target?.isConnected)target.focus();};
 },[open,!!count]);
 const bounds=(scale,x,y)=>clampZoom(scale,x,y,image.current?.offsetWidth||stage.current?.clientWidth||0,image.current?.offsetHeight||stage.current?.clientHeight||0);
 const center=touches=>({x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2});
 const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
 const start=event=>{
  if(event.target.closest?.('button'))return;
  const points=event.touches;
  tapMoved.current=false;
  if(points.length===2){gesture.current={mode:'pinch',distance:Math.max(1,distance(points)),center:center(points),view:zoomRef.current};}
  else if(points.length===1){gesture.current={mode:zoomRef.current.scale>1?'pan':'swipe',x:points[0].clientX,y:points[0].clientY,view:zoomRef.current};}
 };
 const move=event=>{
  const g=gesture.current,points=event.touches;if(!g)return;
  if(g.mode==='pinch'&&points.length===2){tapMoved.current=true;const c=center(points);setView(bounds(g.view.scale*distance(points)/g.distance,g.view.x+c.x-g.center.x,g.view.y+c.y-g.center.y));}
  else if(g.mode==='swipe'&&points.length===1){const dx=points[0].clientX-g.x,dy=points[0].clientY-g.y;if(Math.abs(dx)>8||Math.abs(dy)>8)tapMoved.current=true;if(Math.abs(dx)>Math.abs(dy))setDragX(dx);}
  else if(g.mode==='pan'&&points.length===1){tapMoved.current=true;setView(bounds(g.view.scale,g.view.x+points[0].clientX-g.x,g.view.y+points[0].clientY-g.y));}
 };
 const end=event=>{
  if(event.touches?.length)return;
  const g=gesture.current;gesture.current=null;setDragX(0);
  if(g?.mode==='swipe'&&zoomRef.current.scale===1&&event.changedTouches?.[0]){const p=event.changedTouches[0],direction=swipeDirection(p.clientX-g.x,p.clientY-g.y);if(direction)navigate(direction);}
 };
 const toggleZoom=()=>setView(zoomRef.current.scale>1?IDENTITY_ZOOM:bounds(2,0,0));
 const closeOnTap=event=>{
  if (!tapToClose) return;
  if (tapMoved.current) { tapMoved.current=false; return; }
  onClose?.();
 };
 if(!open||!count)return null;
 return createPortal(<div ref={dialog} role="dialog" aria-modal="true" aria-label="Profile photos" className="fixed inset-0 z-[200] flex h-[100dvh] flex-col overflow-hidden bg-[#080810] text-white" style={{touchAction:'none',overscrollBehavior:'none'}} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={()=>{gesture.current=null;setDragX(0);}}>
  {!minimal && <header className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
   <span role="status" aria-live="polite" className="text-sm tabular-nums">{safeIndex+1} of {count}</span>
   <button ref={closeButton} type="button" onClick={()=>onClose?.()} aria-label="Close" className="flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={18}/>Close</button>
  </header>}
  <div ref={stage} data-testid="photo-stage" className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-4" onClick={closeOnTap} onDoubleClick={tapToClose ? undefined : toggleZoom}>
   {load==='loading'&&<span aria-label="Loading photo" className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white motion-safe:animate-spin"/>}
   {load==='failed'&&!minimal&&<div className="flex flex-col items-center gap-3 text-white/70"><ImageIcon size={36}/><p>Image unavailable</p><button type="button" className="min-h-11 rounded-full border border-white/25 px-5" onClick={()=>setAttempt(n=>n+1)}>Try again</button></div>}
   {load==='ready'&&<motion.img key={current.src} initial={{x:reduce?0:direction*80,opacity:reduce?1:0}} animate={{x:zoom.x+dragX,y:zoom.y,scale:zoom.scale,opacity:1}} transition={{duration:reduce||gesture.current?0:0.25,ease:[0.22,1,0.36,1]}} ref={image} src={current.src} alt={current.alt} draggable={false} onError={()=>{onPhotoError?.(current.src);setLoad('failed');}} className="max-h-full max-w-full select-none object-contain" style={{transformOrigin:'center',willChange:'transform'}}/>}
  </div>
  {!minimal && <footer className="z-10 shrink-0 space-y-2 border-t border-white/10 bg-[#080810] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
   <div className="flex items-center justify-center gap-4">
    {count>1&&<button type="button" aria-label="Previous" onClick={()=>navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><ChevronLeft size={22}/></button>}
    <button type="button" disabled={load!=='ready'} aria-label={zoom.scale>1?'Reset zoom':'Zoom in'} onClick={toggleZoom} className="flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm disabled:opacity-40">{zoom.scale>1?<ZoomOut size={18}/>:<ZoomIn size={18}/>} {zoom.scale>1?'Reset zoom':'Zoom in'}</button>
    {count>1&&<button type="button" aria-label="Next" onClick={()=>navigate(1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><ChevronRight size={22}/></button>}
   </div>
   <p className="text-center text-xs text-white/60">{zoom.scale>1?'Drag to move · Pinch to zoom out':count>1?'Swipe for more · Pinch to zoom':'Pinch to zoom'}</p>
  </footer>}
 </div>,document.body);
}
