import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {safeState,ERRORS} from './contract.mjs';
import CountryVerification from '@/components/country-verification/CountryVerification';
// No environment variable or ordinary account can opt into this held candidate.
// The disposable test harness injects an authority. A hosted adapter is not released.
const Runtime=createContext(null);
export const CountryTestProvider=Runtime.Provider;
export const useCountryTestRuntime=()=>useContext(Runtime);
export function CountryAccessBoundary({children}){
 const runtime=useCountryTestRuntime();
 return runtime?<Enforced runtime={runtime}>{children}</Enforced>:<p role="alert" className="text-red-700 border border-red-600 bg-red-50 p-3">Server country verification is unavailable. Account access is blocked.</p>;
}
function Enforced({runtime,children}){
 const [state,S]=useState(null),[error,E]=useState(false),[attempt,A]=useState(0);const generation=useRef(0);
 useEffect(()=>{const own=++generation.current;S(null);E(false);runtime.read().then(x=>{if(own===generation.current)S(safeState(x,runtime.actor));}).catch(()=>{if(own===generation.current)E(true);});return()=>{generation.current++;};},[runtime,attempt]);
 if(error)return <section className="p-4"><p role="alert" className="text-red-700 border border-red-600 bg-red-50 p-3">{ERRORS.status}</p><button type="button" className="min-h-12 underline" onClick={()=>A(n=>n+1)}>Retry verification status</button></section>;
 if(!state)return <p role="status">Checking country verification…</p>;
 if(!state.verified)return <CountryVerification actor={runtime.actor} countries={runtime.countries} detect={runtime.detect} confirm={runtime.confirm} recover={runtime.recover} onVerified={value=>S(safeState(value,runtime.actor))}/>;
 return children;
}
