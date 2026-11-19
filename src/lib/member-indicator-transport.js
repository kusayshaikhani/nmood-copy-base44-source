// No logging, telemetry, storage, or network calls in this boundary.
export function indicatorFailure(){return new Error('Could not update sharing. Please retry.');}
export function validateCoarseCell(cell){
 if(!cell||typeof cell!=='object'||Array.isArray(cell)||Object.keys(cell).sort().join(',')!=='x,y,z')throw indicatorFailure();
 if(!['x','y','z'].every(k=>Number.isInteger(cell[k])&&Math.abs(cell[k])<=1275))throw indicatorFailure();
 const length=Math.hypot(cell.x,cell.y,cell.z);
 if(length<1273||length>1276)throw indicatorFailure();
 return {x:cell.x,y:cell.y,z:cell.z};
}
export function coarseCellFromPosition(position){
 try{
  const latitude=position?.coords?.latitude,longitude=position?.coords?.longitude;
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw indicatorFailure();
  const lat=latitude*Math.PI/180,lon=longitude*Math.PI/180;
  return validateCoarseCell({x:Math.round(6371*Math.cos(lat)*Math.cos(lon)/5),y:Math.round(6371*Math.cos(lat)*Math.sin(lon)/5),z:Math.round(6371*Math.sin(lat)/5)});
 }catch{throw indicatorFailure();}
}
export function validateIndicatorRequest(name,args){
 const schemas={nmood_withdraw_my_coarse_location:[],nmood_get_my_indicator_preferences:[],nmood_set_my_indicator_consent:['p_distance','p_presence','p_distance_calculation'],nmood_refresh_my_foreground_presence:['p_consent_revision'],nmood_refresh_my_coarse_location:['p_cell','p_consent_revision']};
 const keys=schemas[name];
 if(!keys||!args||Object.keys(args).sort().join(',')!==[...keys].sort().join(','))throw indicatorFailure();
 if(keys.includes('p_consent_revision')&&(typeof args.p_consent_revision!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.p_consent_revision)))throw indicatorFailure();
 if(name==='nmood_set_my_indicator_consent'&&!keys.every(k=>args[k]===null||typeof args[k]==='boolean'))throw indicatorFailure();
 return name==='nmood_refresh_my_coarse_location'?{p_cell:validateCoarseCell(args.p_cell),p_consent_revision:args.p_consent_revision}:{...args};
}

// Reject stale/invalid device fixes before converting; raw values never leave this function.
export function freshCoarseCellFromPosition(position,now=Date.now()) {
 if(!Number.isFinite(position?.timestamp)||position.timestamp>now+5000||now-position.timestamp>60000||!Number.isFinite(position?.coords?.accuracy)||position.coords.accuracy<0||position.coords.accuracy>5000)throw indicatorFailure();
 return coarseCellFromPosition(position);
}
