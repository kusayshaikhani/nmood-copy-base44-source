import React,{useEffect,useState} from 'react';
import CountryVerification from './CountryVerification';
import {requestOfflineCountry} from '@/lib/country-verification/device.mjs';
import isoCodes from '@/lib/country-verification/iso-codes.json';
const labels=new Intl.DisplayNames(['en'],{type:'region'});
const countries=isoCodes.map(code=>({code,name:labels.of(code)||code}));
// Detect before collecting a password. This permits a pending Auth registration,
// NOT account activation. Protected app routes separately require server proof.
export default function SignupCountryBoundary({children,detect=requestOfflineCountry}){
 const [detected,D]=useState(null),[now,N]=useState(Date.now());
 useEffect(()=>{if(!detected)return;const timer=setTimeout(()=>N(Date.now()),Math.max(1,detected.detectedAt+120000-Date.now()));return()=>clearTimeout(timer);},[detected]);
 if(!detected||now-detected.detectedAt>=120000)return <><a className="block p-3 underline" href="/login">Back to sign in</a><CountryVerification actor="pending-signup" countries={countries} detect={detect} preview onDetected={value=>{N(Date.now());D(value);}}/></>;
 return <><p role="status" className="p-3">Device country: {detected.country}. Server country verification is still required before account activation.</p>{children}</>;
}
