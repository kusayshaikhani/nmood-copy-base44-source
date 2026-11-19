import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

const ENABLED_KEY = 'nmood_biometric_sign_in';

export function isBiometricSignInEnabled() {
  return Capacitor.isNativePlatform() && localStorage.getItem(ENABLED_KEY) === 'true';
}

export async function getBiometricAvailability() {
  if (!Capacitor.isNativePlatform()) return { isAvailable: false };
  return BiometricAuth.checkBiometry();
}

export async function authenticateExistingSession() {
  const availability = await getBiometricAvailability();
  if (!availability.isAvailable) throw new Error('Biometric authentication is not available on this device.');
  await BiometricAuth.authenticate({
    reason: 'Sign in to Nmood',
    cancelTitle: 'Cancel',
    allowDeviceCredential: false,
    iosFallbackTitle: '',
    androidTitle: 'Sign in to Nmood',
    androidSubtitle: 'Confirm it is you',
    androidConfirmationRequired: false,
  });
  return true;
}

export async function setBiometricSignInEnabled(enabled) {
  if (enabled) {
    await authenticateExistingSession();
    localStorage.setItem(ENABLED_KEY, 'true');
  } else {
    localStorage.removeItem(ENABLED_KEY);
  }
  return enabled;
}
