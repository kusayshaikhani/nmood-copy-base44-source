import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, User, Search, Check, RefreshCw, Loader2, Flag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { feedback } from '@/lib/feedback';
import { useUnsavedChanges } from '@/lib/useUnsavedChanges';
import AsyncButton from '@/components/shared/AsyncButton';
import MediaPicker from '@/components/media/MediaPicker';
import LookingForTagsSelect from '@/components/profile/LookingForTagsSelect';
import { interests as allInterests, languages as allLanguages, genderOptions, countries, lifestyleOptions } from '@/lib/onboarding-data';
import { ZODIAC_SIGNS, zodiacLabel } from '@/lib/looking-for-tags';
import { COUNTRIES, getCountry } from '@/lib/master-data';
import { detectLocation } from '@/lib/location-detection';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel, genderLabel, lifestyleLabel } from '@/lib/i18n/label-resolvers';
import { canChangeDob, isEligible } from '@/lib/eligibility';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 5;

export default function EditProfileSheet({ open, onOpenChange, member, onSaved, focusSection }) {
  const { t } = useLocalization();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [langQuery, setLangQuery] = useState('');
  const [natQuery, setNatQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { confirmLeave } = useUnsavedChanges(dirty);

  // BUG-004: initialize the form ONLY when the sheet opens, using the latest
  // member snapshot. Re-syncing on every member change mid-edit would wipe the
  // just-uploaded photo (and any other in-progress edits) from the form.
  const memberRef = useRef(member);
  memberRef.current = member;

  useEffect(() => {
    if (open) {
      const m = memberRef.current || {};
      setForm({
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        display_name: m.display_name || '',
        bio: m.bio || '',
        date_of_birth: m.date_of_birth || '',
        gender: m.gender || '',
        city: m.city || '',
        country: m.country || '',
        interests: m.interests || [],
        languages: m.languages || [],
        lifestyle: m.lifestyle || '',
        photo_url: m.photo_url || null,
        nationality: m.nationality || '',
        looking_for_tags: m.looking_for_tags || [],
        zodiac: m.zodiac || '',
      });
      setErrors({});
      setLangQuery('');
      setDirty(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && focusSection) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`edit-section-${focusSection}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [open, focusSection]);

  const handleDetectLocation = async () => {
    setDetecting(true);
    try {
      const detected = await detectLocation();
      const countryKey = COUNTRIES.find((c) => c.name.toLowerCase() === (detected.country || '').toLowerCase())?.key || detected.country || '';
      update({
        country: countryKey,
        city: detected.city,
        location_enabled: detected.source === 'gps',
      });
    } catch (err) {
      feedback.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const update = (data) => { setForm((prev) => ({ ...prev, ...data })); setDirty(true); };

  const persistPhoto = async (photo_url) => {
    if (!member?.id) return;
    try {
      const updated = await updateMemberProfile({ photo_url });
      onSaved?.(updated);
    } catch (err) {
      feedback.error(err);
    }
  };

  const toggleInterest = (id) => {
    const selected = form.interests || [];
    if (selected.includes(id)) {
      update({ interests: selected.filter((i) => i !== id) });
    } else if (selected.length < MAX_INTERESTS) {
      update({ interests: [...selected, id] });
    }
  };

  const toggleLanguage = (lang) => {
    const selected = form.languages || [];
    if (selected.includes(lang)) {
      update({ languages: selected.filter((l) => l !== lang) });
    } else {
      update({ languages: [...selected, lang] });
    }
  };

  const validate = () => {
    const e = {};
    if (!form.display_name?.trim()) e.display_name = t('onboarding.error.display_name');
    if (!form.date_of_birth) e.date_of_birth = t('onboarding.error.dob_required');
    else {
      const birth = new Date(form.date_of_birth);
      const today = new Date();
      if (birth.getTime() > today.getTime()) {
        e.date_of_birth = t('eligibility.error.future');
      } else {
        let age = today.getFullYear() - birth.getFullYear();
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
        if (age < 18) e.date_of_birth = t('eligibility.error.underage');
      }
    }
    if (!form.gender) e.gender = t('onboarding.error.gender');
    if (!form.country) e.country = t('onboarding.error.country');
    if (!form.city?.trim()) e.city = t('onboarding.error.city');
    if ((form.interests || []).length < MIN_INTERESTS) e.interests = t('onboarding.interests.min_error', { min: MIN_INTERESTS });
    if ((form.languages || []).length < 1) e.languages = t('onboarding.languages.min_error');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!member?.id) throw new Error('Profile not loaded');
    if (!validate()) throw new Error(t('profile.edit.error.fix'));
    try {
      // BUG-004: photo_url is persisted immediately by persistPhoto() on upload
      // and remove, so never include it here — a stale form value could
      // otherwise overwrite the saved photo on Save.
      // AGE-001: eligibility_status is NOT set client-side. DOB updates are
      // routed through the authorizationGate `updateDob` action, which derives
      // eligibility_status server-side from the DOB.
      const { photo_url, date_of_birth, ...profileFields } = form;
      const dobChanged = date_of_birth !== (member.date_of_birth || '');
      let updated = await updateMemberProfile(profileFields);

      // AGE-001: If DOB changed, route through the backend updateDob action so
      // eligibility_status is derived server-side (never trusted from the client).
      if (dobChanged && date_of_birth) {
        try {
          const res = await base44.functions.invoke('authorizationGate', {
            action: 'updateDob',
            dob: date_of_birth,
          });
          if (res?.member) updated = res.member;
        } catch (err) {
          // If updateDob fails (e.g. dob_locked), revert the DOB in the saved member.
          feedback.error(err);
          setErrors((prev) => ({ ...prev, date_of_birth: err.message || t('profile.edit.error.save') }));
          throw err;
        }
      }

      setDirty(false);
      feedback.success('profileSaved');
      onSaved?.(updated);
      onOpenChange(false);
    } catch (err) {
      feedback.error(err);
      setErrors((prev) => ({ ...prev, save: err.message || t('profile.edit.error.save') }));
      throw err;
    }
  };

  const availableInterests = allInterests.filter((i) => !(form.interests || []).includes(i.id));
  const filteredLanguages = allLanguages.filter((l) => l.toLowerCase().includes(langQuery.toLowerCase()));

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o && !confirmLeave()) return; onOpenChange(o); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-3 flex-shrink-0" />
        <SheetHeader className="flex-shrink-0 mb-3">
          <SheetTitle>{t('profile.edit.title')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-4">
          {/* Photo */}
          <div id="edit-section-photo" className="flex flex-col items-center">
            <MediaPicker
              hasImage={!!form.photo_url}
              aspect="square"
              trigger={
                <button type="button" className="relative" aria-label={t('profile.edit.photo.aria')}>
                  <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
                    {form.photo_url ? <AvatarImage src={form.photo_url} alt={t('profile.edit.photo_alt')} /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                      <User className="w-7 h-7 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-4 border-background shadow-md">
                    <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                </button>
              }
              onUploaded={(url) => { update({ photo_url: url }); persistPhoto(url); }}
              onRemoved={() => { update({ photo_url: null }); persistPhoto(null); }}
            />
            {errors.photo && <p className="text-xs text-destructive mt-1">{errors.photo}</p>}
          </div>

          {/* Display Name */}
          <div id="edit-section-display_name" className="space-y-1.5">
            <Label>{t('profile.edit.display_name')} <span className="text-destructive">*</span></Label>
            <Input value={form.display_name || ''} onChange={(e) => update({ display_name: e.target.value })} maxLength={40} className={errors.display_name ? 'border-destructive' : ''} />
            {errors.display_name && <p className="text-xs text-destructive">{errors.display_name}</p>}
          </div>

          {/* Bio */}
          <div id="edit-section-bio" className="space-y-1.5">
            <Label>{t('profile.edit.bio')}</Label>
            <Textarea value={form.bio || ''} onChange={(e) => update({ bio: e.target.value })} rows={2} maxLength={200} placeholder={t('profile.edit.bio_placeholder')} />
            <p className="text-xs text-muted-foreground text-end">{(form.bio || '').length}/200</p>
          </div>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div id="edit-section-dob" className="space-y-1.5">
              <Label>{t('profile.edit.dob')} <span className="text-destructive">*</span></Label>
              {isEligible(member) ? (
                <div className="space-y-1">
                  <Input type="date" value={form.date_of_birth || ''} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">{t('eligibility.edit.dob_locked')}</p>
                </div>
              ) : (
                <Input type="date" value={form.date_of_birth || ''} onChange={(e) => update({ date_of_birth: e.target.value })} max={new Date().toISOString().split('T')[0]} className={errors.date_of_birth ? 'border-destructive' : ''} />
              )}
              {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth}</p>}
            </div>
            <div id="edit-section-gender" className="space-y-1.5">
              <Label>{t('profile.edit.gender')} <span className="text-destructive">*</span></Label>
              <Select value={form.gender || ''} onValueChange={(v) => update({ gender: v })}>
                <SelectTrigger className={errors.gender ? 'border-destructive' : ''}><SelectValue placeholder={t('profile.edit.select')} /></SelectTrigger>
                <SelectContent>{genderOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{genderLabel(t, opt.value)}</SelectItem>)}</SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
            </div>
          </div>

          {/* Location (Country + City) — detected or manual. Independent from nationality. */}
          <div className="space-y-1.5">
            <Label>{t('profile.public.location_label')} <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <div id="edit-section-country">
                <Select value={form.country || ''} onValueChange={(v) => update({ country: v })}>
                  <SelectTrigger className={errors.country ? 'border-destructive' : ''}><SelectValue placeholder={t('profile.edit.select')} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
              </div>
              <div id="edit-section-city">
                <Input value={form.city || ''} onChange={(e) => update({ city: e.target.value })} maxLength={60} placeholder={t('profile.edit.city')} className={errors.city ? 'border-destructive' : ''} />
                {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detecting}
              className="flex items-center gap-1.5 text-sm font-medium text-primary py-1 hover:opacity-80 transition-default disabled:opacity-50"
            >
              {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {detecting ? t('profile.edit.location_detecting') : t('profile.edit.location_refresh')}
            </button>
          </div>

          {/* Nationality — independent from location, manually selected */}
          <div id="edit-section-nationality" className="space-y-2">
            <Label>{t('profile.edit.nationality')}</Label>
            {form.nationality && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => update({ nationality: '' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {form.nationality === 'prefer_not_to_say'
                    ? t('profile.edit.nationality_prefer_not_to_say')
                    : (getCountry(form.nationality)?.name || form.nationality)}
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={natQuery} onChange={(e) => setNatQuery(e.target.value)} placeholder={t('profile.edit.nationality_search')} className="pl-10 h-10" />
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
              <button
                type="button"
                onClick={() => update({ nationality: 'prefer_not_to_say' })}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-default ${form.nationality === 'prefer_not_to_say' ? 'bg-primary/5' : 'hover:bg-muted'}`}
              >
                <span className={`text-sm ${form.nationality === 'prefer_not_to_say' ? 'font-semibold text-primary' : 'font-medium'}`}>{t('profile.edit.nationality_prefer_not_to_say')}</span>
                {form.nationality === 'prefer_not_to_say' && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
              </button>
              {COUNTRIES.filter((c) => !natQuery || c.name.toLowerCase().includes(natQuery.toLowerCase()) || (c.native || '').toLowerCase().includes(natQuery.toLowerCase()))
                .map((c) => {
                  const isSelected = form.nationality === c.key;
                  return (
                    <button key={c.key} type="button" onClick={() => update({ nationality: c.key })}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-default ${isSelected ? 'bg-primary/5' : 'hover:bg-muted'}`}>
                      <span className={`text-sm flex items-center gap-2 ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}>
                        <span>{c.flag}</span> {c.name}
                      </span>
                      {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Looking For — structured multi-select on Member entity */}
          <div id="edit-section-looking_for" className="space-y-1.5">
            <Label>{t('profile.public.looking_for_title')}</Label>
            <LookingForTagsSelect
              value={form.looking_for_tags || []}
              onChange={(tags) => update({ looking_for_tags: tags })}
            />
            <p className="text-xs text-muted-foreground">{t('profile.edit.looking_for_hint')}</p>
          </div>

          {/* Zodiac — optional, user-selected */}
          <div id="edit-section-zodiac" className="space-y-1.5">
            <Label>{t('profile.edit.zodiac')}</Label>
            <Select value={form.zodiac || ''} onValueChange={(v) => update({ zodiac: v })}>
              <SelectTrigger><SelectValue placeholder={t('profile.edit.zodiac_placeholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>{t('profile.edit.zodiac_none')}</SelectItem>
                {ZODIAC_SIGNS.map((sign) => (
                  <SelectItem key={sign} value={sign}>{zodiacLabel(t, sign)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lifestyle */}
          <div id="edit-section-lifestyle" className="space-y-1.5">
            <Label>{t('profile.edit.lifestyle')}</Label>
            <Select value={form.lifestyle || ''} onValueChange={(v) => update({ lifestyle: v })}>
              <SelectTrigger><SelectValue placeholder={t('profile.edit.lifestyle_placeholder')} /></SelectTrigger>
              <SelectContent>
                {lifestyleOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{lifestyleLabel(t, opt.value)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Interests */}
          <div id="edit-section-interests" className="space-y-2">
            <Label>{t('profile.edit.interests_count', { count: (form.interests || []).length, max: MAX_INTERESTS })}</Label>
            {(form.interests || []).length >= MAX_INTERESTS && (
              <p className="text-xs text-muted-foreground">{t('onboarding.interests.max_error', { max: MAX_INTERESTS })}</p>
            )}
            {(form.interests || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.interests.map((id) => (
                  <button key={id} onClick={() => toggleInterest(id)} type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {categoryLabel(t, id)}<X className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}
            {availableInterests.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {availableInterests.map((interest) => {
                  const Icon = interest.icon;
                  return (
                    <button key={interest.id} onClick={() => toggleInterest(interest.id)} type="button" className="flex items-center gap-2 p-2.5 rounded-xl border border-border hover:border-muted-foreground/30 transition-default text-left">
                      <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4" /></div>
                      <span className="text-sm font-medium">{categoryLabel(t, interest.id)}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.interests && <p className="text-xs text-destructive">{errors.interests}</p>}
          </div>

          {/* Languages */}
          <div id="edit-section-languages" className="space-y-2">
            <Label>{t('profile.edit.languages')}</Label>
            {(form.languages || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.languages.map((lang) => (
                  <button key={lang} onClick={() => toggleLanguage(lang)} type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {lang}<X className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={langQuery} onChange={(e) => setLangQuery(e.target.value)} placeholder={t('profile.edit.languages_search')} className="pl-10 h-10" />
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
              {filteredLanguages.map((lang) => {
                const isSelected = (form.languages || []).includes(lang);
                return (
                  <button key={lang} onClick={() => toggleLanguage(lang)} type="button" className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-default ${isSelected ? 'bg-primary/5' : 'hover:bg-muted'}`}>
                    <span className={`text-sm ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}>{lang}</span>
                    {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
                  </button>
                );
              })}
            </div>
            {errors.languages && <p className="text-xs text-destructive">{errors.languages}</p>}
          </div>
        </div>

        {/* Footer — fixed bottom action with safe-area + 24px visible spacing */}
        <div className="flex-shrink-0 pt-3 pb-6 border-t border-border">
          {errors.save && <p className="text-sm text-destructive text-center mb-2">{errors.save}</p>}
          <AsyncButton className="w-full h-11" onClick={handleSave} successLabel={t('profile.edit.saved')}>
            {t('profile.edit.save')}
          </AsyncButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}