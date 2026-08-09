import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const ConfirmContext = createContext(() => Promise.resolve(false));

export function AdminConfirmProvider({ children }) {
  const { t } = useLocalization();
  const [state, setState] = useState({ open: false });

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setState({ open: true, resolve, ...opts });
      }),
    []
  );

  const close = (val) => {
    state.resolve?.(val);
    setState({ open: false });
  };

  const destructive = state.variant === 'destructive';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={state.open} onOpenChange={(o) => !o && close(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title || 'Confirm action'}</AlertDialogTitle>
            {state.description && <AlertDialogDescription>{state.description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>{t('admin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => close(true)}
              className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {state.confirmLabel || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export const useAdminConfirm = () => useContext(ConfirmContext);