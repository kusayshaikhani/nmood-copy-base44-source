import { useAuth } from '@/lib/AuthContext';
import React, { useState, useEffect, useRef } from 'react';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
export default function ReplyPreview({ message, onOpen, scope='private' }) {
  const {user}=useAuth();
  const sequence=useRef(0);
  useEffect(()=>{sequence.current++;setReference(null);setBusy(false);return()=>{sequence.current++;};},[user?.id,message.reply_to_id]);
  const [reference,setReference]=useState(null),[busy,setBusy]=useState(false);
  if (!message.reply_to_id) return null;
  return <><button type="button" disabled={busy} aria-label="Open referenced message"
    className="block w-full mb-1 px-2 py-1 text-start rounded border-s-2 border-current text-xs opacity-80 truncate"
    onClick={async event => {
      event.stopPropagation();
      if(onOpen?.(message.reply_to_id))return;
      if(!user?.id)return;
      const attempt=++sequence.current;
      setBusy(true);
      try { const value=await callSupabaseRpc('nmood_get_message_reference',{p_scope:scope,p_message_id:message.reply_to_id},{expectedUserId:user.id});if(attempt!==sequence.current)return;setReference({text:typeof value?.text==='string'?value.text:'Message unavailable',edited:!!value?.edited_at}); }
      catch {if(attempt===sequence.current)setReference({text:'Message unavailable'});}finally{if(attempt===sequence.current)setBusy(false);}
    }}>
    ↩ {message.reply_available ? message.reply_to_text : 'View referenced message'}
  </button><Dialog open={!!reference} onOpenChange={open=>!open&&setReference(null)}><DialogContent onClick={e=>e.stopPropagation()}>
    <DialogTitle>Referenced message</DialogTitle><p className="break-words">{reference?.text}</p>{reference?.edited&&<span>Edited</span>}
  </DialogContent></Dialog></>;
}
