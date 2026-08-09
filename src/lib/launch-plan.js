// EX-004 — Launch Execution Plan for Nmood Release 1.0.
// Operational planning only; no engineering, redesign, or new functionality.

export const PRELAUNCH_PHASES = [
  {
    id: 't30', label: 'T-30 Days', items: [
      { id: 't30_1', label: 'Release scope frozen', hint: 'Architecture Freeze + RC1 scope locked.' },
      { id: 't30_2', label: 'Founder Acceptance Testing scheduled', hint: 'FAT suites scoped to RC1.' },
      { id: 't30_3', label: 'Store assets in production', hint: 'Icons, screenshots, feature graphics.' },
      { id: 't30_4', label: 'Legal documents drafted', hint: 'Privacy, Terms, Guidelines, Moderation.' },
      { id: 't30_5', label: 'Billing secrets configured', hint: 'Apple/Google receipt validation secrets.' },
    ],
  },
  {
    id: 't14', label: 'T-14 Days', items: [
      { id: 't14_1', label: 'FAT execution complete', hint: 'All suites run; defects triaged.' },
      { id: 't14_2', label: 'Internal testing build live', hint: 'TestFlight internal + Play internal track.' },
      { id: 't14_3', label: 'Store listings submitted', hint: 'App Store + Play listings in review.' },
      { id: 't14_4', label: 'Compliance review complete', hint: 'Apple ATT + Google Data Safety.' },
      { id: 't14_5', label: 'Support runbook ready', hint: 'Support staff briefed; tickets routed.' },
    ],
  },
  {
    id: 't7', label: 'T-7 Days', items: [
      { id: 't7_1', label: 'Closed testing live', hint: 'TestFlight external + Play closed track.' },
      { id: 't7_2', label: 'Performance benchmarks green', hint: 'Startup <3s, Home <2s, Search <1s.' },
      { id: 't7_3', label: 'On-call rotation set', hint: 'Founder + engineering on-call defined.' },
      { id: 't7_4', label: 'Announcements scheduled', hint: 'Launch announcement staged (draft).' },
      { id: 't7_5', label: 'Rollback plan documented', hint: 'Store + backend rollback procedure.' },
    ],
  },
  {
    id: 't3', label: 'T-3 Days', items: [
      { id: 't3_1', label: 'Production build uploaded', hint: 'Final RC1 build to both stores.' },
      { id: 't3_2', label: 'Store approval received', hint: 'Both listings approved / ready for release.' },
      { id: 't3_3', label: 'Backups verified', hint: 'Entity data + secrets backed up.' },
      { id: 't3_4', label: 'Founder Daily Brief live', hint: 'Brief generation confirmed in Mission Control.' },
    ],
  },
  {
    id: 't1', label: 'T-1 Day', items: [
      { id: 't1_1', label: 'Go/No-Go decision recorded', hint: 'Founder sign-off on launch.' },
      { id: 't1_2', label: 'Launch comms approved', hint: 'Announcement + social copy approved.' },
      { id: 't1_3', label: 'Status page ready', hint: 'Platform status monitoring live.' },
      { id: 't1_4', label: 'Team briefing held', hint: 'All-hands launch readiness review.' },
    ],
  },
];

export const LAUNCH_DAY_ITEMS = [
  { id: 'ld_mission', label: 'Mission Control', hint: 'Ops dashboard + Founder Daily Brief live.' },
  { id: 'ld_health', label: 'Platform Health', hint: 'System health green; no active incidents.' },
  { id: 'ld_perf', label: 'Performance', hint: 'Startup/Home/Search within targets.' },
  { id: 'ld_notif', label: 'Notifications', hint: 'Announcements sending; preferences honored.' },
  { id: 'ld_ai', label: 'AI', hint: 'Concierge + recommendations responding.' },
  { id: 'ld_membership', label: 'Membership', hint: 'Explorer/Premium tiers active; gating enforced.' },
  { id: 'ld_payments', label: 'Payments', hint: 'Store purchases validating; webhooks firing.' },
  { id: 'ld_store', label: 'Store Status', hint: 'Both listings live; reviews monitored.' },
  { id: 'ld_support', label: 'Support', hint: 'Inbox staffed; SLA targets set.' },
  { id: 'ld_brief', label: 'Founder Daily Brief', hint: 'Day-0 brief generated + reviewed.' },
];

export const POSTLAUNCH_PHASES = [
  {
    id: 'h24', label: 'First 24 Hours', items: [
      { id: 'h24_1', label: 'Crash rate < 1%', hint: 'Monitor crash-free sessions.' },
      { id: 'h24_2', label: 'Onboarding funnel healthy', hint: 'Register→OTP→onboard completion.' },
      { id: 'h24_3', label: 'Support tickets triaged', hint: 'All day-0 tickets acknowledged.' },
      { id: 'h24_4', label: 'Payment validation OK', hint: 'No receipt-validation failures.' },
      { id: 'h24_5', label: 'Status page updated', hint: 'Public status reflects reality.' },
    ],
  },
  {
    id: 'w1', label: 'First Week', items: [
      { id: 'w1_1', label: 'D1 retention measured', hint: 'New-member return rate tracked.' },
      { id: 'w1_2', label: 'Defects triaged', hint: 'P0/P1 issues resolved or mitigated.' },
      { id: 'w1_3', label: 'Store reviews monitored', hint: 'Respond to early reviews.' },
      { id: 'w1_4', label: 'Hotfix window held', hint: 'Engineering ready for emergency fix.' },
    ],
  },
  {
    id: 'm1', label: 'First Month', items: [
      { id: 'm1_1', label: 'D7/D30 retention measured', hint: 'Cohort retention reported.' },
      { id: 'm1_2', label: 'Explorer→Premium conversion tracked', hint: 'Membership Intelligence populated.' },
      { id: 'm1_3', label: 'Release 1.1 backlog groomed', hint: 'Defects classified via classification engine.' },
      { id: 'm1_4', label: 'Post-launch retrospective held', hint: 'Lessons captured for next release.' },
    ],
  },
];

export const INCIDENTS = [
  { id: 'inc_critical', title: 'Critical Bug', severity: 'P0', steps: ['Acknowledge within 15 min', 'Reproduce + scope impact', 'Hotfix via emergency build', 'Communicate to members if visible', 'Postmortem within 24h'] },
  { id: 'inc_high', title: 'High Bug', severity: 'P1', steps: ['Acknowledge within 1h', 'Triage severity + owner', 'Fix in next patch release', 'Update known-issues log'] },
  { id: 'inc_rejection', title: 'Store Rejection', severity: 'P1', steps: ['Read reviewer notes', 'Fix policy violation', 'Resubmit with response note', 'Hold launch comms until approved'] },
  { id: 'inc_outage', title: 'Service Outage', severity: 'P0', steps: ['Confirm via status checks', 'Roll back to last stable', 'Notify members + status page', 'Root-cause + restore', 'Postmortem within 24h'] },
  { id: 'inc_security', title: 'Security Incident', severity: 'P0', steps: ['Contain + revoke affected tokens', 'Assess data exposure', 'Notify affected members + authorities if required', 'Patch + audit log entry', 'Postmortem within 48h'] },
  { id: 'inc_rollback', title: 'Rollback Decision', severity: 'P1', steps: ['Define rollback trigger (crash>2% or data loss)', 'Confirm last stable build/store version', 'Execute store + backend rollback', 'Verify recovery metrics', 'Communicate to members'] },
];

export const METRICS = [
  { id: 'm_members', label: 'New Members', target: 'Daily new registrations', owner: 'Growth' },
  { id: 'm_premium', label: 'Premium', target: 'Explorer→Premium conversion rate', owner: 'Growth' },
  { id: 'm_retention', label: 'Retention', target: 'D1/D7/D30 cohort retention', owner: 'Product' },
  { id: 'm_engagement', label: 'Engagement', target: 'Check-ins + experiences joined / member', owner: 'Product' },
  { id: 'm_reports', label: 'Reports', target: 'Safety reports opened + resolution time', owner: 'Trust & Safety' },
  { id: 'm_health', label: 'Platform Health', target: 'Uptime + error rate', owner: 'Engineering' },
  { id: 'm_crash', label: 'Crash Rate', target: '< 1% crash-free sessions', owner: 'Engineering' },
  { id: 'm_perf', label: 'Performance', target: 'Startup <3s · Home <2s · Search <1s', owner: 'Engineering' },
];

export const ALL_PLAN_ITEMS = [
  ...PRELAUNCH_PHASES.flatMap((p) => p.items.map((i) => ({ ...i, default: 'needsFounder' }))),
  ...LAUNCH_DAY_ITEMS.map((i) => ({ ...i, default: 'needsFounder' })),
  ...POSTLAUNCH_PHASES.flatMap((p) => p.items.map((i) => ({ ...i, default: 'needsFounder' }))),
  ...METRICS.map((i) => ({ ...i, default: 'needsFounder' })),
];