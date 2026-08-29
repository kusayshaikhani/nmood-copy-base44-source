import { describe, it, expect } from 'vitest';
import { categorizeNativeSocialAuthError, OAUTH_ERROR_CATEGORIES } from '@/lib/oauth-diagnostics';

describe('categorizeNativeSocialAuthError', () => {
  it('recognizes a genuine Apple cancel (ASAuthorizationError.canceled = 1001)', () => {
    const err = { code: '1001', message: 'The operation couldn’t be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)' };
    expect(categorizeNativeSocialAuthError(err)).toBe(OAUTH_ERROR_CATEGORIES.USER_CANCELLED);
  });

  it('recognizes a genuine Google cancel', () => {
    const err = { message: 'The user canceled the sign-in flow.' };
    expect(categorizeNativeSocialAuthError(err)).toBe(OAUTH_ERROR_CATEGORIES.USER_CANCELLED);
  });

  it('distinguishes a missing client ID (provider configuration error) from a cancel', () => {
    const err = new Error('Google sign-in is not configured for this app yet.');
    expect(categorizeNativeSocialAuthError(err)).toBe(OAUTH_ERROR_CATEGORIES.NOT_CONFIGURED);
  });

  it('categorizes an unrecognized native error as a provider error, never a cancel', () => {
    const err = { code: '0', message: 'No presenting view controller found' };
    const category = categorizeNativeSocialAuthError(err);
    expect(category).not.toBe(OAUTH_ERROR_CATEGORIES.USER_CANCELLED);
    expect(category).toBe(OAUTH_ERROR_CATEGORIES.PROVIDER_ERROR);
  });

  it('never throws and returns UNKNOWN for an empty error', () => {
    expect(categorizeNativeSocialAuthError(null)).toBe(OAUTH_ERROR_CATEGORIES.UNKNOWN);
  });
});
