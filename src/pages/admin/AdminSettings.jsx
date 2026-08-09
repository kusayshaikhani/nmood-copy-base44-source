import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { adminRoles } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SettingSection({ title, children }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{title}</h2>
      <Card className="divide-y divide-border p-4">
        {children}
      </Card>
    </div>
  );
}

export default function AdminSettings() {
  const { t } = useLocalization();
  const [flags, setFlags] = useState({
    circles: true,
    hosting: true,
    advanced_filters: true,
    vip_features: false,
    maintenance: false,
    signups: true,
  });

  const toggle = (key) => setFlags((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">{t('admin.settings')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.platform_configuration_and_feature_flags')}</p>
      </div>

      <SettingSection title={t('admin.platform')}>
        <div className="space-y-3 py-3.5">
          <div>
            <Label className="text-sm font-medium">{t('admin.platform_name')}</Label>
            <Input defaultValue="Nmood" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-sm font-medium">{t('admin.support_email')}</Label>
            <Input defaultValue="support@inmood.com" className="mt-1.5" />
          </div>
        </div>
      </SettingSection>

      <SettingSection title={t('admin.feature_flags')}>
        <SettingRow label="Circles" description="Enable circle creation">
          <Switch checked={flags.circles} onCheckedChange={() => toggle('circles')} />
        </SettingRow>
        <SettingRow label="Hosting" description="Allow members to host activities">
          <Switch checked={flags.hosting} onCheckedChange={() => toggle('hosting')} />
        </SettingRow>
        <SettingRow label="Advanced Filters" description="Discover advanced filtering">
          <Switch checked={flags.advanced_filters} onCheckedChange={() => toggle('advanced_filters')} />
        </SettingRow>
        <SettingRow label="VIP Features" description="Enable VIP-only features">
          <Switch checked={flags.vip_features} onCheckedChange={() => toggle('vip_features')} />
        </SettingRow>
        <SettingRow label="New Signups" description="Allow new member registrations">
          <Switch checked={flags.signups} onCheckedChange={() => toggle('signups')} />
        </SettingRow>
        <SettingRow label="Maintenance Mode" description="Temporarily restrict access">
          <Switch checked={flags.maintenance} onCheckedChange={() => toggle('maintenance')} />
        </SettingRow>
      </SettingSection>

      <SettingSection title={t('admin.security')}>
        <SettingRow label="Require Email Verification" description="Members must verify email before access">
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow label="2FA for Admins" description="Require two-factor authentication">
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow label="Auto-suspend on Reports" description="Suspend after 3 reports">
          <Switch />
        </SettingRow>
      </SettingSection>

      <SettingSection title={t('admin.roles_permissions')}>
        <div className="space-y-4 py-3.5">
          {adminRoles.map((role) => (
            <div key={role.role} className="p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{role.role}</p>
                <Badge variant="secondary">{role.count} {role.count === 1 ? 'admin' : 'admins'}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((perm) => (
                  <span key={perm} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{perm}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingSection>

      <Button>{t('admin.save_changes')}</Button>
    </div>
  );
}