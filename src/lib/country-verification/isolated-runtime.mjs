import {createCountryClient} from './client.mjs';
import {createNativeCountryAttestation,createNativeCountryTransport,createNativeCountryRecovery} from './native-attest.mjs';
import isoCodes from './iso-codes.json' with {type:'json'};
export const ISOLATED_COUNTRY_BUILD=typeof __NMOOD_ISOLATED_COUNTRY_TEST__!=='undefined'&&__NMOOD_ISOLATED_COUNTRY_TEST__===true;
const ACTOR='0faa8a55-291e-4097-b02c-6e7e7b95d758';
// The session is supplied exclusively by the isolated memory-only sign-in flow.
// It never consults normal Nmood auth storage or returns a token to the UI.
export function createIsolatedCountryRuntime({getIsolatedSession,isCurrent,attestationFactory=createNativeCountryAttestation,transportFactory=createNativeCountryTransport,recoveryFactory=createNativeCountryRecovery,detect,actor=ACTOR}){
 if(typeof isCurrent!=='function'||typeof getIsolatedSession!=='function')throw Error('unavailable');
 const get=async()=>{if(!isCurrent())throw Error('unavailable');const s=await getIsolatedSession();if(!isCurrent()||s?.user?.id!==actor)throw Error('unavailable');return s;};
 const nativeAttest=attestationFactory({getIsolatedSession:get,expectedActor:actor}),nativeTransport=transportFactory({getIsolatedSession:get,expectedActor:actor});
 const guarded=fn=>async(...args)=>{if(!isCurrent())throw Error('unavailable');const result=await fn(...args);if(!isCurrent())throw Error('unavailable');return result;};
 const client=createCountryClient({actor,countries:isoCodes.map(code=>({code,name:code})),detect,attest:guarded(nativeAttest),transport:guarded(nativeTransport)});
 return {...client,recover:guarded(recoveryFactory({getIsolatedSession:get,expectedActor:actor}))};
}
