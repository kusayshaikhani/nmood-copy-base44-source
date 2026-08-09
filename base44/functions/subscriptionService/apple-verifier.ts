// Apple App Store Server Library wrapper — fail-closed JWS verification using
// @apple/app-store-server-library (official). No hand-rolled certificate logic.
// Verifies Server Notifications v2 signedPayload + nested signedTransactionInfo /
// signedRenewalInfo JWS against Apple's Root CA G3 with OCSP online checks.
// Provides App Store Server API client (JWT auth) replacing deprecated verifyReceipt.

import { Buffer } from 'node:buffer';
import {
  SignedDataVerifier,
  VerificationException,
  Environment,
  AppStoreServerAPIClient,
} from 'npm:@apple/app-store-server-library@1.6.0';

const APPLE_ROOT_CA_G3_URL = 'https://www.apple.com/certificateauthority/AppleRootCA-G3.cer';
// SHA-256 fingerprint of Apple Root CA - G3 — pinned to detect MITM on fetch.
// Source: Apple PKI list (support.apple.com/en-us/126047).
const APPLE_ROOT_CA_G3_SHA256 = '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179';

let rootCaDer = null;
let productionVerifier = null;
let sandboxVerifier = null;

async function fetchAppleRootCaG3() {
  if (rootCaDer) return rootCaDer;
  const res = await fetch(APPLE_ROOT_CA_G3_URL);
  if (!res.ok) throw new Error('apple_root_ca_fetch_failed');
  const ab = await res.arrayBuffer();
  const der = Buffer.from(ab);
  const hash = await crypto.subtle.digest('SHA-256', der);
  const fp = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (fp !== APPLE_ROOT_CA_G3_SHA256) throw new Error('apple_root_ca_fingerprint_mismatch');
  rootCaDer = der;
  return der;
}

async function getVerifier(env) {
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID');
  if (!bundleId) throw new Error('apple_bundle_id_missing');
  const der = await fetchAppleRootCaG3();
  if (env === Environment.PRODUCTION) {
    if (!productionVerifier) {
      productionVerifier = new SignedDataVerifier([der], true, Environment.PRODUCTION, bundleId);
    }
    return productionVerifier;
  }
  if (!sandboxVerifier) {
    sandboxVerifier = new SignedDataVerifier([der], true, Environment.SANDBOX, bundleId);
  }
  return sandboxVerifier;
}

// Verify and decode a Server Notification v2 signedPayload.
// Tries production first, then sandbox — BOTH verify the cryptographic signature
// and certificate chain. Never trusts decoded-but-unverified data.
// Returns { decoded, environment } or throws VerificationException (caller fails closed).
export async function verifyNotification(signedPayload) {
  let env = Environment.PRODUCTION;
  let decoded;
  try {
    const v = await getVerifier(Environment.PRODUCTION);
    decoded = await v.verifyAndDecodeNotification(signedPayload);
  } catch (e) {
    if (e instanceof VerificationException) {
      env = Environment.SANDBOX;
      const v = await getVerifier(Environment.SANDBOX);
      decoded = await v.verifyAndDecodeNotification(signedPayload);
    } else {
      throw e;
    }
  }
  return { decoded, environment: env };
}

// Verify and decode a signedTransactionInfo JWS (nested in notifications or API responses).
export async function verifyTransaction(signedTransactionInfo, env) {
  const v = await getVerifier(env || Environment.PRODUCTION);
  return v.verifyAndDecodeTransaction(signedTransactionInfo);
}

// Verify and decode a signedRenewalInfo JWS.
export async function verifyRenewalInfo(signedRenewalInfo, env) {
  const v = await getVerifier(env || Environment.PRODUCTION);
  return v.verifyAndDecodeRenewalInfo(signedRenewalInfo);
}

// Create an App Store Server API client (JWT auth). Returns null if credentials missing.
export function createServerApiClient(env) {
  const signingKey = Deno.env.get('APPLE_PRIVATE_KEY_P8');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const issuerId = Deno.env.get('APPLE_ISSUER_ID');
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID');
  if (!signingKey || !keyId || !issuerId || !bundleId) return null;
  return new AppStoreServerAPIClient(signingKey, keyId, issuerId, bundleId, env || Environment.PRODUCTION);
}

export function hasServerApiCredentials() {
  return !!(
    Deno.env.get('APPLE_PRIVATE_KEY_P8') &&
    Deno.env.get('APPLE_KEY_ID') &&
    Deno.env.get('APPLE_ISSUER_ID')
  );
}

export { Environment, VerificationException };