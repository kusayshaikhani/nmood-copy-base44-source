// Local planning context only. Never expands server-authorized search filters.
export function discoveryIntent(input) {
 const text=typeof input==='string'?input.normalize('NFKC').trim().slice(0,200):'';
 const activity=text.match(/\b(coffee|camping|hiking|beach|nightlife|restaurants?|dinner|dining|food)\b/i)?.[0]?.toLowerCase()||null;
 const city=text.match(/\b(Dubai(?: Marina)?|Ajman|Abu Dhabi|Sharjah|Business Bay|JVC|Downtown)\b/i)?.[0]||null;
 const moods=[...text.matchAll(/\b(quiet|romantic|relaxed|social|adventurous)\b/gi)].map(m=>m[0].toLowerCase());
 const size=text.match(/\b(?:for|group of)\s+(\d{1,2})\s*(?:people|friends|guests)?\b/i);
 const group=size?Number(size[1]):/\bwith friends\b/i.test(text)?'Friends':null;
 const time=text.match(/\b(tonight|today|tomorrow|this weekend|upcoming)\b/i)?.[0]||null;
 const budget=text.match(/\bunder\s+AED\s*(\d+(?:\.\d{1,2})?)\b/i)?.[1]||null;
 return {activity,city,moods,group,time,budget,labels:[activity,city,...moods,group&&`Group: ${group}`,time,budget&&`Budget preference: under AED ${budget}`].filter(Boolean)};
}
