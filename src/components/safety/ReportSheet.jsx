import React, { useState } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Send, Check, Loader2, Flag } from 'lucide-react';
import { useSafety } from '@/lib/safety-store';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { base44 } from '@/api/base44Client';

// Stable reason keys (stored, not localized display strings — fixes QA-003).
const MEMBER_REASONS = [
  'fake_profile',
  'spam',
  'harassment',
  'hate_speech',
  'inappropriate_content',
  'scam',
  'underage',
  'other',
];

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

const REASON_SETS = {
  member: MEMBER_REASONS,
  host: ['harassment', 'inappropriate_content', 'scam', 'fake_profile', 'other'],
  experience: ['inappropriate_content', 'scam', 'fake_profile', 'other'],
  circle: ['inappropriate_content', 'spam', 'hate_speech', 'other'],
  message: ['harassment', 'spam', 'inappropriate_content', 'hate_speech', 'other'],
};

const TITLE_KEYS = {
  member: 'safety.report.member',
  host: 'safety.report.host',
  experience: 'safety.report.experience',
  circle: 'safety.report.circle',
  message: 'safety.report.message',
};

function reasonLabel(t, key) {
  const translated = t('safety.report.reason.' + key);
  const fallback = 'safety.report.reason.' + key;
  return translated && translated !== fallback ? translated : REASON_LABELS[key];
}

export default function ReportSheet({ open, onOpenChange, target }) {
  const { t } = useLocalization();
  const { report } = useSafety();
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const type = target?.type || 'member';
  const reasonKeys = REASON_SETS[type] || REASON_SETS.member;
  const canAlsoBlock = type === 'member';

  const reset = () => {
    setReason(null);
    setDetails('');
    setEvidenceUrl('');
    setAlsoBlock(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handleAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEvidenceUrl(file_url || '');
    } catch { /* ignore — optional */ }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (submitting || !reason) return;
    setSubmitting(true);
    try {
      await report({
        targetType: type,
        targetId: target?.id,
        targetName: target?.name,
        targetImage: target?.image,
        reason,
        details,
        evidenceUrl,
        alsoBlock: canAlsoBlock && alsoBlock,
      });
      setSubmitted(true);
      setTimeout(handleClose, 1800);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={(o) => !o && handleClose()} title={t(TITLE_KEYS[type])} description={t('safety.report.description')}>
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold mb-1">{t('safety.report.thank_you')}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">{t('safety.report.review')}</p>
        </div>
      ) : (
        <div className="pb-2">
          <div className="space-y-2 mb-4">
            {reasonKeys.map((rk) => (
              <button
                key={rk}
                type="button"
                onClick={() => setReason(rk)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-default text-start ${reason === rk ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${reason === rk ? 'border-primary' : 'border-muted-foreground/30'}`}>
                  {reason === rk && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm font-medium">{reasonLabel(t, rk)}</span>
              </button>
            ))}
          </div>

          <label className="text-sm font-medium mb-1.5 block">{t('safety.report.details_label')}</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('safety.report.details_placeholder')}
            rows={3}
            className="w-full px-3.5 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
          />

          <div className="flex items-center gap-2 mb-4">
            <label className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/40 transition-default">
              <Flag className="w-4 h-4" />
              {uploading ? 'Uploading…' : evidenceUrl ? 'Screenshot attached' : 'Add screenshot'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAttach} disabled={uploading} />
            </label>
          </div>

          {canAlsoBlock && (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border mb-4 cursor-pointer hover:bg-muted/40 transition-default">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm font-medium">Also block this member</span>
            </label>
          )}

          <Button className="w-full h-11 gap-2" disabled={!reason || submitting || uploading} onClick={handleSubmit}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('safety.report.submit')}
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}