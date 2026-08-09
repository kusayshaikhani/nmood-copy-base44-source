import MissionControlPlaceholder from '@/components/mission-control/MissionControlPlaceholder';
import { MODULES } from '@/lib/mission-control-modules';

export default function MCMessaging() {
  return <MissionControlPlaceholder module={MODULES.messaging} />;
}