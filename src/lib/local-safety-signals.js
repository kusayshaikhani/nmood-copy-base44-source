export const LOCAL_SAFETY_RULE_VERSION = 'nmood-local-safety-2026-09-v1';

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };
export function normalizeSafetyText(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .replace(/[013457@$]/g, (c) => LEET[c] || c)
    .replace(/\b(?:[a-z]\s+){2,}[a-z]\b/g, (m) => m.replace(/\s/g, ""))
    .replace(/\s+/g, ' ').trim().slice(0, 4000);
}

const has = (text, pattern) => pattern.test(text);
const signal = (category, confidence, decision, rule) => ({ category, confidence, decision, rule, ruleVersion: LOCAL_SAFETY_RULE_VERSION });

export function detectLocalSafetySignals(input, metadata = {}) {
  const text = normalizeSafetyText(input);
  const compact = text.replace(/[^a-z0-9:/._-]/g, '');
  const scan = text + ' ' + compact;
  const out = [];
  if (has(scan, /\b(?:pay|cash|money|price|rate|per hour)\b.{0,45}\b(?:sex|escort|hookup|sexual service)\b|\b(?:escort|sexual service)\b.{0,45}\b(?:pay|cash|money|price|rate)\b/)) out.push(signal('sexual_solicitation', .98, 'hold', 'paid-sex-explicit'));
  if (has(scan, /\b(?:child|kid|minor|under ?1[0-7]|(?:1[0-7]) ?year old)\b.{0,55}\b(?:nude|sexual|sex|explicit)\b|\b(?:nude|explicit)\b.{0,55}\b(?:child|kid|minor|under ?1[0-7])\b/)) out.push(signal('child_safety_concern', .99, 'hold', 'minor-sexual-content'));
  if (has(scan, /\b(?:i(?: will|'ll)?|im going to|going to)\s+(?:kill|shoot|stab|bomb|hurt)\s+(?:you|your|them|him|her)\b|\b(?:kill|shoot|stab) you (?:tonight|tomorrow|at your|when i)\b/)) out.push(signal('threats_violence', .97, 'hold', 'credible-direct-threat'));
  if (has(scan, /\b(?:send|pay|give)\b.{0,40}\b(?:money|cash|bitcoin|crypto)\b.{0,60}\b(?:or|otherwise)\b.{0,45}\b(?:post|share|send|leak|expose)\b.{0,35}\b(?:nude|secret)\b|\b(?:sextort|blackmail)\b/)) out.push(signal('non_consensual_intimate_content', .99, 'hold', 'blackmail-sextortion'));
  if (has(scan, /\b(?:wire|transfer|send)\b.{0,35}\b(?:money|funds|crypto|bitcoin|gift cards?)\b.{0,55}\b(?:fee|unlock|release|refund|prize|investment|guaranteed)\b|\b(?:bank|card)\b.{0,20}\b(?:otp|pin|password|verification code)\b/)) out.push(signal('scam_fraud', .95, 'hold', 'payment-fraud'));
  if (has(scan, /\b(?:login|verify|secure|unlock|claim)\b.{0,35}(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:zip|top|click|xyz|mov)\b)|(?:https?:\/\/)?(?:bit\.ly|tinyurl\.com|t\.co)\/.{2,}/)) out.push(signal('scam_fraud', .94, 'hold', 'phishing-link'));
  if (has(scan, /\b(?:buy|sell|ship|deliver|price)\b.{0,45}\b(?:cocaine|heroin|meth|fentanyl|illegal weapon|stolen cards?|fake passport)\b|\b(?:cocaine|heroin|meth|fentanyl)\b.{0,45}\b(?:buy|sell|ship|deliver|price)\b/)) out.push(signal('illegal_goods_services', .97, 'hold', 'illegal-commerce'));
  const links = (text.match(/(?:https?:\/\/|www\.)/g) || []).length;
  if ((metadata.messagesLastMinute || 0) >= 30) out.push(signal('spam', .96, 'hold', 'extreme-send-rate'));
  else if ((metadata.recentDuplicateCount || 0) >= 3 || links >= 4 || (metadata.messagesLastMinute || 0) >= 12) out.push(signal('spam', .88, 'flag', 'spam-rate-or-links'));
  if (!out.length && (compact.includes('verifyaccount'))) out.push(signal('scam_fraud', .64, 'flag', 'possible-evasion-financial'));
  return out.sort((a, b) => b.confidence - a.confidence);
}

export function localSafetyDecision(input, metadata) {
  const signals = detectLocalSafetySignals(input, metadata);
  return { decision: signals.some((s) => s.decision === 'hold') ? 'hold' : signals.length ? 'flag' : 'allow', signals };
}
