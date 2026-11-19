import jwks from '../passport-independent/status-jwks.json' with {type:'json'};
export const PROJECT='iyxxorbmucsrechxkkxj';
export const ORIGIN=`https://${PROJECT}.supabase.co`;
export const STAGES=['AUTH_VERIFY','REQUEST','CONFIG','DRIVER','CONNECT','TLS','BEGIN','TIMEOUTS','ROLE_QUERY','ROLE_CHECK','API_ROLE','ACTOR_CONTEXT','STATUS_QUERY','ELIGIBILITY','ROLLBACK','CLOSE','JWT_EXPIRED','PASS'];
const bytes=s=>{if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error();return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));};
export async function verifyToken(token,{keys=jwks.keys,now=Date.now()}={}){
 if(typeof token!=='string'||token.length>12288)throw Error();const p=token.split('.');if(p.length!==3)throw Error();const h=JSON.parse(new TextDecoder().decode(bytes(p[0])));if(h.alg!=='ES256'||h.typ!=='JWT'||Object.keys(h).some(k=>!['alg','typ','kid'].includes(k)))throw Error();
 const jwk=keys.find(k=>k.kid===h.kid&&k.alg==='ES256');if(!jwk)throw Error();const sig=bytes(p[2]);if(sig.length!==64)throw Error();
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,sig,new TextEncoder().encode(p[0]+'.'+p[1])))throw Error();
 const c=JSON.parse(new TextDecoder().decode(bytes(p[1]))),s=Math.floor(now/1000);
 if(c.iss!==ORIGIN+'/auth/v1'||typeof c.sub!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.sub)||c.aud!=='authenticated'||c.role!=='authenticated'||!Number.isSafeInteger(c.iat)||!Number.isSafeInteger(c.exp)||c.iat>s||c.exp<=s||c.exp<=c.iat||c.exp-c.iat>3600||c.nbf!==undefined&&(!Number.isSafeInteger(c.nbf)||c.nbf>s)||typeof c.session_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(c.session_id))throw Error();
 return Object.freeze({id:c.sub,expires_at:c.exp,issuer:c.iss});
}
