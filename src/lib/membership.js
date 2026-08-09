// DEPRECATED for permission decisions. Live membership state + all permission
// logic now live in membership-engine.js and permission-engine.js (MP-001).
// This file retains ONLY display metadata (tier labels, colors, badges,
// benefits, comparison rows) used by legacy membership UI components.
// Do NOT add permission/limit logic here — use permission-engine.hasPermission.

export const MEMBERSHIP_TIERS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    badge: 'B',
    price: 'Free',
    description: 'Get started with Nmood',
    benefits: [
      'Join Activities',
      'Join Circles',
      'Create Profile',
      'Add Pals',
      'Limited Hosting (1 activity)',
    ],
    permissions: {
      CanCreateExperience: true,
      CanCreateCircle: true,
      MaxHostedActivities: 1,
      MaxSavedActivities: 10,
      MaxPhotos: 3,
      CanUseAdvancedFilters: false,
      CanSeeAnalytics: false,
      CanAccessVIPFeatures: false,
      CanFeatureProfile: false,
      CanFeatureActivities: false,
    },
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    color: 'text-info',
    bgColor: 'bg-info/10',
    badge: 'S',
    price: '$9.99/mo',
    description: 'More freedom to connect',
    benefits: [
      'Everything in Basic',
      'More Activity creation (5)',
      'Advanced Discover filters',
      'Priority requests',
      'Increased photo limits (6)',
    ],
    permissions: {
      CanCreateExperience: true,
      CanCreateCircle: true,
      MaxHostedActivities: 5,
      MaxSavedActivities: 25,
      MaxPhotos: 6,
      CanUseAdvancedFilters: true,
      CanSeeAnalytics: false,
      CanAccessVIPFeatures: false,
      CanFeatureProfile: false,
      CanFeatureActivities: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    badge: 'P',
    price: '$19.99/mo',
    description: 'Unlock the full experience',
    benefits: [
      'Everything in Standard',
      'Unlimited hosting',
      'Featured profile',
      'Featured Activities',
      'Advanced privacy controls',
      'Host analytics',
    ],
    permissions: {
      CanCreateExperience: true,
      CanCreateCircle: true,
      MaxHostedActivities: Infinity,
      MaxSavedActivities: 100,
      MaxPhotos: 12,
      CanUseAdvancedFilters: true,
      CanSeeAnalytics: true,
      CanAccessVIPFeatures: false,
      CanFeatureProfile: true,
      CanFeatureActivities: true,
    },
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    badge: 'VIP',
    price: '$49.99/mo',
    description: 'The ultimate Nmood experience',
    benefits: [
      'Everything in Premium',
      'VIP badge',
      'Priority verification',
      'Concierge support (future)',
      'Early feature access',
      'Exclusive community events',
    ],
    permissions: {
      CanCreateExperience: true,
      CanCreateCircle: true,
      MaxHostedActivities: Infinity,
      MaxSavedActivities: Infinity,
      MaxPhotos: 24,
      CanUseAdvancedFilters: true,
      CanSeeAnalytics: true,
      CanAccessVIPFeatures: true,
      CanFeatureProfile: true,
      CanFeatureActivities: true,
    },
  },
};

export const TIER_ORDER = ['basic', 'standard', 'premium', 'vip'];

export const comparisonRows = [
  { label: 'Price', values: { basic: 'Free', standard: '$9.99/mo', premium: '$19.99/mo', vip: '$49.99/mo' } },
  { label: 'Hosted Activities', values: { basic: '1', standard: '5', premium: 'Unlimited', vip: 'Unlimited' } },
  { label: 'Saved Activities', values: { basic: '10', standard: '25', premium: '100', vip: 'Unlimited' } },
  { label: 'Photos per Activity', values: { basic: '3', standard: '6', premium: '12', vip: '24' } },
  { label: 'Advanced Filters', values: { basic: false, standard: true, premium: true, vip: true } },
  { label: 'Host Analytics', values: { basic: false, standard: false, premium: true, vip: true } },
  { label: 'Featured Profile', values: { basic: false, standard: false, premium: true, vip: true } },
  { label: 'Featured Activities', values: { basic: false, standard: false, premium: true, vip: true } },
  { label: 'VIP Badge', values: { basic: false, standard: false, premium: false, vip: true } },
  { label: 'Priority Verification', values: { basic: false, standard: false, premium: false, vip: true } },
  { label: 'Concierge Support', values: { basic: false, standard: false, premium: false, vip: true } },
  { label: 'Early Feature Access', values: { basic: false, standard: false, premium: false, vip: true } },
  { label: 'Exclusive Events', values: { basic: false, standard: false, premium: false, vip: true } },
];

export function getTier(tierId) {
  return MEMBERSHIP_TIERS[tierId] || MEMBERSHIP_TIERS.basic;
}

// Returns the static permission metadata for a tier (display only).
// For live permission decisions, use permission-engine.hasPermission().
export function getPermissions(tierId) {
  return getTier(tierId).permissions;
}