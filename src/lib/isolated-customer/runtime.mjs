import {createCustomerSession} from './session.mjs';
import {passportPublicConfig} from '../passport-independent/public-config.mjs';
import {mobileRequest} from '../passport-independent/mobile-request.mjs';
import {createIsolatedAppClient} from '../isolated-app/client.mjs';
import {createIsolatedCountryRuntime} from '../country-verification/isolated-runtime.mjs';
export const ISOLATED_CUSTOMER_BUILD=typeof __NMOOD_ISOLATED_CUSTOMER_TEST__!=='undefined'&&__NMOOD_ISOLATED_CUSTOMER_TEST__===true;
let session;
export function customerSession(){if(!ISOLATED_CUSTOMER_BUILD)throw Error('ISOLATED_CUSTOMER_BUILD_REQUIRED');return session??=createCustomerSession({key:passportPublicConfig?.isolatedPublishableKey,request:mobileRequest});}
export function customerFlow(){const auth=customerSession(),original=auth.snapshot();if(!original)throw Error('SIGNED_OUT');const current=()=>auth.snapshot()===original;return {
 appClient:()=>createIsolatedAppClient({actor:original.user.id,getSession:()=>auth.verified(),isCurrent:current}),
 countryRuntime:()=>createIsolatedCountryRuntime({actor:original.user.id,getIsolatedSession:()=>auth.verified(),isCurrent:current})
};}
