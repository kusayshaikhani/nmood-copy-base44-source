import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import { budgetOptions } from '@/lib/budget-utils';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { emitActivityChange } from '@/lib/activity-store';
import { invalidateExperienceCache } from '@/lib/discover-store';
import { invalidateCircleCache } from '@/lib/circle-store';
import { createCircle, createExperience } from '@/api/contentRecords';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { startTimer } from '@/lib/performance-monitor';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isUnlimitedCapacity, normalizeCapacityInput } from '@/lib/capacity';
import { useGuardedCallback } from '@/lib/use-guarded-back';
import { useSafeBack } from '@/lib/safe-navigation';
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
  const { can, showUpgrade } = useMembershipAccess();
  const { t } = useLocalization();

  const [hostType, setHostType] = useState(initialHostType || location.state?.hostType || null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => {
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
    ? { title: 1, category: 1, description: 1, location: 2, capacity: 3 }
    : { title: 1, category: 1, description: 1, date: 2, startTime: 2, location: 2, capacity: 3, budgetOption: 4, customAmount: 4 };

  // Autosave draft
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('hostCreationDraft', JSON.stringify(data));
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [data]);

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
    const createFeature = isCircle ? FEATURES.CREATE_CIRCLE : FEATURES.CREATE_EXPERIENCE;
    if (!can(createFeature)) {
      trackMembershipEvent(MEMBERSHIP_EVENTS.LIMIT_REACHED, { feature: createFeature });
      showUpgrade(createFeature);
      return;
    }
    const allErrors = {};
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
      const targetStep = errorToStep[firstError];
      if (targetStep !== undefined) setStep(targetStep);
      setPublishError(allErrors[firstError]);
      return;
    }

    setPublishing(true);
    setPublishError('');
    const perf = startTimer('experience_creation', 'create_activity');
    try {
      const coverPhotoUrl = (typeof data.coverPhoto === 'string' && !data.coverPhoto.startsWith('data:')) ? data.coverPhoto : '';
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
        localStorage.removeItem('hostCreationDraft');
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
        localStorage.removeItem('hostCreationDraft');
        invalidateExperienceCache();
        setCreatedId(created.id);
        setPublished(true);
        emitActivityChange();
      }
    } catch (err) {
      // Never show the success screen for a write that did not persist.
      setPublished(false);
      setCreatedId(null);
      setPublishError(err?.message || t('create.exp.err_publish_failed'));
    } finally {
      setPublishing(false);
      perf.end({ type: isCircle ? 'circle' : 'experience' });
    }
  };

  const handleSaveDraft = () => {
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
        onShare={() => {}}
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
  const isLast = step === steps.length - 1;
  const publishLabel = isCircle ? t('hosting.create.create_circle') : t('hosting.create.publish_experience');
  const pageTitle = isCircle ? t('hosting.create.create_circle') : t('hosting.create.publish_experience');

  return (
    <div className="min-h-full flex flex-col bg-background">
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
                errors={errors}
                isCircle={isCircle}
                onEdit={(s) => setStep(s)}
              />
            </motion.div>
          </AnimatePresence>

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
        showDraft
      />
    </div>
  );
}