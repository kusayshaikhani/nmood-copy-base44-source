import { PREMIUM_BENEFITS, MEMBERSHIP_COMPARISON } from './premium-benefits';
// DEPRECATED for permission decisions. Live membership state + all permission
// logic now live in membership-engine.js and permission-engine.js (MP-001).
// This file retains ONLY display metadata (tier labels, colors, badges,
// benefits, comparison rows) used by legacy membership UI components.
// Do NOT add permission/limit logic here — use permission-engine.hasPermission.

export const MEMBERSHIP_TIERS = {
  basic: {
    id: 'basic',
    name: 'Explorer',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    badge: 'B',
    price: 'Free',
    description: 'Get started with Nmood',
    benefits: ['Eligible public discovery', 'Connection and privacy rules apply', 'Account verification and Support'],
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
    price: 'See current store pricing',
    description: 'More freedom to connect',
    benefits: ['Eligible public discovery', 'Connection and privacy rules apply', 'Account verification and Support'],
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
    price: 'See current store pricing',
    description: 'Unlock the full experience',
    benefits: ['Eligible public discovery', 'Connection and privacy rules apply', 'Account verification and Support'],
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
    price: 'See current store pricing',
    description: 'The ultimate Nmood experience',
    benefits: ['Eligible public discovery', 'Connection and privacy rules apply', 'Account verification and Support'],
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

MEMBERSHIP_TIERS.premium.benefits = PREMIUM_BENEFITS.map(benefit => benefit.description);
export const TIER_ORDER = ['basic', 'premium'];

export const comparisonRows = MEMBERSHIP_COMPARISON.map(row => ({
  label: row.label, values: { basic: row.explorer, premium: row.premium },
}));

export function getTier(tierId) {
  return MEMBERSHIP_TIERS[tierId] || MEMBERSHIP_TIERS.basic;
}

// Returns the static permission metadata for a tier (display only).
// For live permission decisions, use permission-engine.hasPermission().
export function getPermissions(tierId) {
  return getTier(tierId).permissions;
}