import { ShieldCheck, Zap, Clock, Users, Star } from 'lucide-react';

export const readinessSections = [
  { id: 'platform', name: 'Platform Health', score: 85, status: 'ready', description: 'Core platform stability' },
  { id: 'security', name: 'Security', score: 92, status: 'ready', description: 'Security audit and compliance' },
  { id: 'performance', name: 'Performance', score: 72, status: 'in_progress', description: 'Load testing and optimization' },
  { id: 'content', name: 'Content', score: 90, status: 'ready', description: 'Content review and guidelines' },
  { id: 'trust', name: 'Trust & Safety', score: 88, status: 'ready', description: 'Reporting and moderation' },
  { id: 'membership', name: 'Membership', score: 95, status: 'ready', description: 'Tiers and permissions' },
  { id: 'hosting', name: 'Hosting', score: 78, status: 'in_progress', description: 'Host platform and tools' },
  { id: 'ai', name: 'AI Readiness', score: 40, status: 'not_started', description: 'Future AI features' },
];

export const overallScore = Math.round(readinessSections.reduce((sum, s) => sum + s.score, 0) / readinessSections.length);

export const checklistItems = [
  { id: 'auth', name: 'Authentication', status: 'completed', notes: 'Login, register, OTP, password reset all functional' },
  { id: 'profile', name: 'Profile', status: 'completed', notes: 'Member profile, trust verification, photo gallery' },
  { id: 'activities', name: 'Activities', status: 'completed', notes: 'Experience details, join flow, my experiences' },
  { id: 'circles', name: 'Circles', status: 'completed', notes: 'Circle creation, discovery, detail pages' },
  { id: 'messaging', name: 'Messaging', status: 'in_progress', notes: 'Chat UI complete, real-time sync pending' },
  { id: 'notifications', name: 'Notifications', status: 'completed', notes: 'Notification center, settings, filters' },
  { id: 'calendar', name: 'Calendar', status: 'completed', notes: 'Agenda, week, month views functional' },
  { id: 'hosting', name: 'Hosting', status: 'in_progress', notes: 'Wizard complete, dashboard analytics pending' },
  { id: 'admin', name: 'Admin', status: 'completed', notes: 'Full admin console with 12 modules' },
  { id: 'subscriptions', name: 'Subscriptions', status: 'ready', notes: 'Membership tiers UI ready, payment integration pending' },
  { id: 'trust_safety', name: 'Trust & Safety', status: 'ready', notes: 'Safety center, reporting, guidelines complete' },
  { id: 'accessibility', name: 'Accessibility', status: 'in_progress', notes: 'Keyboard nav done, screen reader testing pending' },
  { id: 'performance', name: 'Performance', status: 'blocked', notes: 'Blocked by image optimization issues' },
];

export const knownIssues = [
  { id: 'ISS-001', title: 'Real-time messaging not synced', priority: 'high', status: 'in_progress', assigned: 'Backend Team', sprint: 'Sprint 14' },
  { id: 'ISS-002', title: 'Image upload size limit exceeded', priority: 'medium', status: 'open', assigned: 'Frontend Team', sprint: 'Sprint 14' },
  { id: 'ISS-003', title: 'Dark mode flash on initial load', priority: 'low', status: 'open', assigned: 'Frontend Team', sprint: 'Sprint 15' },
  { id: 'ISS-004', title: 'Calendar timezone offset', priority: 'medium', status: 'in_progress', assigned: 'Backend Team', sprint: 'Sprint 14' },
  { id: 'ISS-005', title: 'Push notification delivery delay', priority: 'high', status: 'open', assigned: 'DevOps', sprint: 'Sprint 15' },
  { id: 'ISS-006', title: 'Profile photo compression', priority: 'low', status: 'resolved', assigned: 'Frontend Team', sprint: 'Sprint 13' },
  { id: 'ISS-007', title: 'Admin search performance on large datasets', priority: 'medium', status: 'open', assigned: 'Backend Team', sprint: 'Sprint 15' },
];

export const releases = [
  { id: 1, name: 'Internal', status: 'completed', date: '2026-05-15', description: 'Internal team testing', progress: 100 },
  { id: 2, name: 'Alpha', status: 'completed', date: '2026-06-01', description: 'Closed alpha with select testers', progress: 100 },
  { id: 3, name: 'Closed Beta', status: 'in_progress', date: '2026-07-10', description: 'Invited beta testers', progress: 65 },
  { id: 4, name: 'Open Beta', status: 'not_started', date: '2026-08-15', description: 'Public beta registration', progress: 0 },
  { id: 5, name: 'Production', status: 'not_started', date: '2026-09-01', description: 'Public launch', progress: 0 },
];

export const buildNotes = [
  { id: 1, version: 'v0.3.0', release: 'Closed Beta', date: '2026-07-04', features: ['Admin Portal', 'Operations Center', 'Membership tiers', 'Safety Center'], bugFixes: ['Profile loading issue', 'Sidebar mobile responsive fix'], breakingChanges: ['None'], knownIssues: ['Real-time messaging pending'] },
  { id: 2, version: 'v0.2.0', release: 'Alpha', date: '2026-06-01', features: ['Circles module', 'Messaging', 'Calendar', 'Notifications Center'], bugFixes: ['Onboarding redirect loop', 'Theme persistence'], breakingChanges: ['Navigation renamed to Explore'], knownIssues: ['Image upload size limit'] },
  { id: 3, version: 'v0.1.0', release: 'Internal', date: '2026-05-15', features: ['Home dashboard', 'Profile', 'Experiences', 'Onboarding wizard'], bugFixes: [], breakingChanges: [], knownIssues: ['Dark mode flash on load'] },
];

export const qualityMetrics = [
  { id: 'crash_free', label: 'Crash Free Sessions', value: '99.8%', target: '99.5%', status: 'healthy', icon: ShieldCheck },
  { id: 'startup', label: 'App Startup Time', value: '1.2s', target: '< 2s', status: 'healthy', icon: Zap },
  { id: 'session', label: 'Avg Session Duration', value: '8m 32s', target: '> 5m', status: 'healthy', icon: Clock },
  { id: 'retention', label: 'Member Retention (7d)', value: '68%', target: '> 60%', status: 'healthy', icon: Users },
  { id: 'host_sat', label: 'Host Satisfaction', value: '4.7/5', target: '> 4.0', status: 'healthy', icon: Star },
];