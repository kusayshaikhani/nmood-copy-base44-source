import {hostDraftFields} from '@/lib/ai-action-drafts';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import moment from 'moment';
import { budgetOptions } from '@/lib/budget-utils';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useConfirm } from '@/components/ux/ConfirmProvider';
import { emitActivityChange } from '@/lib/activity-store';
import { invalidateExperienceCache } from '@/lib/discover-store';
import { invalidateCircleCache } from '@/lib/circle-store';
import { createCircle, createExperience, isPersistedCoverUrl } from '@/api/contentRecords';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { startTimer } from '@/lib/performance-monitor';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isUnlimitedCapacity, normalizeCapacityInput } from '@/lib/capacity';
import { useGuardedCallback } from '@/lib/use-guarded-back';
import { useSafeBack } from '@/lib/safe-navigation';
import { sharePublicContent } from '@/lib/native-share';
import { getAppLink } from '@/lib/app-links';
import CreateProgress from '@/components/host/wizard/premium/CreateProgress';
import CreateFooter from '@/components/host/wizard/premium/CreateFooter';
import PremiumStepHostType from '@/components/host/wizard/premium/PremiumStepHostType';
import PremiumStepCover from '@/components/host/wizard/premium/PremiumStepCover';
import PremiumStepBasics from '@/components/host/wizard/premium/PremiumStepBasics';
import PremiumStepTimeLocation from '@/components/host/wizard/premium/PremiumStepTimeLocation';
import PremiumStepCapacity from '@/components/host/wizard/premium/PremiumStepCapacity';
import PremiumStepRequirements from '@/components/host/wizard/premium/PremiumStepRequirements';
import PremiumStepPreview from '@/components/host/wizard/premium/PremiumStepPreview';
import CreateSuccess from '@/components/host/wizard/CreateSuccess';

const initialData = {
  coverPhoto: null,
  logoPhoto: null,
  title: '',
  category: '',
  whatToExpect: '',
  description: '',
  language: 'English',
  mood: '',
  date: '',
  startTime: '',
  endTime: '',
  location: { venueName: '', address: '', coordinates: null },
  capacity: 20,
  budgetOption: '',
  customAmount: '',
  budgetType: 'estimated',
  whatToBring: '',
  languages: [],
  difficulty: '',
  dressCode: '',
  familyFriendly: null,
  petsAllowed: null,
  wheelchairAccessible: null,
  overnight: null,
  privacy: 'public',
  rules: [],
  customTags: [],
};

export default function CreateActivity({ hostType: initialHostType = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { sync, showUpgrade, entitlementState } = useMembershipAccess();
  const confirm = useConfirm();
  const { t } = useLocalization();

  const aiDraft=location.state?.aiActionDraft?.owner===user?.id?location.state.aiActionDraft:null;
  const [hostType, setHostType] = useState(initialHostType || location.state?.hostType || null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => {
    if(aiDraft)return {...initialData,...hostDraftFields(aiDraft.data,aiDraft.kind)};
    try {
      let saved = localStorage.getItem('hostCreationDraft');
      if (!saved) {
        saved = localStorage.getItem('hostCircleDraft') || localStorage.getItem('hostExperienceDraft');
        if (saved) {
          localStorage.setItem('hostCreationDraft', saved);
          localStorage.removeItem('hostCircleDraft');
          localStorage.removeItem('hostExperienceDraft');
        }
      }
      if (!saved) return initialData;
      const parsed = JSON.parse(saved);
      if (parsed.coverPhoto && typeof parsed.coverPhoto === 'string' && parsed.coverPhoto.startsWith('data:')) {
        parsed.coverPhoto = null;
      }
      return { ...initialData, ...parsed, coverUploading: false };
    } catch {
      return initialData;
    }
  });
  const [published, setPublished] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [errors, setErrors] = useState({});
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostAvatar, setHostAvatar] = useState('');

  const isCircle = hostType === 'circle';

  // Unified 6-step flow: Cover, Basics, Time&Location, Capacity, Requirements, Preview
  const steps = [PremiumStepCover, PremiumStepBasics, PremiumStepTimeLocation, PremiumStepCapacity, PremiumStepRequirements, PremiumStepPreview];
  const stepLabels = isCircle
    ? ['Cover', 'Basics', 'Location', 'Capacity', 'Rules', 'Preview']
    : ['Cover', 'Basics', 'Time & Location', 'Capacity', 'Requirements', 'Preview'];

  const errorToStep = isCircle
    ? { coverPhoto: 0, title: 1, category: 1, description: 1, location: 2, capacity: 3 }
    : { coverPhoto: 0, title: 1, category: 1, description: 1, date: 2, startTime: 2, location: 2, capacity: 3, budgetOption: 4, customAmount: 4 };

  // Autosave draft
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if(!aiDraft)localStorage.setItem('hostCreationDraft', JSON.stringify(data));
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [data,aiDraft]);

  // Fetch host profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const myMember = await getOwnMember(user.id, user.email);
        if (myMember) {
          setHostName(myMember.display_name || myMember.first_name || user.full_name || 'You');
          setHostAvatar(myMember.photo_url || '');
        } else {
          setHostName(user.full_name || 'You');
        }
      } catch {
        setHostName(user.full_name || 'You');
      }
    })();
  }, [user]);

  const update = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const selectHostType = (type) => {
    setHostType(type);
    setStep(0);
    setErrors({});
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 0 && !isPersistedCoverUrl(data.coverPhoto)) {
      errs.coverPhoto = 'Add a cover photo before continuing.';
    }
    if (s === 1) {
      if (!data.title?.trim()) errs.title = t('create.exp.err_title_required');
      if (!data.category) errs.category = t('create.exp.err_category_required');
      if (!data.description?.trim()) errs.description = t('create.exp.err_description_required');
    }
    if (s === 2) {
      if (!isCircle) {
        if (!data.date) errs.date = t('create.exp.err_date_required');
        if (!data.startTime) errs.startTime = t('create.exp.err_time_required');
      }
      if (!data.location?.venueName?.trim()) errs.location = t('create.exp.err_location_required');
    }
    if(s===3&&aiDraft&&data.capacity==='')errs.capacity='Choose a capacity or select Unlimited.';
    if(s===3&&aiDraft&&!data.privacy)errs.privacy='Choose who can see this plan.';
    if (s === 3 && !isUnlimitedCapacity(data.capacity) && (!data.capacity || data.capacity < 1)) errs.capacity = t('create.exp.err_capacity_required');
    if (s === 4 && !isCircle) {
      if (!data.budgetOption) errs.budgetOption = t('create.exp.err_budget_required');
      if (data.budgetOption === 'custom' && (!data.customAmount || parseFloat(data.customAmount) <= 0)) errs.customAmount = t('create.exp.err_amount_required');
    }
    return errs;
  };

  const handleNext = () => {
    // A cover upload still in flight would publish without its image.
    if (data.coverUploading) return;
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handlePublish = async () => {
    if (data.coverUploading) return;
    if(aiDraft&&(!data.privacy||data.capacity==='')){setPublishError('Choose capacity and visibility before publishing.');return;}
    if (['loading', 'reconciling', 'unavailable'].includes(entitlementState)) {
      setPublishError('Membership access is not yet verified. Retry the membership check before publishing.');
      return;
    }
    const allErrors = {};
    if (!isPersistedCoverUrl(data.coverPhoto)) {
      allErrors.coverPhoto = 'Add a cover photo before publishing.';
    }
    if (!data.title?.trim()) allErrors.title = t('create.exp.err_title_required');
    if (!data.category) allErrors.category = t('create.exp.err_category_required');
    if (!data.description?.trim()) allErrors.description = t('create.exp.err_description_required');
    if (!isCircle) {
      if (!data.date) allErrors.date = t('create.exp.err_date_required');
      if (!data.startTime) allErrors.startTime = t('create.exp.err_time_required');
      if (!data.budgetOption) allErrors.budgetOption = t('create.exp.err_budget_required');
      if (data.budgetOption === 'custom' && (!data.customAmount || parseFloat(data.customAmount) <= 0)) allErrors.customAmount = t('create.exp.err_amount_required');
    }
    if (!data.location?.venueName?.trim()) allErrors.location = t('create.exp.err_location_required');

    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstError = Object.keys(allErrors)[0];
      const targetStep = firstError === 'coverPhoto' ? 0 : errorToStep[firstError];
      if (targetStep !== undefined) setStep(targetStep);
      setPublishError(allErrors[firstError]);
      return;
    }

    setPublishing(true);
    setPublishError('');
    const perf = startTimer('experience_creation', 'create_activity');
    try {
      // Final guard: ensure cover photo URL is valid before API call
      const coverPhotoUrl = isPersistedCoverUrl(data.coverPhoto) ? data.coverPhoto.trim() : '';
      if (!coverPhotoUrl) {
        setPublishError('Cover photo is required. Please upload one before publishing.');
        setStep(0);
        setPublishing(false);
        return;
      }
      if (isCircle) {
        const rulesStr = (data.rules || []).filter(Boolean).join('\n');
        const created = await createCircle({
          name: data.title.trim(),
          description: data.description.trim(),
          cover_photo: coverPhotoUrl,
          privacy: data.privacy || 'public',
          host_user_id: user.id,
          host_name: hostName,
          host_avatar: hostAvatar,
          member_count: 1,
          max_members: normalizeCapacityInput(data.capacity),
          category: data.category || '',
          location: data.location?.venueName || '',
          location_address: data.location?.address || '',
          location_area: data.location?.area || '',
          location_city: data.location?.city || '',
          location_country: data.location?.country || '',
          location_type: data.location?.location_type || '',
          location_lat: data.location?.coordinates?.[0] ?? null,
          location_lng: data.location?.coordinates?.[1] ?? null,
          rules: rulesStr || '',
          registrations_open: true,
          status: 'active',
          shared_interests: Array.from(new Set([data.category, ...(user?.interests || [])].filter(Boolean))),
        });
        trackProductEvent(PRODUCT_EVENTS.CIRCLE_CREATED, { category: data.category });
        if(!aiDraft)localStorage.removeItem('hostCreationDraft');
        invalidateCircleCache();
        setCreatedId(created.id);
        setPublished(true);
        emitActivityChange();
      } else {
        const budgetStr = data.budgetOption === 'free'
          ? 'Free'
          : data.budgetOption === 'custom'
            ? String(data.customAmount || '')
            : (budgetOptions.find((o) => o.id === data.budgetOption)?.range || '');
        const budgetAmount = data.budgetOption === 'custom' ? parseFloat(data.customAmount || 0) : 0;
        const s = moment(data.startTime, 'HH:mm');
        const e = moment(data.endTime, 'HH:mm');
        let diffHours = e.isValid() && s.isValid() ? e.diff(s, 'hours', true) : 2;
        if (diffHours <= 0 && data.overnight === true) diffHours += 24;
        if (diffHours <= 0) diffHours = 2;
        const durationHours = Math.round(diffHours * 10) / 10;
        const h = Math.floor(durationHours);
        const m = Math.round((durationHours - h) * 60);
        const durationStr = m === 0 ? `${h}h` : (h === 0 ? `${m}m` : `${h}h ${m}m`);
        const created = await createExperience({
          ...(location.state?.circleId ? {circle_id: location.state.circleId} : {}),
          title: data.title.trim(),
          description: data.description.trim(),
          cover_image: coverPhotoUrl,
          category: data.category || '',
          date: data.date,
          time: data.startTime,
          duration: durationStr,
          duration_hours: durationHours,
          location: data.location?.venueName || '',
          location_address: data.location?.address || '',
          location_area: data.location?.area || '',
          location_city: data.location?.city || '',
          location_country: data.location?.country || '',
          location_type: data.location?.location_type || '',
          location_lat: data.location?.coordinates?.[0] ?? null,
          location_lng: data.location?.coordinates?.[1] ?? null,
          max_participants: normalizeCapacityInput(data.capacity),
          visibility: data.privacy || 'public',
          budget: budgetStr,
          budget_amount: budgetAmount,
          status: 'active',
          host_user_id: user.id,
          host_name: hostName,
          host_avatar: hostAvatar,
          spots_filled: 0,
        });
        trackProductEvent(PRODUCT_EVENTS.EXPERIENCE_CREATED, { category: data.category });
        if(!aiDraft)localStorage.removeItem('hostCreationDraft');
        invalidateExperienceCache();
        setCreatedId(created.id);
        setPublished(true);
        emitActivityChange();
      }
    } catch (err) {
      // Never show the success screen for a write that did not persist.
      setPublished(false);
      setCreatedId(null);
      if (/NMOOD_CREATION_LIMIT_REACHED/i.test(`${err?.message || ''} ${err?.detail || ''}`)) {
        const approved = await confirm({
          title: 'You have used your two free creations',
          description: 'Premium gives you unlimited Circles, Experiences, and Nmood Shares.',
          confirmLabel: 'Upgrade',
          cancelLabel: 'Cancel',
        });
        if (approved) showUpgrade(isCircle ? 'create_circle' : 'create_experience');
        return;
      }
      if (err?.status === 403 || err?.code === '42501' || /Premium/i.test(err?.message || '')) await sync();
      setPublishError(err?.message || t('create.exp.err_publish_failed'));
    } finally {
      setPublishing(false);
      perf.end({ type: isCircle ? 'circle' : 'experience' });
    }
  };

  const handleSaveDraft = () => {
    if(aiDraft)return;
    try {
      localStorage.setItem('hostCreationDraft', JSON.stringify(data));
    } catch { /* ignore */ }
    navigate('/host');
  };

  // Guards the shared back arrow (CreateProgress header + CreateFooter's
  // Back/Cancel button) used by both Create Experience and Create Circle,
  // which render this same wizard. A rapid double-tap could otherwise fire
  // this twice before React re-renders, sending two navigations back-to-back.
  // The guard only debounces — useSafeBack still resolves the destination, so
  // it can never mask an invalid one.
  const safeBack = useSafeBack(hostType === 'circle' ? '/communities' : '/explore');
  const rawHandleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => Math.max(0, s - 1));
      return;
    }
    // At the first step there is no in-wizard state left to pop, so leave the
    // screen: return to the recorded origin, else real internal history, else
    // the known-safe parent above.
    safeBack();
  }, [step, safeBack]);
  const handleBack = useGuardedCallback(rawHandleBack, step);

  if (published) {
    return (
      <CreateSuccess
        type={hostType}
        createdId={createdId}
        data={data}
        onView={() => navigate(createdId ? (isCircle ? `/circle/${createdId}` : `/experience/${createdId}`) : '/explore')}
        onInvite={() => navigate(createdId ? (isCircle ? `/circle/${createdId}` : `/experience/${createdId}`) : '/explore')}
        onShare={() => sharePublicContent({ title: data.title, text: data.description, url: getAppLink(createdId ? (isCircle ? `/circle/${createdId}` : `/experience/${createdId}`) : '/explore') })}
        onHostAnother={() => { setPublished(false); setCreatedId(null); setData(initialData); setHostType(null); setStep(0); setErrors({}); }}
        onGoHome={() => navigate('/')}
      />
    );
  }

  // Pre-step: host type selection
  if (!hostType) {
    return <PremiumStepHostType onSelect={selectHostType} />;
  }

  const CurrentStep = steps[step];
  // Android's Google map is a native surface positioned from the DOM box. A
  // transformed Framer Motion ancestor makes that position incorrect, so the
  // Time & Location step must not use the slide animation on Android.
  const isNativeMapStep = Capacitor.getPlatform() === 'android' && step === 2;
  const isLast = step === steps.length - 1;
  const publishLabel = isCircle ? t('hosting.create.create_circle') : t('hosting.create.publish_experience');
  const pageTitle = isCircle ? t('hosting.create.create_circle') : t('hosting.create.publish_experience');

  return (
    <div className="min-h-full flex flex-col bg-background">
      {['loading', 'reconciling', 'unavailable'].includes(entitlementState) && <div role="status" className="rounded-xl border p-4">Membership access is being verified. Your draft is safe.<button type="button" className="min-h-11 px-3 underline" onClick={() => sync()}>Retry membership check</button></div>}
      <CreateProgress
        currentStep={step}
        totalSteps={steps.length}
        stepName={stepLabels[step]}
        title={pageTitle}
        onBack={handleBack}
      />

      {/* Step content */}
      <div className="flex-1 px-6 pt-8 pb-24">
        <div className="max-w-lg mx-auto">
          {isNativeMapStep ? (
            <div>
              <CurrentStep
                data={data}
                update={update}
                requiresCapacityChoice={!!aiDraft}
                errors={errors}
                isCircle={isCircle}
                onEdit={(s) => setStep(s)}
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <CurrentStep
                  data={data}
                  update={update}
                  requiresCapacityChoice={!!aiDraft}
                  errors={errors}
                  isCircle={isCircle}
                  onEdit={(s) => setStep(s)}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {publishError && (
            <p className="text-sm text-destructive text-center mt-6">{publishError}</p>
          )}
        </div>
      </div>

      <CreateFooter
        onBack={handleBack}
        onNext={handleNext}
        onPublish={handlePublish}
        isLast={isLast}
        publishing={publishing}
        uploading={!!data.coverUploading}
        backLabel={step === 0 ? t('hosting.create.cancel') : t('hosting.create.back')}
        nextLabel={t('hosting.create.next')}
        publishLabel={publishLabel}
        onSaveDraft={handleSaveDraft}
        showDraft={!aiDraft}
      />
    </div>
  );
}
