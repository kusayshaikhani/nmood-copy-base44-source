# LRP Section C — Launch Infrastructure Implementation Guide

**Program:** LRP-001 — Nmood Launch Readiness Program  
**Section:** C — Launch Infrastructure Checklist  
**Status:** Production-ready implementation guides  
**Date:** 2026-07-11  
**Owner:** Nmood Engineering  
**References:** FO-001 §3 (Security), FO-004 (AI), FO-008 (Crisis)

---

## Purpose

This document provides actionable implementation guides for every infrastructure dependency required before Closed Beta. Each item lists what it is, why Nmood needs it, the chosen approach, implementation steps, and the production-readiness gate.

---

## 1. Google Maps Migration

**Current state:** MapLibre + MapTiler is the production map provider (MAP-001). No Google Maps dependency exists.

**Decision:** Retain MapLibre + MapTiler. Google Maps is **not required** for Closed Beta.

**Rationale:** MapTiler provides vector tiles, offline-friendly rendering, lower cost, and no Google account dependency. Migration to Google Maps would add cost and a vendor lock-in with no product benefit at this stage.

**If required later (Release 2.0+):**
1. Create Google Cloud project; enable Maps JavaScript API, Places API, Geocoding API.
2. Restrict API key to app domain + app package names.
3. Store key as `GOOGLE_MAPS_API_KEY` secret.
4. Swap `getMapStyle()` in `maptiler-utils.js` to return a Google-compatible style URL, or wrap `MapLibreView` with a `GoogleMapView` adapter.

**Closed-Beta gate:** ✅ Met — MapTiler key (`MAPTILER_API_KEY`) already configured and in production.

---

## 2. Firebase / APNs Push Notifications

**Purpose:** Deliver push notifications (new messages, experience reminders, circle activity) to iOS and Android.

**Approach:** Firebase Cloud Messaging (FCM) as the unified transport; APNs bridge for iOS.

**Implementation steps:**
1. Create a Firebase project; add iOS app (bundle id from `ANDROID_PACKAGE_NAME` equivalent) and Android app.
2. Upload APNs auth key (.p8) to Firebase → Project Settings → Cloud Messaging.
3. Install `firebase-admin` in a backend function `pushService` (new function, modeled on `notificationCleanup`).
4. On notification creation, look up the member's device tokens (store a `DeviceToken` entity: `user_id`, `token`, `platform`, `created_date`).
5. Send via `firebase-admin` `messaging.sendMulticast`; handle invalid-token cleanup.
6. Client registers token on login via a `registerDeviceToken` backend call; deregisters on logout.

**Production secrets:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (set via Base44 secrets).

**Closed-Beta gate:** ⚠️ Deferred to Release 1.1. In-app notifications (NotificationReadState entity, cross-tab BroadcastChannel, cross-device cloud sync) are live and sufficient for Closed Beta. Push is an enhancement, not a blocker.

---

## 3. Analytics

**Purpose:** Understand funnel, retention, and the North Star Metric (MRWC).

**Approach:** Base44 built-in analytics (`base44.analytics.track`) for product events; optional Amplitude/Mixpanel for richer analysis at scale.

**Events to track (minimum viable set):**
- `onboarding_completed`
- `experience_viewed`, `experience_joined`, `experience_completed`
- `circle_created`, `circle_joined`
- `message_sent`
- `membership_upgraded`
- `concierge_opened`, `concierge_recommendation_used`
- `referral_sent`, `referral_converted`

**Implementation:**
1. Wrap `base44.analytics.track` in a `trackEvent(name, props)` helper in `src/lib/product-analytics.js` (already exists).
2. Call at the action site, not the component mount — track outcomes, not views.
3. No PII in properties. Member ids only.

**Closed-Beta gate:** ✅ Met — `product-analytics.js` exists; wire remaining track calls per the event list above during Beta.

---

## 4. Crash Reporting

**Purpose:** Detect, triage, and fix runtime crashes before they affect many members.

**Approach:** Base44 global error handler (`installGlobalErrorHandler`, `error-reporter.js`) captures client errors into the `ErrorLog` entity. For native crash reporting at scale, integrate Sentry.

**Implementation (Sentry, if added):**
1. Create Sentry project; get DSN.
2. Store as `SENTRY_DSN` secret.
3. Install `@sentry/react`; initialize in `main.jsx` before `App`.
4. Route through `captureError` in `error-reporter.js` so a single path governs reporting.
5. Set release tag to the build version for triage.

**Closed-Beta gate:** ✅ Met for web — global error handler + ErrorLog entity live. Sentry optional for native; add before public launch.

---

## 5. Email

**Purpose:** Transactional email — verification, password reset, membership receipts, announcements.

**Approach:** Base44 `Core.SendEmail` integration (live). For higher volume / templating, Resend or Postmark.

**Implementation (Resend, if added):**
1. Create Resend account; verify sending domain.
2. Store `RESEND_API_KEY` secret.
3. Create a `emailService` backend function wrapping Resend's REST API with approved templates.
4. All templates reviewed against FO-002 (Brand Bible) and localized (FO-001 §4).

**Closed-Beta gate:** ✅ Met — `Core.SendEmail` handles verification, reset, and transactional mail. Upgrade to Resend when volume justifies.

---

## 6. Production Domains

**Purpose:** Serve the web app and API from branded, HTTPS domains.

**Implementation:**
1. Register `nmood.com` (and regional/defensive variants).
2. Point DNS A/AAAA records at the Base44 hosting endpoints.
3. Configure the custom domain in Base44 app settings.
4. Set up apex + `www` + `app` (or `m`) subdomains as needed.
5. Add canonical URL and Open Graph tags in `index.html`.

**Closed-Beta gate:** ⚠️ Configure before Beta invites send. Domain registration and DNS must propagate before launch email goes out.

---

## 7. CDN

**Purpose:** Fast, cached delivery of static assets, images, and the app bundle.

**Approach:** Base44 hosting includes CDN at the edge. For large media (member photos, experience covers), use the Base44 file storage URLs, which are already CDN-fronted.

**Implementation:**
1. Verify Base44 CDN is active for the production domain.
2. Ensure `SmartImage` component (exists) is used for all imagery to lazy-load and cache.
3. Set long `Cache-Control` for hashed assets (build output), short for `index.html`.

**Closed-Beta gate:** ✅ Met via Base44 edge CDN.

---

## 8. SSL / TLS

**Purpose:** Encrypt all traffic; required for App Store / Play approval and member trust.

**Implementation:**
1. Base44 provisions and auto-renews TLS certificates for custom domains.
2. Enforce HTTPS via HSTS header in `index.html` (already has CSP; add `Strict-Transport-Security`).
3. Verify SSL Labs grade A or higher before launch.

**Closed-Beta gate:** ✅ Met via Base44 managed TLS. Add HSTS header before public launch.

---

## 9. Production Secrets

**Current secrets:** `MAPTILER_API_KEY`, `APP_ENV`, `ANDROID_PACKAGE_NAME`, `SUBSCRIPTION_WEBHOOK_SECRET`.

**Secrets to add before launch:**
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (push)
- `SENTRY_DSN` (crash reporting)
- `RESEND_API_KEY` (email, if upgraded)
- `STRIPE_SECRET_KEY` (payments — Stripe; region AE supports Stripe)
- `STRIPE_WEBHOOK_SECRET` (subscription webhooks)

**Rules (FO-001 §10):**
- Secrets are never committed to source.
- Secrets are never logged.
- Secrets are rotated annually or on staff turnover.
- Each secret has a named owner.

**Closed-Beta gate:** ⚠️ Add Stripe keys before opening paid Premium; push keys before enabling push. Other keys can follow.

---

## 10. Monitoring

**Purpose:** Know before members do when something is wrong.

**Approach:** Base44 `SubsystemHealth`, `ObservabilityAlert`, `PerformanceMetric`, `ErrorLog` entities + the Mission Control System Health dashboard.

**Implementation:**
1. Confirm `monitoringOps` backend function reports subsystem health on schedule.
2. Configure alert rules in the `AlertRule` entity for: error spike, latency, signup drop, payment failure.
3. Wire alerts to email (and Slack when a connector is authorized).
4. Founder reviews System Health in Weekly Review (FO-005).

**Closed-Beta gate:** ✅ Met — observability entities and Mission Control dashboard live.

---

## 11. Backups

**Purpose:** Recover from data loss without losing member trust.

**Implementation:**
1. Base44 manages database backups.
2. Define Recovery Point Objective (RPO ≤ 24h) and Recovery Time Objective (RTO ≤ 4h) for Beta.
3. Document the restore procedure in FO-008 (Disaster Recovery).
4. Test a restore in staging before Beta.

**Closed-Beta gate:** ✅ Met — Base44-managed backups. Document and test restore procedure pre-Beta.

---

## 12. Logging

**Purpose:** Debug, audit, and investigate incidents without exposing member data.

**Approach:** Structured logging via `logger.js`; audit logs via `AuditLog`; security events via `SecurityEvent`; AI audit via `AiAuditRecord`.

**Rules:**
- No PII in logs.
- Logs are retained per the data retention policy.
- Audit logs are immutable.
- Production log level is `warn` and above; `info` only for key lifecycle events.

**Closed-Beta gate:** ✅ Met — logger, audit, security, and AI audit pipelines live.

---

## Infrastructure Readiness Summary

| Item | Closed-Beta Status |
|------|-------------------|
| Google Maps | ✅ Not required (MapTiler) |
| Push (FCM/APNs) | ⚠️ Release 1.1 |
| Analytics | ✅ Met |
| Crash Reporting | ✅ Met (Sentry optional) |
| Email | ✅ Met |
| Domains | ⚠️ Configure pre-Beta |
| CDN | ✅ Met |
| SSL | ✅ Met (add HSTS) |
| Secrets | ⚠️ Add Stripe + push keys |
| Monitoring | ✅ Met |
| Backups | ✅ Met (test restore) |
| Logging | ✅ Met |

**Verdict:** Infrastructure is Beta-ready. Three configuration tasks (domain, Stripe keys, HSTS header) must complete before Beta invites send. Push notifications and Sentry are deferred to Release 1.1.