import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import CoverPhotoMenu from '@/components/profile/CoverPhotoMenu';
import NativePhotoInput from '@/components/media/NativePhotoInput';
import { callSupabaseRpc, uploadMemberGalleryPhoto, deleteMemberGalleryPhoto, getSupabaseSession } from '@/api/supabaseClient';
import { useSignedMemberGallery } from '@/lib/member-gallery';
import { boundedCoverOperation } from '@/lib/cover-operation';
import { validateImageFile } from '@/lib/upload-security';

// Mount keyed by owner. A viewer never receives a path without server permission.
export default function ProfileCover({ ownerId, editable=false, renderMedia }) {
 const [path,setPath]=useState(null),[pending,setPending]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const op=useRef(null),lock=useRef(false),alive=useRef(true),controller=useRef(new AbortController());
 const camera=useRef(null),library=useRef(null);
 const urls=useSignedMemberGallery(path?[path]:[],ownerId);
 const version=useRef(0);
 const operation=useRef(null);
 const check=()=>{if(!alive.current||getSupabaseSession()?.user?.id!==ownerId)throw new Error('Session changed');};
 const read=(signal)=>callSupabaseRpc('nmood_get_profile_cover',{p_member_id:ownerId},{signal});
 useEffect(()=>{alive.current=true;const abort=new AbortController();controller.current=abort;const current=++version.current;boundedCoverOperation(()=>read(abort.signal),abort).then(value=>{if(!abort.signal.aborted&&current===version.current){setPath(value);setLoaded(true);}}).catch(()=>{if(alive.current&&current===version.current){if(!editable)setLoaded(true);if(editable)setError('Cover could not load. Retry when connected.');}});return()=>{alive.current=false;abort.abort();operation.current?.abort();};},[ownerId]);
 useEffect(()=>()=>{if(pending?.url)URL.revokeObjectURL?.(pending.url);},[pending]);
 const select=event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file||!loaded||lock.current||op.current)return;
  if(!validateImageFile(file,{maxMb:25,allowedTypes:['image/jpeg','image/png','image/webp']}).ok){setError('Choose a JPG, PNG or WebP photo up to 25 MB.');return;}
  setPending({file,url:URL.createObjectURL?.(file)});setError('');setNotice('Cover preview · not uploaded');
 };
 const run=async(remove=false)=>{
  if(lock.current)return;version.current++;lock.current=true;setBusy(true);setError('');let stage='load';
  const abort=new AbortController();operation.current=abort;
  const options={expectedUserId:ownerId,signal:abort.signal};
  const step=fn=>boundedCoverOperation(fn,abort);
  try{
   check();
   if(!op.current&&!pending&&!remove){const fresh=await step(()=>read(abort.signal));check();setPath(fresh);setLoaded(true);return;}
   if(!op.current&&!remove&&!pending?.file)return;
   op.current??={old:path,file:remove?null:pending?.file,path:null};const task=op.current;
   if(task.file&&!task.path){stage='upload';setNotice('Uploading cover…');task.path=await step(()=>uploadMemberGalleryPhoto(task.file,{...options,cover:true,onProgress:progress=>{if(alive.current&&!abort.signal.aborted)setNotice(`Uploading cover: ${Math.round(progress)}%`);}}));check();}
   stage='save';setNotice('Saving cover…');
   const saved=await step(()=>callSupabaseRpc('nmood_save_my_profile_cover',{p_path:task.path,p_expected:task.old},options));check();
   if(saved!==task.path)throw new Error('Cover not confirmed');
   setPath(saved);setLoaded(true);
   // Old file is now inaccessible to other viewers. Cleanup is retryable and
   // never removes avatar or gallery objects (only /cover/ paths are accepted).
   if(task.old&&task.old!==saved){stage='cleanup';await step(()=>deleteMemberGalleryPhoto(task.old,options));check();}
   op.current=null;setPending(null);setConfirm(false);setNotice(saved?'Cover saved.':'Cover removed.');
  }catch(failure){if(alive.current){setNotice('');setError(failure?.code==='COVER_TIMEOUT'?'Cover operation timed out. Your selection is kept. Retry to confirm its status.':failure?.code==='COVER_CANCELLED'?'Cover operation stopped. Your selection is kept. Retry to confirm its status.':stage==='upload'?'Cover upload failed. Your selection is kept. Please retry.':stage==='save'?'Cover could not be confirmed. Your selection is kept. Please retry.':stage==='cleanup'?'Cover saved. Previous photo cleanup needs a retry.':'Cover could not load. Retry when connected.');}}
  finally{abort.abort();operation.current=null;lock.current=false;if(alive.current)setBusy(false);}
 };
 if(!editable&&renderMedia)return renderMedia({coverUrl:urls[0]||null,coverLoading:!loaded});
 if(!editable&&!urls[0])return null;
 return <div className={editable?'absolute inset-0':'relative h-40 overflow-hidden rounded-2xl'} aria-label="Profile cover">
  {(pending?.url||urls[0])&&<img src={pending?.url||urls[0]} alt="Profile cover" className="pointer-events-none h-full w-full object-cover object-center"/>}
  {editable&&<div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/60"/>}
  {editable&&<div data-testid="cover-actions" className="absolute inset-x-4 bottom-24 z-10 text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_60%)]">
   {busy&&<div className="flex items-center gap-2"><LoaderCircle aria-label="Saving cover" className="h-5 w-5 animate-spin"/><button type="button" className="min-h-11 px-3 underline" onClick={()=>operation.current?.abort()}>Cancel cover operation</button></div>}
   {notice&&<p role="status" className="text-xs">{notice}</p>}{error&&<p role="alert" className="text-xs">{error}</p>}
   {error&&<button type="button" className="min-h-11 px-3 touch-manipulation underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" disabled={busy} onClick={()=>void run()}>Retry cover</button>}
   {!pending&&!op.current&&!confirm&&<CoverPhotoMenu hasCover={!!path} disabled={busy||!loaded} onCamera={()=>camera.current?.click()} onChoose={()=>library.current?.click()} onRemove={()=>setConfirm(true)}/>}
   {pending&&<div className="flex flex-wrap items-center gap-x-2"><button type="button" className="min-h-11 px-3 touch-manipulation underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" disabled={busy||!loaded||!pending.file||!!error} onClick={()=>void run()}>Upload cover</button><button type="button" className="min-h-11 px-3 touch-manipulation underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" disabled={busy||!!op.current?.path} onClick={()=>{op.current=null;setPending(null);setNotice('');setError('');}}>Cancel cover selection</button></div>}
   {confirm&&<div role="alertdialog" aria-label="Remove cover photo?"><p>Remove your cover photo?</p><button type="button" className="min-h-11 px-3 touch-manipulation underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" disabled={busy} onClick={()=>void run(true)}>Confirm remove cover</button><button type="button" className="min-h-11 px-3 touch-manipulation underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" disabled={busy||!!op.current} onClick={()=>setConfirm(false)}>Cancel</button></div>}
   <NativePhotoInput ref={camera} aria-label="Take cover photo input" type="file" accept="image/*" capture="user" className="hidden" disabled={busy||!loaded||!!op.current} onChange={select} onPickerError={setError}/>
   <NativePhotoInput ref={library} aria-label="Choose cover photo input" type="file" accept="image/*" className="hidden" disabled={busy||!loaded||!!op.current} onChange={select} onPickerError={setError}/>
  </div>}
 </div>;
}
