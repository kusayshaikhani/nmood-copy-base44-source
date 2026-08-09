import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function NotificationsSettings({ open, onOpenChange, settings, onToggle }) {
  const { t } = useLocalization();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/40 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-background pt-4 pb-2 px-5 border-b border-border z-10">
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{t('notifications.settings_title')}</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-default"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground mb-3">
                {t('notifications.settings_desc')}
              </p>
              <div className="space-y-1">
                {settings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-default"
                    >
                      <div className="flex-1 me-3">
                        <p className="font-medium text-sm">{t(`notifications.settings.${setting.id}`)}</p>
                        <p className="text-xs text-muted-foreground">{t(`notifications.settings.${setting.id}_desc`)}</p>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={() => onToggle(setting.id)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}