import React, { useEffect, useRef, useState } from 'react';
import {motion, useReducedMotion} from 'framer-motion';
import { Camera, Image as ImageIcon, X, LoaderCircle } from 'lucide-react';
import NativePhotoInput from '@/components/media/NativePhotoInput';
import BottomSheet from '@/components/shared/BottomSheet';
import { uploadMemberGalleryPhoto, deleteMemberGalleryPhoto, getSupabaseSession, supabaseSelect } from '@/api/supabaseClient';
import { updateMemberProfile } from '@/lib/member-update';
import { useSignedMemberGallery } from '@/lib/member-gallery';
import { validateImageFile } from '@/lib/upload-security';
import { withTimeout } from '@/lib/bounded-operation';

const LIMIT = 6;
export default function ProfileGallery({ member, onSaved, onNavigationBlockedChange }) {
 const owner = member?.id;
 const reduceMotion=useReducedMotion();
 const [photos,setPhotos]=useState(()=>Array.isArray(member?.photo_gallery)?member.photo_gallery:[]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);
 const [sheet,setSheet]=useState(false),[confirm,setConfirm]=useState(null),[lightbox,setLightbox]=useState(null);
 const [pending,setPending]=useState([]);
 useEffect(()=>()=>pending.forEach(item=>URL.revokeObjectURL?.(item.url)),[pending]);
 const revision=useRef(0);
 const operation=useRef(null),lock=useRef(false),active=useRef(true),controller=useRef(new AbortController());
 const camera=useRef(null),picker=useRef(null);
 const urls=useSignedMemberGallery(photos,owner);
 const sourceKey=JSON.stringify(member?.photo_gallery||[]);
 const assertOwner=()=>{if(!active.current||getSupabaseSession()?.user?.id!==owner)throw new Error('Session changed');};
 const options=()=>({expectedUserId:owner,signal:controller.current.signal});
 const fresh=async()=>{
  assertOwner();
  const rows=await withTimeout(()=>supabaseSelect('members',`id=eq.${encodeURIComponent(owner)}&select=id,photo_gallery,photo_url`,options()));
  assertOwner();const row=rows?.[0];
  if(row?.id!==owner||!Array.isArray(row.photo_gallery))throw new Error('Gallery unavailable');
  return row;
 };
 useEffect(()=>{active.current=true;controller.current=new AbortController();return()=>{active.current=false;controller.current.abort();};},[]);
 // Prop snapshots can arrive out of order. Never use them to overwrite a confirmed
 // operation: re-read the owner's current server gallery instead.
 useEffect(()=>{
  let current=true;const version=revision.current;
  if(!lock.current&&!operation.current)fresh().then(row=>{if(current&&!lock.current&&version===revision.current)setPhotos(row.photo_gallery);}).catch(()=>{if(current&&active.current&&!lock.current&&version===revision.current){setFailed(true);setMessage('Gallery could not refresh. Retry to load the latest photos.');}});
  return()=>{current=false;};
 // The owner-keyed parent remounts this component on account changes.
 },[sourceKey,owner]);
 const sync=async(latest,next)=>{
  assertOwner();setMessage('Synchronizing gallery…');
  const updated=await updateMemberProfile({photo_gallery:next},options());
  assertOwner();
  if(JSON.stringify(updated?.photo_gallery)!==JSON.stringify(next))throw new Error('Gallery not confirmed');
  await withTimeout(()=>onSaved?.({...latest,...updated}));assertOwner();
  setPhotos(next);setLightbox(null);
 };
 const run=async()=>{
  if(lock.current)return;
  revision.current+=1;lock.current=true;setBusy(true);setFailed(false);setMessage('Checking Gallery…');
  try{
   const op=operation.current;
   if(!op){const latest=await fresh();setPhotos(latest.photo_gallery);setMessage('Gallery refreshed.');return;}
   let latest=await fresh();setPhotos(latest.photo_gallery);
   if(op.type==='upload'){
    const missing=op.files.filter(file=>!latest.photo_gallery.includes(op.uploads.get(file)));
    if(latest.photo_gallery.length+missing.length>LIMIT)throw Object.assign(new Error('Gallery limit'),{code:'GALLERY_LIMIT'});
    for(let index=0;index<op.files.length;index++){
     const file=op.files[index];assertOwner();
     if(!op.uploads.has(file)){
      setMessage(`Uploading photo ${index+1} of ${op.files.length}…`);
      const path=await uploadMemberGalleryPhoto(file,{...options(),onProgress:percent=>{if(active.current)setMessage(`Uploading photo ${index+1} of ${op.files.length}: ${Math.round(percent)}%`);}});
      assertOwner();if(!path)throw new Error('Upload unconfirmed');op.uploads.set(file,path);
     }
    }
    latest=await fresh();
    const additions=op.files.map(file=>op.uploads.get(file)).filter(path=>!latest.photo_gallery.includes(path));
    const next=[...latest.photo_gallery,...additions];if(next.length>LIMIT)throw Object.assign(new Error('Gallery limit'),{code:'GALLERY_LIMIT'});
    await sync(latest,next);setMessage('Photos uploaded and gallery saved.');
   }else if(op.type==='delete'){
    // Never delete a file currently serving as the primary avatar. Removing its
    // gallery reference is separate from managing that avatar on main Profile.
    if(!op.storageDone&&op.path!==latest.photo_url){
     const result=await deleteMemberGalleryPhoto(op.path,{...options(),protectedPhoto:latest.photo_url});assertOwner();op.storageDone=true;op.fileDeleted=!result?.retainedPrimary;
    }
    op.storageDone=true;latest=await fresh();op.profileSubmitted=true;await sync(latest,latest.photo_gallery.filter(path=>path!==op.path));
    setMessage('Photo removed from Gallery.');
   }else{
    if(!op.next){
     const from=latest.photo_gallery.indexOf(op.path),to=from+op.direction;
     if(from<0||to<0||to>=latest.photo_gallery.length)throw new Error('Gallery changed');
     op.base=[...latest.photo_gallery];op.next=[...latest.photo_gallery];[op.next[from],op.next[to]]=[op.next[to],op.next[from]];
    }
    if(JSON.stringify(latest.photo_gallery)!==JSON.stringify(op.base)&&JSON.stringify(latest.photo_gallery)!==JSON.stringify(op.next))throw new Error('Gallery changed');
    await sync(latest,op.next);setMessage('Gallery order saved.');
   }
   operation.current=null;setPending([]);setConfirm(null);
  }catch(error){
   if(active.current){setFailed(true);setMessage(error?.code==='GALLERY_LIMIT'?'Maximum six photos. Cancel this selection to remove a photo, then choose again.':error?.code==='GALLERY_PATH_UNSUPPORTED'?'This legacy photo cannot be deleted through the authorized storage path. Its reference is kept.':operation.current?.fileDeleted?'The file was removed, but gallery synchronization failed. Retry to finish removing its reference.':operation.current?.type==='upload'?'Upload or synchronization failed. Selected photos are kept. Retry; successfully uploaded files will not upload again.':'Gallery could not finish. The photo is kept here until confirmed. Check your connection and retry.');}
  }finally{lock.current=false;if(active.current)setBusy(false);}
 };
 const select=async event=>{
  const files=Array.from(event.target.files||[]);event.target.value='';
  if(!files.length||lock.current||operation.current)return;
  if(files.length+photos.length>LIMIT){setFailed(true);setMessage('Maximum six photos. Choose fewer photos or remove one first.');return;}
  if(files.some(file=>!validateImageFile(file,{maxMb:25,allowedTypes:['image/jpeg','image/png','image/webp']}).ok)){setFailed(true);setMessage('Choose JPG, PNG or WebP photos up to 25 MB each.');return;}
  operation.current={type:'upload',files,uploads:new Map()};setPending(files.map(file=>({file,url:URL.createObjectURL?.(file)})));setSheet(false);setFailed(false);setMessage('Photos selected. Upload to save them to your Gallery.');
 };
 const requestRemove=path=>{if(lock.current||operation.current)return;setConfirm(path);};
 const remove=()=>{if(lock.current||operation.current||confirm==null)return;operation.current={type:'delete',path:confirm,fileDeleted:false};void run();};
 const move=(path,direction)=>{if(lock.current||operation.current)return;operation.current={type:'move',path,direction};void run();};
 const blocked=busy||!!operation.current;
 useEffect(()=>{onNavigationBlockedChange?.(blocked);},[blocked,onNavigationBlockedChange]);
 return <section aria-label="Profile Gallery" className="px-6 space-y-3">
  <div className="flex items-center justify-between"><h2 className="text-section-title font-semibold">Gallery</h2><span>{photos.length} / {LIMIT} photos</span></div>
  {busy&&<LoaderCircle className="h-5 w-5 animate-spin" aria-label="Gallery operation in progress"/>}
  {message&&<p role={failed?'alert':'status'} aria-live="polite" className="text-sm">{message}</p>}
  {failed&&<button type="button" className="min-h-11 rounded-xl border px-4" disabled={busy} onClick={()=>void run()}>Retry Gallery</button>}
  {!busy&&operation.current?.type==='upload'&&operation.current.uploads.size===0&&<button type="button" className="min-h-11 px-4" onClick={()=>{operation.current=null;setPending([]);setFailed(false);setMessage('Selection cancelled. Gallery unchanged.');}}>Cancel selection</button>}
  {failed&&!busy&&operation.current?.type==='delete'&&!operation.current.fileDeleted&&!operation.current.profileSubmitted&&<button type="button" className="min-h-11 px-4" onClick={()=>{operation.current=null;setPending([]);setConfirm(null);setFailed(false);setMessage('Removal cancelled.');}}>Cancel removal</button>}
  {pending.length>0&&<div aria-label="Pending gallery photos" className="flex gap-3 overflow-x-auto">{pending.map((item,index)=><figure key={index} className="w-28 shrink-0">{item.url&&<img src={item.url} alt={`Pending photo ${index+1}`} className="h-24 w-28 rounded-xl object-cover object-top"/>}<figcaption className="text-sm">Photo {index+1}: {operation.current?.uploads.has(item.file)?'Uploaded; confirming Gallery':busy?'Uploading…':'Pending'}</figcaption></figure>)}</div>}
  {pending.length>0&&!failed&&<button type="button" disabled={busy} className="min-h-11 rounded-xl bg-primary px-4 text-primary-foreground" onClick={()=>void run()}>{busy?'Saving Gallery…':pending.length===1?'Upload':`Upload ${pending.length} photos`}</button>}
  {photos.length>=LIMIT&&<p>Gallery limit reached. Remove a photo before adding another.</p>}
  {!photos.length&&<p>Add photos to your Gallery.</p>}
  <div className="flex gap-3 overflow-x-auto pb-3">
   {photos.map((path,index)=><div key={`${typeof path==='string'?path:index}`} className="relative w-40 shrink-0 rounded-xl border bg-muted p-1">
    <button type="button" className="h-36 w-full" aria-label={`Open gallery photo ${index+1}`} onClick={()=>setLightbox(index)}>
     {operation.current?.fileDeleted&&operation.current.path===path?<span>Removal awaiting synchronization</span>:urls[index]?<img src={urls[index]} alt={`Gallery photo ${index+1}`} className="h-full w-full rounded-xl object-cover object-top"/>:<span>Photo preview unavailable</span>}
    </button>
    <button type="button" className="absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-background shadow" aria-label={`Remove gallery photo ${index+1}`} disabled={blocked} onClick={()=>requestRemove(path)}><X className="h-5 w-5"/></button>
   </div>)}
  </div>
  <button type="button" className="min-h-11 w-full rounded-xl border px-4" disabled={blocked||photos.length>=LIMIT} onClick={()=>setSheet(true)}>Add photos</button>
  {confirm!==null&&<div role="alertdialog" aria-label="Remove gallery photo?" className="rounded-xl border bg-card p-3">
   <p>Remove this photo from Gallery? Your primary profile photo stays unchanged.</p>
   <button type="button" className="min-h-11 px-4" disabled={blocked} onClick={remove}>Remove photo</button>
   <button type="button" className="min-h-11 px-4" disabled={blocked} onClick={()=>setConfirm(null)}>Cancel</button>
  </div>}
  {lightbox!==null&&<div role="dialog" aria-label="Gallery viewer" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 text-white">
   <span>{lightbox+1} of {photos.length}</span><button type="button" className="min-h-11 px-4" onClick={()=>setLightbox(null)}>Close</button>
   {urls[lightbox]?<motion.img key={urls[lightbox]} drag="x" dragConstraints={{left:0,right:0}} dragElastic={0.6} onDragEnd={(_,info)=>{if(Math.abs(info.offset.x)>50){setLightbox(i=>Math.max(0,Math.min(photos.length-1,i+(info.offset.x<0?1:-1))));}}} initial={{opacity:reduceMotion?1:0}} animate={{opacity:1}} transition={{duration:reduceMotion?0:0.25}} style={{touchAction:"pan-y"}} draggable={false} src={urls[lightbox]} alt={`Gallery photo ${lightbox+1}`} className="max-h-[65dvh] max-w-full object-contain"/>:<p>Photo preview unavailable</p>}
   <div>{[-1,1].map(direction=><button key={direction} type="button" className="min-h-11 px-4" disabled={lightbox+direction<0||lightbox+direction>=photos.length} onClick={()=>setLightbox(lightbox+direction)}>{direction<0?'Previous':'Next'}</button>)}</div>
   <div>{[-1,1].map(direction=><button key={direction} type="button" className="min-h-11 px-4" disabled={blocked||lightbox+direction<0||lightbox+direction>=photos.length} onClick={()=>move(photos[lightbox],direction)}>{direction<0?'Move left':'Move right'}</button>)}</div>
  </div>}
  <BottomSheet open={sheet} onOpenChange={setSheet} title="Add Gallery photos">
   <button type="button" className="flex min-h-11 items-center gap-2 px-4" onClick={()=>camera.current?.click()}><Camera/>Take Photo</button>
   <button type="button" className="flex min-h-11 items-center gap-2 px-4" onClick={()=>picker.current?.click()}><ImageIcon/>Choose from Gallery</button>
  </BottomSheet>
  <NativePhotoInput ref={camera} aria-label="Take gallery photo" type="file" accept="image/*" capture="user" className="hidden" disabled={blocked} onChange={select} onPickerError={text=>{setFailed(true);setMessage(text);}} onPickerCancel={()=>setSheet(false)}/>
  <NativePhotoInput ref={picker} aria-label="Choose gallery photos" type="file" accept="image/*" multiple maxSelection={Math.max(0,LIMIT-photos.length)} className="hidden" disabled={blocked} onChange={select} onPickerError={text=>{setFailed(true);setMessage(text);}} onPickerCancel={()=>setSheet(false)}/>
 </section>;
}
