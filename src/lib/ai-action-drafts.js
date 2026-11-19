import {callSupabaseRpc} from '@/api/supabaseClient';
export const ACTIONS={circle:'Build a Circle',experience:'Build an Experience',share:'Share on Nmood'};
export function actionOrder(question,answer){
 const text=`${question} ${answer}`.toLowerCase();
 const first=/\b(share|story|moment|reflection)\b/.test(text)?'share':/\b(circle|club|community)\b/.test(text)?'circle':'experience';
 return [first,...Object.keys(ACTIONS).filter(k=>k!==first)];
}
export function draftFields(question,answer){
 const clean=String(answer||'').replace(/\*\*/g,'').slice(0,4000);
 const text=`${question} ${clean}`;
 const activity=[['Camping',/\bcamp(?:ing)?\b/i],['Coffee',/\bcoffee\b/i],['Dinner',/\bdinner\b/i],['BBQ',/\b(?:bbq|barbecue)\b/i],['Birthday',/\bbirthday\b/i],['Hiking',/\bhik(?:e|ing)\b/i],['Picnic',/\bpicnic\b/i]].find(([,r])=>r.test(text))?.[0]||'';
 const checklist=clean.split('\n').filter(l=>/^\s*(?:[-*•]|\d+[.)])\s+/.test(l)).map(l=>l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/,'' )).join('\n');
 const money=clean.match(/(?:AED|USD|EUR|GBP|[$€£])\s*\d[\d,.]*(?:\s*[–-]\s*\d[\d,.]*)?/i)?.[0]||'';
 return {title:activity?`${activity} plan`:String(question||'My plan').replace(/[?]+$/,'').slice(0,120),description:clean,activity,checklist,suggested_audience:'People interested in this activity',estimated_budget:money?`Estimated ${money} — AI suggestion, not a quote`:'',date:'',time:'',exact_location:'',capacity:'',cost:'',visibility:''};
}
export async function actionDraftRequest(operation,{identity,answerRequestId=null,kind=null,data=null,revision=null,signal}={}){
 const r=await callSupabaseRpc('nmood_ai_action_drafts',{p_operation:operation,p_answer_request_id:answerRequestId,p_kind:kind,p_data:data,p_revision:revision},{expectedUserId:identity,signal});
 if(r?.contract!=='ai-action-drafts-1')throw Error('Drafts are unavailable right now. Your AI answer is still here.');
 return r;
}
export function hostDraftFields(d,kind){const visibility=(kind==='circle'?['public','approval','invite']:['public','private','connections']).includes(d.visibility)?d.visibility:'';const capacity=/^unlimited$/i.test(d.capacity||'')?null:/^\d+$/.test(d.capacity||'')&&Number(d.capacity)>=2&&Number(d.capacity)<=100?Number(d.capacity):'';return {title:d.title,description:d.description,whatToExpect:d.activity,whatToBring:d.checklist,aiAudience:d.suggested_audience,aiEstimatedBudget:d.estimated_budget,date:d.date||'',startTime:d.time||'',endTime:'',location:{venueName:d.exact_location||'',address:d.exact_location||'',coordinates:null},capacity,budgetOption:'',customAmount:'',privacy:visibility,budgetType:'estimated'};}
