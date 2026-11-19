// Presentation of authorized state only. Every mutation still goes through its RPC.
export function circleAction({role='visitor',privacy,visibility,loading=false,error=false,administrator=false,registrationsOpen=true,full=false,hasPendingInvite=false}={}) {
 if(loading)return {state:'loading',label:'Checking membership…',enabled:false};
 if(error)return {state:'error',label:'Membership unavailable',enabled:false};
 if(role==='organizer'||role==='member')return {state:'chat',label:'Chat',enabled:true};
 if(role==='banned')return {state:'banned',label:'Joining unavailable',enabled:false};
 if(role==='pending')return {state:'pending',label:'Requested',enabled:false};
 if(administrator)return {state:'administrator',label:'Circle joining unavailable for app administrators',enabled:false};
 if(hasPendingInvite)return {state:'invitation',label:'Respond to your invitation above',enabled:false};
 if(['private','invite','invite-only','connections'].includes(privacy)||['private','invite','invite-only','connections'].includes(visibility))return {state:'invite',label:'Invite only',enabled:false};
 if(!registrationsOpen)return {state:'closed',label:'Registrations closed',enabled:false};
 if(full)return {state:'full',label:'Circle full',enabled:false};
 if(privacy==='approval')return {state:'request',label:'Request to Join',enabled:true};
 if(['public','open'].includes(privacy))return {state:'join',label:'Join Circle',enabled:true};
 return {state:'unavailable',label:'Joining unavailable',enabled:false};
}
export function experienceAction({attendance,loading=false,error=false,manager=false,visibility,approval=true,full=false,closed=false,cancelled=false,ended=false}={}){
 if(loading)return 'loading';
 if(error)return 'unavailable';
 if(manager)return 'manager';
 if(cancelled)return 'cancelled';
 if(ended)return 'ended';
 if(['confirmed','going'].includes(attendance))return 'confirmed';
 if(['pending','waiting'].includes(attendance))return 'pending';
 if(['banned','removed'].includes(attendance))return 'unavailable';
 if(['private','connections','invite','invite-only'].includes(visibility))return 'invite';
 if(closed)return 'closed';
 if(full)return 'full';
 if(!['public','open','approval'].includes(visibility))return 'unavailable';
 return approval||visibility==='approval'?'request':'join';
}
