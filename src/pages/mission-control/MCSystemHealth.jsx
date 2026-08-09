import PlatformOperationsCenter from '@/components/mission-control/ops/PlatformOperationsCenter';

/** FM-011 — System Health consolidated into the Platform Operations Center. */
export default function MCSystemHealth() {
  return <PlatformOperationsCenter initialTab="system-health" />;
}