// Build-time injected adapter. Never falls back to the production SDK or fixtures.
export function createIsolatedRecordAdapter(client,{media}={}){
 const kinds=new Map();
 const row=async(entity,value)=>{if(!value?.id)throw Error('ISOLATED_RESPONSE');kinds.set(value.id,entity);const {id,owner_id,created_date,...data}=value;if(data.cover_media_id){if(!media)throw Error('ISOLATED_MEDIA_REQUIRED');data[entity==='Circle'?'cover_photo':'cover_image']=await media.display(data.cover_media_id);}return {id,owner_id,created_at:created_date,entity_type:entity,data};};
 const type=id=>{const entity=kinds.get(id);if(!entity)throw Error('ISOLATED_RECORD_NOT_LOADED');return entity;};
 const readable=async(entity)=>{const list=await client.records({action:'list',entity});if(!Array.isArray(list))throw Error('ISOLATED_RESPONSE');return Promise.all(list.map(v=>row(entity,v)));};
 const payload=(entity,data)=>{const value={...data};if(entity==='Circle'){if(value.name&&!value.title)value.title=value.name;if(value.privacy&&!value.visibility)value.visibility=value.privacy;}const cover=entity==='Circle'?'cover_photo':'cover_image';if(cover in value){if(!media)throw Error('ISOLATED_MEDIA_REQUIRED');value.cover_media_id=media.idFor(value[cover]);delete value[cover];}for(const key of ['host_user_id','host_name','host_avatar','member_count','spots_filled'])delete value[key];return value;};
 return {
  listReadableRecords:readable,
  listOwnedRecords:async entity=>(await readable(entity)).filter(v=>v.owner_id===(client.actorId||'0faa8a55-291e-4097-b02c-6e7e7b95d758')),
  getReadableRecord:async(entity,id)=>{if(!id)return null;return row(entity,await client.records({action:'get',entity,id}));},
  createOwnedRecord:async(entity,data)=>row(entity,await client.records({action:'create',entity,data:payload(entity,data)})),
  updateOwnedRecord:async(id,data)=>{const entity=type(id);return row(entity,await client.records({action:'update',entity,id,data:payload(entity,data)}));},
  deleteOwnedRecord:async()=>{throw Error('ISOLATED_DELETION_REQUIRES_REVIEWED_ACTION');},
  toEntity:r=>r?{...r.data,id:r.id,owner_id:r.owner_id,created_date:r.created_at}:null,
 };
}
