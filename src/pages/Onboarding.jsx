import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import {
  updateMemberProfile,
  createMemberProfile,
} from '@/lib/member-update';
import { isOnboardingComplete } from '@/lib/eligibility';
import { toFriendlyResult } from '@/lib/error-reporter';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';

import OnboardingShell from '@/components/onboarding/OnboardingShell';
import BasicProfileStep from '@/components/onboarding/steps/BasicProfileStep';
import InterestsStep from '@/components/onboarding/steps/InterestsStep';
import LanguagesStep from '@/components/onboarding/steps/LanguagesStep';
import LocationStep from '@/components/onboarding/steps/LocationStep';
import NotificationsStep from '@/components/onboarding/steps/NotificationsStep';
import PrivacyStep from '@/components/onboarding/steps/PrivacyStep';
import CompleteStep from '@/components/onboarding/steps/CompleteStep';

import { hasChosenLanguage } from '@/lib/i18n/languages';
import {
  getConsentForMember,
  clearStoredConsent,
} from '@/lib/legal-consent';
import { clearPendingRegistration } from '@/lib/pending-registration';
import { useLocalization } from '@/lib/i18n/useLocalization';

const stepConfig = [
  { key: 'profile' },
  { key: 'interests' },
  { key: 'languages' },
  { key: 'location' },
  { key: 'notifications' },
  { key: 'privacy' },
  { key: 'complete' },
];

export default function Onboarding() {
  const {
    user,
    member,
    refreshMember,
  } = useAuth();

  const navigate = useNavigate();
  const { t } = useLocalization();

  const [step, setStep] = useState(0);

  const [memberData, setMemberData] = useState({});

  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    const checkExisting = async () => {
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
        const existing = await getOwnMember(
          user.id,
          user.email
        );

        if (!active) return;

        if (
          existing &&
          isOnboardingComplete(existing)
        ) {
          navigate('/', { replace: true });
          return;
        }

        if (existing) {
          setMemberData((previousData) => ({
            ...previousData,
            ...existing,
          }));
        }
      } catch (error) {
        console.warn(
          '[Onboarding] existing member check failed:',
          error?.message || error
        );
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
    user?.email,
    navigate,
  ]);

  const onboarded = isOnboardingComplete(member);

  useEffect(() => {
    if (!onboarded) {
      return;
    }

    navigate('/', { replace: true });
  }, [
    onboarded,
    navigate,
  ]);

  const update = (newData) => {
    setMemberData((previousData) => ({
      ...previousData,
      ...newData,
    }));
  };

  const handleNext = () => {
    setStep((previousStep) =>
      Math.min(
        previousStep + 1,
        stepConfig.length - 1
      )
    );
  };

  const handleBack = () => {
    setStep((previousStep) =>
      Math.max(previousStep - 1, 0)
    );
  };

  const handleComplete = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      if (!user?.id) {
        throw new Error(
          'Your session could not be verified. Please sign in again.'
        );
      }

      // Name and DOB are collected on the Create Account form, not here.
      // Photo and gender are optional and never block entering the app.
      const payload = {
        ...memberData,
        display_name:
          memberData.display_name ||
          user?.full_name ||
          '',
        email:
          user.email ||
          memberData.email ||
          '',
        onboarding_completed: true,
        ...getConsentForMember(),
      };

      const {
        date_of_birth,
        eligibility_status,
        eligibility_verified_at,
        dob_change_requested_at,
        id,
        created_date,
        updated_date,
        created_by,
        created_by_id,
        ...profileFields
      } = payload;

      let savedMember = null;

      if (memberData.id) {
        savedMember =
          await updateMemberProfile({
            ...profileFields,
            onboarding_completed: true,
          });
      } else {
        savedMember =
          await createMemberProfile({
            ...profileFields,
            onboarding_completed: true,
          });
      }

      let persistedMember =
        await getOwnMember(
          user.id,
          user.email
        );

      if (
        persistedMember &&
        !persistedMember.onboarding_completed
      ) {
        await updateMemberProfile({
          onboarding_completed: true,
        });

        persistedMember =
          await getOwnMember(
            user.id,
            user.email
          );
      }

      if (
        !persistedMember ||
        !persistedMember.onboarding_completed
      ) {
        throw new Error(
          'Your profile was saved, but onboarding completion could not be confirmed. Please try again.'
        );
      }

      await refreshMember(
        persistedMember || savedMember
      );

      clearStoredConsent();
      clearPendingRegistration();

      navigate('/', { replace: true });
    } catch (error) {
      console.error(
        '[Onboarding] completion failed:',
        error
      );

      const friendlyResult =
        toFriendlyResult(error, {
          screen: 'onboarding',
          action: 'save_profile',
        });

      setSaveError(
        friendlyResult?.message ||
          error?.message ||
          'We could not finish setting up your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

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

        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentStep = stepConfig[step];
  const isCompleteStep =
    currentStep.key === 'complete';

  return (
    <OnboardingShell
      step={step}
      totalSteps={stepConfig.length}
      title={t(
        `onboarding.step.${currentStep.key}.title`
      )}
      subtitle={t(
        `onboarding.step.${currentStep.key}.subtitle`
      )}
      onBack={handleBack}
      hideHeader={isCompleteStep}
    >
      {currentStep.key === 'profile' && (
        <BasicProfileStep
          data={memberData}
          update={update}
          onNext={handleNext}
        />
      )}

      {currentStep.key === 'interests' && (
        <InterestsStep
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
    </OnboardingShell>
  );
}