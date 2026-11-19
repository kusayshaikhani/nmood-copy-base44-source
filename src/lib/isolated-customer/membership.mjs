import {isolatedAppAdapters} from '../isolated-app/active.mjs';
import {customerSession} from './runtime.mjs';
import {initializeRevenueCat,purchasePackage,restorePurchases,getAvailableProducts,openManageSubscriptions} from './revenuecat-client.mjs';
function context(actor){const session=customerSession().snapshot();if(session?.user.id!==actor)throw Error('SESSION_CHANGED');return ()=>{if(customerSession().snapshot()!==session)throw Error('SESSION_CHANGED');};}
export async function reconcileMembership(actor,{signal,onServerStatus,verifyPurchases=false}={}){
 const current=context(actor);if(signal?.aborted)throw Error('ABORTED');const client=isolatedAppAdapters().client;
 const result=await (verifyPurchases?client.reconcileMembership():client.membership());current();if(signal?.aborted||typeof result?.premium!=='boolean')throw Error('ENTITLEMENT_UNCONFIRMED');onServerStatus?.(result);
 return {id:'isolated-'+actor,user_id:actor,type:result.premium?'premium':'explorer',status:result.status,expires_at:result.expires_at,active:result.premium,_server_authorized:true,_reconciliation_status:'confirmed',billing_platform:'apple'};
}
export const initializeMembership=reconcileMembership,refreshMembership=reconcileMembership;
let busy=false;
async function operate(actor,action){if(busy)return {ok:false,pending:true,code:'PURCHASE_IN_PROGRESS'};busy=true;try{const current=context(actor);await initializeRevenueCat(actor);current();const result=await action();current();if(result?.ok===false)return result;const membership=await reconcileMembership(actor,{verifyPurchases:true});current();return {ok:membership.type==='premium',membership,pending:membership.type!=='premium',error:membership.type==='premium'?undefined:'Store access is awaiting server verification. Do not buy again.'};}catch(e){return {ok:false,pending:true,code:'VERIFICATION_PENDING',error:'Store access could not be confirmed. Do not buy again while verification is pending.'};}finally{busy=false;}}
export const purchaseMembership=(actor,pkg)=>operate(actor,()=>purchasePackage(pkg));
export const restoreMembership=actor=>operate(actor,()=>restorePurchases());
export const getAvailablePlans=()=>getAvailableProducts();
export const openManageMembership=()=>openManageSubscriptions();
