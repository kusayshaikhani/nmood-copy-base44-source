// Fixed diagnostic categories only. No location, country identifiers, distances,
// account data, original exceptions, or evidence are attached or persisted.
const reasons=new Set(['OTHER_COUNTRY_GUARD','NO_LAND_MATCH','EXACT_BOUNDARY','OVERLAPPING_COUNTRIES','DISPUTED_AREA_GUARD','DISPUTED_LINE_GUARD','UNSUPPORTED_COUNTRY','DATA_FORMAT_INVALID','POSITION_INVALID','INTERNAL_GEOMETRY_FAILURE']);
export function safeBoundaryReason(value){return reasons.has(value)?value:'INTERNAL_GEOMETRY_FAILURE';}
export function boundaryFailure(reason){const error=Error('unavailable');error.boundaryReason=safeBoundaryReason(reason);return error;}
