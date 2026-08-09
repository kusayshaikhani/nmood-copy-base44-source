import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-020 — Fixed footer with Back + Next/Publish gradient CTA.
 * Sits above the MobileNav. Includes auto-saved indicator and save-draft link.
 */
export default function CreateFooter({ onBack, onNext, onPublish, isLast, publishing, backLabel, nextLabel, publishLabel, onSaveDraft, showDraft }) {
  const { t } = useLocalization();

  return (
    <div className="sticky bottom-0 flex-shrink-0 z-30 px-4 pt-2 pb-1.5 mb-2 bg-background border-t border-border/50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 h-11 rounded-button" disabled={publishing} type="button">
            {backLabel}
          </Button>
          {isLast ? (
            <Button onClick={onPublish} className="flex-1 h-11 rounded-button gap-2" disabled={publishing} type="button">
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
              {publishing ? t('hosting.create.publishing') : publishLabel}
            </Button>
          ) : (
            <Button onClick={onNext} className="flex-1 h-11 rounded-button" disabled={publishing} type="button">
              {nextLabel}
            </Button>
          )}
        </div>
        {showDraft && (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Check className="w-3 h-3 text-success" />
            <span className="text-[11px] text-muted-foreground">{t('hosting.create.draft_auto_saved')}</span>
            <span className="text-muted-foreground/40">·</span>
            <button onClick={onSaveDraft} className="text-[11px] text-primary font-medium hover:underline" type="button">
              {t('create.premium.save_draft')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}