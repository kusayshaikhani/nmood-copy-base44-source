import {Capacitor} from '@capacitor/core';
import {Purchases} from '@revenuecat/purchases-capacitor';
import {isolatedNativePurchases,PRODUCTS} from './native-purchases.mjs';
import {customerSession} from './runtime.mjs';
import {subscriptionName} from '../subscription-display';
let instance;
const native=()=>instance??=isolatedNativePurchases({sdk:Purchases,apiKey:typeof __NMOOD_ISOLATED_RC_PUBLIC_KEY__==='undefined'?'':__NMOOD_ISOLATED_RC_PUBLIC_KEY__,getSession:()=>customerSession().snapshot(),isNativeIOS:()=>Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='ios'});
export class RevenueCatError extends Error{}
export async function initializeRevenueCat(actor){if(customerSession().snapshot()?.user.id!==actor)throw Error('SESSION_CHANGED');return native().initialize();}
export async function getAvailableProducts(){return (await native().products()).map(pkg=>{const product=pkg.product,planId=product.identifier.split('.').at(-1);return {id:pkg.identifier,planId,productId:product.identifier,title:subscriptionName({period:product.subscriptionPeriod,planId,productId:product.identifier}),price:product.priceString||'',localizedPrice:product.priceString||'',currency:product.currencyCode||'',period:product.subscriptionPeriod||'',rcPackage:pkg};});}
export function normalizePurchaseError(e){return {code:e?.userCancelled?'PURCHASE_CANCELLED':'STORE_UNCONFIRMED',message:e?.userCancelled?'Purchase cancelled.':'The store operation could not be confirmed. Do not purchase again while verification is pending.'};}
export async function purchasePackage(pkg){try{await native().purchase(pkg);return {ok:true};}catch(e){return {ok:false,cancelled:e?.userCancelled===true,...normalizePurchaseError(e),error:normalizePurchaseError(e).message};}}
export async function restorePurchases(){return native().restore();}
export async function getCustomerInfo(){const info=await native().info(),ent=info?.entitlements?.active?.nmood_premium;const products=(info?.activeSubscriptions||[]).filter(x=>PRODUCTS.includes(x));return {isPremium:ent?.isSandbox===true&&PRODUCTS.includes(ent.productIdentifier),activeProductIds:products,productId:ent?.productIdentifier??null,expirationDate:ent?.expirationDate??null};}
export const getCachedCustomerInfo=()=>null,getCachedEntitlementInfo=()=>null;
export function clearRevenueCatCache(){instance?.clear();}
export function watchSubscriptionChanges(){return ()=>{};}
export async function openManageSubscriptions(){if(!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=='ios')throw Error('NATIVE_IOS_REQUIRED');window.open('https://apps.apple.com/account/subscriptions','_blank');}
