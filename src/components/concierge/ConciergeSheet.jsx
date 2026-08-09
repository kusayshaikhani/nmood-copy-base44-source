import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sunrise, TrendingUp, MessageCircle, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ConciergeBrief from './ConciergeBrief';
import ConciergeWeekly from './ConciergeWeekly';
import ConciergeChat from './ConciergeChat';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConciergeSheet({ open, onOpenChange, member, user }) {
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState('brief');

  const tabs = [
    { id: 'brief', label: t('ai.concierge.tab.brief'), icon: Sunrise },
    { id: 'weekly', label: t('ai.concierge.tab.weekly'), icon: TrendingUp },
    { id: 'chat', label: t('ai.concierge.tab.chat'), icon: MessageCircle },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] rounded-t-3xl p-0 flex flex-col">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted mt-3 flex-shrink-0" />

        <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
          <div>
            <SheetTitle className="text-lg font-bold">{t('ai.concierge.title')}</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">{t('ai.concierge.intelligent_assistant')}</SheetDescription>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" type="button">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-1 px-4 border-b border-border flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-default ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className={`flex-1 overflow-y-auto p-4 ${activeTab === 'chat' ? 'flex flex-col' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={activeTab === 'chat' ? 'flex-1 flex flex-col min-h-0' : ''}
            >
              {activeTab === 'brief' && <ConciergeBrief member={member} user={user} />}
              {activeTab === 'weekly' && <ConciergeWeekly member={member} user={user} />}
              {activeTab === 'chat' && <ConciergeChat member={member} user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex-shrink-0 px-4 py-2.5 border-t border-border">
          <p className="text-[10px] text-muted-foreground/70 text-center leading-relaxed">
            {t('ai.concierge.advisory')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}