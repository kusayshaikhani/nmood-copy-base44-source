import React, {useEffect,useRef,useState} from 'react';
import {MoreHorizontal,Trash2} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {HardDeleteProvider,useHardDelete} from './HardDeleteProvider';
import BottomSheet from '@/components/shared/BottomSheet';
function Action({entity,id,onDeleted}) {
 const {requestHardDelete}=useHardDelete();
 const noun=entity.endsWith('Message')?'message':'item';
 const anchor=useRef(null);const [open,setOpen]=useState(false);
 useEffect(()=>{
  const target=anchor.current?.closest('[id^="message-"]');if(!target)return;
  let timer;let start;let held=false;
  const cancel=()=>{clearTimeout(timer);start=null;};
  const down=event=>{
   if(event.pointerType==='mouse'||event.target.closest('button,a,input,textarea,audio'))return;
   // Own this gesture for administrators, avoiding a second reply/action sheet.
   cancel();event.stopPropagation();start={x:event.clientX,y:event.clientY};held=false;
   timer=setTimeout(()=>{held=true;setOpen(true);},500);
  };
  const move=event=>{if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>10)cancel();};
  const click=event=>{if(held){event.preventDefault();event.stopPropagation();held=false;}};
  target.addEventListener('pointerdown',down,true);target.addEventListener('pointermove',move,true);
  target.addEventListener('pointerup',cancel,true);target.addEventListener('pointercancel',cancel,true);target.addEventListener('click',click,true);
  return()=>{cancel();target.removeEventListener('pointerdown',down,true);target.removeEventListener('pointermove',move,true);target.removeEventListener('pointerup',cancel,true);target.removeEventListener('pointercancel',cancel,true);target.removeEventListener('click',click,true);};
 },[]);
 return <span ref={anchor} onClick={event=>event.stopPropagation()}>
  <button type="button" aria-label={`Administrator ${noun} actions`} onClick={()=>setOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"><MoreHorizontal size={18}/></button>
  <BottomSheet open={open} onOpenChange={setOpen} title={noun==='message'?'Message actions':'Item actions'}>
   <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl p-3 text-destructive" onClick={async()=>{
    setOpen(false);const result=await requestHardDelete({entity,id,title:`Permanently delete this ${noun}?`});if(result?.ok)onDeleted?.();
   }}><Trash2 size={18}/>Delete permanently…</button>
  </BottomSheet>
 </span>;
}
export default function AdminDeleteAction(props) {
 const {user}=useAuth();if(!['admin','founder'].includes(user?.role))return null;
 return <HardDeleteProvider><Action {...props}/></HardDeleteProvider>;
}
