import {test} from 'node:test';import assert from 'node:assert/strict';
globalThis.__NMOOD_ISOLATED_CUSTOMER_TEST__=true;
const {createMobileRequest}=await import('../passport-independent/mobile-request.mjs');
const {permittedIsolatedRequest}=await import('../isolated-app/network-boundary.mjs');
const origin='https://iyxxorbmucsrechxkkxj.supabase.co';
test('normal signup and confirmation resend cross both customer transport gates',async()=>{const calls=[];const request=createMobileRequest({platform:()=> 'ios',web:async url=>{calls.push(url);return {status:200};}});for(const path of ['/auth/v1/signup','/auth/v1/resend','/auth/v1/token?grant_type=password']){assert.equal(permittedIsolatedRequest(origin+path,'POST'),true);assert.equal((await request(origin+path,{method:'POST',redirect:'error',credentials:'omit'})).status,200);}assert.equal(calls.length,3);});
test('customer transport rejects synthetic endpoint and foreign backend',async()=>{const request=createMobileRequest({web:()=>{throw Error('NETWORK_MUST_NOT_RUN');}});for(const url of [origin+'/functions/v1/passport-isolated-synthetic-v1','https://other.supabase.co/auth/v1/signup']){assert.equal(permittedIsolatedRequest(url,'POST'),false);await assert.rejects(request(url,{method:'POST',redirect:'error',credentials:'omit'}),/TRANSPORT_BOUNDARY/);}});
