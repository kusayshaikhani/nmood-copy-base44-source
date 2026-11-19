export function createCustomerGroupChat(client){
 const loaded=new Map(),kind=scope=>{if(!['circle','experience'].includes(scope))throw Error('GROUP_SCOPE');return scope==='circle'?'Circle':'Experience';};
 const room=(scope,id)=>client.groups({action:'chat',kind:kind(scope),id});
 const remember=r=>{if(!r?.id||!r.conversation_id)throw Error('GROUP_RESPONSE');loaded.set(r.id,r.conversation_id);return r;};
 const conversation=id=>{const c=loaded.get(id);if(!c)throw Error('GROUP_MESSAGE_NOT_LOADED');return c;};
 return {
  context:async(scope,id)=>(await room(scope,id)).record,
  list:async(scope,id)=>{const r=await room(scope,id);return (await client.messages({action:'list',conversation_id:r.id})).map(remember);},
  send:async(scope,id,m)=>{if(m?.type&&m.type!=='text'||m.file_url||m.file_name)throw Error('GROUP_ATTACHMENT_NOT_IMPLEMENTED');const r=await room(scope,id);return [remember(await client.messages({action:'send',conversation_id:r.id,content:m.content,reply_to_id:m.reply_to_id||null}))];},
  edit:async(id,content)=>remember(await client.messages({action:'edit',conversation_id:conversation(id),id,content})),
  delete:async id=>{const result=await client.messages({action:'delete',conversation_id:conversation(id),id});if(result?.deleted!==true)throw Error('GROUP_DELETE_UNCONFIRMED');loaded.delete(id);return result;},
 };
}
