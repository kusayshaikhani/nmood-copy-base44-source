const PROJECT='iyxxorbmucsrechxkkxj';
const uuid=x=>typeof x==='string'&&/^[0-9a-f-]{36}$/.test(x);
// SDK success is never entitlement authority. The isolated server must confirm
// the same actor, sandbox environment, entitlement and unexpired purchase.
export function createIsolatedPurchases({binding,sdk,getSession,verifyServer,now=Date.now}){
 if(binding?.project!==PROJECT||binding?.bundle!=='com.nmood.app'||binding?.environment!=='SANDBOX'||binding?.isolatedRoutingVerified!==true||binding?.restoreOwnershipVerified!==true||typeof binding.entitlement!=='string'||!binding.entitlement||!Array.isArray(binding.products)||!binding.products.length||binding.products.some(x=>typeof x!=='string'||!x))throw Error('ISOLATED_PURCHASE_CONFIGURATION_REQUIRED');
 let busy=false;
 async function run(action,product){if(busy)throw Error('PURCHASE_BUSY');const original=await getSession();if(!uuid(original?.user?.id))throw Error('SIGNED_OUT');const actor=original.user.id,current=async()=>{if(await getSession()!==original)throw Error('SESSION_CHANGED');};busy=true;
 try{await sdk.bindIdentity('isolated:'+PROJECT+':'+actor);await current();
  if(action==='purchase'){if(!binding.products.includes(product))throw Error('PRODUCT_DENIED');await sdk.purchase(product);}else await sdk.restore();await current();
  const result=await verifyServer({action,expectedActor:actor});await current();
  if(result?.project!==PROJECT||result?.actor!==actor||result?.environment!=='SANDBOX'||result?.entitlement!==binding.entitlement||typeof result.active!=='boolean')throw Error('ENTITLEMENT_UNCONFIRMED');
  if(result.active&&(!binding.products.includes(result.product)||!Number.isSafeInteger(result.expiresAt)||result.expiresAt<=now()))throw Error('ENTITLEMENT_UNCONFIRMED');
  return {ok:true,active:result.active,expiresAt:result.active?result.expiresAt:null};
 }finally{busy=false;}}
 return {purchase:product=>run('purchase',product),restore:()=>run('restore')};
}
