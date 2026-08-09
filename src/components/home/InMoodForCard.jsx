import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Sparkles, Compass, PenLine } from 'lucide-react';
import InterestPollWizard from '@/components/interest-poll/InterestPollWizard';
import { useLocalization } from '@/lib/i18n/useLocalization';

const intentions = [
  { id: 'coffee', emoji: '☕' },
  { id: 'networking', emoji: '👥' },
  { id: 'padel', emoji: '🎾' },
  { id: 'photography', emoji: '📷' },
  { id: 'running', emoji: '🏃' },
  { id: 'dinner', emoji: '🍽️' },
  { id: 'relax', emoji: '🧘' },
  { id: 'adventure', emoji: '🏔️' },
];

const actions = [
  { id: 'find', icon: Users },
  { id: 'invite', icon: UserPlus },
  { id: 'host', icon: Sparkles },
  { id: 'browse', icon: Compass },
];

export default function InMoodForCard({ onHost }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [selected, setSelected] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const [showPoll, setShowPoll] = useState(false);

  const activeIntention = customMode ? (customText.trim() || null) : selected;

  const handleSelect = (id) => {
    setCustomMode(false);
    setCustomText('');
    setSelected(selected === id ? null : id);
  };

  const handleCustom = () => {
    setSelected(null);
    setCustomMode(true);
  };

  const handleAction = (id) => {
    if (!activeIntention) return;
    if (id === 'find') navigate('/discover-people');
    else if (id === 'invite') setShowPoll(true);
    else if (id === 'host') onHost?.();
    else if (id === 'browse') navigate('/explore');
  };

  return (
    <section className="rounded-card border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 p-5 pt-7 shadow-card">
      <h2 className="text-lg font-semibold">{t('home.what_are_you_nmood_for')}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t('home.inmood.subtitle')}</p>

      <div className="flex flex-wrap gap-x-2 gap-y-3 mb-1">
        {intentions.map((it) => (
          <motion.button
            key={it.id}
            onClick={() => handleSelect(it.id)}
            type="button"
            whileTap={{ scale: 0.92 }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 transition-default text-sm ${
              selected === it.id
                ? 'border-primary bg-primary/5 text-primary font-semibold'
                : 'border-border text-muted-foreground hover:border-muted-foreground/30'
            }`}
          >
            <span className="text-base">{it.emoji}</span>
            <span>{t('home.intention.' + it.id)}</span>
          </motion.button>
        ))}
        <motion.button
          onClick={handleCustom}
          type="button"
          whileTap={{ scale: 0.92 }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 transition-default text-sm ${
            customMode
              ? 'border-primary bg-primary/5 text-primary font-semibold'
              : 'border-border text-muted-foreground hover:border-muted-foreground/30'
          }`}
        >
          <PenLine className="w-4 h-4" />
          <span>{t('home.inmood.custom')}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {customMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={t('home.inmood.custom_placeholder')}
              maxLength={40}
              className="w-full h-12 px-4 mt-3 rounded-input bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeIntention && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-4">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <motion.button
                    key={a.id}
                    onClick={() => handleAction(a.id)}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 p-3 rounded-card bg-card border border-border hover:border-primary/40 transition-default text-left"
                  >
                    <div className="w-9 h-9 rounded-button bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium leading-tight">{t('home.action.' + a.id)}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InterestPollWizard open={showPoll} onOpenChange={setShowPoll} />
    </section>
  );
}