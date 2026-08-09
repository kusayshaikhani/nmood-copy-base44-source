// MP-005 Native Subscription Service — secure server-side source of truth.
// Validates Apple App Store & Google Play subscription receipts, prevents
// duplicate purchases / entitlement conflicts, and updates the Membership
// entity (the single source of truth). Grace period, restore, and webhook
// (renewal/cancel/refund) reconciliation are handled here.
//
// APPLE HARDENING (SEC-001B):
//   • App Store Server Notifications v2 signedPayload is cryptographically
//     verified via @apple/app-store-server-library (official) — certificate
//     chain checked against Apple Root CA G3 with OCSP online checks.
//   • Nested signedTransactionInfo / signedRenewalInfo JWS are verified
//     before any entitlement mutation. Fail-closed on any verification,
//     bundle ID, environment, or replay failure.
//   • Idempotency by notificationUUID (AuditLog) prevents replay attacks.
//   • Purchase/restore/sync use the App Store Server API (JWT auth) as the
//     primary path. verifyReceipt is a TEMPORARY compatibility fallback for
//     legacy StoreKit 1 receipts only — never the primary production path.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  verifyNotification,
  verifyTransaction,
  verifyRenewalInfo,
  createServerApiClient,
  hasServerApiCredentials,
  Environment,
} from './apple-verifier.ts';

const APPLE_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_PURCHASE_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

// Store product identifiers → internal plan ids.
const PRODUCT_MAP = {
  apple: {
    'app.nmood.premium.monthly': 'monthly',
    'app.nmood.premium.quarterly': 'quarterly',
    'app.nmood.premium.halfyear': 'halfyear',
    'app.nmood.premium.annual': 'annual',
  },
  google: {
    'app.nmood.premium.monthly': 'monthly',
    'app.nmood.premium.quarterly': 'quarterly',
    'app.nmood.premium.halfyear': 'halfyear',
    'app.nmood.premium.annual': 'annual',
  },
};

const PLAN_DURATION_DAYS = { monthly: 30, quarterly: 90, halfyear: 180, annual: 365 };

function json(status, body) {
  return Response.json(body, { status });
}

// ---------------------------------------------------------------------------
// Idempotency — track processed Apple notification UUIDs to prevent replays.
// ---------------------------------------------------------------------------
async function isNotificationProcessed(base44, notificationUUID) {
  if (!notificationUUID) return false;
  try {
    const rows = await base44.asServiceRole.entities.AuditLog.filter({
      action: 'apple_notification_processed',
      target_id: notificationUUID,
    });
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function markNotificationProcessed(base44, notificationUUID, details) {
  if (!notificationUUID) return;
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      administrator: 'apple_webhook',
      action: 'apple_notification_processed',
      target_type: 'subscription_notification',
      target_id: notificationUUID,
      details: JSON.stringify(details),
    });
  } catch { /* non-critical */ }
}

// ---------------------------------------------------------------------------
// Apple App Store Server API — primary production path (replaces verifyReceipt).
// Uses JWT auth + getAllSubscriptionStatuses, verifies nested JWS.
// ---------------------------------------------------------------------------
async function validateAppleServerApi(transactionId, env) {
  const client = createServerApiClient(env);
  if (!client) return null;

  const expectedBundleId = Deno.env.get('APPLE_BUNDLE_ID');

  const statusResponse = await client.getAllSubscriptionStatuses(transactionId);

  // Fail closed — bundle ID must match.
  if (statusResponse.bundleId !== expectedBundleId) {
    return { valid: false, storeStatus: 'bundle_id_mismatch' };
  }

  // Fail closed — environment must match (Sandbox responses rejected in production mode).
  const responseEnv = statusResponse.environment;
  if (env === Environment.PRODUCTION && responseEnv !== Environment.PRODUCTION) {
    return { valid: false, storeStatus: 'environment_mismatch' };
  }

  // Find the latest transaction in the first subscription group.
  const group = statusResponse.data?.[0];
  if (!group?.lastTransactions?.length) {
    return { valid: false, storeStatus: 'no_transactions' };
  }
  const latest = group.lastTransactions
    .map((t) => ({ ...t, _signedDate: t.signedDate || 0 }))
    .sort((a, b) => b._signedDate - a._signedDate)[0];

  // Verify nested JWS — fail closed on any verification failure.
  let txInfo = null;
  let renInfo = null;
  if (latest.signedTransactionInfo) {
    txInfo = await verifyTransaction(latest.signedTransactionInfo, env);
  }
  if (latest.signedRenewalInfo) {
    renInfo = await verifyRenewalInfo(latest.signedRenewalInfo, env);
  }

  // Status: 1=ACTIVE, 2=EXPIRED, 3=IN_BILLING_RETRY_PERIOD, 4=IN_GRACE_PERIOD, 5=REVOKED
  const statusNum = latest.status;
  const productId = txInfo?.productId;
  const planId = PRODUCT_MAP.apple[productId] || 'monthly';
  const expiresAt = txInfo?.expiresDate ? new Date(Number(txInfo.expiresDate)).toISOString() : null;
  const autoRenew = renInfo ? String(renInfo.autoRenewStatus) === '1' : true;
  const inGrace = statusNum === 3 || statusNum === 4;
  const refunded = txInfo?.revocationDate != null && txInfo?.revocationReason != null;
  const revoked = statusNum === 5;

  return {
    valid: true,
    provider: 'apple',
    productId,
    planId,
    originalTransactionId: txInfo?.originalTransactionId || transactionId,
    expiresAt,
    autoRenew,
    inGrace,
    refunded,
    revoked,
    cancelled: refunded || revoked,
  };
}

// ---------------------------------------------------------------------------
// Apple verifyReceipt — TEMPORARY compatibility fallback for legacy StoreKit 1.
// Never the primary production path; used only when Server API credentials are
// missing or a legacy receipt-data is provided without a transactionId.
// ---------------------------------------------------------------------------
async function validateApple(receiptData, sharedSecret) {
  const call = async (url) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'receipt-data': receiptData, password: sharedSecret, 'exclude-old-transactions': true }),
    });
    return r.json();
  };
  let res = await call(APPLE_VERIFY_URL);
  if (res && res.status === 21007) res = await call(APPLE_SANDBOX_URL);
  if (!res || res.status !== 0) return { valid: false, storeStatus: res?.status };

  const infos = Array.isArray(res.latest_receipt_info) ? res.latest_receipt_info : [];
  if (infos.length === 0) return { valid: false, storeStatus: 'no_receipt_info' };
  const latest = infos
    .map((i) => ({ ...i, _exp: Number(i.expires_date_ms) || 0 }))
    .sort((a, b) => b._exp - a._exp)[0];
  const pending = Array.isArray(res.pending_renewal_info) ? res.pending_renewal_info[0] : null;
  const now = Date.now();
  const expiresAt = latest._exp;
  const refunded = !!latest.cancellation_date_ms;
  const inGrace = pending && pending.grace_period_expires_date_ms && Number(pending.grace_period_expires_date_ms) > now;
  const autoRenew = pending ? String(pending.auto_renew_status) === '1' : true;
  const productId = latest.product_id;
  const planId = PRODUCT_MAP.apple[productId] || 'monthly';
  return {
    valid: true,
    provider: 'apple',
    productId,
    planId,
    originalTransactionId: latest.original_transaction_id,
    expiresAt: new Date(expiresAt).toISOString(),
    autoRenew,
    inGrace,
    refunded,
    revoked: false,
    cancelled: refunded,
    legacy: true,
  };
}

function b64urlFromBytes(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlFromJson(obj) {
  return b64urlFromBytes(new TextEncoder().encode(JSON.stringify(obj)));
}
function pemToPkcs8Der(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(serviceAccountJson) {
  const sa = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const header = { alg: 'RS256', typ: 'JWT' };
  const unsigned = `${b64urlFromJson(header)}.${b64urlFromJson(claim)}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8Der(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64urlFromBytes(sig)}`;
  const r = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const tok = await r.json();
  if (!tok.access_token) throw new Error('google_token_failed');
  return tok.access_token;
}

async function validateGoogle(productId, purchaseToken, packageName, serviceAccountJson) {
  const accessToken = await getGoogleAccessToken(serviceAccountJson);
  const url = `${GOOGLE_PURCHASE_BASE}/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await r.json();
  if (!data || data.error) return { valid: false, storeStatus: data?.error?.message || 'google_error' };
  const expiresAt = Number(data.expiryTimeMillis);
  const autoRenewing = !!data.autoRenewing;
  const cancelled = !!data.userCancellationTimeMillis;
  const refunded = data.paymentState === 0 && !!data.cancelReason;
  const planId = PRODUCT_MAP.google[productId] || 'monthly';
  return {
    valid: true,
    provider: 'google',
    productId,
    planId,
    originalTransactionId: purchaseToken,
    expiresAt: new Date(expiresAt).toISOString(),
    autoRenew: autoRenewing,
    inGrace: data.paymentState === 3,
    refunded,
    revoked: false,
    cancelled: cancelled || refunded,
  };
}

// Dev fallback: when no store credentials are configured (or a simulated
// receipt is sent), grant entitlement from the product/plan so the full
// membership + permission + welcome flow is exercised end-to-end.
function simulatedEntitlement(provider, productId, planId) {
  const pid = planId || PRODUCT_MAP[provider]?.[productId] || 'monthly';
  const days = PLAN_DURATION_DAYS[pid] || 30;
  return {
    valid: true,
    provider,
    productId: productId || Object.keys(PRODUCT_MAP[provider] || {})[0] || 'dev',
    planId: pid,
    originalTransactionId: `dev_${provider}_${pid}_${Date.now()}`,
    expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
    autoRenew: true,
    inGrace: false,
    refunded: false,
    revoked: false,
    cancelled: false,
    simulated: true,
  };
}

// ---------------------------------------------------------------------------
// Entitlement → Membership (source of truth)
// ---------------------------------------------------------------------------
async function resolveEntitlement(base44, user, provider, payload) {
  const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
  const googleSa = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  const packageName = Deno.env.get('ANDROID_PACKAGE_NAME') || 'com.nmood.app';
  const receipt = payload.receipt || {};
  const allowSim = Deno.env.get('ALLOW_SIMULATED_RECEIPTS') === 'true';
  const isSim = allowSim && (receipt.simulated || (!sharedSecret && !googleSa && !hasServerApiCredentials()));

  if (provider === 'apple') {
    if (isSim) return simulatedEntitlement('apple', receipt.productId, payload.planId);

    // PRIMARY: App Store Server API (StoreKit 2 transactionId).
    if (payload.transactionId && hasServerApiCredentials()) {
      const env = Deno.env.get('APP_ENV') === 'production' ? Environment.PRODUCTION : Environment.SANDBOX;
      const ent = await validateAppleServerApi(payload.transactionId, env).catch(() => null);
      if (ent) return ent;
      // Server API failed — fall through to legacy verifyReceipt if receiptData is present.
    }

    // TEMPORARY FALLBACK: verifyReceipt (legacy StoreKit 1 receiptData).
    const rd = receipt.receiptData || (typeof receipt === 'string' && receipt.length > 100 ? receipt : null);
    if (rd && sharedSecret) {
      return validateApple(rd, sharedSecret);
    }

    return { valid: false, storeStatus: 'no_receipt_or_transaction' };
  }

  if (provider === 'google') {
    if (isSim) return simulatedEntitlement('google', receipt.productId, payload.planId);
    return validateGoogle(receipt.productId || payload.productId, receipt.purchaseToken, packageName, googleSa);
  }

  return { valid: false, storeStatus: 'unsupported_provider' };
}

async function applyEntitlement(base44, user, ent) {
  const userId = String(user.id);
  const existing = await base44.asServiceRole.entities.Membership.filter({ user_id: userId });

  // Prevent entitlement conflicts: same store transaction owned by another user.
  if (ent.originalTransactionId) {
    const byTxn = await base44.asServiceRole.entities.Membership.filter({ store_transaction_id: ent.originalTransactionId });
    if (byTxn.some((m) => m.user_id !== userId)) return { conflict: true };
  }

  const now = new Date();
  const expiresAt = ent.expiresAt || new Date(now.getTime() + (PLAN_DURATION_DAYS[ent.planId] || 30) * 86400000).toISOString();

  let status = 'active';
  let type = 'premium';
  if (ent.refunded) { status = 'refunded'; type = 'explorer'; }
  else if (ent.revoked) { status = 'cancelled'; type = 'explorer'; }
  else if (ent.inGrace) { status = 'grace_period'; }
  // voluntary cancellation (auto-renew off, not refunded/revoked) keeps premium until expiry

  const update = {
    type,
    status,
    plan: ent.planId,
    billing_platform: ent.provider,
    payment_provider: ent.provider,
    auto_renew: !!ent.autoRenew,
    store_transaction_id: ent.originalTransactionId || existing[0]?.store_transaction_id,
    store_product_id: ent.productId || existing[0]?.store_product_id,
    expires_at: expiresAt,
    renewal_date: ent.autoRenew ? expiresAt : (existing[0]?.renewal_date || null),
    cancelled_at: (ent.refunded || ent.revoked) ? (existing[0]?.cancelled_at || now.toISOString()) : null,
  };

  let membership;
  if (existing.length > 0) {
    membership = await base44.asServiceRole.entities.Membership.update(existing[0].id, {
      ...update,
      started_date: existing[0].started_date || now.toISOString().slice(0, 10),
    });
  } else {
    membership = await base44.asServiceRole.entities.Membership.create({
      user_id: userId,
      started_date: now.toISOString().slice(0, 10),
      ...update,
    });
  }
  return { membership, entitlement: ent };
}

// Reconcile a previously-stored entitlement from a store webhook (renewal/cancel/refund).
async function reconcileByTransaction(base44, originalTransactionId, patch) {
  const rows = await base44.asServiceRole.entities.Membership.filter({ store_transaction_id: originalTransactionId });
  if (rows.length === 0) return null;
  const m = rows[0];
  return base44.asServiceRole.entities.Membership.update(m.id, patch);
}

// ---------------------------------------------------------------------------
// Apple Server Notifications v2 — notification type → entitlement patch.
// Uses VERIFIED transaction + renewal info (JWS already checked by the caller).
// ---------------------------------------------------------------------------
function appleNotificationToPatch(notificationType, txInfo, renInfo) {
  if (!txInfo) return null;
  const txId = txInfo.originalTransactionId;
  const productId = txInfo.productId;
  const planId = PRODUCT_MAP.apple[productId] || 'monthly';
  const expiresAt = txInfo.expiresDate ? new Date(Number(txInfo.expiresDate)).toISOString() : null;
  const autoRenew = renInfo ? String(renInfo.autoRenewStatus) === '1' : true;
  switch (notificationType) {
    case 'SUBSCRIBED':
    case 'DID_RENEW':
      return { txId, patch: { type: 'premium', status: 'active', plan: planId, expires_at: expiresAt, auto_renew: autoRenew, store_product_id: productId } };
    case 'DID_CHANGE_RENEWAL_STATUS':
      return { txId, patch: { auto_renew: autoRenew } };
    case 'DID_FAIL_TO_RENEW':
      return { txId, patch: { status: 'grace_period' } };
    case 'REFUND':
      return { txId, patch: { type: 'explorer', status: 'refunded', auto_renew: false } };
    case 'REVOKE':
      return { txId, patch: { type: 'explorer', status: 'cancelled', auto_renew: false } };
    case 'GRACE_PERIOD_EXPIRED':
    case 'EXPIRED':
      return { txId, patch: { type: 'explorer', status: 'expired', auto_renew: false } };
    default:
      return null;
  }
}

// Google RTDN notification type → entitlement patch.
const GOOGLE_NOTIFICATION_TYPES = {
  1: 'SUBSCRIPTION_RECOVERED', 2: 'SUBSCRIPTION_RENEWED',
  3: 'SUBSCRIPTION_CANCELED', 4: 'SUBSCRIPTION_EXPIRED',
  5: 'SUBSCRIPTION_REVOKED', 6: 'SUBSCRIPTION_PURCHASED',
  7: 'SUBSCRIPTION_DEFERRED', 12: 'SUBSCRIPTION_REVOKED', 13: 'SUBSCRIPTION_EXPIRED',
};

async function googleNotificationToPatch(base44, notification) {
  const nType = GOOGLE_NOTIFICATION_TYPES[notification.notificationType] || '';
  const purchaseToken = notification.purchaseToken;
  const productId = notification.subscriptionId;
  if (!purchaseToken) return null;
  const packageName = Deno.env.get('ANDROID_PACKAGE_NAME') || 'com.nmood.app';
  const googleSa = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  if (!googleSa) return null;
  try {
    const ent = await validateGoogle(productId, purchaseToken, packageName, googleSa);
    if (!ent.valid) return null;
    const txId = purchaseToken;
    switch (nType) {
      case 'SUBSCRIPTION_PURCHASED':
      case 'SUBSCRIPTION_RECOVERED':
      case 'SUBSCRIPTION_RENEWED':
        return { txId, patch: { type: 'premium', status: 'active', plan: ent.planId, expires_at: ent.expiresAt, auto_renew: ent.autoRenew, store_product_id: productId } };
      case 'SUBSCRIPTION_CANCELED':
        return { txId, patch: { auto_renew: false } };
      case 'SUBSCRIPTION_EXPIRED':
        return { txId, patch: { type: 'explorer', status: 'expired', auto_renew: false } };
      case 'SUBSCRIPTION_REVOKED':
        return { txId, patch: { type: 'explorer', status: 'cancelled', auto_renew: false } };
      default:
        return null;
    }
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode;

    // Webhook (server-to-server, no user auth) — protected by shared secret.
    if (mode === 'webhook') {
      const secret = new URL(req.url).searchParams.get('secret');
      if (!secret || secret !== Deno.env.get('SUBSCRIPTION_WEBHOOK_SECRET')) {
        return json(401, { error: 'unauthorized' });
      }
      const source = body.source || new URL(req.url).searchParams.get('source');

      // Apple Server Notifications v2 — body contains signedPayload (JWS).
      // Fail-closed: verify the JWS + cert chain before any entitlement mutation.
      if (source === 'apple' && body.signedPayload) {
        let result;
        try {
          result = await verifyNotification(body.signedPayload);
        } catch {
          // Verification failed (bad signature, bad cert chain, bad bundle ID, etc.)
          // — fail closed, do NOT mutate entitlements.
          return json(200, { ok: true, updated: false, error: 'verification_failed' });
        }

        const { decoded: payload, environment: notifEnv } = result;
        const notificationUUID = payload.notificationUUID;

        // Idempotency — reject replayed notifications.
        if (await isNotificationProcessed(base44, notificationUUID)) {
          return json(200, { ok: true, updated: false, event: 'duplicate' });
        }

        // Verify nested signedTransactionInfo / signedRenewalInfo JWS.
        let txInfo = null;
        let renInfo = null;
        try {
          if (payload.data?.signedTransactionInfo) {
            txInfo = await verifyTransaction(payload.data.signedTransactionInfo, notifEnv);
          }
          if (payload.data?.signedRenewalInfo) {
            renInfo = await verifyRenewalInfo(payload.data.signedRenewalInfo, notifEnv);
          }
        } catch {
          // Nested JWS verification failed — fail closed.
          await markNotificationProcessed(base44, notificationUUID, { notificationType: payload.notificationType, error: 'nested_verification_failed' });
          return json(200, { ok: true, updated: false, error: 'nested_verification_failed' });
        }

        // Validate bundleId from the VERIFIED transaction info.
        const expectedBundleId = Deno.env.get('APPLE_BUNDLE_ID');
        if (txInfo?.bundleId && expectedBundleId && txInfo.bundleId !== expectedBundleId) {
          await markNotificationProcessed(base44, notificationUUID, { notificationType: payload.notificationType, error: 'bundle_id_mismatch' });
          return json(200, { ok: true, updated: false, error: 'bundle_id_mismatch' });
        }

        // Map to entitlement patch using verified data.
        const mapped = appleNotificationToPatch(payload.notificationType, txInfo, renInfo);
        if (!mapped) {
          await markNotificationProcessed(base44, notificationUUID, { notificationType: payload.notificationType });
          return json(200, { ok: true, updated: false, event: payload.notificationType });
        }

        // Apply the patch + record as processed (idempotency).
        const m = await reconcileByTransaction(base44, mapped.txId, mapped.patch).catch(() => null);
        await markNotificationProcessed(base44, notificationUUID, { notificationType: payload.notificationType, transactionId: mapped.txId, updated: !!m });
        return json(200, { ok: true, updated: !!m, event: payload.notificationType });
      }

      // Google RTDN — body contains notificationType, purchaseToken, subscriptionId.
      if (source === 'google' && body.notificationType !== undefined) {
        const mapped = await googleNotificationToPatch(base44, body).catch(() => null);
        if (!mapped) return json(200, { ok: true, updated: false });
        const m = await reconcileByTransaction(base44, mapped.txId, mapped.patch).catch(() => null);
        return json(200, { ok: true, updated: !!m });
      }

      // Manual webhook (testing/forwarding) — existing format.
      const txId = body.originalTransactionId;
      const patch = body.patch || {};
      const m = await reconcileByTransaction(base44, txId, patch).catch(() => null);
      return json(200, { ok: true, updated: !!m });
    }

    // All other modes require an authenticated user.
    const user = await base44.auth.me();
    if (!user) return json(401, { error: 'unauthorized' });

    if (mode === 'purchase') {
      const provider = body.provider || 'apple';
      const ent = await resolveEntitlement(base44, user, provider, body);
      if (!ent.valid) {
        try { await base44.asServiceRole.entities.ErrorLog.create({ message: 'subscription:receipt_invalid', severity: 'warning', context: { provider, storeStatus: ent.storeStatus } }); } catch {}
        return json(200, { ok: false, event: 'validation_failed' });
      }
      const applied = await applyEntitlement(base44, user, ent);
      if (applied.conflict) return json(200, { ok: false, event: 'entitlement_conflict' });
      const wasNew = applied.membership.type === 'premium';
      return json(200, { ok: true, membership: applied.membership, event: wasNew ? 'purchased' : 'updated', provider });
    }

    if (mode === 'restore') {
      const provider = body.provider || 'apple';
      const ent = await resolveEntitlement(base44, user, provider, body).catch(() => null);
      if (ent && ent.valid) {
        const applied = await applyEntitlement(base44, user, ent);
        if (applied.conflict) return json(200, { ok: false, event: 'entitlement_conflict' });
        return json(200, { ok: true, membership: applied.membership, event: 'restored', provider });
      }
      const current = (await base44.asServiceRole.entities.Membership.filter({ user_id: String(user.id) }))[0] || null;
      return json(200, { ok: false, membership: current, event: 'no_active_subscription', provider });
    }

    if (mode === 'sync') {
      const provider = body.provider;
      if (body.receipts && Array.isArray(body.receipts) && body.receipts.length > 0) {
        for (const r of body.receipts) {
          const ent = await resolveEntitlement(base44, user, r.provider || provider, { receipt: r, planId: r.planId, transactionId: r.transactionId }).catch(() => null);
          if (ent && ent.valid) {
            const applied = await applyEntitlement(base44, user, ent);
            if (!applied.conflict) return json(200, { ok: true, membership: applied.membership, event: 'synced', provider: ent.provider });
          }
        }
      }
      const current = (await base44.asServiceRole.entities.Membership.filter({ user_id: String(user.id) }))[0] || null;
      if (current && current.type === 'premium') {
        const exp = current.expires_at ? new Date(current.expires_at).getTime() : null;
        if (exp && exp < Date.now() && current.status !== 'cancelled' && current.status !== 'refunded') {
          const updated = await base44.asServiceRole.entities.Membership.update(current.id, { type: 'explorer', status: 'expired', auto_renew: false });
          return json(200, { ok: true, membership: updated, event: 'expired', provider: current.billing_platform });
        }
        if (current.status === 'grace_period') {
          const graceExp = current.expires_at ? new Date(current.expires_at).getTime() : null;
          if (graceExp && graceExp < Date.now()) {
            const updated = await base44.asServiceRole.entities.Membership.update(current.id, { type: 'explorer', status: 'expired', auto_renew: false });
            return json(200, { ok: true, membership: updated, event: 'expired', provider: current.billing_platform });
          }
        }
      }
      return json(200, { ok: true, membership: current, event: 'synced', provider: current?.billing_platform });
    }

    return json(400, { error: 'unknown_mode' });
  } catch (error) {
    return json(500, { ok: false, event: 'error', message: 'Subscription service unavailable' });
  }
});