import { workDraftError } from '@/lib/work-profile';
import React, { useState, useEffect, useRef } from 'react';
import InterestsFields, { MIN_INTERESTS } from './InterestsFields';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LifestyleFields from './LifestyleFields';
import { withTimeout } from '@/lib/bounded-operation';
import { profileSaveReference } from '@/lib/profile-save-diagnostics';
import { updateMemberProfile, updateMemberDob } from '@/lib/member-update';
import { feedback } from '@/lib/feedback';
import { useUnsavedChanges } from '@/lib/useUnsavedChanges';
import AsyncButton from '@/components/shared/AsyncButton';
import LanguagesSelect from '@/components/profile/LanguagesSelect';
import PersonalDetailsFields from '@/components/profile/PersonalDetailsFields';
import NationalitySelect from '@/components/profile/NationalitySelect';
import LookingForTagsSelect from '@/components/profile/LookingForTagsSelect';
import ProfilePromptFields from '@/components/profile/ProfilePromptFields';
import { normalizeProfilePrompts } from '@/lib/profile-prompts';
import { genderOptions, hereForOptions } from '@/lib/onboarding-data';
import NativeProfileSelect from '@/components/profile/NativeProfileSelect';
import { ZODIAC_SIGNS } from '@/lib/looking-for-tags';
import ProfileLocationFields, { resolveSavedLocation } from './ProfileLocationFields';
export { resolveSavedLocation } from './ProfileLocationFields';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { genderLabel } from '@/lib/i18n/label-resolvers';
import { requestDobCorrectionReview } from '@/lib/dob-correction-request';

import { PROFILE_FIELD_CLASS } from './profile-field-style';
import { MEMBER_INDICATORS_ENABLED } from '@/lib/member-indicator-config';
import { getMemberIndicatorRuntime } from '@/lib/member-indicator-runtime';

export default function EditProfileSheet({ open, onOpenChange, member, onSaved, focusSection }) {
  const { t } = useLocalization();
  const [form, setForm] = useState({});
  const [fieldRetry, setFieldRetry] = useState(0);
  const savingRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    return window.NmoodRecovery?.profileRetry?.(() => {
      if (savingRef.current) return false;
      setFieldRetry(attempt => attempt + 1);
      return true;
    }, 'profile-edit');
  }, [open]);

  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [requestingDobReview, setRequestingDobReview] = useState(false);
  const [dobReviewRequested, setDobReviewRequested] = useState(false);
  const [dobCorrectionDate, setDobCorrectionDate] = useState('');
  const [indicatorPrefs, setIndicatorPrefs] = useState(null);
  const { confirmLeave } = useUnsavedChanges(dirty);

  // BUG-004: initialize the form ONLY when the sheet opens, using the latest
  // member snapshot. Re-syncing on every member change mid-edit would wipe the
  // just-uploaded photo (and any other in-progress edits) from the form.
  const memberRef = useRef(member);
  memberRef.current = member;

  useEffect(() => {
    if (open) {
      const m = memberRef.current || {};
      const savedLocation = resolveSavedLocation(m.city, m.country);
      setForm({
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        display_name: m.display_name || '',
        bio: m.bio || '',
        date_of_birth: m.date_of_birth || '',
        gender: m.gender || '',
        dating_looking_for_gender: ['male', 'female', 'community_only'].includes(m.dating_looking_for_gender) ? m.dating_looking_for_gender : '',
        city: savedLocation.city,
        country: savedLocation.country,
        interests: m.interests || [],
        languages: m.languages || [],
        lifestyle: m.lifestyle || '',
        photo_url: m.photo_url || null,
        ...Object.fromEntries(['height_cm','work_text','share_height','share_work'].filter(key => Object.hasOwn(m,key)).map(key => [key,m[key]])),
        nationality: m.nationality || '',
        show_age: m.show_age ?? false,
        looking_for_tags: m.looking_for_tags || [],
        prompts: normalizeProfilePrompts(m.prompts),
        ...(typeof m.zodiac === 'string' && (m.zodiac === '' || ZODIAC_SIGNS.includes(m.zodiac)) ? { zodiac: m.zodiac } : {}),
        marital_status: m.marital_status || '',
        family_plan: m.family_plan || '',
        share_marital_status: m.share_marital_status ?? false,
        share_family_plan: m.share_family_plan ?? false,
        smoking: m.smoking || '',
        drinking: m.drinking || '',
      });
      setErrors({});

      setDirty(false);
      setDobCorrectionDate('');
      setDobReviewRequested(Boolean(m.dob_change_requested_at));
      setIndicatorPrefs(null);
      if (MEMBER_INDICATORS_ENABLED) void getMemberIndicatorRuntime()?.load().then(value => setIndicatorPrefs(value)).catch(() => setIndicatorPrefs({ load_failed: true }));
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

  const handleDobCorrectionRequest = async () => {
    if (requestingDobReview || dobReviewRequested) return;
    setRequestingDobReview(true);
    try {
      await requestDobCorrectionReview(dobCorrectionDate);
      setDobReviewRequested(true);
      feedback.message('Your correction request was submitted for support review.');
    } catch (error) {
      feedback.error(error);
    } finally {
      setRequestingDobReview(false);
    }
  };

  const update = (data) => { setForm((prev) => ({ ...prev, ...data })); setDirty(true); };

  const validate = () => {
    const e = {};
    if (workDraftError(form)) e.work = workDraftError(form);
    if (!form.display_name?.trim()) e.display_name = t('onboarding.error.display_name');
    // Private DOB can be unavailable in a partial read. Do not block unrelated
    // edits or resubmit DOB unless the member explicitly changed it.
    if (form.date_of_birth && form.date_of_birth !== (member?.date_of_birth || '')) {
      const birth = new Date(form.date_of_birth);
      const today = new Date();
      if (!Number.isFinite(birth.getTime()) || birth.getTime() > today.getTime()) {
        e.date_of_birth = t('eligibility.error.future');
      } else {
      }
    }
    if (!form.country) e.country = t('onboarding.error.country');
    if (!form.city?.trim()) e.city = t('onboarding.error.city');
    if ((form.interests || []).length < MIN_INTERESTS) e.interests = t('onboarding.interests.min_error', { min: MIN_INTERESTS });
    if ((form.languages || []).length < 1) e.languages = t('onboarding.languages.min_error');
    setErrors(e);
    return Object.keys(e);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    window.NmoodRecovery?.profileField?.('PROFILE-SAVE');
    let stage = 'validation';
    setErrors({});
    try {
      if (!member?.id) throw new Error('Profile not loaded');
      const invalid = validate();
      if (invalid.length) {
        const labels = {work:'Work',display_name:'display name',date_of_birth:'date of birth',country:'country',city:'city',interests:'interests',languages:'languages'};
        const failure = Object.assign(new Error('Check these fields: ' + invalid.map(key => labels[key]).join(', ') + '.'), {code:'VALIDATION'});
        throw failure;
      }
      stage = 'profile-write';
      // Main Profile owns avatar and gallery changes. Never submit stale photo fields here.
      // AGE-001: eligibility_status is NOT set client-side. DOB updates are
      // routed through the authorizationGate `updateDob` action, which derives
      // eligibility_status server-side from the DOB.
      // Privacy controls live in their dedicated owner-scoped paths. This sheet can
      // receive a stale member projection, so it must not re-submit those fields and
      // accidentally revoke an explicit indicator consent on an unrelated profile edit.
      const { photo_url: _photo_url, photo_gallery: _photo_gallery, date_of_birth,
        show_distance: _show_distance, location_enabled: _location_enabled,
        show_online_status: _show_online_status, show_last_seen: _show_last_seen,
        ...profileFields } = form;
      // The family writer returns only fields it owns. Do not submit empty or
      // unavailable family values inherited from a partial profile projection:
      // they cause a false "unconfirmed" save and can overwrite a real choice.
      for (const key of ['marital_status','family_plan','smoking','drinking','share_marital_status','share_family_plan','share_smoking','share_drinking']) {
        const fallback = key.startsWith('share_') ? false : '';
        if ((profileFields[key] ?? fallback) === (member?.[key] ?? fallback)) delete profileFields[key];
      }
      if (JSON.stringify(normalizeProfilePrompts(profileFields.prompts)) === JSON.stringify(normalizeProfilePrompts(member?.prompts))) {
        delete profileFields.prompts;
      }
      const dobChanged = date_of_birth !== (member.date_of_birth || '');
      let updated = await updateMemberProfile(profileFields);

      // Route voluntary DOB changes through the private backend endpoint.
      if (dobChanged && date_of_birth) {
        stage = 'dob-write';
        try {
          const res = await withTimeout(() => updateMemberDob(date_of_birth));
          if (res) updated = { ...updated, ...res, date_of_birth };
        } catch (err) {
          // If updateDob fails (e.g. dob_locked), revert the DOB in the saved member.
          setErrors((prev) => ({ ...prev, date_of_birth: 'Date of birth could not be updated. Your draft is kept.' }));
          throw err;
        }
      }

      stage = 'refresh';
      await withTimeout(() => onSaved?.({ ...member, ...updated }));
      setDirty(false);
      feedback.success('profileSaved');
      onOpenChange(false);
    } catch (err) {
      const explanation = err?.code === 'VALIDATION' ? err.message : 'Save could not finish. Some changes may already be saved. Your draft is kept; please retry.';
      setErrors((prev) => ({ ...prev, save: `${explanation} Reference: ${profileSaveReference(err, stage)}` }));
      throw new Error('Profile save needs retry.');
    } finally { savingRef.current = false; }
  };



  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o && !confirmLeave()) return; onOpenChange(o); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92dvh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-3 flex-shrink-0" />
        <SheetHeader className="flex-shrink-0 mb-3">
          <SheetTitle>{t('profile.edit.title')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-4">
          {['first_name','last_name'].map(key=><div key={key} id={`edit-section-${key}`} className="min-w-0 space-y-1.5">
            <Label htmlFor={`edit-${key}`}>{key==='first_name'?'First name':'Last name'}</Label>
            <Input id={`edit-${key}`} value={form[key]||''} onChange={event=>update({[key]:event.target.value})} maxLength={80}/>
          </div>)}
          {/* Display Name */}
          <div id="edit-section-display_name" className="min-w-0 space-y-1.5">
            <Label>{t('profile.edit.display_name')} <span className="text-destructive">*</span></Label>
            <Input value={form.display_name || ''} onChange={(e) => update({ display_name: e.target.value })} maxLength={40} className={errors.display_name ? 'border-destructive' : ''} />
            {errors.display_name && <p className="text-xs text-destructive">{errors.display_name}</p>}
          </div>

          {/* Bio */}
          <div id="edit-section-bio" className="min-w-0 space-y-1.5">
            <Label>{t('profile.edit.bio')}</Label>
            <Textarea value={form.bio || ''} onChange={(e) => update({ bio: e.target.value })} rows={2} maxLength={200} placeholder={t('profile.edit.bio_placeholder')} />
            <p className="text-xs text-muted-foreground text-end">{(form.bio || '').length}/200</p>
          </div>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div id="edit-section-dob" className="min-w-0 space-y-1.5">
              <Label>{t('profile.edit.dob')} <span className="text-muted-foreground">(optional)</span></Label>
              {member?.identity_verified ? (
                <div className="space-y-1">
                  <Input type="date" value={form.date_of_birth || ''} disabled className={`${PROFILE_FIELD_CLASS} opacity-60`} />
                  <p className="text-xs text-muted-foreground">Your verified date can only be corrected after support review.</p>
                  <Input aria-label="Corrected date of birth" type="date" value={dobCorrectionDate} onChange={(event) => setDobCorrectionDate(event.target.value)} max={new Date().toISOString().split('T')[0]} disabled={dobReviewRequested} className={PROFILE_FIELD_CLASS} />
                  <button type="button" onClick={handleDobCorrectionRequest} disabled={requestingDobReview || dobReviewRequested} className="text-xs font-semibold text-primary disabled:text-muted-foreground">
                    {dobReviewRequested ? 'Correction review requested' : requestingDobReview ? 'Submitting request…' : 'Request a correction review'}
                  </button>
                </div>
              ) : (
                <Input type="date" value={form.date_of_birth || ''} onChange={(e) => update({ date_of_birth: e.target.value })} max={new Date().toISOString().split('T')[0]} className={`${PROFILE_FIELD_CLASS} ${errors.date_of_birth ? 'border-destructive' : ''}`} />
              )}
              {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth}</p>}
            </div>
            <div id="edit-section-gender" className="min-w-0 space-y-1.5">
              <Label htmlFor="profile-gender">{t('profile.edit.gender')}</Label>
              <NativeProfileSelect key={`gender-${fieldRetry}`} id="profile-gender" value={form.gender} path="PROFILE-GENDER"
                options={genderOptions.map(option=>({value:option.value,label:genderLabel(t,option.value)}))} placeholder={t('profile.edit.select')}
                className={`${PROFILE_FIELD_CLASS} w-full`} onChange={gender=>update({gender})}/>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
            </div>
          </div>

          <ProfileLocationFields data={form} update={update} errors={errors} />

          {/* Nationality — independent from location, manually selected */}
          <div id="edit-section-nationality" className="space-y-2">
            <Label>{t('profile.edit.nationality')}</Label>
            <p className="text-xs text-muted-foreground">Optional. If supplied, nationality is visible to permitted profile viewers. Remove it to hide it; there is no separate private nationality setting.</p>
            <NationalitySelect value={form.nationality} onChange={nationality => update({ nationality })} t={t} />
          </div>

          {/* Looking For — structured multi-select on Member entity */}
          <div id="edit-section-looking_for" className="min-w-0 space-y-1.5">
            <Label htmlFor="profile-here-for">I’m here for</Label>
            <NativeProfileSelect key={`here-for-${fieldRetry}`} id="profile-here-for" value={form.dating_looking_for_gender} path="PROFILE-HERE-FOR"
              options={hereForOptions} placeholder={t('profile.edit.select')}
              className={`${PROFILE_FIELD_CLASS} w-full`} onChange={dating_looking_for_gender=>update({dating_looking_for_gender})}/>
            <p className="text-xs text-muted-foreground">This is shown on your profile and can be used in People filters.</p>
          </div>
          <div id="edit-section-looking_for_tags" className="min-w-0 space-y-1.5">
            <Label>{t('profile.public.looking_for_title')}</Label>
            <LookingForTagsSelect
              value={form.looking_for_tags || []}
              onChange={(tags) => update({ looking_for_tags: tags })}
            />
            <p className="text-xs text-muted-foreground">{t('profile.edit.looking_for_hint')}</p>
          </div>

          <ProfilePromptFields value={form.prompts} onChange={(prompts) => update({ prompts })} />

          {MEMBER_INDICATORS_ENABLED && <section id="edit-section-indicators" aria-label="Distance and activity sharing" className="space-y-3 rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold">Distance and activity sharing</h2>
            <p className="text-xs text-muted-foreground">These are explicit consents. Nmood sends only a coarse location cell while the app is open, never coordinates.</p>
            <label className="flex min-h-11 items-center justify-between gap-3">Allow coarse location for approximate distance<input type="checkbox" disabled={!indicatorPrefs || indicatorPrefs.load_failed} checked={form.indicator_distance_consent ?? (indicatorPrefs?.distance_enabled === true)} onChange={event=>{setIndicatorPrefs(current=>({...current,distance_enabled:event.target.checked}));update({indicator_distance_consent:event.target.checked});}}/></label>
            <label className="flex min-h-11 items-center justify-between gap-3">Allow foreground activity for Online and Last Seen<input type="checkbox" disabled={!indicatorPrefs || indicatorPrefs.load_failed} checked={form.indicator_presence_consent ?? (indicatorPrefs?.presence_enabled === true)} onChange={event=>{setIndicatorPrefs(current=>({...current,presence_enabled:event.target.checked}));update({indicator_presence_consent:event.target.checked});}}/></label>
            {indicatorPrefs?.load_failed && <p role="alert" className="text-xs text-destructive">Could not load sharing consent. Retry before saving.</p>}
          </section>}
          <div id="edit-section-family"><PersonalDetailsFields data={form} update={update} /></div>
          <LifestyleFields data={form} update={update} />

          <InterestsFields data={form} update={update} errors={errors}/>

          {/* Languages */}
          <div id="edit-section-languages" className="space-y-2">
            <Label>{t('profile.edit.languages')}</Label>
            <LanguagesSelect value={form.languages || []} onChange={languages=>update({languages})} />
            {errors.languages && <p className="text-xs text-destructive">{errors.languages}</p>}
          </div>
        </div>

        {/* Footer — fixed bottom action with safe-area + 24px visible spacing */}
        <div className="flex-shrink-0 pt-3 pb-6 border-t border-border">
          {errors.save && <p role="alert" className="text-sm text-destructive text-center mb-2">{errors.save}</p>}
          <AsyncButton className="w-full h-11" onClick={handleSave} successLabel={t('profile.edit.saved')}>
            {t('profile.edit.save')}
          </AsyncButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
