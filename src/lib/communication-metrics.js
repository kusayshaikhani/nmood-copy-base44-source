/**
 * FM-009 — Communication Center metrics, channel config, search/filter/sort, export.
 * Pure helpers over Campaign / CampaignTemplate data.
 */
import { APP_VERSION } from '@/lib/system-config';

export const CHANNELS = [
  { id: 'push', label: 'Push Notifications' },
  { id: 'in_app', label: 'In-App Notifications' },
  { id: 'email', label: 'Email Campaigns' },
  { id: 'announcement', label: 'System Announcements' },
];

export const FUTURE_CHANNELS = [
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'partner', label: 'Partner Integrations' },
];

export const CHANNEL_LABEL = {
  push: 'Push', in_app: 'In-App', email: 'Email', announcement: 'Announcement',
  sms: 'SMS', whatsapp: 'WhatsApp', partner: 'Partner',
};

export const STATUS_BADGE = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-info/15 text-info',
  sending: 'bg-warning/15 text-warning',
  sent: 'bg-success/15 text-success',
  failed: 'bg-destructive/15 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
  archived: 'bg-destructive/15 text-destructive',
};

export const PRIORITY_BADGE = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info/15 text-info',
  high: 'bg-warning/15 text-warning',
  urgent: 'bg-destructive/15 text-destructive',
};

export const APPROVAL_LABEL = {
  draft: 'Draft', pending_approval: 'Pending Approval', approved: 'Approved',
  rejected: 'Rejected', published: 'Published',
};

export const ANNOUNCEMENT_TYPE_BADGE = {
  information: 'bg-info/15 text-info',
  warning: 'bg-warning/15 text-warning',
  maintenance: 'bg-warning/15 text-warning',
  emergency: 'bg-destructive/15 text-destructive',
};

export const TEMPLATE_CATEGORIES = [
  'welcome', 'maintenance', 'promotion', 'premium_offer',
  'community_update', 'safety_alert', 'emergency_broadcast', 'custom',
];

export const TEMPLATE_CATEGORY_LABEL = {
  welcome: 'Welcome', maintenance: 'Maintenance', promotion: 'Promotion',
  premium_offer: 'Premium Offer', community_update: 'Community Update',
  safety_alert: 'Safety Alert', emergency_broadcast: 'Emergency Broadcast', custom: 'Custom',
};

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
];

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' }, { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent', label: 'Sent' }, { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' }, { value: 'archived', label: 'Archived' },
];

export const APPROVAL_OPTIONS = [
  { value: 'draft', label: 'Draft' }, { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'published', label: 'Published' },
];

export const ANNOUNCEMENT_TYPES = [
  { value: 'information', label: 'Information' }, { value: 'warning', label: 'Warning' },
  { value: 'maintenance', label: 'Maintenance' }, { value: 'emergency', label: 'Emergency' },
];

const DAY = 86400000;
const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function computeOverview(campaigns) {
  const todayK = dayKey(Date.now());
  const sent = campaigns.filter((c) => c.status === 'sent');
  const sentToday = sent.filter((c) => dayKey(c.sent_at) === todayK).length;
  const byType = (t) => campaigns.filter((c) => c.type === t && c.status === 'sent').length;
  const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
  const failed = campaigns.reduce((n, c) => n + ((c.delivery_stats && c.delivery_stats.failed) || 0), 0);
  const totalDelivered = sent.reduce((n, c) => n + ((c.delivery_stats && c.delivery_stats.delivered) || 0), 0);
  const totalAudience = sent.reduce((n, c) => n + (c.actual_audience || 0), 0);
  const deliveryRate = totalAudience ? Math.round((totalDelivered / totalAudience) * 100) : 0;
  const opened = sent.reduce((n, c) => n + ((c.delivery_stats && c.delivery_stats.opened) || 0), 0);
  const clicked = sent.reduce((n, c) => n + ((c.delivery_stats && c.delivery_stats.clicked) || 0), 0);
  const openRate = totalDelivered ? Math.round((opened / totalDelivered) * 100) : 0;
  const clickRate = totalDelivered ? Math.round((clicked / totalDelivered) * 100) : 0;
  return {
    sentToday, push: byType('push'), inApp: byType('in_app'), email: byType('email'),
    announcements: byType('announcement'), scheduled, failed, deliveryRate, openRate, clickRate,
  };
}

export function campaignSearch(items, q) {
  if (!q) return items;
  const s = q.toLowerCase();
  return items.filter((c) =>
    [c.name, c.title, c.subject, c.sent_by, c.id].filter(Boolean).join(' ').toLowerCase().includes(s)
  );
}

export function campaignFilter(items, filters) {
  let out = items;
  if (filters.status) out = out.filter((c) => c.status === filters.status);
  if (filters.priority) out = out.filter((c) => c.priority === filters.priority);
  if (filters.approval) out = out.filter((c) => c.approval_state === filters.approval);
  if (filters.dateFrom) {
    const t = new Date(filters.dateFrom).getTime();
    out = out.filter((c) => c.created_date && new Date(c.created_date).getTime() >= t);
  }
  if (filters.dateTo) {
    const t = new Date(filters.dateTo).getTime() + DAY;
    out = out.filter((c) => c.created_date && new Date(c.created_date).getTime() <= t);
  }
  return out;
}

export function campaignSort(items, sort) {
  const fns = {
    newest: (a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0),
    oldest: (a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0),
    audience: (a, b) => (b.actual_audience || b.estimated_audience || 0) - (a.actual_audience || a.estimated_audience || 0),
    sent: (a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0),
  };
  return [...items].sort(fns[sort] || fns.newest);
}

function esc(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }
function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export function exportCampaignsCsv(items) {
  const header = 'ID,Name,Type,Status,Approval,Priority,Audience,Sent By,Sent At,Delivered,Failed,Opened,Clicked,Delivery Rate,Open Rate,Click Rate,Created';
  const lines = [header];
  items.forEach((c) => {
    const ds = c.delivery_stats || {};
    const aud = c.actual_audience || c.estimated_audience || 0;
    const del = ds.delivered || 0;
    lines.push([
      esc(c.id), esc(c.name), esc(c.type), esc(c.status), esc(c.approval_state), esc(c.priority),
      aud, esc(c.sent_by), esc(c.sent_at), del, ds.failed || 0, ds.opened || 0, ds.clicked || 0,
      aud ? Math.round((del / aud) * 100) : 0, del ? Math.round((ds.opened || 0) / del * 100) : 0,
      del ? Math.round((ds.clicked || 0) / del * 100) : 0, esc(c.created_date),
    ].join(','));
  });
  triggerDownload(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), `nmood-communications-${Date.now()}.csv`);
}

export async function exportCampaignsPdf(items) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16); doc.text('Nmood Communication Center Report', 14, 16);
  doc.setFontSize(9); doc.text(`Version ${APP_VERSION} · ${new Date().toLocaleString()} · ${items.length} campaigns`, 14, 22);
  const cols = ['Name', 'Type', 'Status', 'Priority', 'Audience', 'Sent By', 'Sent', 'Deliv', 'Open%', 'Click%'];
  let y = 30; doc.setFontSize(8); doc.text(cols.join('   |   '), 14, y); y += 5;
  items.slice(0, 60).forEach((c) => {
    const ds = c.delivery_stats || {};
    const aud = c.actual_audience || c.estimated_audience || 0;
    const del = ds.delivered || 0;
    const row = [
      (c.name || '').slice(0, 24), CHANNEL_LABEL[c.type] || c.type, c.status || '', c.priority || '',
      String(aud), (c.sent_by || '').slice(0, 14), (c.sent_at || '').slice(0, 10), String(del),
      del ? Math.round((ds.opened || 0) / del * 100) + '%' : '—', del ? Math.round((ds.clicked || 0) / del * 100) + '%' : '—',
    ];
    doc.text(row.join('   |   '), 14, y); y += 5;
    if (y > 195) { doc.addPage(); y = 16; doc.text(cols.join('   |   '), 14, y); y += 5; }
  });
  doc.save(`nmood-communications-${Date.now()}.pdf`);
}