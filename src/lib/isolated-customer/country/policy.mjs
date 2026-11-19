export const POLICY='isolated-coastal-proximity-v1';
export const COASTAL='coastal_proximity_verified';
export const validMethod=(method,policy)=>method==='device-offline-country-v1' ? policy==null : method===COASTAL&&policy===POLICY;
