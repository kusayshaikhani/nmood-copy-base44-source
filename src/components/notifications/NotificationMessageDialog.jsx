import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export default function NotificationMessageDialog({message,onClose,onExplore}) {
 return <Dialog open={!!message} onOpenChange={open=>{if(!open)onClose();}}>
  <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
   <DialogHeader><DialogTitle>{message?.title}</DialogTitle><DialogDescription>Message from Nmood</DialogDescription></DialogHeader>
   <p className="whitespace-pre-wrap break-words">{message?.description}</p>
   {message?._type==='welcome' && <button className="min-h-11 rounded-xl bg-primary p-3 text-primary-foreground" onClick={onExplore}>Start exploring</button>}
  </DialogContent>
 </Dialog>;
}
