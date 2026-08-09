/**
 * FM-008 — Community Management Center metrics, search/filter/sort, and export.
 * Pure helpers over Experience / Circle / SafetyReport data.
 */
import { APP_VERSION } from '@/lib/system-config';

const DAY = 86400000;
const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function computeOverview(experiences, circles, reports) {
  const todayK = dayKey(Date.now());
  const expReports = reports.filter((r) => r.target_type === 'experience');
  const circleReports = reports.filter((r) => r.target_type === 'circle');
  return {
    activeExperiences: experiences.filter((e) => e.status === 'active' && !e.is_archived && !e.is_hidden).length,
    activeCircles: circles.filter((c) => c.status === 'active' && !c.is_hidden).length,
    experiencesToday: experiences.filter((e) => dayKey(e.created_date) === todayK).length,
    circlesToday: circles.filter((c) => dayKey(c.created_date) === todayK).length,
    featuredExperiences: experiences.filter((e) => e.is_featured).length,
    featuredCircles: circles.filter((c) => c.is_featured).length,
    featuredContent: experiences.filter((e) => e.is_featured).length + circles.filter((c) => c.is_featured).length,
    reportedExperiences: new Set(expReports.map((r) => r.target_id).filter(Boolean)).size,
    reportedCircles: new Set(circleReports.map((r) => r.target_id).filter(Boolean)).size,
    reportedContent: new Set([...expReports, ...circleReports].map((r) => r.target_id).filter(Boolean)).size,
    archivedContent: experiences.filter((e) => e.is_archived).length + circles.filter((c) => c.status === 'archived').length,
    hiddenContent: experiences.filter((e) => e.is_hidden).length + circles.filter((c) => c.is_hidden).length,
  };
}

export function reportCountMap(reports, type) {
  const map = {};
  reports.filter((r) => r.target_type === type).forEach((r) => {
    if (r.target_id) map[r.target_id] = (map[r.target_id] || 0) + 1;
  });
  return map;
}

export function activeReports(reports, type, id) {
  return reports.filter((r) => r.target_type === type && r.target_id === id);
}

function matchQuery(item, type, q) {
  const s = q.toLowerCase();
  const title = (type === 'experience' ? item.title : item.name) || '';
  const creator = item.host_name || '';
  const fields = [title, creator, item.id, item.location, item.category, item.budget, ...(item.shared_interests || [])].join(' ').toLowerCase();
  return fields.includes(s);
}

export function applySearch(items, type, query) {
  if (!query) return items;
  return items.filter((i) => matchQuery(i, type, query));
}

export function applyFilters(items, type, filters, reports) {
  let out = items;
  if (filters.status) out = out.filter((i) => i.status === filters.status);
  if (filters.category) out = out.filter((i) => (i.category || '').toLowerCase() === filters.category.toLowerCase());
  if (filters.creator) out = out.filter((i) => (i.host_name || '').toLowerCase().includes(filters.creator.toLowerCase()));
  if (filters.visibility) out = out.filter((i) => (i.visibility || 'public') === filters.visibility);
  if (filters.featured) out = out.filter((i) => i.is_featured);
  if (filters.reported) {
    const ids = new Set(reports.filter((r) => r.target_type === type).map((r) => r.target_id));
    out = out.filter((i) => ids.has(i.id));
  }
  if (filters.archived) {
    if (type === 'experience') out = out.filter((i) => i.is_archived);
    else out = out.filter((i) => i.status === 'archived' || i.is_archived);
  }
  if (filters.hidden) out = out.filter((i) => i.is_hidden);
  if (filters.dateFrom) {
    const t = new Date(filters.dateFrom).getTime();
    out = out.filter((i) => i.created_date && new Date(i.created_date).getTime() >= t);
  }
  if (filters.dateTo) {
    const t = new Date(filters.dateTo).getTime() + DAY;
    out = out.filter((i) => i.created_date && new Date(i.created_date).getTime() <= t);
  }
  return out;
}

const SORTERS = {
  experience: {
    newest: (a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0),
    oldest: (a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0),
    participants: (a, b) => (b.spots_filled || 0) - (a.spots_filled || 0),
    reports: (a, b, rc) => (rc[b.id] || 0) - (rc[a.id] || 0),
    rated: (a, b) => (b.spots_filled || 0) - (a.spots_filled || 0),
    updated: (a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0),
  },
  circle: {
    newest: (a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0),
    oldest: (a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0),
    members: (a, b) => (b.member_count || 0) - (a.member_count || 0),
    reports: (a, b, rc) => (rc[b.id] || 0) - (rc[a.id] || 0),
    rated: (a, b) => (b.member_count || 0) - (a.member_count || 0),
    updated: (a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0),
  },
};

export function applySort(items, type, sort, reportCounts) {
  const fn = SORTERS[type][sort];
  if (!fn) return items;
  return [...items].sort((a, b) => fn(a, b, reportCounts));
}

export function filterOptions(items, type) {
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  const creators = [...new Set(items.map((i) => i.host_name).filter(Boolean))].sort();
  return { categories, creators };
}

export const STATUS_BADGE = {
  active: 'bg-success/15 text-success',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
  completed: 'bg-info/15 text-info',
  draft: 'bg-muted text-muted-foreground',
  paused: 'bg-warning/15 text-warning',
  archived: 'bg-destructive/15 text-destructive',
};

// Soft-delete / archive patch builders — never hard delete.
export function archivePatch(type) {
  return type === 'experience' ? { is_archived: true } : { status: 'archived', is_archived: true };
}
export function restorePatch(type) {
  return type === 'experience' ? { is_archived: false, is_hidden: false } : { status: 'active', is_archived: false, is_hidden: false };
}
export function softDeletePatch(type) {
  return type === 'experience' ? { is_archived: true, is_hidden: true, status: 'closed' } : { status: 'archived', is_archived: true, is_hidden: true };
}

function esc(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }

export function exportCommunityCsv(items, type) {
  const header = type === 'experience'
    ? 'ID,Title,Host,Location,Category,Date,Participants,Capacity,Visibility,Featured,Hidden,Archived,Status,Reports,Created'
    : 'ID,Name,Owner,Location,Category,Members,Visibility,Featured,Hidden,Archived,Status,Reports,Created';
  const lines = [header];
  items.forEach((i) => {
    if (type === 'experience') {
      lines.push([esc(i.id), esc(i.title), esc(i.host_name), esc(i.location), esc(i.category), esc(i.date), i.spots_filled || 0, i.max_participants || 0, esc(i.visibility), i.is_featured, i.is_hidden, i.is_archived, esc(i.status), 0, esc(i.created_date)].join(','));
    } else {
      lines.push([esc(i.id), esc(i.name), esc(i.host_name), esc(i.location), esc(i.category), i.member_count || 0, esc(i.visibility), i.is_featured, i.is_hidden, i.is_archived, esc(i.status), 0, esc(i.created_date)].join(','));
    }
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `nmood-${type}-export-${Date.now()}.csv`);
}

export async function exportCommunityPdf(items, type) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16); doc.text(`Nmood ${type === 'experience' ? 'Experiences' : 'Circles'} Report`, 14, 16);
  doc.setFontSize(9); doc.text(`Version ${APP_VERSION} · ${new Date().toLocaleString()} · ${items.length} records`, 14, 22);
  const cols = type === 'experience'
    ? ['Title', 'Host', 'Location', 'Status', 'Featured', 'Participants', 'Created']
    : ['Name', 'Owner', 'Location', 'Status', 'Featured', 'Members', 'Created'];
  let y = 30;
  doc.setFontSize(8);
  doc.text(cols.join('   |   '), 14, y); y += 5;
  items.slice(0, 60).forEach((i) => {
    const row = type === 'experience'
      ? [i.title || '', i.host_name || '', i.location || '', i.status || '', i.is_featured ? 'Yes' : 'No', String(i.spots_filled || 0), (i.created_date || '').slice(0, 10)]
      : [i.name || '', i.host_name || '', i.location || '', i.status || '', i.is_featured ? 'Yes' : 'No', String(i.member_count || 0), (i.created_date || '').slice(0, 10)];
    doc.text(row.join('   |   '), 14, y); y += 5;
    if (y > 195) { doc.addPage(); y = 16; doc.text(cols.join('   |   '), 14, y); y += 5; }
  });
  doc.save(`nmood-${type}-report-${Date.now()}.pdf`);
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/**
 * MC-UX-001 — Build a unified chronological activity timeline from both
 * Experiences and Circles. Newest first. Each item:
 * { id, kind: 'experience'|'circle', action, name, ts }
 */
export function buildActivityTimeline(experiences, circles, reports, limit = 15) {
  const items = [];
  const push = (id, kind, action, name, ts) => {
    if (!ts) return;
    items.push({ id: `${kind}-${action}-${id}`, kind, action, name, ts: new Date(ts).getTime() });
  };
  experiences.forEach((e) => push(e.id, 'experience', 'created', e.title, e.created_date));
  experiences.forEach((e) => { if (e.is_archived) push(e.id, 'experience', 'archived', e.title, e.updated_date); });
  experiences.forEach((e) => { if (e.is_featured) push(e.id, 'experience', 'featured', e.title, e.updated_date); });
  circles.forEach((c) => push(c.id, 'circle', 'created', c.name, c.created_date));
  circles.forEach((c) => { if (c.status === 'archived' || c.is_archived) push(c.id, 'circle', 'archived', c.name, c.updated_date); });
  circles.forEach((c) => { if (c.is_featured) push(c.id, 'circle', 'featured', c.name, c.updated_date); });
  reports.forEach((r) => push(r.target_id || r.id, r.target_type === 'circle' ? 'circle' : 'experience', 'reported', r.target_type === 'circle' ? 'Circle' : 'Experience', r.created_date));
  items.sort((a, b) => b.ts - a.ts);
  return items.slice(0, limit);
}