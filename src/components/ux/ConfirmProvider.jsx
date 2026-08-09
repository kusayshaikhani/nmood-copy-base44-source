import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { haptic } from '@/lib/haptics';

/**
 * UI-026 — Global premium confirmation dialog. Call
 * `confirm({ title, description, confirmLabel, cancelLabel, destructive })`
 * which resolves to a boolean — replacing every browser confirm with a
 * 28px rounded, blur-backed modal, large typography, and clear primary /
 * secondary actions. Mounted once in App.jsx.
 */
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const { t } = useLocalization();
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);
  const reduce = useReducedMotion();

  const close = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setState(null);
  }, []);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      haptic('selection');
      setState({
        title: opts.title || t('ux.confirm_default_title'),
        description: opts.description || t('ux.confirm_default_desc'),
        confirmLabel: opts.confirmLabel || (opts.destructive ? t('ux.confirm_delete_action') : t('ux.confirm_confirm')),
        cancelLabel: opts.cancelLabel || t('ux.confirm_cancel'),
        destructive: opts.destructive || false,
        icon: opts.icon,
      });
    });
  }, [t]);

  const handleConfirm = () => { haptic('success'); close(true); };
  const handleCancel = () => { haptic('light'); close(false); };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ux-confirm-title"
          >
            <div
              className="absolute inset-0 bg-background/50 backdrop-blur-md"
              onClick={() => handleCancel()}
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 12 }}
              animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="relative w-full max-w-sm rounded-dialog bg-card border border-border/50 shadow-dialog p-7 text-center"
            >
              <div className={`mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center ${state.destructive ? 'bg-destructive/12' : 'bg-primary/12'}`}>
                {state.icon ? state.icon : <AlertTriangle className={`w-8 h-8 ${state.destructive ? 'text-destructive' : 'text-primary'}`} strokeWidth={1.5} />}
              </div>
              <h2 id="ux-confirm-title" className="text-xl font-semibold mb-2 text-balance">{state.title}</h2>
              {state.description && <p className="text-sm text-muted-foreground mb-7 leading-relaxed text-balance">{state.description}</p>}
              <div className="flex flex-col-reverse gap-2.5">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleCancel}
                  className="w-full"
                >
                  {state.cancelLabel}
                </Button>
                <Button
                  variant={state.destructive ? 'destructive' : 'default'}
                  size="lg"
                  onClick={handleConfirm}
                  className="w-full"
                >
                  {state.confirmLabel}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

export default ConfirmProvider;