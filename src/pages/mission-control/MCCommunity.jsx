import CommunityCenter from '@/components/mission-control/community/CommunityCenter';
import { MODULES } from '@/lib/mission-control-modules';

/** MC-UX-001 — Unified Community Management workspace (Experiences + Circles). */
export default function MCCommunity() {
  return <CommunityCenter defaultTab="experience" module={MODULES.community} />;
}