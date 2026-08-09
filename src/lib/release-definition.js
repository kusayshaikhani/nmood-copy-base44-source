/**
 * RM-002 — Nmood Release 1.0 Definition & Architecture Freeze
 * ----------------------------------------------------------------------------
 * This file is the SINGLE SOURCE OF TRUTH for Release 1.0 scope.
 * Architecture is FROZEN: no new major platform features unless explicitly
 * approved for Release 1.1 or later. See release-engine.js#classifyRequest.
 *
 * Edit completion/gate status here only after an approved engineering review.
 * AI may NEVER modify this file or release status automatically.
 */

export const RELEASE = {
  version: '1.0',
  code: 'RM-002',
  architecture_frozen: true,
  frozen_date: '2026-07-06',
  vision:
    'Nmood is an AI-powered human connection platform that helps people build meaningful real-world relationships through shared interests, Circles, Experiences and trusted communities. NOT a dating app. NOT traditional social media. NOT simply an events platform.',
  principles: ['Trust', 'Privacy', 'Genuine human connection'],
};

// --- Release 1.0 modules -----------------------------------------------------
// completion: 0-100 (best-effort engineering estimate). status: complete|in_progress|planned
export const MODULES = [
  { key: 'auth', name: 'Authentication', completion: 100, status: 'complete' },
  { key: 'profiles', name: 'Member Profiles', completion: 100, status: 'complete' },
  { key: 'trust', name: 'Trust System', completion: 70, status: 'in_progress', note: 'Verification badge consistency across profile surfaces.' },
  { key: 'discovery', name: 'Discovery', completion: 100, status: 'complete' },
  { key: 'ai', name: 'AI Recommendations', completion: 95, status: 'in_progress', note: 'Concierge + matchmaker live; tuning ongoing.' },
  { key: 'circles', name: 'Circles', completion: 85, status: 'in_progress', note: 'Bus event emission + incoming invitation UI pending.' },
  { key: 'experiences', name: 'Experiences', completion: 95, status: 'complete' },
  { key: 'messaging', name: 'Messaging', completion: 75, status: 'in_progress', note: '1:1 gating enforcement wire-up pending.' },
  { key: 'notifications', name: 'Notifications', completion: 100, status: 'complete' },
  { key: 'membership', name: 'Membership', completion: 95, status: 'in_progress', note: 'Live receipt validation pending store secrets.' },
  { key: 'communities', name: 'Business Communities', completion: 95, status: 'in_progress' },
  { key: 'analytics', name: 'Analytics', completion: 70, status: 'in_progress', note: 'Membership Intelligence added; AdminAnalytics still mock-driven.' },
  { key: 'administration', name: 'Administration', completion: 95, status: 'complete' },
  { key: 'release', name: 'Release Management', completion: 60, status: 'in_progress', note: 'Established by RM-002.' },
  { key: 'qa', name: 'QA Framework', completion: 70, status: 'in_progress', note: 'Ops checklist + quality pages live; external QA pending.' },
  { key: 'settings', name: 'Settings', completion: 100, status: 'complete' },
  { key: 'privacy', name: 'Privacy Controls', completion: 95, status: 'in_progress', note: 'Account deletion/export placeholders.' },
  { key: 'security', name: 'Security', completion: 75, status: 'in_progress', note: 'Server-side entitlement verification pending.' },
  { key: 'production', name: 'Production Configuration', completion: 65, status: 'in_progress', note: 'Store secrets + webhook callbacks pending.' },
];

// --- Quality gates -----------------------------------------------------------
// status: passed|in_progress|open. Live defect gates are reconciled server-side.
export const QUALITY_GATES = [
  { key: 'modules_complete', name: 'All core modules implemented', status: 'in_progress' },
  { key: 'no_critical', name: 'No Critical defects', status: 'in_progress', live: true },
  { key: 'no_high_blocking', name: 'No High Severity blocking defects', status: 'in_progress', live: true },
  { key: 'qa_approved', name: 'QA Approved', status: 'open' },
  { key: 'security_review', name: 'Security Review Approved', status: 'open' },
  { key: 'privacy_review', name: 'Privacy Review Approved', status: 'open' },
  { key: 'performance_review', name: 'Performance Review Approved', status: 'open' },
  { key: 'membership_validated', name: 'Membership validated', status: 'in_progress' },
  { key: 'analytics_operational', name: 'Analytics operational', status: 'in_progress' },
  { key: 'production_config', name: 'Production configuration complete', status: 'in_progress' },
  { key: 'backup_verified', name: 'Backup strategy verified', status: 'passed' },
  { key: 'monitoring_operational', name: 'Monitoring operational', status: 'in_progress' },
];

// --- Targets (documented requirements) -------------------------------------
export const SECURITY_TARGETS = [
  'Authentication', 'Authorization', 'Membership enforcement', 'API security',
  'Data encryption', 'Secure storage', 'Audit logging', 'Administrative permissions',
];

export const PRIVACY_TARGETS = [
  'Privacy settings', 'Profile visibility', 'Data minimization', 'Anonymous analytics',
  'Consent management', 'Account deletion', 'Data export (where implemented)',
  'Premium shall NEVER override privacy choices',
];

export const OPERATIONS_TARGETS = [
  'Founder Dashboard', 'Moderation', 'Reports', 'Analytics',
  'Release Tracking', 'QA Tracking', 'Production Monitoring',
];

export const COMPLIANCE_TARGETS = [
  'Apple App Store', 'Google Play', 'UAE regulatory requirements',
  'Privacy Policy', 'Terms of Service', 'Community Guidelines',
];

export const PERFORMANCE_TARGETS = [
  'Launch quickly', 'Scroll smoothly', 'Load images efficiently',
  'Support large communities', 'Maintain responsive messaging', 'Scale for future growth',
];

// --- Deferred backlog (Release 1.1 candidates) ------------------------------
// Anything not in the module list above is automatically a 1.1 candidate.
export const DEFERRED = [
  'Retire legacy 4-tier MEMBERSHIP_TIERS metadata (post UI migration)',
  'Standalone Analytics page real-data migration (AdminAnalytics)',
  'Phone registration via SMS provider (gated by provider config)',
  'Native Capacitor/StoreKit/Play Billing plugin wiring',
  'Per-pal timeline URL hardcoding cleanup',
];

// AI-supported questions (release-engine + releaseIntelligence backend)
export const AI_QUESTIONS = [
  'What remains before Release 1.0?',
  'Which modules are incomplete?',
  'Which quality gates remain open?',
  'Which issues block production?',
  'What is the current Release Readiness %?',
];

export const RELEASE_SCOPE_KEYS = MODULES.map((m) => m.key);