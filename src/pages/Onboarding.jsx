import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { onboardingDistanceDefaults } from '@/lib/onboarding-distance-defaults';
import { RegionControls } from '@/components/region/RegionControls';
import { mergePersonalChanges, recoverPersonalChanges, readPendingPersonalDetails, storePendingPersonalDetails, savePersonalDetails, withoutPersonalDetails } from '@/lib/onboarding-personal-details';
import {explicitSettings,saveOnboardingSettings} from '@/lib/onboarding-settings';
import { onboardingStepsFor, ONBOARDING_DRAFT_VERSION, readOnboardingDraft, storeOnboardingDraft, clearOnboardingDraft, draftFields, resumeStep, reviewedPrefix, stepValidation, completionIssue } from '@/lib/onboarding-journey';
import PersonalDetailsFields from '@/components/profile/PersonalDetailsFields';
import LifestyleFields from '@/components/profile/LifestyleFields';
import ProfileGallery from '@/components/profile/premium/ProfileGallery';
import { Button } from '@/components/ui/button';
import React, { Component, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import {
  ensureOnboardingProfile,
  updateMemberProfile,
  updateMemberDob,
  completeOnboardingProfile,
} from '@/lib/member-update';
import { withTimeout } from '@/lib/bounded-operation';
import { isOnboardingComplete } from '@/lib/eligibility';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
import {
  buildOnboardingProgressPayload,
  requirePersistedOnboardingGender,
  requirePersistedOnboardingHereFor,
  requirePersistedOnboardingLookingForTags,
} from '@/lib/onboarding-profile-payload';

import OnboardingShell from '@/components/onboarding/OnboardingShell';
import BasicProfileStep from '@/components/onboarding/steps/BasicProfileStep';
import InterestsStep from '@/components/onboarding/steps/InterestsStep';
import LookingForStep from '@/components/onboarding/steps/LookingForStep';
import LanguagesStep from '@/components/onboarding/steps/LanguagesStep';
import LocationStep from '@/components/onboarding/steps/LocationStep';
import NotificationsStep from '@/components/onboarding/steps/NotificationsStep';
import PrivacyStep from '@/components/onboarding/steps/PrivacyStep';
import CompleteStep from '@/components/onboarding/steps/CompleteStep';
import DobRecoveryStep from '@/components/onboarding/steps/DobRecoveryStep';

import { hasChosenLanguage } from '@/lib/i18n/languages';
import {
  getConsentForMember,
  clearStoredConsent,
} from '@/lib/legal-consent';
import { clearPendingRegistration } from '@/lib/pending-registration';
import { useLocalization } from '@/lib/i18n/useLocalization';


export const ONBOARDING_PRIVACY_DEFAULTS = Object.freeze({
  profile_visibility: 'public',
  who_can_message: 'everyone',
  share_nationality: true,
  share_marital_status: true,
  share_family_plan: false,
  share_smoking: true,
  share_drinking: true,
  share_height: true,
  share_work: true,
  // New profiles start with approximate-distance sharing enabled. Existing
  // saved choices are preserved by onboardingDistanceDefaults().
  show_distance: true,
  show_online_status: true,
  show_last_seen: true,
  indicator_distance_consent: true,
  indicator_presence_consent: true,
  indicator_distance_calculation: false,
});

function privacyValueOrDefault(value, fallback) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function withOnboardingPrivacyDefaults(profile = {}) {
  return {
    ...profile,
    ...onboardingDistanceDefaults(profile),
    profile_visibility: privacyValueOrDefault(profile.profile_visibility, ONBOARDING_PRIVACY_DEFAULTS.profile_visibility),
    who_can_message: privacyValueOrDefault(profile.who_can_message, ONBOARDING_PRIVACY_DEFAULTS.who_can_message),
    share_nationality: profile.share_nationality ?? ONBOARDING_PRIVACY_DEFAULTS.share_nationality,
    share_marital_status: profile.share_marital_status ?? ONBOARDING_PRIVACY_DEFAULTS.share_marital_status,
    share_family_plan: profile.share_family_plan ?? false,
    share_smoking: profile.share_smoking ?? ONBOARDING_PRIVACY_DEFAULTS.share_smoking,
    share_drinking: profile.share_drinking ?? ONBOARDING_PRIVACY_DEFAULTS.share_drinking,
    share_height: profile.share_height ?? ONBOARDING_PRIVACY_DEFAULTS.share_height,
    share_work: profile.share_work ?? ONBOARDING_PRIVACY_DEFAULTS.share_work,
    show_online_status: profile.show_online_status ?? ONBOARDING_PRIVACY_DEFAULTS.show_online_status,
    show_last_seen: profile.show_last_seen ?? ONBOARDING_PRIVACY_DEFAULTS.show_last_seen,
    indicator_presence_consent: profile.indicator_presence_consent ?? ONBOARDING_PRIVACY_DEFAULTS.indicator_presence_consent,
  };
}

// A broken or partially migrated profile must never leave a signed-in person
// looking at an empty screen. Keep this boundary local to onboarding so the
// recovery path remains available even when one onboarding sub-step fails.
class OnboardingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
        <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-bold">We couldn’t resume your profile</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your draft is kept. Try this step again.
          </p>
          <button
            type="button"
            className="mt-5 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }
}

function OnboardingFlow() {
  const {
    user,
    member,
    refreshMember,
    onboardingDraftRef,
  } = useAuth();

  const navigate = useNavigate();
  const { t } = useLocalization();

  const localDraftRef = useRef(null);
  const draftRef = onboardingDraftRef || localDraftRef;
  const savedDraft = draftRef.current?.userId === user?.id ? draftRef.current : readOnboardingDraft(user?.id);
  const [step, setStep] = useState(resumeStep(savedDraft));

  const [memberData, setMemberData] = useState(savedDraft?.data || { ...ONBOARDING_PRIVACY_DEFAULTS });
  const stepConfig = onboardingStepsFor(memberData, MAIN_PASSPORT);
  const memberDataRef = useRef(savedDraft?.data || { ...ONBOARDING_PRIVACY_DEFAULTS });

  const [reviewed, setReviewed] = useState(savedDraft?.version===ONBOARDING_DRAFT_VERSION && Array.isArray(savedDraft.reviewed) ? savedDraft.reviewed : []);
  const reviewedRef = useRef(reviewed);
  const [galleryVisited,setGalleryVisited] = useState(false);
  const [galleryBlocked,setGalleryBlocked] = useState(false);
  const [photoBusy,setPhotoBusy] = useState(false);
  const controller=useRef(new AbortController());
  const [draftWarning,setDraftWarning] = useState('');
  const savingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(()=>{mounted.current=true;controller.current=new AbortController();return()=>{mounted.current=false;controller.current.abort();};},[]);
  const keepDraft = (data, position=step, completed=reviewedRef.current) => {
    const draft={version:ONBOARDING_DRAFT_VERSION,userId:user?.id,step:position,reviewed:completed,data:draftFields(data)};
    draftRef.current=draft;
    if(!storeOnboardingDraft(draft))setDraftWarning('This device cannot retain unsaved changes across reloads. Keep this page open until Continue confirms your save.');
  };
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => window.NmoodRecovery?.profileRetry?.(() => {
    if (savingRef.current || galleryBlocked || photoBusy || completingRef.current) return false;
    setLoadAttempt(value => value + 1);
    return true;
  }), [saving]);
  const [saveError, setSaveError] = useState('');
  const [personalSaveError, setPersonalSaveError] = useState('');
  const completingRef = useRef(false);
  const completionStageRef = useRef('profile-save');
  const confirmedCompletion = useRef(null);
  const confirmedFinalSave = useRef(null);
  useEffect(() => {
    if (user?.id && !checking && !loadError) keepDraft(memberDataRef.current);
  }, [step, checking, loadError, user?.id, draftRef]);

  useEffect(() => {
    let active = true;

    const resumeProfile = async (existing) => {
      if (!existing?.id) throw new Error('PROFILE_UNAVAILABLE');

      if (isOnboardingComplete(existing)) {
        await withTimeout(() => refreshMember(existing));
        if (!active) return;
        draftRef.current = null;
        clearOnboardingDraft();
        navigate('/', { replace: true });
        return;
      }

      const prior = draftRef.current?.userId === user.id ? draftRef.current : readOnboardingDraft(user.id);
      const {photo_gallery:_staleGallery,...priorData}=draftFields(prior?.data||{});
      const personalChanges = mergePersonalChanges(recoverPersonalChanges(existing, priorData), readPendingPersonalDetails(user.id));
      const resumed = withOnboardingPrivacyDefaults({ ...existing, ...priorData, ...personalChanges, _personalChanges: personalChanges });
      memberDataRef.current = resumed;
      setMemberData(resumed);
      const steps=onboardingStepsFor(existing,MAIN_PASSPORT);
      const previous=Array.isArray(prior?.reviewed)?prior.reviewed.filter(key=>steps.some(s=>s.key===key)):[];
      const completed=prior?.version===ONBOARDING_DRAFT_VERSION ? previous.slice(0,reviewedPrefix(previous,steps)) : [];
      reviewedRef.current=completed;setReviewed(completed);
      setStep(Math.min(completed.length,steps.length-1));
    };

    const checkExisting = async () => {
      setChecking(true);
      setLoadError(false);
      if (!user?.id) {
        if (active) {
          setChecking(false);
        }

        return;
      }

      if (!hasChosenLanguage()) {
        navigate(
          '/language-select?from=/onboarding',
          { replace: true }
        );

        return;
      }

      try {
        // Provision the canonical, unfinished profile before any onboarding
        // interaction. The backend resolves legacy records by account ID and
        // never uses this completion flow to create a second profile.
        const existing = await withTimeout(signal => ensureOnboardingProfile({ expectedUserId: user.id, signal }));
        if (!active) return;
        await resumeProfile(existing);
      } catch {
        // Auth has already resolved the signed-in member before this screen is
        // mounted. If a second provisioning request is interrupted, resume the
        // verified record that AuthContext already holds instead of falsely
        // telling a new member that their profile cannot be loaded.
        if (active && member?.id === user.id) {
          try {
            await resumeProfile(member);
          } catch {
            if (active) setLoadError(true);
          }
        } else if (active) setLoadError(true);
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    checkExisting();

    return () => {
      active = false;
    };
  }, [
    user?.id,
    member?.id,
    loadAttempt,
    navigate,
  ]);

  useEffect(()=>{if(stepConfig[step]?.key==='gallery')setGalleryVisited(true);},[step]);

  const onboarded = isOnboardingComplete(member);

  useEffect(() => {
    if (!onboarded) {
      return;
    }

    draftRef.current=null;clearOnboardingDraft();
    navigate('/', { replace: true });
  }, [
    onboarded,
    navigate,
  ]);

  const update = (newData) => {
    if(!mounted.current)return;
    const next = { ...memberDataRef.current, ...newData };
    memberDataRef.current = next;
    keepDraft(next);
    setMemberData(next);
  };

  const updatePersonal = (patch) => {
    const changes = mergePersonalChanges(memberDataRef.current._personalChanges || {}, patch);
    if (!storePendingPersonalDetails(user.id, changes)) setDraftWarning('This device cannot retain optional changes after closing the app. Keep this page open to retry saving them.');
    setPersonalSaveError('');
    update({ ...patch, _personalChanges: changes });
  };
  const persistPersonal = async () => {
    const changes = memberDataRef.current._personalChanges || {};
    if (!Object.keys(changes).length) return;
    const result = await savePersonalDetails(changes, patch => withTimeout(signal => updateMemberProfile(patch, { expectedUserId: user.id, signal })));
    if (!mounted.current) return;
    if (!storePendingPersonalDetails(user.id, result.remaining)) setDraftWarning('This device cannot retain optional changes after closing the app. Keep this page open to retry saving them.');
    update({ ...result.saved, _personalChanges: result.remaining });
    setPersonalSaveError(result.error);
  };
  const retryPersonal = async () => {
    if (savingRef.current || completingRef.current) return;
    savingRef.current = true; setSaving(true);
    try { await persistPersonal(); }
    finally { savingRef.current = false; if (mounted.current) setSaving(false); }
  };

  const advance = () => {
    setPhotoBusy(false);
    const completed=reviewedRef.current.slice();
    if(completed[step]!==stepConfig[step].key)completed.splice(step,completed.length,stepConfig[step].key);
    reviewedRef.current=completed;setReviewed(completed);
    const next=Math.min(step+1,stepConfig.length-1);
    keepDraft(memberDataRef.current,next,completed);
    setStep(next);
  };
  const handleNext = async () => {
    if (savingRef.current || galleryBlocked || (photoBusy && stepConfig[step].key!=='notifications')) return;
    const error=stepValidation(stepConfig[step].key,memberDataRef.current);
    if(error){setSaveError(error);return;}
    savingRef.current=true;setSaving(true);setSaveError('');
    try {
      if (stepConfig[step].key === 'personal') {
        // Optional saving never gates progression. Only confirmed fields leave
        // the per-account draft; required checks still run at final completion.
        await persistPersonal();
        if (mounted.current) advance();
        return;
      }
      const fields=new Set([...stepConfig[step].fields,...(MAIN_PASSPORT&&stepConfig[step].key==='location'?['country_code']:[]),...(stepConfig[step].key==='personal'?['_workDraft']:[])]);
      const draft = buildOnboardingProgressPayload(Object.fromEntries(Object.entries(memberDataRef.current).filter(([key])=>fields.has(key))));
      const saved = await withTimeout(() => updateMemberProfile(draft,{expectedUserId:user.id,signal:controller.current.signal}));
      if(!mounted.current)return;
      requirePersistedOnboardingGender(draft.gender, saved);
      requirePersistedOnboardingHereFor(draft.dating_looking_for_gender, saved);
      requirePersistedOnboardingLookingForTags(draft.looking_for_tags, saved);
      const changes=explicitSettings(memberDataRef.current,stepConfig[step].key);
      await saveOnboardingSettings(changes,{expectedUserId:user.id,signal:controller.current.signal});
      if(!mounted.current)return;
      const remaining={...(memberDataRef.current._settingsChanges||{})};
      for(const key of Object.keys(changes))delete remaining[key];
      update({_settingsChanges:remaining});
      advance();
    } catch {
      if(mounted.current)setSaveError('This step could not be confirmed. Your draft is kept. Check your connection and try Continue again.');
    } finally {
      savingRef.current=false;
      if(mounted.current)setSaving(false);
    }
  };

  const handleBack = () => {
    if(savingRef.current||galleryBlocked||photoBusy)return;
    setSaveError('');
    setStep((previousStep) =>
      Math.max(previousStep - 1, 0)
    );
  };

  const handleOptionalDobSave = async (dateOfBirth) => {
    if (savingRef.current) return;
    savingRef.current=true;
    setSaving(true);
    setSaveError('');
    try {
      await withTimeout(()=>updateMemberDob(dateOfBirth));
      if(!mounted.current)return;
      update({ date_of_birth: dateOfBirth });
      // Age is optional. A successful save must always leave this optional
      // step; keeping the draft here stranded Android users on Step 1.
      advance();
    } catch (error) {
      if (/already stored/i.test(error?.message || '')) {
        if(!mounted.current)return;
        update({ date_of_birth: dateOfBirth });
        advance();
        return;
      }
      if(mounted.current)setSaveError('We could not save your date of birth. Your draft is kept; please try again.');
    } finally {
      savingRef.current=false;
      if(mounted.current)setSaving(false);
    }
  };

  const handleOptionalDobSkip = () => {
    if (savingRef.current) return;
    // Do not send an already stored private DOB through the generic profile
    // update path. Skipping is intentionally a local progression only.
    setSaveError('');
    advance();
  };

  const handleComplete = async () => {
    if (savingRef.current || galleryBlocked || photoBusy || completingRef.current) {
      return;
    }

    for(const key of ['notifications','privacy'])if(Object.keys(explicitSettings(memberDataRef.current,key)).length){
      setStep(stepConfig.findIndex(item=>item.key===key));setSaveError('Review your pending settings and Continue to confirm them.');return;
    }
    const issue=completionIssue(memberDataRef.current,reviewedRef.current,stepConfig);
    if(issue){setStep(stepConfig.findIndex(item=>item.key===issue.key));setSaveError(issue.message);return;}
    savingRef.current=true;
    completingRef.current = true;
    completionStageRef.current = 'profile-save';
    setSaving(true);
    setSaveError('');

    try {
      if (!user?.id) {
        throw new Error(
          'Your session could not be verified. Please retry the session check; your form is kept.'
        );
      }

      // Defense in depth: the first onboarding step prevents moving forward
      // without a photo, and completion verifies the requirement again before
      // any profile can be persisted as complete.
      if (!memberData.photo_url) {
        throw new Error('Add at least one profile photo before finishing onboarding.');
      }

      // Name and DOB are collected on the Create Account form, not here.
      // During the Base44 → Supabase migration some previously verified
      // accounts were missing the copied display name. Resolve it from the
      // canonical profile data first, then use a human-readable account
      // fallback so a valid verified member can finish the same profile.
      const displayName = resolveOnboardingDisplayName(memberData, user);

      if (!displayName) {
        setStep(0);
        setSaveError('Add the name you want to show on your profile before finishing onboarding.');
        return;
      }

      // Photo is required; gender is optional.
      const profileFields = {
        ...buildOnboardingProgressPayload(withoutPersonalDetails(draftFields(memberDataRef.current))),
        display_name: displayName,
        ...getConsentForMember(),
      };

      // The profile was provisioned at verification/onboarding entry. Final
      // completion only validates the required fields and marks that same
      // canonical record complete; it never creates a profile.
      // Supabase validates and completes the existing profile atomically.
      // In legacy Base44 mode the same helper retains its existing behavior.
      // Retry optional drafts separately: no missing extension can poison the
      // required profile/safety/consent save or the server completion RPC.
      await persistPersonal();
      if (!mounted.current) return;
      const finalKey=JSON.stringify([user.id,profileFields]);
      const savedProfile = confirmedFinalSave.current?.key===finalKey ? confirmedFinalSave.current.profile : await withTimeout(() => updateMemberProfile(profileFields,{expectedUserId:user.id,signal:controller.current.signal}));
      requirePersistedOnboardingGender(profileFields.gender, savedProfile);
      requirePersistedOnboardingHereFor(profileFields.dating_looking_for_gender, savedProfile);
      requirePersistedOnboardingLookingForTags(profileFields.looking_for_tags, savedProfile);
      confirmedFinalSave.current={key:finalKey,profile:savedProfile};
      if(!mounted.current)return;
      completionStageRef.current = 'profile-complete';
      const savedMember = confirmedCompletion.current?.id===user.id ? confirmedCompletion.current : await withTimeout(() => completeOnboardingProfile({expectedUserId:user.id,signal:controller.current.signal}));
      if(!mounted.current)return;
      // PostgREST returns a table-returning RPC as an array. Prefer the
      // authoritative record returned by the atomic completion function;
      // reading it again through the browser's RLS endpoint can legitimately
      // be unavailable during a migration and must not undo a successful
      // completion.
      let persistedMember = Array.isArray(savedMember)
        ? savedMember[0]
        : (savedMember?.member || savedMember);

      if (!persistedMember?.onboarding_completed) {
        persistedMember = await withTimeout(() => getOwnMember(user.id, user.email));
      }

      if (
        !persistedMember ||
        !persistedMember.onboarding_completed
      ) {
        throw new Error(
          'Your profile was saved, but onboarding completion could not be confirmed. Please try again.'
        );
      }

      confirmedCompletion.current=persistedMember;
      completionStageRef.current = 'profile-auth-refresh';
      await withTimeout(() => refreshMember(persistedMember || savedMember));

      clearStoredConsent();
      clearPendingRegistration();

      draftRef.current = null;
      clearOnboardingDraft();
      navigate('/', { replace: true });
    } catch (error) {

      window.NmoodRecovery?.profileField?.('ONBOARDING-COMPLETE');
      if(mounted.current)setSaveError('This step could not finish. Your form is kept; try again.');
    } finally {
      completingRef.current = false;
      savingRef.current=false;
      if(mounted.current)setSaving(false);
    }
  };

  if (!user?.id && !checking) return <main className="p-6"><h1>Session verification needed</h1><p>Your saved draft will resume after your account session is available.</p><Button onClick={()=>setLoadAttempt(value=>value+1)}>Try again</Button></main>;

  if (loadError && !checking) {
    return <main className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
      <section role="alert" className="max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold">Your profile could not be loaded</h1>
        <p>Please check your connection and try again.</p>
        <button type="button" className="min-h-12 rounded-xl bg-primary px-5 text-primary-foreground" onClick={() => setLoadAttempt(value => value + 1)}>Retry onboarding</button>
      </section>
    </main>;
  }

  if (checking) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>

        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-primary" />
        <p role="status">Loading your profile…</p>
      </div>
    );
  }

  // Defensive normalization protects resumptions from any stale or malformed
  // locally persisted step value left by an earlier app release.
  const safeStep = Number.isInteger(step)
    ? Math.max(0, Math.min(step, stepConfig.length - 1))
    : 0;
  const currentStep = stepConfig[safeStep];

  const isCompleteStep =
    currentStep.key === 'complete';
  const titleKey = currentStep.key === 'eligibility'
    ? 'onboarding.step.eligibility.title'
    : 'onboarding.step.' + currentStep.key + '.title';
  const subtitleKey = currentStep.key === 'eligibility'
    ? 'eligibility.optional_dob.subtitle'
    : 'onboarding.step.' + currentStep.key + '.subtitle';

  return (
    <RegionControls onboarding><OnboardingShell
        step={safeStep}
      totalSteps={stepConfig.length}
      title={MAIN_PASSPORT && currentStep.key === 'location' ? 'Find your local Nmood' : currentStep.title || t(titleKey)}
      subtitle={currentStep.key==='complete'?'Review your profile, then finish when you are ready.': ['personal','lifestyle','gallery'].includes(currentStep.key)?'Optional: leave any unsupplied fields blank, then Continue.':t(subtitleKey)}
      onBack={handleBack}
      navigationDisabled={saving||galleryBlocked||photoBusy}
      persistentContent={(galleryVisited||currentStep.key==='gallery')&&<div hidden={currentStep.key!=='gallery'} className="space-y-5">
        <p>Gallery photos are optional. Continue without adding photos, or upload here. Your primary profile photo stays separate.</p>
        <ProfileGallery key={user?.id} member={memberData} onSaved={saved=>update({photo_gallery:saved.photo_gallery})} onNavigationBlockedChange={setGalleryBlocked}/>
        {galleryBlocked&&<p role="status">Finish, retry or cancel the pending Gallery operation before continuing. Uploads are not retained after closing the app.</p>}
        <Button className="w-full h-12" disabled={saving||galleryBlocked} onClick={handleNext}>Continue</Button>
      </div>}
    >
      {draftWarning&&<p role="alert">{draftWarning}</p>}
      {Object.keys(memberData._personalChanges || {}).length > 0 && (personalSaveError || currentStep.key !== 'personal') && (
        <section aria-label="Unsaved optional details" className="mb-4 rounded-xl border border-border p-3 text-sm">
          {personalSaveError && <p role="alert">{personalSaveError}</p>}
          <p>Your optional draft is kept on this device. You can continue onboarding and retry here or from your Profile after finishing.</p>
          <Button type="button" variant="outline" disabled={saving} onClick={retryPersonal}>Retry optional details</Button>
        </section>
      )}
      <fieldset disabled={saving} className="min-w-0 contents">
      {saveError && !isCompleteStep && (
        <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {saveError}
        </div>
      )}
      {currentStep.key === 'eligibility' && (
        <DobRecoveryStep
          value={memberData.date_of_birth || ''}
          onChange={date_of_birth => update({ date_of_birth })}
          onSave={handleOptionalDobSave}
          onSkip={handleOptionalDobSkip}
          saving={saving}
          error={saveError}
        />
      )}
      {currentStep.key === 'profile' && (
        <BasicProfileStep
          onNavigationBlockedChange={setPhotoBusy}
          data={memberData}
          update={update}
          onNext={handleNext}
        />
      )}

      {currentStep.key === 'personal' && <div className="space-y-5"><PersonalDetailsFields data={memberData} update={updatePersonal} includeNationality selectionIncludesSharing/><Button className="w-full h-12" onClick={handleNext}>Continue</Button></div>}
      {currentStep.key === 'lifestyle' && <div className="space-y-5"><LifestyleFields data={memberData} update={update}/><Button className="w-full h-12" onClick={handleNext}>Continue</Button></div>}
      {currentStep.key === 'interests' && (
        <InterestsStep
          data={memberData}
          update={update}
          onNext={handleNext}
        />
      )}

      {currentStep.key === 'looking_for' && (
        <LookingForStep
          saving={saving}
          data={memberData}
          update={update}
          onNext={handleNext}
        />
      )}

      {currentStep.key === 'languages' && (
        <LanguagesStep
          data={memberData}
          update={update}
          onNext={handleNext}
        />
      )}

      {currentStep.key === 'location' && (
        <LocationStep
          data={memberData}
          update={update}
          onNext={handleNext}
        />
      )}

      {currentStep.key === 'notifications' && (
        <NotificationsStep
          data={memberData}
          update={update}
          onNext={handleNext}
          onNavigationBlockedChange={setPhotoBusy}
        />
      )}

      {currentStep.key === 'privacy' && (
        <PrivacyStep
          data={memberData}
          update={update}
          onNext={handleNext}
        />
      )}

      {currentStep.key === 'complete' && (
        <CompleteStep
          data={memberData}
          onComplete={handleComplete}
          saving={saving}
          error={saveError}
        />
      )}
      </fieldset>
    </OnboardingShell></RegionControls>
  );
}

export default function Onboarding() {
  const { user } = useAuth();
  return (
    <OnboardingErrorBoundary key={user?.id || 'anonymous'}>
      <OnboardingFlow />
    </OnboardingErrorBoundary>
  );
}

export function resolveOnboardingDisplayName(data, user) {
  const nameParts = [data?.first_name, data?.last_name]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .trim();

  const directName = [
    data?.display_name,
    nameParts,
    user?.full_name,
    user?.user_metadata?.full_name,
    user?.user_metadata?.name,
  ].find((value) => typeof value === 'string' && value.trim());

  return directName ? directName.trim() : '';
}
