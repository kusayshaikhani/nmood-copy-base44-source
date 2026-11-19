// Use only the same required criteria as the completeness percentage.
export function getProfileCompletionSteps({ completeness, onCompleteDetails }) {
 return completeness.missing.filter(item=>item.target!=='phone'&&item.target!=='email').map(item=>({
  key:item.key, label:`${item.label} remaining — ${Number(item.contribution.toFixed(2))}%`,
  action:()=>onCompleteDetails(item.target),
 }));
}
