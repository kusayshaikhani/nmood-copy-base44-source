import {callSupabaseRpc} from '@/api/supabaseClient';
const messages={ADMIN_REQUIRED:'An active administrator account is required.',SIGN_IN_REQUIRED:'Please sign in again.',PROTECTED_ACCOUNT:'This administrator account is protected.',PERMANENT_DELETION_IN_PROGRESS:'Permanent deletion is already in progress; this action cannot restore the account.',CAPACITY_REACHED:'This group has no available places.',REQUEST_NO_LONGER_PENDING:'This request has already been decided. Refresh the list.',CONTENT_NOT_FOUND:'This content is no longer available.',CONFIRMATION_REQUIRED:'Enter the exact confirmation shown.',REASON_REQUIRED:'Enter an audit reason.',TARGET_AND_REASON_REQUIRED:'Choose a member and enter an audit reason.'};
async function checked(name,input){
 const result=await callSupabaseRpc(name,{p_input:input});
 if(result?.ok!==true)throw Error(messages[result?.error]||'The action could not be completed. Refresh and try again; no success was confirmed.');
 return result.data;
}
export const memberOperation=(target,action,reason)=>checked('nmood_mission_control',{target,action,reason});
export const missionHistory=target=>checked('nmood_mission_control',{action:'history',...(target?{target}:{})});
export const communityOperation=input=>checked('nmood_mission_community',input);

export const missionControls=()=>checked('nmood_mission_control',{action:'member_controls'});
