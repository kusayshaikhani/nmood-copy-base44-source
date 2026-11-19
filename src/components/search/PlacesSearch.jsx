import React,{useEffect,useRef,useState} from 'react';
import {searchPlaces} from '@/lib/places-search';
import PlacesResults from './PlacesResults';
export default function PlacesSearch({intent,identity,enabled=false,submission=0}){
 const [state,setState]=useState({});const last=useRef(null);
 const key=JSON.stringify([intent,identity,submission]);
 useEffect(()=>{
  const controller=new AbortController();let current=true;
  const [requestIntent,actor,ticket]=JSON.parse(key);
  setState({});
  if(!ticket||!requestIntent.activity||!actor||!requestIntent.city||!enabled)return;
  const timer=setTimeout(()=>{
   if(last.current===ticket)return;
   last.current=ticket;setState({pending:true,key});
   searchPlaces(requestIntent,{signal:controller.signal,requestId:ticket}).then(response=>{if(current)setState({response,key});}).catch(()=>{if(current)setState({error:true,key});});
  },0);
  return()=>{current=false;clearTimeout(timer);controller.abort();};
 },[key,enabled]);
 const response=state.key===key?state.response:undefined;
 return <div className="space-y-5"><PlacesResults key={identity} intent={intent} verifiedResponse={response} loading={state.key===key&&state.pending} unavailable={enabled&&!!submission&&!!intent.activity&&!!intent.city&&(state.key===key&&state.error)}/></div>;
}
