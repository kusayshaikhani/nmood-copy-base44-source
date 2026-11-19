// Local intent routing; no provider call while typing and no inferred location.
export function siRoute(value) {
 const text=typeof value==='string'?value.trim():'';
 const planning=/\b(first dates?|date ideas?|bbqs?|barbecues?|birthdays?|packing|pack|bring|checklist|budget|plan|planning|ideas?|prepare)\b/i.test(text)||/\bcamping with\b/i.test(text);
 const venue=/\b(restaurants?|caf[eé]s?|venues?|campsites?)\b/i.test(text)||/\b(where|find|near|nearby|in)\b.*\b(coffee|dinner|camping|hiking|beach|nightlife|food)\b/i.test(text)||/\b(coffee|dinner|camping|hiking|beach|nightlife|food)\b.*\b(in|near|nearby)\b/i.test(text);
 const practical=/\b(packing|pack|bring|checklist|prepare)\b/i.test(text)||/\bwhat\s+(?:should|can|do)\s+(?:i|we)\s+(?:take|need)\b/i.test(text);
 const advice=/\b(?:how\s+(?:can|should|do|would)\s+(?:i|we)|what\s+(?:should|can|could|do|would)\s+(?:i|we)|where\s+(?:can|should|could)\s+(?:i|we)\s+(?:camp|go|stay)|help\s+(?:me|us)\s+(?:plan|prepare)|suggest\s+(?:a|some)\s+(?:plan|ideas?))\b/i.test(text);
 const content=/\b(people|profiles?|circles?|experiences?|shares?)\b/i.test(text);
 return practical||advice?'planning':content?'internal':venue?'venue':planning?'planning':'internal';
}
export function planningPrompt(question) {
 return `General social-planning help only. Respect the stated budget and group size. Label every money figure as an estimate, not a quote. Never name or invent venues, exact venue prices, reviews, availability or Nmood results. Give a concise useful plan or packing checklist. Question: ${question.trim().slice(0,200)}`;
}
