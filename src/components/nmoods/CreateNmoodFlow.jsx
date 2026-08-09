import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ChevronLeft, X, Check, MapPin, Clock, Plus, Tag, Globe, Users, Eye, Timer, Sparkles, Navigation as NavIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  nmoodCategories,
  whenOptions,
  groupSizeOptions,
  genderOptions,
  ageOptions,
  visibilityOptions,
  expirationOptions,
  lookingForSuggestions,
  tagSuggestions,
} from '@/lib/nmoods-data';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 10;
const MAX_INTENTION = 120;
const MAX_TAGS = 5;

const STEP_META = [
  { icon: Sparkles, label: 'intention' },
  { icon: Tag, label: 'category' },
  { icon: MapPin, label: 'location' },
  { icon: Clock, label: 'when' },
  { icon: Users, label: 'looking_for' },
  { icon: Users, label: 'who' },
  { icon: Globe, label: 'languages' },
  { icon: Tag, label: 'tags' },
  { icon: Eye, label: 'visibility' },
  { icon: Timer, label: 'expiration' },
];

const commonLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ur', name: 'اردو' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
];

const intentionExamples = [
  'trying a hidden coffee shop.',
  'playing padel after work.',
  "watching tonight's sunset.",
  'meeting entrepreneurs.',
  'trying authentic Japanese food.',
];

export default function CreateNmoodFlow({ open, onClose, onPublished }) {
  const { t } = useLocalization();
  const [step, setStep] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const [intention, setIntention] = useState('');
  const [category, setCategory] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [usingCurrentLoc, setUsingCurrentLoc] = useState(false);
  const [hideLocation, setHideLocation] = useState(false);
  const [when, setWhen] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [languages, setLanguages] = useState([]);
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [expiration, setExpiration] = useState('24h');

  useEffect(() => {
    if (!open) return;
    const detected = (navigator.language || 'en').split('-')[0];
    setLanguages([detected]);
  }, [open]);

  const canContinue = useMemo(() => {
    if (step === 1) return intention.trim().length > 5;
    if (step === 2) return !!category;
    return true;
  }, [step, intention, category]);

  const canPublish = intention.trim().length > 5 && !!category;

  const reset = () => {
    setStep(1);
    setIntention('');
    setCategory(null);
    setLocationName('');
    setUsingCurrentLoc(false);
    setHideLocation(false);
    setWhen('');
    setCustomDate('');
    setCustomTime('');
    setLookingFor('');
    setGroupSize('');
    setGender('');
    setAgeRange('');
    setLanguages([]);
    setTags([]);
    setCustomTag('');
    setVisibility('public');
    setExpiration('24h');
    setPublishing(false);
    setPublished(false);
  };

  const handleClose = () => {
    if (publishing) return;
    reset();
    onClose();
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handlePublish();
  };

  const handlePublish = () => {
    if (!canPublish) return;
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.45 },
        colors: ['#5B3DF5', '#8B5CF8', '#6C9EFF', '#A78BFA'],
        disableForReducedMotion: true,
      });
    }, 1200);
  };

  const handleViewMynmood = () => {
    reset();
    onPublished?.();
    onClose();
  };

  const handleDone = () => {
    reset();
    onClose();
  };

  const toggleTag = (tag) => {
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tag];
    });
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags([...tags, tag]);
    setCustomTag('');
  };

  const toggleLanguage = (code) => {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  if (!open) return null;

  const stepIcon = STEP_META[step - 1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
      >
        <div className="max-w-md mx-auto h-full flex flex-col">
          {published ? (
            <SuccessScreen onView={handleViewMynmood} onDone={handleDone} />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border/30 bg-card/60 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={step > 1 ? () => setStep(step - 1) : handleClose}
                  disabled={publishing}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors shrink-0"
                >
                  {step > 1 ? <ChevronLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <stepIcon.icon className="w-3.5 h-3.5" />
                    <span>{t(`nmoods.step.${stepIcon.label}`)}</span>
                    <span className="text-muted-foreground/60">·</span>
                    <span>{step} / {TOTAL_STEPS}</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-nmood-cta rounded-full"
                      initial={false}
                      animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto momentum-scroll">
                <AnimatePresence mode="wait">
                  {/* Step 1: Intention */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.intention_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.intention_desc')}</p>
                      <p className="text-base font-semibold text-primary mb-3">I'm in the mood for...</p>
                      <textarea
                        value={intention}
                        onChange={(e) => setIntention(e.target.value.slice(0, MAX_INTENTION))}
                        rows={3}
                        autoFocus
                        placeholder="trying a hidden coffee shop..."
                        className="w-full rounded-input border border-border bg-card px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[11px] text-muted-foreground">{t('nmoods.create.intention_hint')}</span>
                        <span className={cn('text-[11px] font-medium', intention.length > MAX_INTENTION - 20 ? 'text-warning' : 'text-muted-foreground')}>
                          {intention.length}/{MAX_INTENTION}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {intentionExamples.map((ex) => (
                          <button key={ex} type="button" onClick={() => setIntention(ex)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                            {ex}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Category */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.category_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.category_desc')}</p>
                      <div className="grid grid-cols-4 gap-2.5">
                        {nmoodCategories.map((cat) => (
                          <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={cn('flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all duration-200', category === cat.id ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]' : 'border-border bg-card hover:border-primary/30')}>
                            <span className="text-2xl leading-none">{cat.icon}</span>
                            <span className="text-[11px] font-medium">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Location */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.location_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.location_desc')}</p>
                      <button type="button" onClick={() => { setUsingCurrentLoc(true); setLocationName('Current Location'); }} className={cn('w-full flex items-center gap-3 p-4 rounded-xl border transition-all mb-3', usingCurrentLoc ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30')}>
                        <NavIcon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{t('nmoods.create.use_current_location')}</span>
                      </button>
                      <input value={locationName} onChange={(e) => { setLocationName(e.target.value); setUsingCurrentLoc(false); }} placeholder={t('nmoods.create.search_location')} className="w-full rounded-input border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-4" />
                      <button type="button" onClick={() => setHideLocation(!hideLocation)} className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                        <div className="text-left">
                          <p className="text-sm font-medium">{t('nmoods.create.hide_location')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t('nmoods.create.hide_location_desc')}</p>
                        </div>
                        <span className={cn('w-11 h-6 rounded-full transition-colors flex items-center px-0.5', hideLocation ? 'bg-primary justify-end' : 'bg-muted justify-start')}>
                          <span className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform" />
                        </span>
                      </button>
                    </motion.div>
                  )}

                  {/* Step 4: When */}
                  {step === 4 && (
                    <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.when_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.when_desc')}</p>
                      <div className="space-y-2">
                        {whenOptions.map((opt) => (
                          <button key={opt.id} type="button" onClick={() => setWhen(opt.id)} className={cn('w-full flex items-center gap-3 p-4 rounded-xl border transition-all', when === opt.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:border-primary/30')}>
                            <span className="text-xl">{opt.icon}</span>
                            <span className="text-sm font-medium flex-1 text-left">{t(`nmoods.when.${opt.id}`)}</span>
                            {when === opt.id && <Check className="w-5 h-5 text-primary" strokeWidth={2.5} />}
                          </button>
                        ))}
                      </div>
                      {when === 'custom' && (
                        <div className="flex gap-2 mt-3">
                          <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="flex-1 rounded-input border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-32 rounded-input border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 5: Looking For */}
                  {step === 5 && (
                    <motion.div key="s5" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.looking_for_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.looking_for_desc')}</p>
                      <input value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder={t('nmoods.create.looking_for_placeholder')} className="w-full rounded-input border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-4" />
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('nmoods.create.suggestions')}</p>
                      <div className="flex flex-wrap gap-2">
                        {lookingForSuggestions.map((s) => (
                          <button key={s} type="button" onClick={() => setLookingFor(s)} className={cn('text-sm px-3.5 py-2 rounded-full border transition-all', lookingFor === s ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30')}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Who Can Join */}
                  {step === 6 && (
                    <motion.div key="s6" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6 space-y-5">
                      <div>
                        <h2 className="text-xl font-bold mb-1">{t('nmoods.create.who_title')}</h2>
                        <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.who_desc')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-2 block">{t('nmoods.create.group_size')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {groupSizeOptions.map((opt) => (
                            <button key={opt.id} type="button" onClick={() => setGroupSize(opt.id)} className={cn('p-3 rounded-xl border text-sm font-medium transition-all', groupSize === opt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/30')}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-2 block">{t('nmoods.create.gender')} <span className="text-muted-foreground font-normal text-xs">({t('nmoods.create.optional')})</span></label>
                        <div className="flex gap-2">
                          {genderOptions.map((opt) => (
                            <button key={opt.id} type="button" onClick={() => setGender(gender === opt.id ? '' : opt.id)} className={cn('flex-1 py-2.5 rounded-full border text-sm font-medium transition-all', gender === opt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/30')}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-2 block">{t('nmoods.create.age')} <span className="text-muted-foreground font-normal text-xs">({t('nmoods.create.optional')})</span></label>
                        <div className="flex flex-wrap gap-2">
                          {ageOptions.map((opt) => (
                            <button key={opt.id} type="button" onClick={() => setAgeRange(ageRange === opt.id ? '' : opt.id)} className={cn('px-4 py-2.5 rounded-full border text-sm font-medium transition-all', ageRange === opt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/30')}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 7: Languages */}
                  {step === 7 && (
                    <motion.div key="s7" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.languages_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.languages_desc')}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {languages.map((code) => {
                          const lang = commonLanguages.find((l) => l.code === code);
                          return (
                            <span key={code} className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-primary/10 text-primary">
                              {lang?.name || code}
                              <button type="button" onClick={() => toggleLanguage(code)} className="hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('nmoods.create.add_language')}</p>
                      <div className="flex flex-wrap gap-2">
                        {commonLanguages.filter((l) => !languages.includes(l.code)).map((l) => (
                          <button key={l.code} type="button" onClick={() => toggleLanguage(l.code)} className="text-sm px-3.5 py-2 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                            {l.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 8: Tags */}
                  {step === 8 && (
                    <motion.div key="s8" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.tags_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.tags_desc')}</p>
                      <div className="flex gap-2 mb-4">
                        <input value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }} placeholder={t('nmoods.create.add_tag')} disabled={tags.length >= MAX_TAGS} className="flex-1 rounded-input border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50" />
                        <button type="button" onClick={addCustomTag} disabled={!customTag.trim() || tags.length >= MAX_TAGS} className="px-4 rounded-input border border-border bg-card disabled:opacity-50">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                              #{tag}
                              <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {t('nmoods.create.suggested')} · {tags.length}/{MAX_TAGS}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(tagSuggestions[category] || tagSuggestions['Other']).filter((s) => !tags.includes(s)).map((s) => (
                          <button key={s} type="button" onClick={() => toggleTag(s)} disabled={tags.length >= MAX_TAGS} className="text-sm px-3.5 py-2 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all disabled:opacity-50">
                            #{s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 9: Visibility */}
                  {step === 9 && (
                    <motion.div key="s9" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.visibility_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.visibility_desc')}</p>
                      <div className="space-y-2.5">
                        {visibilityOptions.map((opt) => (
                          <button key={opt.id} type="button" onClick={() => setVisibility(opt.id)} className={cn('w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left', visibility === opt.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:border-primary/30')}>
                            <span className="text-2xl leading-none mt-0.5">{opt.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{opt.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                            </div>
                            {visibility === opt.id && <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 10: Expiration */}
                  {step === 10 && (
                    <motion.div key="s10" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="px-5 py-6">
                      <h2 className="text-xl font-bold mb-1">{t('nmoods.create.expiration_title')}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{t('nmoods.create.expiration_desc')}</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {expirationOptions.map((opt) => (
                          <button key={opt.id} type="button" onClick={() => setExpiration(opt.id)} className={cn('p-4 rounded-xl border text-center transition-all', expiration === opt.id ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border bg-card hover:border-primary/30')}>
                            <span className="text-sm font-semibold block">{opt.label}</span>
                            {opt.id === '24h' && <span className="text-[10px] text-muted-foreground mt-0.5 block">{t('nmoods.create.default')}</span>}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">{t('nmoods.create.expiration_note')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] border-t border-border/30 bg-card/60 backdrop-blur-xl">
                <Button onClick={handleNext} disabled={!canContinue || publishing} size="lg" className="w-full">
                  {publishing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> {t('nmoods.create.publishing')}
                    </>
                  ) : step === TOTAL_STEPS ? (
                    <>
                      <Sparkles className="w-4 h-4" /> {t('nmoods.create.publish')}
                    </>
                  ) : (
                    t('nmoods.create.continue')
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SuccessScreen({ onView, onDone }) {
  const { t } = useLocalization();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-elevated"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', damping: 12 }}>
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-bold mb-2 text-balance">
        {t('nmoods.success.title')}
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-sm text-muted-foreground mb-8 max-w-xs text-balance">
        {t('nmoods.success.desc')}
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full max-w-xs space-y-2.5">
        <Button onClick={onView} size="lg" className="w-full">{t('nmoods.success.view')}</Button>
        <Button onClick={onDone} variant="outline" size="lg" className="w-full">{t('nmoods.success.done')}</Button>
      </motion.div>
    </motion.div>
  );
}