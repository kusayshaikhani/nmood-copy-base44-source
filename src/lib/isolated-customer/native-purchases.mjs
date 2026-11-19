const PROJECT='iyxxorbmucsrechxkkxj';
export const PRODUCTS=['monthly','quarterly','halfyear','annual'].map(x=>'com.nmood.realconnections.premium.'+x);
// Serializes native identity changes and store operations. No anonymous SDK logOut.
export function isolatedNativePurchases({sdk,apiKey,getSession,isNativeIOS}){
 let configured=false,identity=null,queue=Promise.resolve();
 function run(work){const original=getSession();const current=()=>{if(!original||getSession()!==original)throw Error('SESSION_CHANGED');};
  const result=queue.then(async()=>{current();if(!isNativeIOS()||!/^appl_[A-Za-z0-9]+$/.test(apiKey||''))throw Error('ISOLATED_STORE_CONFIGURATION');
   const actor=original.user?.id;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(actor||''))throw Error('SIGNED_OUT');
   const wanted=`isolated:${PROJECT}:${actor}`;
   if(!configured){await sdk.configure({apiKey,appUserID:wanted});configured=true;identity=wanted;}else if(identity!==wanted){await sdk.logIn({appUserID:wanted});identity=wanted;}current();
   const value=await work(current);current();return value;
  });queue=result.catch(()=>{});return result;
 }
 async function packages(){const response=await sdk.getOfferings();const offering=response?.all?.default;if(offering?.identifier!=='default'||!Array.isArray(offering.availablePackages))throw Error('OFFERING_UNAVAILABLE');const list=offering.availablePackages.filter(p=>PRODUCTS.includes(p?.product?.identifier));if(!list.length)throw Error('PRODUCTS_UNAVAILABLE');return list;}
 return {
  initialize:()=>run(async()=>{}),
  products:()=>run(async()=>packages()),
  purchase:pkg=>run(async current=>{const list=await packages();current();const actual=list.find(p=>p.identifier===pkg?.identifier&&p.product.identifier===pkg?.product?.identifier);if(!actual)throw Error('PRODUCT_DENIED');return sdk.purchasePackage({aPackage:actual});}),
  restore:()=>run(()=>sdk.restorePurchases()),
  info:()=>run(async()=>{const r=await sdk.getCustomerInfo();return r.customerInfo;}),
  clear:()=>{identity=null;},
 };
}
