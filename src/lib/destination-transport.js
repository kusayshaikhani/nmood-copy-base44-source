import { DESTINATION_RPC_NAMES, DESTINATION_TABLES } from './passport-adapters';
const rpcNames=new Set(DESTINATION_RPC_NAMES),tables=new Set(DESTINATION_TABLES);
// Parse only the app's explicit query grammar. No SQL or caller-owned route fragments.
export function destinationRequest(path,options,ticket){
 if(!ticket)return {path,options};
 const match=/^\/rest\/v1\/(?:rpc\/([a-z][a-z0-9_]*)|([a-z][a-z0-9_]*))(?:\?([^#]*))?$/.exec(path);
 const method=(options.method||'GET').toUpperCase();
 if(!match|| (match[1]?!rpcNames.has(match[1]):!tables.has(match[2])))throw new Error('Destination endpoint is unavailable.');
 const query=[...new URLSearchParams(match[3]||'').entries()];
 if(match[1]&&(method!=='POST'||query.length))throw new Error('Destination RPC request is unavailable.');
 if(match[2]&&(!['GET','PATCH','DELETE'].includes(method)||(method!=='GET'&&match[2]!=='app_records')))throw new Error('Destination table operation is unavailable.');
 const payload=options.body?JSON.parse(options.body):{};
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Destination payload is unavailable.');
 return {path:'/rest/v1/rpc/nmood_passport_candidate_request',options:{...options,method:'POST',body:JSON.stringify({p_kind:match[1]?'rpc':'table',p_name:match[1]||match[2],p_method:method,p_query:query,p_body:payload,p_revision:ticket.ticket.revision})}};
}
