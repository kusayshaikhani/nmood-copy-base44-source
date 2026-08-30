import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, Lock, Mail, Eye, Infinity as InfinityIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isUnlimitedCapacity, UNLIMITED_CAPACITY } from '@/lib/capacity';

const circlePrivacyOptions = [
  { id: 'public', label: 'Public', icon: Globe, desc: 'Anyone can find and join' },
  { id: 'approval', label: 'Approval', icon: Eye, desc: 'Members need approval' },
  { id: 'invite', label: 'Invite Only', icon: Mail, desc: 'Only invited members' },
];

const experienceVisibilityOptions = [
  { id: 'public', label: 'Public', icon: Globe, desc: 'Anyone can find and join' },
  { id: 'private', label: 'Private', icon: Lock, desc: 'Only with the link' },
  { id: 'connections', label: 'Invite Only', icon: Mail, desc: 'Members need approval' },
];

/**
 * Step 4: Capacity & Privacy/Visibility.
 * Circle: public / approval / invite privacy options.
 * Experience: public / private / connections visibility options.
 */
export default function PremiumStepCapacity({ data, update, errors = {}, isCircle }) {
  const { t } = useLocalization();
  const unlimited = isUnlimitedCapacity(data.capacity);
  const capacity = unlimited ? 20 : data.capacity;
  const options = isCircle ? circlePrivacyOptions : experienceVisibilityOptions;
  const labelKey = isCircle ? 'create.circle.privacy_title' : 'create.premium.capacity_visibility';
  const [inputValue, setInputValue] = useState(String(capacity));
  // Remembers the last numeric choice so toggling Unlimited off restores it.
  const [lastNumeric, setLastNumeric] = useState(capacity);

  // Sync input when capacity changes externally (e.g., slider drag)
  useEffect(() => {
    if (unlimited) return;
    setInputValue(String(capacity));
    setLastNumeric(capacity);
  }, [capacity, unlimited]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === '') { setInputValue(''); return; }
    // Accept digits only — allow temporary editing states
    setInputValue(raw.replace(/\D/g, ''));
  };

  const commitRaw = (raw) => {
    let num = parseInt(raw, 10);
    if (isNaN(num) || num < 2) num = 2;
    if (num > 100) num = 100;
    setInputValue(String(num));
    update('capacity', num);
  };

  const handleBlur = (e) => commitRaw(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitRaw(e.target.value); e.target.blur(); }
  };

  const toggleUnlimited = (next) => {
    update('capacity', next ? UNLIMITED_CAPACITY : lastNumeric);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('hosting.wizard.step_capacity')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('hosting.step.capacity_desc')}</p>
      </div>

      {/* Capacity display */}
      <div className="flex flex-col items-center py-6">
        <motion.div
          key={unlimited ? 'unlimited' : capacity}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          {unlimited ? <InfinityIcon className="w-10 h-10 text-primary" /> : <Users className="w-10 h-10 text-primary" />}
        </motion.div>
        <motion.p
          key={(unlimited ? 'unlimited' : capacity) + '-num'}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={unlimited ? 'text-4xl font-bold mb-1' : 'text-5xl font-bold mb-1'}
          data-testid="capacity-value"
        >
          {unlimited ? t('hosting.capacity.unlimited') : capacity}
        </motion.p>
        <p className="text-sm text-muted-foreground">
          {unlimited ? t('hosting.capacity.no_limit') : t('hosting.step.spots_available')}
        </p>
      </div>

      {/* Unlimited toggle */}
      <div className="flex items-center justify-between rounded-card border border-border px-4 py-3">
        <div className="pe-3">
          <label htmlFor="capacity-unlimited" className="text-sm font-medium">{t('hosting.capacity.unlimited')}</label>
          <p className="text-xs text-muted-foreground mt-0.5">{t('hosting.capacity.no_limit')}</p>
        </div>
        <Switch
          id="capacity-unlimited"
          checked={unlimited}
          onCheckedChange={toggleUnlimited}
          aria-label={t('hosting.capacity.unlimited')}
        />
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider value={[capacity]} onValueChange={(v) => update('capacity', v[0])} min={2} max={100} step={1} disabled={unlimited} className="py-2" />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{t('hosting.step.min_capacity')}</span>
          <span className="text-xs text-muted-foreground">{t('hosting.step.max_capacity')}</span>
        </div>
      </div>

      {/* Numeric capacity input — synchronized with slider both ways */}
      <div className="px-2">
        <label htmlFor="capacity-input" className="block text-sm font-medium mb-1.5">Number of attendees</label>
        <Input
          id="capacity-input"
          type="text"
          inputMode="numeric"
          value={unlimited ? t('hosting.capacity.unlimited') : inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          readOnly={unlimited}
          placeholder={unlimited ? t('hosting.capacity.unlimited') : '2–100'}
          className="w-full max-w-[160px]"
          aria-label="Number of attendees"
        />
      </div>

      {errors.capacity && <p className="text-xs text-destructive text-center">{errors.capacity}</p>}

      {/* Privacy / Visibility segmented control */}
      <div>
        <p className="text-sm font-medium mb-3">{t(labelKey)}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = (data.privacy || 'public') === opt.id;
            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => update('privacy', opt.id)}
                type="button"
                className={`flex flex-col items-center gap-2 p-4 rounded-card border-2 transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{opt.desc}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}