import React,{useRef,useState} from 'react';
import {MoreHorizontal,Trash2} from 'lucide-react';
export default function SwipeConversationRow({children,eligible=false,disabled=false,onRemove,name='conversation'}){
 const start=useRef(null);const [open,setOpen]=useState(false);const swiped=useRef(false);
 return <div className="relative overflow-hidden rounded-2xl" onKeyDown={e=>{if(e.key==='Escape'){swiped.current=false;setOpen(false);}}}>
  {eligible&&open&&<button type="button" disabled={disabled} onClick={onRemove} aria-label={`Delete ${name} from my inbox`} className="absolute inset-y-0 right-0 w-24 bg-destructive text-destructive-foreground flex flex-col items-center justify-center gap-1 text-sm"><Trash2 aria-hidden size={20}/><span className="whitespace-nowrap font-medium">Delete</span></button>}
  <div className="relative bg-card transition-transform motion-reduce:transition-none" style={{transform:open&&eligible?'translateX(-96px)':undefined,touchAction:'pan-y'}}
   onPointerDown={e=>{start.current={x:e.clientX,y:e.clientY};swiped.current=false;}}
   onPointerUp={e=>{const p=start.current;start.current=null;if(!eligible||!p)return;const x=e.clientX-p.x,y=e.clientY-p.y;if(Math.abs(x)>50&&Math.abs(x)>Math.abs(y)){swiped.current=true;setOpen(x<0);}}}
   onPointerCancel={()=>{start.current=null;}}
   onClickCapture={e=>{if(swiped.current){e.preventDefault();e.stopPropagation();swiped.current=false;}}}>
   <div className={eligible?'pr-11':''}>{children}</div>
   {eligible&&<button type="button" disabled={disabled} aria-label={`Conversation actions for ${name}`} aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="absolute right-0 top-1/2 -translate-y-1/2 min-h-11 min-w-11 grid place-items-center"><MoreHorizontal aria-hidden size={20}/></button>}
  </div>
 </div>;
}
