import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Loader2, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const STATUS_LABELS = {
  submitted: 'Submitted',
  reviewing: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_VARIANT = {
  submitted: 'secondary',
  reviewing: 'info',
  resolved: 'success',
  dismissed: 'outline',
};

const REASON_LABELS = {
  fake_profile: 'Fake Profile',
  spam: 'Spam',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  inappropriate_content: 'Inappropriate Content',
  scam: 'Scam',
  underage: 'Underage User',
  other: 'Other',
};

export default function ReportHistorySheet({ open, onOpenChange }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user?.id) return;
    let active = true;
    setLoading(true);
    // SEC — Use the backend listMySafetyReports action which returns ONLY
    // public fields. Direct entity reads are blocked by RLS (admin/founder
    // only) — reporters cannot read internal moderation fields.
    base44.functions
      .invoke('authorizationGate', { action: 'listMySafetyReports' })
      .then((res) => { if (active) setReports(res?.data?.reports || []); })
      .catch(() => { if (active) setReports([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, user?.id]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Report History">
      <div className="pb-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Flag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No reports yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">Reports you submit about members or content will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto no-scrollbar">
            {reports.map((r) => (
              <div key={r.id} className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium truncate">{r.target_name || 'Member'}</p>
                  <Badge variant={STATUS_VARIANT[r.status] || 'secondary'}>{STATUS_LABELS[r.status] || r.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {REASON_LABELS[r.reason] || r.reason || '—'}
                  {r.created_date ? ` · ${new Date(r.created_date).toLocaleDateString()}` : ''}
                </p>
                {r.details && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.details}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}