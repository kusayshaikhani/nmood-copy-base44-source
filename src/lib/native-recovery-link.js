// Native deep-link entry point.
//
// OAuth (Google/Apple) callbacks are handled entirely by
// auth-callback-coordinator.js — this file only wires Capacitor's
// `appUrlOpen`/`getLaunchUrl` delivery into that single coordinator so an
// OAuth grant is consumed exactly once across cold and warm launches.
//
// This file's own logic now only covers legacy link-based password recovery
// (nmood://reset-password / https://app.nmood.app/reset-password) for emails
// sent before the in-app recovery-code flow (ForgotPassword.jsx) shipped.
import { App as NativeApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { restoreSupabaseSessionFromUrl } from '@/api/supabaseClient';
import {
  isAuthCallbackUrl,
  consumeAuthCallback,
  finalizeAuthCallback,
  AUTH_CALLBACK_STAGES,
} from '@/lib/auth-callback-coordinator';

export function parseAppPath(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    if (url.protocol === 'nmood:') {
      // Handles nmood://reset-password?... (hostname = 'reset-password')
      // and nmood:/reset-password?... or nmood:///reset-password?... (hostname = '', pathname = '/reset-password')
      const hostPart = url.hostname ? `/${url.hostname}` : '';
      const pathPart = url.pathname ? (url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`) : '';
      const combined = `${hostPart}${pathPart}`.replace(/\/+/g, '/') || '/';
      return `${combined}${url.search}${url.hash}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function isRecoveryUrl(rawUrl, targetPath) {
  const full = `${rawUrl || ''} ${targetPath || ''}`;
  if (full.includes('/reset-password')) return true;
  if (full.includes('type=recovery')) return true;
  return false;
}

// Legacy link-based recovery only — never called for OAuth callback URLs.
async function openLegacyRecoveryUrl(rawUrl) {
  const target = parseAppPath(rawUrl);
  if (!target) return false;
  if (!isRecoveryUrl(rawUrl, target)) return false;

  const targetPathOnly = target.split('?')[0].split('#')[0];
  let destination = target;
  if (targetPathOnly !== '/reset-password') {
    const searchAndHash = target.slice(targetPathOnly.length);
    destination = `/reset-password${searchAndHash}`;
  }

  // Do NOT throw or fail sign-in here — proceed to /reset-password where
  // ResetPassword.jsx handles an invalid/expired token_hash itself.
  const session = await restoreSupabaseSessionFromUrl(rawUrl).catch(() => null);

  window.history.replaceState({}, '', destination);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new CustomEvent('nmood:auth-callback', {
    detail: { url: rawUrl, isRecovery: true, destination, session },
  }));
  return true;
}

async function closeExternalBrowser() {
  try {
    await Browser.close();
  } catch {
    // The browser may already have closed itself on the deep-link callback.
  }
}

// Legacy recovery-link dedupe (URL-string based — fine here since these
// links are single-use tokens with no cold-launch double-delivery concern
// the way OAuth's appUrlOpen/getLaunchUrl pair has).
const handledRecoveryUrls = new Set();

async function handleIncomingUrl(rawUrl) {
  if (!rawUrl) return;

  if (isAuthCallbackUrl(rawUrl)) {
    const result = await consumeAuthCallback(rawUrl);
    finalizeAuthCallback(result);
    if (result.stage === AUTH_CALLBACK_STAGES.SUCCESS) await closeExternalBrowser();
    return;
  }

  if (handledRecoveryUrls.has(rawUrl)) return;
  handledRecoveryUrls.add(rawUrl);
  if (await openLegacyRecoveryUrl(rawUrl)) await closeExternalBrowser();
}

export async function installNativeRecoveryLinkHandler() {
  if (!Capacitor.isNativePlatform()) return () => {};
  const listener = await NativeApp.addListener('appUrlOpen', ({ url }) => handleIncomingUrl(url));
  const launch = await NativeApp.getLaunchUrl();
  if (launch?.url) await handleIncomingUrl(launch.url);
  return () => listener.remove();
}
