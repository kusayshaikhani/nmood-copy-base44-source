/**
 * FM-001 Founder Mission Control — Sidebar module registry.
 *
 * Single source of truth for the 19 placeholder modules. Each module is
 * rendered by its own page component (src/pages/mission-control/MC*.jsx) so it
 * can be developed independently in future phases.
 */
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MessageSquare,
  Brain,
  UsersRound,
  Bell,
  Crown,
  BarChart3,
  Wrench,
  BrainCircuit,
  Sparkles,
  Cpu,
  Rocket,
} from 'lucide-react';

export const MODULES = {
  dashboard: { title: 'Dashboard', description: 'Platform overview and founder KPIs.', icon: LayoutDashboard },
  members: { title: 'Members', description: 'Member directory, profiles, and account status.', icon: Users },
  'trust-safety': { title: 'Trust & Safety', description: 'Reports, moderation, and safety operations.', icon: ShieldCheck },
  messaging: { title: 'Messaging', description: 'Private and circle messaging oversight.', icon: MessageSquare },
  'ai-intelligence': { title: 'AI Intelligence', description: 'AI agents, prompts, and model governance.', icon: Brain },
  'ai-brain': { title: 'AI Brain', description: 'Centralized AI orchestration & service registry.', icon: BrainCircuit },
  'personal-intelligence': { title: 'Personal Intelligence', description: 'AI memory, semantic intelligence & personalization.', icon: Sparkles },
  'ai-operations': { title: 'AI Operations', description: 'AI assistants, governance, audit & continuous learning.', icon: Cpu },
  community: { title: 'Community Management', description: 'Unified management of experiences and circles — overview, featured content, reports, and moderation.', icon: UsersRound },
  notifications: { title: 'Notifications', description: 'Announcements and notification delivery.', icon: Bell },
  memberships: { title: 'Memberships', description: 'Explorer/Premium plans and entitlements.', icon: Crown },
  analytics: { title: 'Business Intelligence', description: 'Platform analytics, growth, localization & regional intelligence.', icon: BarChart3 },
  'platform-operations': { title: 'Platform Operations', description: 'Infrastructure, security, configuration, monitoring & deployments.', icon: Wrench },
  'production-hardening': { title: 'Production Hardening', description: 'Enterprise production readiness: security, performance, reliability, monitoring, deployments & DR.', icon: ShieldCheck },
  'launch-center': { title: 'Founder Launch Center', description: 'Release 1.0 certification, launch readiness, go/no-go & operational launch status.', icon: Rocket },
};

// Sidebar order — matches the FM-001 specification exactly.
export const SIDEBAR_ORDER = [
  'dashboard',
  'members',
  'trust-safety',
  'messaging',
  'ai-intelligence',
  'ai-brain',
  'personal-intelligence',
  'ai-operations',
  'community',
  'notifications',
  'memberships',
  'analytics',
  'platform-operations',
  'production-hardening',
  'launch-center',
];

/** Route path for a module id (dashboard is the index route). */
export function modulePath(id) {
  return id === 'dashboard' ? '/mission-control' : `/mission-control/${id}`;
}