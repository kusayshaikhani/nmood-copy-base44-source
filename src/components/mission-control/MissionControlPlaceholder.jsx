import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MCModuleHeader, MCEmptyState } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * FM-001 / FM-004 — Reusable placeholder for every Mission Control module.
 * Follows the standard enterprise layout so all not-yet-built modules share
 * the same header and empty-state appearance. Ready to be replaced with real
 * functionality in future implementation phases.
 */
export default function MissionControlPlaceholder({ module }) {
  const { t } = useLocalization();
  return (
    <div className="max-w-3xl mx-auto">
      <MCModuleHeader
        icon={module.icon}
        title={module.title}
        description={module.description}
        breadcrumb={[{ label: module.title }]}
      />
      <Card className="glass p-10">
        <MCEmptyState
          icon={Sparkles}
          title={t('mission.coming_soon')}
          description="This module is part of the Founder Mission Control framework. Functionality will be implemented in an upcoming phase."
        />
      </Card>
    </div>
  );
}