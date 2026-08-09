// FAT-001 Founder Acceptance Testing — Release 1.0 test suite definitions.
// Every scenario is a complete member journey verified as a real user would use it.
// This is a test framework, not new functionality.

export const FAT_SUITES = [
  {
    id: 'auth',
    module: 'Authentication',
    signOffRequired: true,
    scenarios: [
      { id: 'AUTH-01', scenario: 'Log in with email + password', expected: 'Session created, redirected to Home' },
      { id: 'AUTH-02', scenario: 'Log out from any screen', expected: 'Session destroyed, sent to Splash' },
      { id: 'AUTH-03', scenario: 'Register a new member (email)', expected: 'OTP sent, verified, logged in, onboarding starts' },
      { id: 'AUTH-04', scenario: 'Forgot password flow', expected: 'Reset email sent, generic success shown' },
      { id: 'AUTH-05', scenario: 'Remember me across browser restart', expected: 'Session restored without re-login' },
      { id: 'AUTH-06', scenario: 'Session restore on reload', expected: 'Auth state persists, no flash of login' },
      { id: 'AUTH-07', scenario: 'Session expiration handling', expected: 'Graceful redirect to login, no broken state' },
    ],
  },
  {
    id: 'profile',
    module: 'Member Profile',
    signOffRequired: true,
    scenarios: [
      { id: 'PROF-01', scenario: 'Create profile during onboarding', expected: 'Required fields saved, completeness updates' },
      { id: 'PROF-02', scenario: 'Edit profile (bio, photo, interests)', expected: 'Changes persist immediately across session' },
      { id: 'PROF-03', scenario: 'Toggle privacy visibility', expected: 'Visibility enforced on profile views' },
      { id: 'PROF-04', scenario: 'Add/remove gallery photos', expected: 'Gallery renders with correct aspect ratios' },
      { id: 'PROF-05', scenario: 'Trust verification badges', expected: 'Badges consistent across all profile surfaces' },
      { id: 'PROF-06', scenario: 'Select interests (min count enforced)', expected: 'Cannot proceed below minimum' },
      { id: 'PROF-07', scenario: 'Set life goals', expected: 'Goals persist and surface in Journey' },
      { id: 'PROF-08', scenario: 'Add languages', expected: 'Languages saved and displayed' },
    ],
  },
  {
    id: 'discovery',
    module: 'Discovery',
    signOffRequired: true,
    scenarios: [
      { id: 'DISC-01', scenario: 'Personalized recommendations on Home', expected: 'Recommendations match interests' },
      { id: 'DISC-02', scenario: 'Search across experiences/circles/people/hosts', expected: 'Results relevant, deduplicated' },
      { id: 'DISC-03', scenario: 'Apply search filters', expected: 'Filters narrow results correctly' },
      { id: 'DISC-04', scenario: 'Nearby discovery (location enabled)', expected: 'Distance-sorted, accurate' },
      { id: 'DISC-05', scenario: 'Suggested members (Discover People)', expected: 'Respects privacy + blocks' },
      { id: 'DISC-06', scenario: 'AI Discovery picks', expected: 'Picks relevant, acceptance tracked' },
    ],
  },
  {
    id: 'relationships',
    module: 'Relationships',
    signOffRequired: true,
    scenarios: [
      { id: 'REL-01', scenario: 'Send Pal request from an experience', expected: 'Request created via authorizationGate, quota checked' },
      { id: 'REL-02', scenario: 'View pending incoming requests', expected: 'Incoming list accurate' },
      { id: 'REL-03', scenario: 'Accept a Pal request', expected: 'PalConnection created, both lists update' },
      { id: 'REL-04', scenario: 'Reject a Pal request', expected: 'Request marked declined, no connection' },
      { id: 'REL-05', scenario: 'Cancel an outgoing request', expected: 'Request removed from outgoing' },
      { id: 'REL-06', scenario: 'Remove an existing Pal', expected: 'Connection deactivated, real-time sync' },
      { id: 'REL-07', scenario: 'Block a member', expected: 'Blocked across discovery, messaging, profiles' },
      { id: 'REL-08', scenario: 'Explorer connection limit enforced', expected: 'Blocked at server when limit reached' },
      { id: 'REL-09', scenario: 'Premium unlimited connections', expected: 'No limit, no upgrade prompt' },
    ],
  },
  {
    id: 'messaging',
    module: 'Messaging',
    signOffRequired: true,
    scenarios: [
      { id: 'MSG-01', scenario: 'Private 1:1 chat with a Pal', expected: 'Messages persist and sync' },
      { id: 'MSG-02', scenario: 'Experience group chat', expected: 'Only attendees can send; gated server-side' },
      { id: 'MSG-03', scenario: 'Message notifications fire', expected: 'Notification created and badged' },
      { id: 'MSG-04', scenario: 'Read status updates', expected: 'Read receipts accurate' },
      { id: 'MSG-05', scenario: 'Typing indicator', expected: 'Shows/hides without flicker' },
      { id: 'MSG-06', scenario: 'Send photo in chat', expected: 'Upload + render correct' },
      { id: 'MSG-07', scenario: 'Blocked member cannot message', expected: 'Send rejected server-side' },
    ],
  },
  {
    id: 'experiences',
    module: 'Experiences',
    signOffRequired: true,
    scenarios: [
      { id: 'EXP-01', scenario: 'Create an experience (host wizard)', expected: 'All steps validate, experience active' },
      { id: 'EXP-02', scenario: 'Join an experience', expected: 'Attendance created via authorizationGate, spot fills' },
      { id: 'EXP-03', scenario: 'Leave an experience', expected: 'Attendance left, spot frees, waiting list promotes' },
      { id: 'EXP-04', scenario: 'Capacity enforcement', expected: 'Cannot exceed max participants server-side' },
      { id: 'EXP-05', scenario: 'Waiting list flow', expected: 'Waitlisted, then auto-promoted on leave' },
      { id: 'EXP-06', scenario: 'Host controls (edit, cancel)', expected: 'Audit logged, attendees notified' },
      { id: 'EXP-07', scenario: 'Discover and open experience detail', expected: 'All fields render, join/leave work' },
    ],
  },
  {
    id: 'circles',
    module: 'Circles',
    signOffRequired: true,
    scenarios: [
      { id: 'CIR-01', scenario: 'Create a circle', expected: 'Circle saved, member count 1' },
      { id: 'CIR-02', scenario: 'Join / request to join (privacy-aware)', expected: 'approval/private/invite enforced server-side' },
      { id: 'CIR-03', scenario: 'Invite a Pal to a circle', expected: 'Invitation created, recipient notified' },
      { id: 'CIR-04', scenario: 'Leave a circle', expected: 'Membership removed, count decremented' },
      { id: 'CIR-05', scenario: 'Admin: ban/remove a member', expected: 'Member removed, banned cannot rejoin' },
      { id: 'CIR-06', scenario: 'Circle visibility rules', expected: 'private/connections hidden from non-members' },
    ],
  },
  {
    id: 'communities',
    module: 'Business Communities',
    signOffRequired: false,
    scenarios: [
      { id: 'COM-01', scenario: 'Create a community', expected: 'Community saved, creator is admin' },
      { id: 'COM-02', scenario: 'Manage community settings', expected: 'Changes persist' },
      { id: 'COM-03', scenario: 'Join a public community', expected: 'Membership created' },
      { id: 'COM-04', scenario: 'Moderate community content', expected: 'Moderator actions audit logged' },
    ],
  },
  {
    id: 'membership',
    module: 'Membership',
    signOffRequired: true,
    scenarios: [
      { id: 'MEM-01', scenario: 'Upgrade Explorer → Premium (store)', expected: 'Receipt validated, entitlement activated' },
      { id: 'MEM-02', scenario: 'Downgrade / cancel', expected: 'Managed by store, grace period honored' },
      { id: 'MEM-03', scenario: 'Restore purchases', expected: 'Cross-device entitlement restored, no duplicates' },
      { id: 'MEM-04', scenario: 'Premium features accessible', expected: 'No paywall on premium-gated actions' },
      { id: 'MEM-05', scenario: 'Explorer restrictions enforced', expected: 'Quota enforced server-side, not client-only' },
      { id: 'MEM-06', scenario: 'Explorer connection limit', expected: 'Blocked at authorizationGate when exceeded' },
      { id: 'MEM-07', scenario: 'Blurred profiles for Explorers', expected: 'Photos blurred until Premium' },
      { id: 'MEM-08', scenario: 'Upgrade prompts fire once sensibly', expected: 'Feedback + haptics, not spammy' },
    ],
  },
  {
    id: 'safety',
    module: 'Trust & Safety',
    signOffRequired: true,
    scenarios: [
      { id: 'SAF-01', scenario: 'Report a member/content', expected: 'SafetyReport created, moderation queue updated' },
      { id: 'SAF-02', scenario: 'Block a member', expected: 'Blocked globally, reflected in discovery' },
      { id: 'SAF-03', scenario: 'Photo verification flow', expected: 'Verification status persists' },
      { id: 'SAF-04', scenario: 'Moderation queue review', expected: 'Admin can resolve/dismiss, audit logged' },
      { id: 'SAF-05', scenario: 'Privacy controls respected', expected: 'Visibility enforced on all surfaces' },
    ],
  },
  {
    id: 'ai',
    module: 'AI',
    signOffRequired: true,
    scenarios: [
      { id: 'AI-01', scenario: 'Concierge chat returns relevant help', expected: 'Cached, unmount-safe, recommendations shown' },
      { id: 'AI-02', scenario: 'Recommendation quality', expected: 'Matches interests, acceptance tracked' },
      { id: 'AI-03', scenario: 'Matchmaker suggestions', expected: 'Respects blocks + privacy' },
      { id: 'AI-04', scenario: 'AI explanations (Why recommended)', expected: 'Explanation renders accurately' },
      { id: 'AI-05', scenario: 'Premium-only AI features gated', expected: 'Explorers see upgrade prompt' },
    ],
  },
  {
    id: 'notifications',
    module: 'Notifications',
    signOffRequired: true,
    scenarios: [
      { id: 'NOT-01', scenario: 'In-app notifications fire on events', expected: 'Notification created, listed' },
      { id: 'NOT-02', scenario: 'Badge counts accurate', expected: 'Unread count matches list' },
      { id: 'NOT-03', scenario: 'Mark read / unread', expected: 'State persists, badge updates' },
      { id: 'NOT-04', scenario: 'Delete a notification', expected: 'Removed from list' },
      { id: 'NOT-05', scenario: 'Notification navigation to source', expected: 'Deep links to correct screen' },
    ],
  },
  {
    id: 'admin',
    module: 'Administration',
    signOffRequired: false,
    scenarios: [
      { id: 'ADM-01', scenario: 'Moderation queue actions', expected: 'Resolve/dismiss audit logged' },
      { id: 'ADM-02', scenario: 'Member management (suspend/deactivate)', expected: 'Status enforced, audit logged' },
      { id: 'ADM-03', scenario: 'Business management', expected: 'Admin can edit business entities' },
      { id: 'ADM-04', scenario: 'Reports reviewed and resolved', expected: 'Status transitions persist' },
      { id: 'ADM-05', scenario: 'Mission Control accessible to admin only', expected: 'Non-admins rejected' },
      { id: 'ADM-06', scenario: 'Release Dashboard reflects readiness', expected: 'Scores accurate' },
    ],
  },
  {
    id: 'ops',
    module: 'Operations',
    signOffRequired: false,
    scenarios: [
      { id: 'OPS-01', scenario: 'Mission Control loads subsystem status', expected: 'All probes return health' },
      { id: 'OPS-02', scenario: 'Founder Daily Brief renders real data', expected: 'Numbers + recommendations accurate' },
      { id: 'OPS-03', scenario: 'Platform health probe refresh', expected: 'Status updates on refresh' },
      { id: 'OPS-04', scenario: 'Audit logs searchable and complete', expected: 'No sensitive data exposed' },
      { id: 'OPS-05', scenario: 'Critical alerts distinguishable', expected: 'Critical visually separated' },
    ],
  },
  {
    id: 'performance',
    module: 'Performance',
    signOffRequired: true,
    scenarios: [
      { id: 'PERF-01', scenario: 'App startup under 2s', expected: 'Measured via performance monitor' },
      { id: 'PERF-02', scenario: 'Navigation between routes', expected: 'No blocking, code-split chunks load' },
      { id: 'PERF-03', scenario: 'Search response under 500ms', expected: 'In-memory, instant' },
      { id: 'PERF-04', scenario: 'Scrolling 60fps on lists', expected: 'No jank on long lists' },
      { id: 'PERF-05', scenario: 'Image loading (lazy + blur-up)', expected: 'SmartImage renders gracefully' },
      { id: 'PERF-06', scenario: 'Offline behavior', expected: 'OfflineBanner, no broken actions' },
      { id: 'PERF-07', scenario: 'Recovery from transient failure', expected: 'Retry/graceful degradation' },
    ],
  },
  {
    id: 'accessibility',
    module: 'Accessibility',
    signOffRequired: true,
    scenarios: [
      { id: 'A11Y-01', scenario: 'Keyboard navigation across all screens', expected: 'All actions reachable via tab/enter' },
      { id: 'A11Y-02', scenario: 'Screen reader on key flows', expected: 'Labels announced correctly' },
      { id: 'A11Y-03', scenario: 'Visible focus indicators', expected: 'Focus ring visible on all controls' },
      { id: 'A11Y-04', scenario: 'Color contrast meets WCAG AA', expected: 'No low-contrast text' },
      { id: 'A11Y-05', scenario: 'Touch targets ≥ 44px', expected: 'All tappable elements meet minimum' },
    ],
  },
];

export const ALL_SCENARIOS = FAT_SUITES.flatMap((s) =>
  s.scenarios.map((sc) => ({ ...sc, suiteId: s.id, module: s.module }))
);

export const STATUS = {
  pass: { label: 'Pass', color: 'text-success', icon: 'CheckCircle2' },
  fail: { label: 'Fail', color: 'text-destructive', icon: 'XCircle' },
  blocked: { label: 'Blocked', color: 'text-warning', icon: 'Pause' },
  notTested: { label: 'Not Tested', color: 'text-muted-foreground', icon: 'Circle' },
};

export const SIGNOFF_OPTIONS = ['Not Tested', 'Approved', 'Approved with Notes', 'Rejected'];