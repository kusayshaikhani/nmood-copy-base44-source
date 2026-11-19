import React,{useEffect,useState} from 'react';
import DeletionConfirmation from '@/components/privacy/DeletionConfirmation';
import {readDeletionReceipt,refreshDeletionReceipt,forgetDeletionReceipt,saveDeletionReceipt} from '@/lib/deletion-receipt';
export default function DeletionStatus(){
 const [receipt,setReceipt]=useState(readDeletionReceipt);const [state,setState]=useState(receipt);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);const [fresh,setFresh]=useState(false);const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError(false);refreshDeletionReceipt(receipt?.receipt).then(value=>{if(active){setState(value);setFresh(true);saveDeletionReceipt({...value,receipt:receipt.receipt});}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[receipt,attempt]);
 return <main className="mx-auto max-w-lg space-y-5 px-5 py-10" aria-busy={loading}>
  {state?<DeletionConfirmation state={state} historical={!fresh}/>:<><h1 className="text-xl font-semibold">Deletion status unavailable</h1><p>Open this page on the device where you requested deletion, or contact <a href="mailto:support@nmood.app" className="underline">support@nmood.app</a> to verify your identity and status.</p></>}
  {loading&&<p role="status">Checking deletion status…</p>}
  {error&&<p role="alert">Current status is unavailable. This does not cancel or extend a deletion request.</p>}
  <button className="min-h-11 rounded-xl border px-4" disabled={loading} onClick={()=>setAttempt(n=>n+1)}>Check current status</button>
  {receipt&&<button className="min-h-11 rounded-xl border px-4" onClick={()=>{forgetDeletionReceipt();setReceipt(null);setState(null);setFresh(false);}}>Forget this receipt on this device</button>}
  <a className="block min-h-11 underline" href="/auth">Return to sign in</a>
 </main>;
}
