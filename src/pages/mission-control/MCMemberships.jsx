import MissionControlPlaceholder from '@/components/mission-control/MissionControlPlaceholder';
import { MODULES } from '@/lib/mission-control-modules';

export default function MCMemberships() {
  return <MissionControlPlaceholder module={MODULES.memberships} />;
}