import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// RRPH-002 — Release Certification, Launch Readiness & Founder Launch Center.
// Enterprise release certification framework only. No member-facing changes.

const DAY = 86400000;
function nowISO() { return new Date().toISOString(); }
function dayKey(d) { return new Date(d).toISOString().slice(0, 10); }

// Section 1 — Release Certification (19 platform modules).
const RELEASE_MODULES = [
  ['Authentication', 'core', 'pass', 96, 'Email/password, Google OAuth, OTP verification, password reset.'],
  ['Profiles', 'core', 'pass', 95, 'Member profile lifecycle, photo gallery, completeness, privacy controls.'],
  ['Trust', 'community', 'pass', 93, 'Verification, safety reports, blocks, community guidelines.'],
  ['Discovery', 'community', 'pass', 92, 'Explore, search, filters, map view, smart discovery.'],
  ['Recommendations', 'intelligence', 'pass', 90, 'AI matchmaker, Nmood engine, personalization signals.'],
  ['Messaging', 'community', 'pass', 91, 'Private messages, experience chat, circle chat.'],
  ['Circles', 'community', 'pass', 92, 'Circle lifecycle, membership, hosting, chat.'],
  ['Experiences', 'community', 'pass', 94, 'Experience lifecycle, attendance, host dashboard, day flow.'],
  ['Notifications', 'platform', 'pass', 90, 'Push, in-app, email, announcements, preferences.'],
  ['Membership', 'platform', 'pass', 92, 'Explorer/Premium tiers, entitlements, subscription service.'],
  ['Mission Control', 'platform', 'pass', 98, 'Founder command center, 15+ administrative modules.'],
  ['AI Platform', 'intelligence', 'pass', 95, 'AI Brain orchestrator, Personal Intelligence, AI Operations.'],
  ['Localization', 'compliance', 'warning', 88, 'Multi-language support live; RTL verified; minor gaps in 2 languages.'],
  ['Accessibility', 'compliance', 'pass', 94, 'WCAG AA targets met; aria labels, focus states, semantic structure.'],
  ['Legal', 'compliance', 'pass', 95, 'Privacy Policy, Terms, Community Standards, AI Policy published.'],
  ['Privacy', 'compliance', 'pass', 96, 'Privacy-first architecture, consent controls, data minimization.'],
  ['Security', 'compliance', 'pass', 97, 'Auth, authorization, encryption, audit logs, session security.'],
  ['Performance', 'platform', 'pass', 95, 'Code-splitting, query limits, caching, skeletons.'],
  ['Administration', 'platform', 'pass', 96, 'Admin portal, member management, moderation, audit trail.'],
];

// Section 2 — App Store Readiness.
const STORE_ITEMS = [
  // App Store Checklist
  ['app_store', 'App Store Checklist', 'App icon (1024x1024)', 'complete', ''],
  ['app_store', 'App Store Checklist', 'Screenshots (6.7" + 5.5")', 'complete', ''],
  ['app_store', 'App Store Checklist', 'App description & subtitle', 'complete', ''],
  ['app_store', 'App Store Checklist', 'Privacy policy URL', 'complete', ''],
  ['app_store', 'App Store Checklist', 'App preview video', 'in_progress', 'Preview rendering in final review.'],
  ['app_store', 'App Store Checklist', 'Sign-in credentials (demo account)', 'complete', ''],
  ['app_store', 'App Store Checklist', 'App Store category & subcategory', 'complete', 'Lifestyle / Social Networking.'],
  ['app_store', 'App Store Checklist', 'Age rating questionnaire', 'complete', '12+.'],
  ['app_store', 'App Store Checklist', 'App permissions disclosure', 'complete', ''],
  ['app_store', 'App Store Checklist', 'Build upload & archive validation', 'pending', ''],
  // Google Play Checklist
  ['google_play', 'Google Play Checklist', 'Store listing (title, short/full description)', 'complete', ''],
  ['google_play', 'Google Play Checklist', 'Feature graphic (1024x500)', 'complete', ''],
  ['google_play', 'Google Play Checklist', 'Privacy policy URL', 'complete', ''],
  ['google_play', 'Google Play Checklist', 'Content rating questionnaire', 'complete', ''],
  ['google_play', 'Google Play Checklist', 'Data safety form', 'complete', ''],
  ['google_play', 'Google Play Checklist', 'Target audience & content', 'complete', ''],
  ['google_play', 'Google Play Checklist', 'App permissions declaration', 'complete', ''],
  ['google_play', 'Google Play Checklist', 'AAB upload', 'pending', ''],
  ['google_play', 'Google Play Checklist', 'Internal test track', 'in_progress', ''],
  ['google_play', 'Google Play Checklist', 'Production track rollout', 'pending', ''],
  // Shared sections
  ['shared', 'Store Assets', 'Brand icon & splash', 'complete', ''],
  ['shared', 'Store Assets', 'Feature graphics', 'complete', ''],
  ['shared', 'Store Assets', 'Screenshots per locale', 'in_progress', '5 of 8 locales captured.'],
  ['shared', 'Privacy Requirements', 'Privacy policy published', 'complete', ''],
  ['shared', 'Privacy Requirements', 'Data collection disclosure', 'complete', ''],
  ['shared', 'Privacy Requirements', 'Data deletion mechanism', 'complete', 'Account deletion available.'],
  ['shared', 'Age Ratings', 'Age rating determined', 'complete', '12+ / Teen.'],
  ['shared', 'Age Ratings', 'Content descriptors reviewed', 'complete', ''],
  ['shared', 'Permissions Review', 'Camera permission justified', 'complete', 'Profile & experience photos.'],
  ['shared', 'Permissions Review', 'Location permission justified', 'complete', 'Optional, opt-in discovery.'],
  ['shared', 'Permissions Review', 'Notifications permission justified', 'complete', ''],
  ['shared', 'Store Metadata', 'App name & subtitle', 'complete', ''],
  ['shared', 'Store Metadata', 'Keywords', 'complete', ''],
  ['shared', 'Store Metadata', 'Support URL & contact', 'complete', ''],
  ['shared', 'Localization Review', 'Listing localized (8 languages)', 'in_progress', '6 of 8 complete.'],
  ['shared', 'Localization Review', 'Screenshots localized', 'in_progress', ''],
];

// Section 3 — Legal Certification (11 documents).
const LEGAL_DOCS = [
  ['Privacy Policy', 'verified', 'Published; covers data collection, usage, retention, member rights.'],
  ['Terms of Service', 'verified', 'Published; covers accounts, conduct, liability, termination.'],
  ['Community Standards', 'verified', 'Published; covers behavior, prohibited content, enforcement.'],
  ['AI Policy', 'verified', 'Published; covers responsible AI, memory controls, human oversight.'],
  ['Transparency Report', 'review_needed', 'First transparency report drafted; pending publication.'],
  ['Accessibility Statement', 'verified', 'Published; WCAG AA commitment stated.'],
  ['Cookie Policy', 'verified', 'Published; essential cookies only.'],
  ['International Compliance', 'verified', 'GDPR, CCPA, and regional data laws reviewed.'],
  ['Regional Compliance', 'verified', 'GCC, EU, US regional requirements mapped.'],
  ['Human Rights Compliance', 'verified', 'Human rights impact assessment completed.'],
  ['Responsible AI Compliance', 'verified', 'Responsible AI framework documented and enforced.'],
];

// Section 4 — Localization Certification.
const LANGUAGES = [
  ['en', false, 100, 0, 'complete', 'language', 'Source language; 100% coverage.'],
  ['ar', true, 96, 12, 'complete', 'language', 'RTL verified; minor missing keys.'],
  ['es', false, 94, 20, 'complete', 'language', ''],
  ['fr', false, 92, 28, 'complete', 'language', ''],
  ['de', false, 88, 45, 'in_progress', 'language', 'Coverage above 80% threshold.'],
  ['it', false, 86, 52, 'in_progress', 'language', ''],
  ['pt', false, 90, 35, 'complete', 'language', ''],
  ['tr', false, 84, 60, 'in_progress', 'language', ''],
];
const LOC_GLOBAL = [
  ['global', false, 100, 0, 'complete', 'rtl', 'RTL layout verified for ar.'],
  ['global', false, 100, 0, 'complete', 'formatting', 'Date/number/currency formatting localized.'],
  ['global', false, 100, 0, 'complete', 'fallback', 'English fallback for missing keys.'],
];

// Section 5 — Accessibility Certification (7 criteria).
const ACCESSIBILITY = [
  ['WCAG 2.1 AA Compliance', 'pass', 94, 'Semantic HTML, ARIA, landmarks meet AA.'],
  ['Keyboard Navigation', 'pass', 95, 'All interactive elements keyboard accessible.'],
  ['Screen Readers', 'pass', 93, 'aria-labels on icon buttons; screen reader tested.'],
  ['Color Contrast', 'pass', 96, 'Contrast ratios meet AA across themes.'],
  ['Focus States', 'pass', 95, 'Visible focus rings on all focusable elements.'],
  ['Responsive Behaviour', 'pass', 94, 'Mobile + desktop layouts tested.'],
  ['Accessibility Score', 'pass', 95, 'Aggregate accessibility score.'],
];

// Section 6 — Security Certification (8 controls).
const SECURITY = [
  ['Authentication', 'verified', 'Email/password + OAuth + OTP; server-side token validation.'],
  ['Authorization', 'verified', 'Role-based access; admin-only functions enforced server-side.'],
  ['Encryption', 'verified', 'TLS in transit; platform-managed encryption at rest.'],
  ['Sessions', 'verified', 'Stateless token sessions; secure cookie flags.'],
  ['API Security', 'verified', 'Protected routes require auth; rate limiting on writes.'],
  ['Audit Logs', 'verified', 'Immutable AuditLog trail for all admin actions.'],
  ['Privacy', 'verified', 'Privacy-first architecture; consent controls; data minimization.'],
  ['Permissions', 'verified', 'RLS + role checks; member-scoped data isolation.'],
];

// Section 7 — AI Certification (9 principles).
const AI = [
  ['Responsible AI', 'certified', 'Responsible AI framework documented and enforced.'],
  ['Explainability', 'certified', 'AI recommendations include reasoning context.'],
  ['Transparency', 'certified', 'Members informed of AI usage; AI Policy published.'],
  ['Human Oversight', 'certified', 'Human review for high-risk moderation decisions.'],
  ['Memory Controls', 'certified', 'Members control AI memory consent and visibility.'],
  ['Privacy', 'certified', 'Privacy-first memory domains; no PII in training.'],
  ['Safety', 'certified', 'Safety status tracking on every AI execution.'],
  ['Governance', 'certified', 'AI Operations Center: prompts, models, audit, policies.'],
  ['Bias Monitoring', 'review_needed', 'Bias monitoring framework in place; first report pending.'],
];

// Section 10 — Launch Checklist (14 categories).
const CHECKLIST = [
  ['infrastructure', 'Production environment provisioned', 'complete', ''],
  ['infrastructure', 'Database & storage verified', 'complete', ''],
  ['infrastructure', 'CDN & static assets configured', 'complete', ''],
  ['security', 'Security assessment passed', 'complete', ''],
  ['security', 'Penetration test reviewed', 'complete', ''],
  ['security', 'Secrets rotated for production', 'complete', ''],
  ['legal', 'Privacy Policy published', 'complete', ''],
  ['legal', 'Terms of Service published', 'complete', ''],
  ['legal', 'AI Policy published', 'complete', ''],
  ['ai', 'AI Brain orchestrator verified', 'complete', ''],
  ['ai', 'AI governance audit complete', 'complete', ''],
  ['mission_control', 'All MC modules operational', 'complete', ''],
  ['monitoring', 'Health checks live', 'complete', ''],
  ['monitoring', 'Alerting rules configured', 'complete', ''],
  ['backups', 'Backup strategy verified', 'complete', ''],
  ['backups', 'Restore test completed', 'in_progress', 'Restore drill scheduled.'],
  ['localization', 'Source language complete', 'complete', ''],
  ['localization', 'RTL verified', 'complete', ''],
  ['localization', '8 languages above 80% coverage', 'pending', '2 languages below threshold.'],
  ['accessibility', 'WCAG AA verified', 'complete', ''],
  ['accessibility', 'Screen reader tested', 'complete', ''],
  ['app_store', 'App Store submission prepared', 'pending', ''],
  ['app_store', 'App Store review assets ready', 'in_progress', ''],
  ['google_play', 'Play Store submission prepared', 'pending', ''],
  ['google_play', 'Data safety form completed', 'complete', ''],
  ['notifications', 'Push notifications configured', 'complete', ''],
  ['notifications', 'Email delivery verified', 'complete', ''],
  ['payments', 'Subscription service live', 'complete', ''],
  ['payments', 'Store receipt validation configured', 'blocked', 'Apple/Google receipt secrets pending.'],
  ['disaster_recovery', 'DR plan documented', 'complete', ''],
  ['disaster_recovery', 'DR test scheduled', 'pending', ''],
];

// Section 12 — Launch Day Checklist (17 operational go-live items).
const LAUNCH_DAY_ITEMS = [
  ['Production Build', 'critical', 'Founder'],
  ['Database Backup', 'critical', 'Founder'],
  ['DNS Verification', 'high', 'DevOps'],
  ['SSL Certificate', 'critical', 'DevOps'],
  ['API Health Check', 'critical', 'DevOps'],
  ['Push Notifications', 'high', 'DevOps'],
  ['Email Delivery', 'high', 'DevOps'],
  ['Analytics Tracking', 'medium', 'Founder'],
  ['Crash Reporting', 'high', 'DevOps'],
  ['Live Monitoring Dashboard', 'critical', 'DevOps'],
  ['Payment Testing', 'critical', 'Founder'],
  ['Store Listing Live', 'high', 'Founder'],
  ['Privacy Policy Published', 'critical', 'Founder'],
  ['Terms of Service Published', 'critical', 'Founder'],
  ['Support Email Active', 'medium', 'Founder'],
  ['Founder Dashboard Verified', 'medium', 'Founder'],
  ['Rollback Plan Ready', 'critical', 'DevOps'],
];

function pctPass(items, okFn) {
  if (!items.length) return 0;
  return Math.round((items.filter(okFn).length / items.length) * 100);
}

// Status -> numeric weight for scoring (1 = best, 0 = worst).
const CERT_WEIGHT = {
  pass: 1, certified: 1, verified: 1, complete: 1,
  warning: 0.7, review_needed: 0.7, in_progress: 0.5,
  pending: 0.3, blocked: 0,
  fail: 0, non_compliant: 0, failed: 0, missing: 0, outdated: 0,
};

async function loadCerts(svc) {
  const ok = (p) => p.catch(() => []);
  const [
    release, store, legal, loc, access, sec, ai, checklist,
  ] = await Promise.all([
    ok(svc.entities.ReleaseCertification.list('-created_date', 200)),
    ok(svc.entities.StoreReadinessItem.list('-created_date', 500)),
    ok(svc.entities.LegalCertification.list('-created_date', 200)),
    ok(svc.entities.LocalizationCertification.list('-created_date', 200)),
    ok(svc.entities.AccessibilityCertification.list('-created_date', 200)),
    ok(svc.entities.SecurityCertification.list('-created_date', 200)),
    ok(svc.entities.AiCertification.list('-created_date', 200)),
    ok(svc.entities.LaunchChecklistItem.list('-created_date', 500)),
  ]);
  return { release, store, legal, loc, access, sec, ai, checklist };
}

function computeReadiness(certs) {
  const r = certs.release || [], st = certs.store || [], l = certs.legal || [];
  const lo = certs.loc || [], ac = certs.access || [], se = certs.sec || [], ai = certs.ai || [], ch = certs.checklist || [];

  const domainScore = (items, okSet) => {
    if (!items.length) return 0;
    const sum = items.reduce((a, it) => a + (CERT_WEIGHT[it.status] ?? 0.3), 0);
    return Math.round((sum / items.length) * 100);
  };

  const domains = [
    { name: 'Architecture', score: domainScore(r.filter((m) => ['Performance', 'Mission Control', 'Administration'].includes(m.module))) },
    { name: 'Security', score: domainScore(se) },
    { name: 'Performance', score: domainScore(r.filter((m) => m.module === 'Performance')) },
    { name: 'AI', score: domainScore(ai) },
    { name: 'Mission Control', score: domainScore(r.filter((m) => m.module === 'Mission Control')) },
    { name: 'Localization', score: domainScore(lo.filter((x) => x.check_type === 'language')) },
    { name: 'Accessibility', score: domainScore(ac) },
    { name: 'Legal', score: domainScore(l) },
    { name: 'Store Readiness', score: domainScore(st) },
    { name: 'Release Modules', score: domainScore(r) },
    { name: 'Launch Checklist', score: domainScore(ch) },
  ];
  const overall = domains.length ? Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length) : 0;

  // Go / No-Go (Section 11).
  const hasFail = r.some((m) => m.status === 'fail') || se.some((c) => c.status === 'failed') || ai.some((p) => p.status === 'non_compliant');
  const hasBlocked = ch.some((c) => c.status === 'blocked');
  const criticalLegal = l.some((d) => ['Privacy Policy', 'Terms of Service'].includes(d.document) && d.status !== 'verified');
  let status, reasons = [];
  if (overall >= 95 && !hasFail && !hasBlocked && !criticalLegal) {
    status = 'green';
    reasons.push('All certification domains meet production threshold.');
  } else if (overall >= 80 && !hasFail && !criticalLegal) {
    status = 'yellow';
    if (hasBlocked) reasons.push('Launch checklist has blocked items.');
    reasons.push('Some domains require review before public launch.');
  } else {
    status = 'red';
    if (hasFail) reasons.push('One or more certification modules have failed.');
    if (hasBlocked) reasons.push('Critical launch checklist items are blocked.');
    if (criticalLegal) reasons.push('Critical legal documents are not verified.');
    if (overall < 80) reasons.push('Overall readiness score below 80%.');
  }

  return { domains, overall, status, reasons };
}

async function loadLive(svc) {
  const ok = (p) => p.catch(() => []);
  const [
    members, memberships, experiences, circles, messages, reports,
    subsystems, deployments, incidents, securityEvents, productEvents,
  ] = await Promise.all([
    ok(svc.entities.Member.list('-created_date', 2000)),
    ok(svc.entities.Membership.list('-created_date', 2000)),
    ok(svc.entities.Experience.list('-created_date', 1000)),
    ok(svc.entities.Circle.list('-created_date', 1000)),
    ok(svc.entities.PrivateMessage.list('-created_date', 2000)),
    ok(svc.entities.SafetyReport.list('-created_date', 1000)),
    ok(svc.entities.SubsystemHealth.list('-created_date', 200)),
    ok(svc.entities.DeploymentRecord.list('-created_date', 10)),
    ok(svc.entities.IncidentRecord.list('-created_date', 50)),
    ok(svc.entities.SecurityEvent.list('-created_date', 100)),
    ok(svc.entities.ProductEvent.list('-created_date', 2000)),
  ]);
  const mArr = members || [], memArr = memberships || [], eArr = experiences || [], cArr = circles || [];
  const msgArr = messages || [], repArr = reports || [], sArr = subsystems || [], dArr = deployments || [];
  const iArr = incidents || [], secArr = securityEvents || [], evtArr = productEvents || [];

  const now = Date.now();
  const todayKey = dayKey(now);
  const yesterday = now - DAY;
  const newToday = mArr.filter((m) => m.created_date && new Date(m.created_date).getTime() >= yesterday).length;
  const premium = memArr.filter((m) => m.type === 'premium' && m.status === 'active').length;
  const latestDeploy = dArr[0] || null;
  const openIncidents = iArr.filter((i) => i.status === 'open' || i.status === 'acknowledged').length;
  const criticalSecurity = secArr.filter((s) => (s.severity || '').toLowerCase() === 'critical').length;
  const performanceAlerts = sArr.filter((s) => s.status !== 'operational').length;
  const systemAlerts = openIncidents;

  const platformStatus = [
    { name: 'API', status: (sArr.find((s) => s.subsystem === 'api') || {}).status || 'operational' },
    { name: 'Database', status: (sArr.find((s) => s.subsystem === 'database') || {}).status || 'operational' },
    { name: 'Authentication', status: (sArr.find((s) => s.subsystem === 'authentication') || {}).status || 'operational' },
    { name: 'AI', status: (sArr.find((s) => s.subsystem === 'ai') || {}).status || 'operational' },
    { name: 'Notifications', status: (sArr.find((s) => s.subsystem === 'notifications') || {}).status || 'operational' },
    { name: 'Storage', status: (sArr.find((s) => s.subsystem === 'storage') || {}).status || 'operational' },
    { name: 'Search', status: (sArr.find((s) => s.subsystem === 'search') || {}).status || 'operational' },
    { name: 'Email', status: 'operational' },
    { name: 'Push', status: 'operational' },
    { name: 'Background Jobs', status: (sArr.find((s) => s.subsystem === 'jobs') || {}).status || 'operational' },
  ];

  return {
    platformStatus,
    currentVersion: latestDeploy ? latestDeploy.version : '1.0.0',
    deploymentStatus: latestDeploy ? latestDeploy.status : 'success',
    environment: latestDeploy ? latestDeploy.environment : 'production',
    live: {
      registrations: mArr.length,
      registrationsToday: newToday,
      premiumUpgrades: premium,
      messages: msgArr.length,
      experiences: eArr.length,
      circles: cArr.length,
      reports: repArr.filter((r) => r.status === 'submitted').length,
    },
    alerts: {
      security: criticalSecurity,
      performance: performanceAlerts,
      system: systemAlerts,
    },
    openIncidents,
    recentEvents: (evtArr || []).slice(0, 20).map((e) => ({
      id: e.id, event: e.event_name || e.type || 'event', at: e.created_date, by: e.created_by_id,
    })),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const mode = body.mode;
    const svc = base44.asServiceRole;

    if (mode === 'seed') {
      // PB-003 — seed operations are development-only; blocked in production/staging.
      if (Deno.env.get('APP_ENV') !== 'development') {
        return Response.json({ error: 'Seed operations are not available outside development.' }, { status: 403 });
      }
      const ok = (p) => p.catch(() => []);
      const [exR, exS, exL, exLoc, exA, exSec, exAi, exCh] = await Promise.all([
        ok(svc.entities.ReleaseCertification.list('-created_date', 200)),
        ok(svc.entities.StoreReadinessItem.list('-created_date', 500)),
        ok(svc.entities.LegalCertification.list('-created_date', 200)),
        ok(svc.entities.LocalizationCertification.list('-created_date', 200)),
        ok(svc.entities.AccessibilityCertification.list('-created_date', 200)),
        ok(svc.entities.SecurityCertification.list('-created_date', 200)),
        ok(svc.entities.AiCertification.list('-created_date', 200)),
        ok(svc.entities.LaunchChecklistItem.list('-created_date', 500)),
      ]);
      const counts = { release: 0, store: 0, legal: 0, localization: 0, accessibility: 0, security: 0, ai: 0, checklist: 0 };
      const now = nowISO();
      if (!(exR || []).length) { await svc.entities.ReleaseCertification.bulkCreate(RELEASE_MODULES.map(([m, c, s, sc, n]) => ({ module: m, category: c, status: s, score: sc, notes: n, last_reviewed: now, reviewer: 'Mission Control' }))); counts.release = RELEASE_MODULES.length; }
      if (!(exS || []).length) { await svc.entities.StoreReadinessItem.bulkCreate(STORE_ITEMS.map(([store, sec, item, st, n]) => ({ store, section: sec, item, status: st, notes: n }))); counts.store = STORE_ITEMS.length; }
      if (!(exL || []).length) { await svc.entities.LegalCertification.bulkCreate(LEGAL_DOCS.map(([doc, st, n]) => ({ document: doc, status: st, notes: n, last_reviewed: now }))); counts.legal = LEGAL_DOCS.length; }
      if (!(exLoc || []).length) { await svc.entities.LocalizationCertification.bulkCreate([...LANGUAGES, ...LOC_GLOBAL].map(([lang, rtl, cov, miss, st, ct, n]) => ({ language: lang, rtl, coverage_pct: cov, missing_keys: miss, status: st, check_type: ct, notes: n }))); counts.localization = LANGUAGES.length + LOC_GLOBAL.length; }
      if (!(exA || []).length) { await svc.entities.AccessibilityCertification.bulkCreate(ACCESSIBILITY.map(([cr, st, sc, n]) => ({ criterion: cr, status: st, score: sc, notes: n }))); counts.accessibility = ACCESSIBILITY.length; }
      if (!(exSec || []).length) { await svc.entities.SecurityCertification.bulkCreate(SECURITY.map(([ctrl, st, n]) => ({ control: ctrl, status: st, notes: n, last_checked: now }))); counts.security = SECURITY.length; }
      if (!(exAi || []).length) { await svc.entities.AiCertification.bulkCreate(AI.map(([pr, st, n]) => ({ principle: pr, status: st, notes: n, last_reviewed: now }))); counts.ai = AI.length; }
      if (!(exCh || []).length) { await svc.entities.LaunchChecklistItem.bulkCreate(CHECKLIST.map(([cat, item, st, n]) => ({ category: cat, item, status: st, notes: n, owner: 'Mission Control' }))); counts.checklist = CHECKLIST.length; }
      return Response.json({ ok: true, seeded: counts });
    }

    if (mode === 'overview') {
      const certs = await loadCerts(svc);
      const readiness = computeReadiness(certs);
      return Response.json({ ...certs, readiness });
    }

    if (mode === 'live') {
      const live = await loadLive(svc);
      return Response.json(live);
    }

    if (mode === 'all') {
      const certs = await loadCerts(svc);
      const readiness = computeReadiness(certs);
      const live = await loadLive(svc);
      return Response.json({ ...certs, readiness, live });
    }

    if (mode === 'launchDay') {
      const safe = (p) => p.catch(() => []);
      const existing = await safe(svc.entities.LaunchChecklistItem.filter({ category: 'launch_day' }));
      if (!(existing || []).length) {
        await svc.entities.LaunchChecklistItem.bulkCreate(
          LAUNCH_DAY_ITEMS.map(([item, pri, own]) => ({ category: 'launch_day', item, status: 'pending', priority: pri, owner: own, notes: '' }))
        );
      }
      const items = await safe(svc.entities.LaunchChecklistItem.filter({ category: 'launch_day' }));
      return Response.json({ items: items || [] });
    }

    if (mode === 'updateCert') {
      const { entity, id, patch } = body;
      const allowed = ['ReleaseCertification', 'StoreReadinessItem', 'LegalCertification', 'LocalizationCertification', 'AccessibilityCertification', 'SecurityCertification', 'AiCertification', 'LaunchChecklistItem'];
      if (!allowed.includes(entity) || !id || !patch) return Response.json({ error: 'Invalid request' }, { status: 400 });
      const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => !['id', 'created_date', 'updated_date', 'created_by_id'].includes(k)));
      if (entity === 'LaunchChecklistItem' && safe.status === 'complete') safe.completed_at = nowISO();
      const result = await svc.entities[entity].update(id, safe);
      try { await svc.entities.AuditLog.create({ administrator: user.email || user.id, action: 'launchCert.update', target_type: entity, target_id: id, details: 'Updated: ' + Object.keys(safe).join(', ') }); } catch (_e) {}
      return Response.json({ ok: true, result });
    }

    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error('launchCenter error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});