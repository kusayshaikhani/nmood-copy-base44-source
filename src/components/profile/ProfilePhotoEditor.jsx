import React, {useEffect, useRef, useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {withImageCrop} from '@/lib/profile-image-presentation';
import {Button} from '@/components/ui/button';
import {ImagePlus, Trash2} from 'lucide-react';
import NativePhotoInput from '@/components/media/NativePhotoInput';
import {getSupabaseSession, uploadProfilePhoto} from '@/api/supabaseClient';
import {updateMemberProfile} from '@/lib/member-update';
import {validateImageFile} from '@/lib/upload-security';
import {withTimeout} from '@/lib/bounded-operation';

// Only the authenticated owner's existing profile writer is used. Removing the
// avatar removes its profile reference; it does not delete a gallery object.
export default function ProfilePhotoEditor({member, onSaved}) {
 const client=useQueryClient(), input=useRef(null), pending=useRef(null), lock=useRef(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[confirm,setConfirm]=useState(false),[retry,setRetry]=useState(false);
 const [crop,setCrop]=useState(null);
 useEffect(()=>()=>{if(crop?.preview)URL.revokeObjectURL(crop.preview);},[crop?.preview]);
 const controller=useRef(new AbortController());
 useEffect(()=>{controller.current=new AbortController();return()=>controller.current.abort();},[]);
 const owner=member?.id;
 const assertOwner=()=>{if(!owner||controller.current.signal.aborted||getSupabaseSession()?.user?.id!==owner)throw Error('Session changed');};
 const run=async()=>{
  if(lock.current)return;
  lock.current=true;setBusy(true);setRetry(false);setMessage('Saving profile photo…');
  try {
   assertOwner();const task=pending.current;
   const options={expectedUserId:owner,signal:controller.current.signal};
   if(task.file&&!task.url){const original=await withTimeout(signal=>uploadProfilePhoto(task.file,{...options,signal}),60000);task.url=withImageCrop(original,task.crop);}
   assertOwner();
   const result=await updateMemberProfile({photo_url:task.url??null},options);
   assertOwner();
   if(result?.id!==owner||(result.photo_url??null)!==(task.url??null))throw Error('Photo save unconfirmed');
   await withTimeout(()=>onSaved?.(result));assertOwner();
   await client.invalidateQueries();
   window.dispatchEvent(new Event('nmood:refresh'));
   pending.current=null;setConfirm(false);setMessage(task.url?'Profile photo updated.':'Profile photo removed.');
  } catch {if(!controller.current.signal.aborted){setRetry(true);setMessage('Photo could not be confirmed. Check your connection and retry. Your selection is kept.');}}
  finally {lock.current=false;if(!controller.current.signal.aborted)setBusy(false);}
 };
 const select=event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file||lock.current)return;
  const valid=validateImageFile(file,{maxMb:8,allowedTypes:['image/jpeg','image/png','image/webp']});
  if(!valid.ok||!file.size||(!file.type&&!/\.(jpe?g|png|webp)$/i.test(file.name))){setMessage('Choose a JPG, PNG or WebP image up to 8 MB.');return;}
  setCrop({file,preview:URL.createObjectURL(file),x:50,y:25,ready:false});
 };
 return <div className="mt-3 text-center space-y-2">
 <div className="flex flex-wrap justify-center gap-3">
  <Button type="button" variant="outline" disabled={busy||!!crop} className="min-h-11 whitespace-normal" onClick={()=>input.current?.click()}><ImagePlus aria-hidden="true"/>{member?.photo_url?'Replace profile photo':'Choose profile photo'}</Button>
  {member?.photo_url&&<Button type="button" variant="outline" disabled={busy||!!crop} className="min-h-11 whitespace-normal" onClick={()=>setConfirm(true)}><Trash2 aria-hidden="true"/>Remove profile photo</Button>}
 </div>
  {crop&&<section role="region" aria-label="Adjust profile photo" className="rounded-2xl border bg-card p-4 space-y-4">
   <h3 className="font-semibold">Adjust profile photo</h3>
   <p className="text-sm text-muted-foreground">Move the photo to keep your face visible. Your original photo is preserved.</p>
   <div className="flex flex-wrap items-center justify-center gap-4">
    <img src={crop.preview} alt="Card crop preview" className="h-[150px] w-[240px] max-w-full rounded-xl" style={{objectFit:'cover',objectPosition:`${crop.x}% ${crop.y}%`,imageOrientation:'from-image'}} onLoad={event=>{const portrait=event.currentTarget.naturalHeight>event.currentTarget.naturalWidth;setCrop(c=>c?{...c,ready:true,y:c.ready?c.y:portrait?25:50}:c);}} onError={()=>{setCrop(c=>c?{...c,ready:false,error:true}:c);}}/>
    <img src={crop.preview} alt="Avatar crop preview" className="h-24 w-24 rounded-full" style={{objectFit:'cover',objectPosition:`${crop.x}% ${crop.y}%`,imageOrientation:'from-image'}}/>
   </div>
   {crop.error&&<p role="alert">This image could not be opened. Choose another photo.</p>}
   <label className="block text-sm">Horizontal position<input className="block w-full min-h-11" type="range" min="0" max="100" value={crop.x} onChange={event=>setCrop(c=>({...c,x:Number(event.target.value)}))}/></label>
   <label className="block text-sm">Vertical position<input className="block w-full min-h-11" type="range" min="0" max="100" value={crop.y} onChange={event=>setCrop(c=>({...c,y:Number(event.target.value)}))}/></label>
   <div className="flex flex-wrap justify-center gap-3"><Button type="button" disabled={busy||!crop.ready||crop.error} onClick={()=>{pending.current={file:crop.file,crop:{x:crop.x,y:crop.y}};setCrop(null);void run();}}>Save profile photo</Button><Button type="button" variant="outline" onClick={()=>setCrop(null)}>Cancel crop</Button></div>
  </section>}
  {confirm&&<div role="alertdialog" aria-label="Remove profile photo"><p>Remove your profile photo?</p><button type="button" disabled={busy} className="min-h-11 px-3" onClick={()=>{pending.current={url:null};void run();}}>Confirm remove</button><button type="button" disabled={busy} className="min-h-11 px-3" onClick={()=>setConfirm(false)}>Cancel</button></div>}
  <NativePhotoInput ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo file" className="hidden" disabled={busy} onChange={select} onPickerError={setMessage}/>
  {message&&<p role="status" className="text-sm px-4">{message}</p>}
  {retry&&<button type="button" disabled={busy} className="min-h-11 px-3 underline" onClick={()=>void run()}>Retry photo save</button>}
 </div>;
}
