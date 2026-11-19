import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus } from 'lucide-react';

// A non-modal menu: no focus trap, inert layer, scroll lock or native selector.
export default function CoverPhotoMenu({ hasCover, disabled, onCamera, onChoose, onRemove }) {
 const [position,setPosition]=useState(null);
 const trigger=useRef(null),menu=useRef(null),fallbackButton=useRef(null),id=useId(),keyboardOpen=useRef(false);
 const focusSafely=element=>{try{element?.focus({preventScroll:true});}catch{/* Pointer actions remain usable if WebKit rejects focus. */}};
 const close=(restore=false)=>{setPosition(null);if(restore)focusSafely(trigger.current);};
 const locate=()=>{
  try{
   const rect=trigger.current.getBoundingClientRect();
   const viewport=window.visualViewport;
   const width=viewport?.width||window.innerWidth,height=viewport?.height||window.innerHeight;
   const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0;
   if(![rect.left,rect.bottom,rect.width].every(Number.isFinite)||rect.width<=0)throw new Error('Unavailable anchor');
   return {style:{left:Math.max(left+8,Math.min(rect.left,left+width-248)),top:Math.max(top+8,Math.min(rect.bottom+4,top+height-(hasCover?148:104)-8))},fallback:false};
  }catch{return {style:{left:8,top:80},fallback:true};}
 };
 const open=(keyboard=false)=>{if(disabled)return;keyboardOpen.current=keyboard;setPosition(locate());};
 const isOpen=!!position;
 useEffect(()=>{
  if(!isOpen)return;
  // Touch must not transfer focus: WebKit can scroll/blur as the menu opens.
  if(keyboardOpen.current)focusSafely(menu.current?.querySelector('[role="menuitem"]'));
  const frame=requestAnimationFrame(()=>{
   const element=menu.current;if(!element)return;
   const rect=element.getBoundingClientRect(),css=getComputedStyle(element);
   const hit=document.elementFromPoint?.(rect.left+Math.min(rect.width/2,24),rect.top+Math.min(rect.height/2,24));
   if(!rect.width||!rect.height||css.visibility==='hidden'||css.display==='none'||Number(css.opacity)===0||(hit&&!element.contains(hit))){
    setPosition(current=>current?{...current,fallback:true}:current);
   }
  });
  const outside=e=>{if(!menu.current?.contains(e.target)&&!trigger.current?.contains(e.target)&&!fallbackButton.current?.contains(e.target))setPosition(null);};
  const reposition=()=>setPosition(current=>current?locate():null);
  const escape=e=>{if(e.key==='Escape'){e.preventDefault();close(true);}};
  document.addEventListener('keydown',escape);
  document.addEventListener('pointerdown',outside);
  window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,true);
  const viewport=window.visualViewport;
  viewport?.addEventListener('resize',reposition);viewport?.addEventListener('scroll',reposition);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',reposition);window.removeEventListener('scroll',reposition,true);viewport?.removeEventListener('resize',reposition);viewport?.removeEventListener('scroll',reposition);};
 },[isOpen,hasCover]);
 useEffect(()=>{if(disabled)setPosition(null);},[disabled]);
 const choose=action=>{close(true);action();};
 const keyDown=e=>{
  if(e.key==='Escape'){e.preventDefault();close(true);return;}
  if(e.key==='Tab'){close(true);return;}
  const items=Array.from(menu.current.querySelectorAll('[role="menuitem"]'));
  const index=items.indexOf(document.activeElement);
  const next=e.key==='ArrowDown'?(index+1)%items.length:e.key==='ArrowUp'?(index-1+items.length)%items.length:e.key==='Home'?0:e.key==='End'?items.length-1:null;
  if(next!==null){e.preventDefault();focusSafely(items[next]);}
 };
 const itemClass='w-full min-h-11 px-3 text-left rounded-lg text-sm font-medium touch-manipulation hover:bg-muted focus-visible:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
 return <>
  <button ref={trigger} type="button" disabled={disabled} aria-haspopup="menu" aria-expanded={!!position} aria-controls={position?id:undefined}
   className="h-11 rounded-button inline-flex items-center justify-center gap-1.5 text-[13px] sm:text-sm font-semibold px-3 bg-card border border-border/70 text-foreground shadow-soft touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
   onClick={e=>position?close():open(e.detail===0)} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open(true);}}}>
   <ImagePlus aria-hidden="true" className="w-4 h-4"/>{hasCover?'Cover photo ▾':'Add cover photo'}
  </button>
  {position?.fallback&&<button ref={fallbackButton} type="button" className="min-h-11 px-3 rounded-button bg-card text-foreground underline" onClick={()=>choose(onChoose)}>Choose photo directly</button>}
  {position&&createPortal(<div ref={menu} id={id} role="menu" aria-label="Cover photo actions" onKeyDown={keyDown}
   onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget)&&e.relatedTarget!==trigger.current&&e.relatedTarget!==fallbackButton.current)close();}}
   style={position.style} className="fixed z-[100] w-60 max-w-[calc(100vw-16px)] rounded-xl border border-border bg-card p-2 text-foreground shadow-lg">
   <button type="button" role="menuitem" tabIndex={-1} className={itemClass} onClick={()=>choose(onCamera)}>Take cover photo</button>
   <button type="button" role="menuitem" tabIndex={-1} className={itemClass} onClick={()=>choose(onChoose)}>{hasCover?'Replace cover':'Choose cover'}</button>
   {hasCover&&<button type="button" role="menuitem" tabIndex={-1} className={`${itemClass} text-red-700`} onClick={()=>choose(onRemove)}>Remove cover</button>}
  </div>,document.body)}
 </>;
}
