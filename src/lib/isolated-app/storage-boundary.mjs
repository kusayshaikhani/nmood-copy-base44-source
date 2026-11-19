const PREFIX='nmood.isolated-test.v1.';
export function isolatedStorage(storage){
 const keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k?.startsWith(PREFIX));
 return Object.freeze({get length(){return keys().length;},key:i=>keys()[i]?.slice(PREFIX.length)??null,getItem:key=>storage.getItem(PREFIX+String(key)),setItem:(key,value)=>storage.setItem(PREFIX+String(key),String(value)),removeItem:key=>storage.removeItem(PREFIX+String(key)),clear:()=>{for(const key of keys())storage.removeItem(key);}});
}
export function installIsolatedStorageBoundary(target=window){for(const name of ['localStorage','sessionStorage'])Object.defineProperty(target,name,{value:isolatedStorage(target[name]),writable:false,configurable:false});}
