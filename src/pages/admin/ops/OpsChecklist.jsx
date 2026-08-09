import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, FileDown, RefreshCw } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// F-003 §10 — Final Validation. The 10 modules every release must pass.
const MODULES = [
  { id: 'authentication', label: 'Authentication', checks: ['Login (email + Google)', 'Register → OTP flow', 'Password reset', 'Session persistence'] },
  { id: 'identity', label: 'Identity', checks: ['Profile creation', 'Onboarding completes', 'Profile completeness calc', 'Privacy controls'] },
  { id: 'discovery', label: 'Discovery', checks: ['Explore loads', 'Search returns results', 'Filters work', 'Nmood recommendations'] },
  { id: 'connections', label: 'Connections', checks: ['Pal request lifecycle', 'Connected profile', 'Block / report'] },
  { id: 'experiences', label: 'Experiences', checks: ['Join / leave', 'Create activity', 'Experience chat', 'Day-of flow'] },
  { id: 'membership', label: 'Membership', checks: ['Explorer tier', 'Premium gating', 'Upgrade flow', 'Cancel / restore'] },
  { id: 'administration', label: 'Administration', checks: ['Admin role enforced', 'Member management', 'Reports workflow', 'Server-side verification'] },
  { id: 'analytics', label: 'Analytics', checks: ['Product events tracked', 'Privacy-by-design', 'Dashboard populated'] },
  { id: 'notifications', label: 'Notifications', checks: ['Announcements send', 'Notification preferences', 'Invitations delivered'] },
  { id: 'performance', label: 'Performance', checks: ['App startup < 3s', 'Home load < 2s', 'Search < 1s', 'No unhandled errors'] },
];

export default function OpsChecklist() {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [status, setStatus] = useState(() => Object.fromEntries(MODULES.map((m) => [m.id, 'pending'])));

  const cycle = (id) => {
    const order = ['pending', 'pass', 'fail'];
    setStatus((s) => ({ ...s, [id]: order[(order.indexOf(s[id]) + 1) % order.length] }));
  };

  const passCount = Object.values(status).filter((v) => v === 'pass').length;
  const failCount = Object.values(status).filter((v) => v === 'fail').length;
  const progress = Math.round((passCount / MODULES.length) * 100);
  const ready = passCount === MODULES.length && failCount === 0;

  const generateReport = () => {
    const date = new Date().toISOString();
    const lines = [
      'INMOOD — PRODUCTION RELEASE REPORT',
      'Generated: ' + date,
      'Overall: ' + (ready ? '✅ APPROVED FOR RELEASE' : '❌ NOT READY'),
      'Progress: ' + passCount + '/' + MODULES.length + ' modules passed' + (failCount ? ' · ' + failCount + ' failed' : ''),
      '',
      ...MODULES.map((m) => {
        const s = status[m.id];
        const icon = s === 'pass' ? '✓' : s === 'fail' ? '✗' : '○';
        return `${icon} ${m.label}\n   Checks: ${m.checks.join(', ')}\n   Status: ${s.toUpperCase()}`;
      }),
      '',
      '— End of report —',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inmood-release-report-${date.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: ready ? 'Release approved' : 'Report generated', description: ready ? 'All modules passed.' : `${failCount} module(s) failing.` });
  };

  const reset = () => setStatus(Object.fromEntries(MODULES.map((m) => [m.id, 'pending'])));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('mission.final_validation')}</h1>
          <p className="text-sm text-muted-foreground">{t('mission.verify_all_modules_before_every')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="w-4 h-4" />
          {t('mission.reset')}
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('mission.readiness')}</span>
          <span className={'text-sm font-bold ' + (ready ? 'text-success' : failCount ? 'text-destructive' : 'text-muted-foreground')}>
            {passCount}/{MODULES.length} passed · {progress}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div className={'h-full rounded-full transition-all ' + (ready ? 'bg-success' : 'bg-primary')} style={{ width: progress + '%' }} />
        </div>
        <Button onClick={generateReport} className="w-full" disabled={passCount === 0 && failCount === 0}>
          <FileDown className="w-4 h-4" />
          {t('mission.generate_release_report')}
        </Button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {MODULES.map((m) => {
          const s = status[m.id];
          return (
            <Card key={m.id} className="p-4">
              <button onClick={() => cycle(m.id)} className="flex items-center justify-between gap-3 w-full text-left">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{m.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.checks.join(' · ')}</p>
                </div>
                {s === 'pass' ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : s === 'fail' ? (
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                )}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}