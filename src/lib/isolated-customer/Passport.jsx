import React from 'react';
import GlobalPassport from '@/components/country-verification/GlobalPassport';
import {useCountryTestRuntime} from '@/lib/country-verification/runtime';
export default function CustomerPassport(){const runtime=useCountryTestRuntime();if(!runtime)return <p role="alert">Sign in and verify your country to continue.</p>;return <main className="p-4"><h1>Global Passport</h1><GlobalPassport actor={runtime.actor} read={runtime.read} save={runtime.save}/></main>;}
