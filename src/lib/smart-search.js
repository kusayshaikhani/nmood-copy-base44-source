// Local, deterministic interpretation. No network, storage, analytics or AI provider.
// Values are controlled search terms, never inferred attributes or venue prices.
const ZODIAC = 'aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces'.split(' ');
const LANGUAGES = 'English Arabic French Spanish German Hindi Urdu Turkish Russian Chinese Japanese Portuguese Italian Korean Persian Bengali Indonesian Malay Tagalog Dutch Swedish Hebrew Polish'.split(' ');
export const SMART_ACTIVITIES = {
 coffee: ['coffee', 'café', 'cafe'], camping: ['camping', 'camp'], salsa: ['salsa'],
 outdoor: ['outdoor', 'outdoors'], food: ['food', 'dining'], sports: ['sports', 'sport'],
 music: ['music'], art: ['art'], networking: ['networking'], learning: ['learning'],
 photography: ['photography'], travel: ['travel'], gaming: ['gaming'], business: ['business'],
 wellness: ['wellness'], movies: ['movies', 'movie', 'cinema'], shopping: ['shopping'],
 hiking: ['hiking', 'hike'], walking: ['walking', 'walk'], fitness: ['fitness'],
};
// Existing Nmood area choices; no third-party lookup. Additional public venue names
// can be supplied from an already-authorized Nmood catalogue, never private locations.
export const SMART_PUBLIC_PLACES = ['Dubai Marina', 'Downtown', 'JVC', 'Business Bay'];
export const SMART_KEYS = ['smart_activity','smart_language','smart_zodiac','smart_age_min','smart_age_max','smart_place','smart_time_from','smart_time_to','smart_budget_min','smart_budget_max','smart_budget_under'];
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stamp = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
export function smartTimeRange(intent, now = new Date()) {
 const start = new Date(now); start.setHours(0,0,0,0);
 const end = new Date(start); end.setDate(end.getDate()+1);
 if (intent === 'tonight') start.setHours(18);
 if (intent === 'tomorrow') { start.setDate(start.getDate()+1); end.setDate(end.getDate()+1); }
 if (intent === 'this weekend') {
  const day=start.getDay(); start.setDate(start.getDate()+(day===0?-1:(6-day)));
  end.setTime(start.getTime()); end.setDate(end.getDate()+2);
 }
 if (intent === 'upcoming') return {smart_time_from:[stamp(now)]};
 return {smart_time_from:[stamp(start)],smart_time_to:[stamp(end)]};
}
/** Interpret English query syntax; unknown words remain literal search terms. */
export function interpretSmartSearch(input, {now = new Date(), publicPlaces = SMART_PUBLIC_PLACES} = {}) {
 const text = typeof input === 'string' ? input.normalize('NFKC').trim() : '';
 const chips = []; const issues = []; let rest = text.replace(/^(?:please\s+)?(?:find(?:\s+me)?|show\s+me|look\s+for|i(?:’|')m\s+looking\s+for|i\s+am\s+looking\s+for)\s+/i, '');
 if (text.length>200) return {chips,query:'',issues:['Use 200 characters or fewer.']};
 // Do not silently turn negation or alternatives into positive AND filters.
 if (/\b(?:not|except|without|excluding|or)\b/i.test(text)) return {chips,query:text,issues:['Use positive filters joined with AND; alternatives and exclusions need clarification.']};
 const consume = (pattern, make) => { rest = rest.replace(pattern, (...args) => {
  const chip = make(args); if (chip) chips.push({...chip,id:`${chip.type}:${chips.length}`}); return ' ';
 }); };
 consume(/\b(?:people|someone|anyone|persons?|members?|pals|circles?|experiences?|gatherings?|nmood\s+shares|shares|posts)\b/gi, ([raw]) => {
  const word=raw.toLowerCase(); const value=/people|someone|anyone|person|member|pal/.test(word)?'people':word.startsWith('circle')?'circles':/experience|gathering/.test(word)?'experiences':'posts';
  return {type:'kind',value,label:({people:'People',circles:'Circles',experiences:'Experiences',posts:'Nmood Shares'})[value],filters:{}};
 });
 consume(/\bunder\s+AED\s*(\d+(?:\.\d{1,2})?)\b(?![\d.])/gi, ([,n])=>({type:'budget',label:`Under AED ${+n}`,filters:{smart_budget_under:[String(+n)]}}));
 consume(/\bAED\s*(\d+(?:\.\d{1,2})?)\s*[-–—]\s*(\d+(?:\.\d{1,2})?)\b(?![\d.])/gi, ([,a,b])=>{
  if(+a>+b){issues.push('Put the smaller AED amount first.');return null;}
  return {type:'budget',label:`AED ${+a}–${+b}`,filters:{smart_budget_min:[String(+a)],smart_budget_max:[String(+b)]}};
 });
 consume(/\bfree\b/gi,()=>({type:'budget',label:'Free',filters:{smart_budget_min:['0'],smart_budget_max:['0']}}));
 consume(/\b(older\s+than|younger\s+than)\s+(\d{1,3})(?:\s+years?(?:\s+old)?)?\b(?![\d.])/gi, ([,comparison,n]) => {
  const older=/older/i.test(comparison),age=+n;
  if(age<18||age>99||(older&&age===99)||(!older&&age===18)){issues.push('Use an age comparison within the supported range of 18 to 99.');return null;}
  return {type:'age',label:older?`Older than ${age}`:`Younger than ${age}`,filters:{smart_age_min:[String(older?age+1:18)],smart_age_max:[String(older?99:age-1)]}};
 });
 consume(/\b(?:aged?\s+)?(\d{1,3})\s*(?:to|[-–—])\s*(\d{1,3})\s*(?:years?(?:\s+old)?)?\b/gi, ([raw,a,b]) => {
  if (!/age|years/i.test(raw)) { issues.push('Specify “aged” for an age range or “AED” for a budget range.'); return null; }
  if (+a<18||+b>99||+a>+b) {issues.push('Use an age range from 18 to 99, with the minimum first.');return null;}
  return {type:'age',label:`Age ${+a}–${+b}`,filters:{smart_age_min:[String(+a)],smart_age_max:[String(+b)]}};
 });
 consume(/(?:^|[^\d.\-])\b(?:aged?\s+(\d{1,3})(?:\s+years?(?:\s+old)?)?|(\d{1,3})\s+years?(?:\s+old)?)\b(?![\d.])/gi, ([,a,b]) => {
  const age=+(a||b); if(age<18||age>99){issues.push('Use an age from 18 to 99.');return null;}
  return {type:'age',label:`Age ${age}`,filters:{smart_age_min:[String(age)],smart_age_max:[String(age)]}};
 });
 consume(/\b(this\s+weekend|today|tonight|tomorrow|upcoming)\b/gi, ([v])=>{const intent=v.toLowerCase().replace(/\s+/g,' ');return {type:'time',label:intent[0].toUpperCase()+intent.slice(1),filters:smartTimeRange(intent,now)};});
 consume(new RegExp(`\\b(${ZODIAC.join('|')})\\b`,'gi'),([v])=>({type:'zodiac',label:v[0].toUpperCase()+v.slice(1).toLowerCase(),filters:{smart_zodiac:[v.toLowerCase()]}}));
 consume(new RegExp(`\\b(${LANGUAGES.join('|')})(?:[- ]speaking|\\s+speakers?)?\\b`,'gi'),([,v])=>({type:'language',label:`Language: ${v[0].toUpperCase()+v.slice(1).toLowerCase()}`,filters:{smart_language:v.toLowerCase()==='tagalog'?['tagalog','filipino']:[v.toLowerCase()]}}));
 for(const place of [...publicPlaces].filter(p=>typeof p==='string'&&p.length<=100).sort((a,b)=>b.length-a.length)) {
  consume(new RegExp(`\\b(?:(?:near|in|around)\\s+)?${escape(place)}\\b`,'gi'),()=>({type:'place',label:`Public place: ${place}`,filters:{smart_place:[place]}}));
 }
 for(const [activity,aliases] of Object.entries(SMART_ACTIVITIES)) {
  consume(new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${aliases.map(escape).join('|')})(?![\\p{L}\\p{N}_])`,'giu'),()=>({type:'activity',label:`Activity: ${activity}`,filters:{smart_activity:[activity]}}));
 }
 if (/\b(?:older|younger)\b/i.test(rest)) issues.push('Use a whole age, for example “someone older than 45”.');
 if(chips.some(c=>c.type==='age')&&!chips.some(c=>c.type==='kind')) chips.push({id:`kind:${chips.length}`,type:'kind',value:'people',label:'People',filters:{}});
 if (/\b(?:AED|aged?|years?|under)\b/i.test(rest)) issues.push('Check the age or budget syntax: “aged 30 to 40”, “under AED 200”, or “AED 50–100”.');
 for(const type of ['age','budget','time','kind']) if(chips.filter(c=>c.type===type).length>1) issues.push(`Use one ${type==='kind'?'result type':type} filter at a time.`);
 // Only grammatical glue is removed; meaningful unknown words are never guessed.
 if(chips.length) rest=rest.replace(/\b(?:who|like|likes|speaking|activities|and)\b/gi,' ');
 rest=rest.replace(/\s+/g,' ').trim();
 return {chips,query:rest,issues:[...new Set(issues)]};
}
export function activeSmartFilters(chips, dismissed = []) {
 const filters = {};
 for(const chip of chips.filter(c=>!dismissed.includes(c.id))) for(const [key,values] of Object.entries(chip.filters)) filters[key]=[...new Set([...(filters[key]||[]),...values])];
 return filters;
}

// Conflicting interpretations can be corrected by removing one of their chips.
export function smartSearchIssues(interpreted, dismissed = []) {
 const remaining=interpreted.chips.filter(c=>!dismissed.includes(c.id));
 return interpreted.issues.filter(issue=>{
  for(const type of ['age','budget','time','kind']) {
   const message=`Use one ${type==='kind'?'result type':type} filter at a time.`;
   if(issue===message) return remaining.filter(c=>c.type===type).length>1;
  }
  return true;
 });
}
