// Exact Stage 1 allowlist shared by the client and authoritative server validation.
export const STAGE1_COUNTRIES = Object.freeze(['AE','SA','QA','KW','BH','OM','US','CA','GB','IE','NZ','FR','DE','NL','BE','CH','AT','AR','LB','EG']);
export function normalizeStage1Phone(raw,country,parsePhone){
 if(!STAGE1_COUNTRIES.includes(country)||typeof raw!=='string')throw Error('invalid_phone');
 const value=raw.trim().replace(/[\s()-]/g,'').replace(/^00/,'+');
 if(!/^\+?[0-9]+$/.test(value))throw Error('invalid_phone');
 const parsed=parsePhone(value,{defaultCountry:country,extract:false});
 if(!parsed?.isValid()||parsed.country!==country||parsed.ext||!/^\+[1-9][0-9]{6,14}$/.test(parsed.number))throw Error('invalid_phone');
 return parsed.number;
}
