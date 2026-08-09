import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Send, Check, Camera } from 'lucide-react';
import { reportTargets, reportReasons } from '@/lib/safety-data';
import { useSafety } from '@/lib/safety-store';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ReportSection() {
  const { t } = useLocalization();
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const { report } = useSafety();
  const [details, setDetails] = useState('');

  const openSheet = (target) => {
    setSelectedTarget(target);
    setSelectedReason(null);
    setSubmitted(false);
  };

  const closeSheet = () => {
    setSelectedTarget(null);
    setSelectedReason(null);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    report({ targetType: selectedTarget?.id || 'member', reason: selectedReason, details });
    setSubmitted(true);
    setTimeout(closeSheet, 1800);
  };

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold mb-3">{t('safety.report.problem')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {reportTargets.map((target) => {
          const Icon = target.icon;
          return (
            <button
              key={target.id}
              onClick={() => openSheet(target)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/40 transition-default"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{target.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 start-0 end-0 z-50 bg-background rounded-t-3xl max-h-[80vh] overflow-y-auto"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-success" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{t('safety.report.submitted')}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Thank you for helping keep our community safe. Our team will review your report.
                  </p>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 bg-background pt-4 pb-2 px-5 border-b border-border z-10">
                    <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold">Report {selectedTarget.label}</h2>
                      <button
                        onClick={closeSheet}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-default"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Help us understand what happened. Select a reason below.
                    </p>
                    <div className="space-y-2 mb-4">
                      {reportReasons.map((reason) => {
                        const isSelected = selectedReason === reason.id;
                        const reasonClass = isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border';
                        return (
                          <button
                            key={reason.id}
                            onClick={() => setSelectedReason(reason.id)}
                            className={'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-default text-start ' + reasonClass}
                          >
                            <div className={'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (isSelected ? 'border-primary' : 'border-muted-foreground/30')}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="text-sm font-medium">{reason.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mb-4">
                      <label className="text-sm font-medium mb-1.5 block">Additional Details (optional)</label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Provide more context about the issue..."
                        rows={3}
                        className="w-full px-3.5 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default resize-none"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="text-sm font-medium mb-1.5 block">Screenshots (optional)</label>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border bg-muted/30">
                        <Camera className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('safety.report.tap_screenshots')}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full h-11 gap-2"
                      disabled={!selectedReason}
                      onClick={handleSubmit}
                    >
                      <Send className="w-4 h-4" />{t('safety.report.submit')}</Button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}