import React,{useMemo} from 'react';
import {CountryTestProvider,CountryAccessBoundary} from '@/lib/country-verification/runtime';
import GlobalPassport from './GlobalPassport';
// Mounted only by the explicitly selected isolated test build after sign-in.
export default function IsolatedCountryPanel({session,children}){
 const runtime=useMemo(()=>session.countryRuntime(),[session]);
 return <CountryTestProvider value={runtime}><CountryAccessBoundary><GlobalPassport actor={runtime.actor} read={runtime.read} save={runtime.save}/>{children}</CountryAccessBoundary></CountryTestProvider>;
}
