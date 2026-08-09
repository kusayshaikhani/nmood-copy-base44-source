/**
 * FM-005 — Trust & Safety helpers. Pure presentation, filter, and sort logic.
 * New report categories can be added by extending REPORT_TYPE_LABELS / reasons
 * without structural changes to the workspace.
 */
import { formatDistanceToNow, format } from 'date-fns';

export const REPORT_TYPE_LABELS = {
  member: 'Member',
  experience: 'Experience',
  circle: 'Circle',
  host: 'Host',
  message: 'Message',
};

export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export const STATUS_LABELS = {
  submitted: 'Submitted',
  reviewing: 'Reviewing',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

export const STATUS_BADGE = {
  submitted: 'default',
  reviewing: 'secondary',
  resolved: 'secondary',
  dismissed: 'secondary',
};

export const APPEAL_STATUS_LABELS = {
  open: 'Open',
  waiting: 'Waiting',
  resolved: 'Resolved',
};

export const isOpen = (status) => status === 'submitted' || status === 'reviewing';

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const t = new Date(dateStr);
  return Number.isNaN(t.getTime()) ? '—' : format(t, 'dd MMM yyyy');
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const t = new Date(dateStr);
  if (Number.isNaN(t.getTime())) return '—';
  try { return formatDistanceToNow(t, { addSuffix: true }); } catch { return '—'; }
}

export function reportShortId(r) {
  return r?.id ? '#' + String(r.id).slice(-6) : '—';
}

export function ticketShortId(t) {
  return t?.id ? '#' + String(t.id).slice(-6) : '—';
}

export function reporterCountry(report, memberByUserId) {
  const m = memberByUserId?.[report?.created_by_id];
  return m?.country || '—';
}

export function priorityRank(p) {
  return { low: 0, medium: 1, high: 2 }[p || 'low'] ?? 0;
}

export function computeKpis(reports, appeals, members) {
  const openReports = reports.filter((r) => isOpen(r.status)).length;
  const highPriority = reports.filter((r) => r.priority === 'high' && isOpen(r.status)).length;
  const pendingAppeals = appeals.filter((a) => a.status === 'open').length;
  const activeSuspensions = members.filter((m) => m.admin_status === 'suspended').length;
  const activeBans = members.filter((m) => m.admin_status === 'banned').length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const resolvedToday = reports.filter(
    (r) => r.status === 'resolved' && r.updated_date && r.updated_date.slice(0, 10) === todayKey
  ).length;
  const resolved = reports.filter((r) => r.status === 'resolved' && r.created_date && r.updated_date);
  let avgResolution = '—';
  if (resolved.length) {
    const ms = resolved.reduce((acc, r) => acc + (new Date(r.updated_date) - new Date(r.created_date)), 0) / resolved.length;
    const hours = ms / 3600000;
    avgResolution = hours < 1 ? `${Math.round(ms / 60000)}m` : hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`;
  }
  return {
    openReports,
    highPriority,
    pendingAppeals,
    activeSuspensions,
    activeBans,
    resolvedToday,
    avgResolution,
    aiFlagged: 0, // AI flagging is reserved (FM-005 future-ready)
  };
}

export function applyFiltersAndSearch(reports, search, filters, memberByUserId) {
  let result = reports;
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((r) =>
      [r.id, r.reason, r.target_name, r.reporter_name, r.details, r.target_type]
        .some((v) => v && String(v).toLowerCase().includes(q))
    );
  }
  if (filters.type) result = result.filter((r) => r.target_type === filters.type);
  if (filters.status) result = result.filter((r) => r.status === filters.status);
  if (filters.priority) result = result.filter((r) => r.priority === filters.priority);
  if (filters.country) result = result.filter((r) => (reporterCountry(r, memberByUserId) || '').toLowerCase() === filters.country.toLowerCase());
  if (filters.resolution) {
    if (filters.resolution === 'open') result = result.filter((r) => isOpen(r.status));
    else result = result.filter((r) => r.status === filters.resolution);
  }
  if (filters.aiFlagged) result = result.filter(() => false); // no AI flag field yet
  if (filters.dateFrom) result = result.filter((r) => r.created_date && r.created_date.slice(0, 10) >= filters.dateFrom);
  if (filters.dateTo) result = result.filter((r) => r.created_date && r.created_date.slice(0, 10) <= filters.dateTo);
  return result;
}

export function applySortReports(reports, sort) {
  const { key, dir } = sort;
  const factor = dir === 'asc' ? 1 : -1;
  return [...reports].sort((a, b) => {
    let av, bv;
    switch (key) {
      case 'created_date':
        av = new Date(a.created_date || 0).getTime(); bv = new Date(b.created_date || 0).getTime(); break;
      case 'priority':
        av = priorityRank(a.priority); bv = priorityRank(b.priority); break;
      case 'target_name':
        av = (a.target_name || '').toLowerCase(); bv = (b.target_name || '').toLowerCase(); break;
      default: return 0;
    }
    if (av < bv) return -1 * factor;
    if (av > bv) return 1 * factor;
    return 0;
  });
}

export function applySortAppeals(appeals, sort) {
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...appeals].sort((a, b) => {
    const av = new Date(a.created_date || 0).getTime();
    const bv = new Date(b.created_date || 0).getTime();
    return (av - bv) * factor;
  });
}

export function countActiveFilters(filters) {
  let n = 0;
  ['type', 'status', 'priority', 'country', 'resolution', 'dateFrom', 'dateTo', 'aiFlagged'].forEach((k) => { if (filters[k]) n++; });
  return n;
}

export function relatedReports(reports, report) {
  if (!report?.target_id) return [];
  return reports
    .filter((r) => r.target_id === report.target_id && r.id !== report.id)
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
}