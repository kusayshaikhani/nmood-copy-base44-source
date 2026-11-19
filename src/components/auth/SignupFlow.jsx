import React from 'react';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import SignupCountryBoundary from '@/components/country-verification/SignupCountryBoundary';

// Main customers declare home country during normal profile onboarding.
// Separate legacy/rehearsal flows retain their original verification contract.
export default function SignupFlow({ children }) {
  return MAIN_PASSPORT ? children : <SignupCountryBoundary>{children}</SignupCountryBoundary>;
}
