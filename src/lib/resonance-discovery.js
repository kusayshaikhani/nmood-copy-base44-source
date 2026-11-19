// Presentation-only resonance derived from the already authorized discovery
// projection. It never requests additional member fields or invents a match.
export function sharedResonance(member, viewer) {
  const viewerInterests = new Set((viewer?.interests || []).map(value => String(value).toLowerCase()));
  const viewerLanguages = new Set((viewer?.languages || []).map(value => String(value).toLowerCase()));
  const sharedInterests = (member?.interests || []).filter(value => viewerInterests.has(String(value).toLowerCase()));
  const sharedLanguages = (member?.languages || []).filter(value => viewerLanguages.has(String(value).toLowerCase()));
  const reasons = [];
  if (sharedInterests.length) reasons.push(`You both enjoy ${sharedInterests.slice(0, 2).join(' and ')}`);
  if (sharedLanguages.length) reasons.push(`You both speak ${sharedLanguages.slice(0, 2).join(' and ')}`);
  if (member?.city && viewer?.city && String(member.city).toLowerCase() === String(viewer.city).toLowerCase()) reasons.push(`You are both in ${member.city}`);
  return { sharedInterests, sharedLanguages, reasons };
}

export function orbitBubbles(members, viewer, limit = 6) {
  const viewerInterests = new Set((viewer?.interests || []).map(value => String(value).toLowerCase()));
  const counts = new Map();
  for (const member of members || []) for (const interest of member?.interests || []) {
    const key = String(interest).trim();
    if (!key || !viewerInterests.has(key.toLowerCase())) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([label]) => label);
}
