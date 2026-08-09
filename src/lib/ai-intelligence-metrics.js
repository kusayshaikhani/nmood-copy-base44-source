/**
 * FM-007 — AI Intelligence Center metrics. Live sections (Member Insights,
 * AI Knowledge) are computed from entity data; AI telemetry sections return
 * `null` placeholders so the UI can mark them as awaiting future telemetry.
 */
import { APP_VERSION } from '@/lib/system-config';

const DAY = 86400000;

function topCounts(arr, field, limit = 8) {
  const counts = {};
  arr.forEach((x) => {
    const v = x[field];
    if (v) counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function topCountsArray(arr, field, limit = 8) {
  const counts = {};
  arr.forEach((x) => (x[field] || []).forEach((v) => { counts[v] = (counts[v] || 0) + 1; }));
  return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

function ageFromDob(dob) {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (Number.isNaN(t)) return null;
  const age = Math.floor((Date.now() - t) / (365.25 * DAY));
  return age > 0 && age < 120 ? age : null;
}

export function computeOverview() {
  return {
    aiStatus: null,
    availability: null,
    requestsToday: null,
    activeSessions: null,
    recommendationsGenerated: null,
    recommendationsAccepted: null,
    avgResponseTime: null,
    avgConfidence: null,
  };
}

export const AI_SERVICES = [
  { key: 'recommendation', name: 'Recommendation Engine', icon: 'Sparkles' },
  { key: 'discovery', name: 'Discovery AI', icon: 'ScanSearch' },
  { key: 'matching', name: 'Matching Engine', icon: 'Users' },
  { key: 'search', name: 'Search Intelligence', icon: 'Search' },
  { key: 'translation', name: 'Translation Services', icon: 'Languages' },
  { key: 'notification', name: 'Notification Intelligence', icon: 'Bell' },
  { key: 'safety', name: 'AI Safety Filters', icon: 'ShieldAlert' },
];

export function computeHealth(error) {
  return AI_SERVICES.map((s) => ({ ...s, status: 'unknown', detail: 'Awaiting telemetry' }));
}

export function computeRecommendationPerformance() {
  return {
    total: null, accepted: null, ignored: null, saved: null,
    ctr: null, acceptanceRate: null, avgScore: null,
  };
}

export function sampleTrend(seed = 80) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((d, i) => ({ day: d, value: Math.round(seed + Math.sin(i) * 6 + i) }));
}

export function computeMemberInsights(members, experiences, circles, filters = {}) {
  const since = filters.dateFrom ? new Date(filters.dateFrom).getTime() : Date.now() - 30 * DAY;
  const until = filters.dateTo ? new Date(filters.dateTo).getTime() + DAY : Date.now();
  const inRange = (d) => d && (() => { const t = new Date(d).getTime(); return t >= since && t <= until; })();

  let scopedMembers = members;
  if (filters.country) scopedMembers = scopedMembers.filter((m) => (m.country || '').toLowerCase() === filters.country.toLowerCase());
  if (filters.language) scopedMembers = scopedMembers.filter((m) => (m.languages || []).some((l) => l.toLowerCase() === filters.language.toLowerCase()));

  const popularInterests = topCountsArray(scopedMembers, 'interests', 8);
  const recentMembers = scopedMembers.filter((m) => inRange(m.created_date));
  const emergingInterests = topCountsArray(recentMembers, 'interests', 6);
  const trendingCategories = topCounts(experiences.filter((e) => inRange(e.created_date)), 'category', 6);
  const popularExperiences = [...experiences].filter((e) => (e.spots_filled || 0) > 0).sort((a, b) => (b.spots_filled || 0) - (a.spots_filled || 0)).slice(0, 6).map((e) => ({ name: e.title, count: e.spots_filled || 0 }));
  const popularCircles = [...circles].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 6).map((c) => ({ name: c.name, count: c.member_count || 0 }));

  const ageBands = ['18–24', '25–34', '35–44', '45+'];
  const ageCounts = { '18–24': 0, '25–34': 0, '35–44': 0, '45+': 0 };
  scopedMembers.forEach((m) => {
    const age = ageFromDob(m.date_of_birth);
    if (age == null) return;
    if (age <= 24) ageCounts['18–24']++;
    else if (age <= 34) ageCounts['25–34']++;
    else if (age <= 44) ageCounts['35–44']++;
    else ageCounts['45+']++;
  });
  const byAgeGroup = ageBands.map((b) => ({ name: b, count: ageCounts[b] }));
  const byCountry = topCounts(scopedMembers, 'country', 6);
  const byLanguage = topCountsArray(scopedMembers, 'languages', 6);

  return { popularInterests, emergingInterests, trendingCategories, popularExperiences, popularCircles, byAgeGroup, byCountry, byLanguage };
}

export function computeAiQuality() {
  return {
    confidenceDistribution: null,
    lowConfidenceResults: null,
    accuracy: null,
    diversity: null,
    freshness: null,
    duplicateDetection: null,
  };
}

export function computeAiSafety() {
  return {
    safetyFlags: null,
    blockedResponses: null,
    sensitiveContentEvents: null,
    biasAlerts: null,
    harmPreventionEvents: null,
    policyViolations: null,
  };
}

export function computeModelPerformance() {
  return {
    avgProcessingTime: null,
    queueLength: null,
    errorRate: null,
    timeoutRate: null,
    successRate: null,
    peakLoad: null,
  };
}

export const PROMPT_LIBRARY = [
  { name: 'Experience Recommendation', version: '1.2.0', status: 'active', lastUpdated: '2026-06-01', usedBy: 'Discover, Home' },
  { name: 'Circle Suggestion', version: '1.0.3', status: 'active', lastUpdated: '2026-05-20', usedBy: 'Circles, Home' },
  { name: 'Member Match', version: '2.1.0', status: 'active', lastUpdated: '2026-06-15', usedBy: 'Pals, Matchmaker' },
  { name: 'Concierge Brief', version: '1.4.0', status: 'active', lastUpdated: '2026-06-10', usedBy: 'Concierge' },
  { name: 'Nmood Entry', version: '1.1.0', status: 'beta', lastUpdated: '2026-06-25', usedBy: 'Nmood' },
  { name: 'Safety Filter', version: '1.0.0', status: 'active', lastUpdated: '2026-04-01', usedBy: 'AI Safety' },
];

export function computeAiKnowledge(members, experiences, circles) {
  const interests = new Set();
  members.forEach((m) => (m.interests || []).forEach((i) => interests.add(i)));
  const expCats = new Set();
  experiences.forEach((e) => e.category && expCats.add(e.category));
  const circleCats = new Set();
  circles.forEach((c) => c.category && circleCats.add(c.category));
  return {
    activeInterests: { name: `${interests.size} interests`, count: interests.size, list: [...interests].slice(0, 10) },
    experienceCategories: { name: `${expCats.size} categories`, count: expCats.size, list: [...expCats].slice(0, 10) },
    circleCategories: { name: `${circleCats.size} categories`, count: circleCats.size, list: [...circleCats].slice(0, 10) },
    semanticConcepts: null,
    languageModels: null,
    translationCoverage: null,
  };
}

export function computeAiAlerts(error) {
  const alerts = [];
  if (error) alerts.push({ level: 'critical', title: 'AI data load error — metrics unavailable', detail: 'Could not fetch entity data for insight computation.' });
  return alerts;
}

export const FUTURE_AI_FEATURES = [
  { name: 'Prompt Studio', icon: 'FileText' },
  { name: 'AI Model Management', icon: 'Cpu' },
  { name: 'A/B Testing', icon: 'FlaskConical' },
  { name: 'Recommendation Weight Tuning', icon: 'Sliders' },
  { name: 'Semantic Search Tuning', icon: 'ScanSearch' },
  { name: 'AI Learning Reports', icon: 'GraduationCap' },
  { name: 'Personalization Controls', icon: 'Wrench' },
  { name: 'Explainable AI', icon: 'Eye' },
];

export function filterOptions(members) {
  const countries = [...new Set(members.map((m) => m.country).filter(Boolean))].sort().map((c) => ({ value: c, label: c }));
  const langs = new Set();
  members.forEach((m) => (m.languages || []).forEach((l) => langs.add(l)));
  const languages = [...langs].sort().map((l) => ({ value: l, label: l }));
  return { countries, languages };
}

function esc(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }

export function exportAiCsv(insights, knowledge) {
  const lines = ['Section,Item,Count'];
  insights.popularInterests.forEach((r) => lines.push(`Popular Interests,${esc(r.name)},${r.count}`));
  insights.trendingCategories.forEach((r) => lines.push(`Trending Categories,${esc(r.name)},${r.count}`));
  insights.popularExperiences.forEach((r) => lines.push(`Popular Experiences,${esc(r.name)},${r.count}`));
  insights.popularCircles.forEach((r) => lines.push(`Popular Circles,${esc(r.name)},${r.count}`));
  insights.byCountry.forEach((r) => lines.push(`Engagement by Country,${esc(r.name)},${r.count}`));
  insights.byLanguage.forEach((r) => lines.push(`Engagement by Language,${esc(r.name)},${r.count}`));
  insights.byAgeGroup.forEach((r) => lines.push(`Engagement by Age,${esc(r.name)},${r.count}`));
  if (knowledge.activeInterests) lines.push(`AI Knowledge,Active Interests,${knowledge.activeInterests.count}`);
  if (knowledge.experienceCategories) lines.push(`AI Knowledge,Experience Categories,${knowledge.experienceCategories.count}`);
  if (knowledge.circleCategories) lines.push(`AI Knowledge,Circle Categories,${knowledge.circleCategories.count}`);
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `nmood-ai-intelligence-${Date.now()}.csv`);
}

export async function exportAiPdf(insights, knowledge) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text('Nmood AI Intelligence Report', 14, 20);
  doc.setFontSize(10); doc.text(`Version ${APP_VERSION} · ${new Date().toLocaleString()}`, 14, 28);
  let y = 40;
  const write = (title, rows) => {
    doc.setFontSize(12); doc.text(title, 14, y); y += 6;
    doc.setFontSize(9);
    rows.forEach((r) => { doc.text(`${r.name}: ${r.count}`, 18, y); y += 5; });
    y += 3;
  };
  write('Popular Interests', insights.popularInterests);
  write('Trending Categories', insights.trendingCategories);
  write('Popular Experiences', insights.popularExperiences);
  write('Engagement by Country', insights.byCountry);
  if (knowledge.activeInterests) { doc.setFontSize(12); doc.text('AI Knowledge', 14, y); y += 6; doc.setFontSize(9); doc.text(`Active Interests: ${knowledge.activeInterests.count}`, 18, y); y += 5; doc.text(`Experience Categories: ${knowledge.experienceCategories.count}`, 18, y); y += 5; doc.text(`Circle Categories: ${knowledge.circleCategories.count}`, 18, y); }
  doc.save(`nmood-ai-intelligence-${Date.now()}.pdf`);
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}