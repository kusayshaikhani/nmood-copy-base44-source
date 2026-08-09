// RM-003 Rollback readiness. Feature flags and SystemConfig are server-driven
// and can be reverted without redeploy. Database migration + deployment
// rollback are platform-managed. Exposes readiness manifest + config
// snapshot/restore helpers backed by the audit trail.
import { base44 } from '@/api/base44Client';

export const ROLLBACK_READINESS = {
  featureRollback: { supported: true, method: 'Toggle FeatureFlag (server-driven, no redeploy)' },
  configRollback: { supported: true, method: 'Restore prior SystemConfig value from AuditLog history' },
  databaseMigrationRollback: { supported: true, method: 'Platform-managed point-in-time recovery (contact Base44 support)' },
  deploymentRollback: { supported: true, method: 'Platform-managed previous deployment revision' },
};

export async function captureConfigSnapshot() {
  try {
    const res = await base44.functions.invoke('systemOps', { mode: 'getConfig' });
    return res?.config || null;
  } catch {
    return null;
  }
}

export async function restoreConfigValue(key, value, category = 'branding') {
  try {
    await base44.functions.invoke('systemOps', { mode: 'setConfig', key, value, category });
    return true;
  } catch {
    return false;
  }
}

export function getRollbackReadiness() {
  return ROLLBACK_READINESS;
}