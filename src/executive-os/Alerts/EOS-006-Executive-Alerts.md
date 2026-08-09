# EXEC-006 — Executive Alerts

**Suite:** Nmood Executive Operating System  
**ID:** EOS-006  
**Status:** Permanent operating system  
**Date:** 2026-07-11  
**Owner:** Nmood Founder  
**Reference:** FO-008 (Crisis Management), FO-004 (AI)

---

## Purpose

Executive Alerts are the alarms that wake the Founder. Every alert has a metric, a threshold, a severity, a window, an owner, and a response. An alert is never silent; an alert is never ignored.

---

## Severity Levels

| Severity | Meaning | Response | Routing |
|---------|---------|----------|---------|
| 🔴 Critical | Member safety, data, or revenue at immediate risk | Founder + lead act now | Push + email + Daily Brief top |
| 🟠 High | Significant risk or degradation; action within hours | Lead acts; Founder informed | Email + Daily Brief |
| 🟡 Medium | Watch; investigate; action within a day | Owner investigates | Daily Brief |
| 🔵 Informational | Notable but not actionable | Logged | Dashboard only |

---

## Alert Definitions

### 1. Server Down / Platform Outage
- **Metric:** SubsystemHealth status
- **Threshold:** Any subsystem status = major_outage
- **Window:** Real-time
- **Severity:** 🔴 Critical
- **Owner:** Engineering lead
- **Response:** Initiate incident response (FO-008); holding statement within 1 hour.

### 2. Spike in Reports
- **Metric:** SafetyReport count
- **Threshold:** > 3× rolling 7-day average in 1 hour
- **Window:** 1 hour
- **Severity:** 🟠 High (🔴 if coordinated abuse)
- **Owner:** Trust & Safety lead
- **Response:** Investigate cause; check for coordinated abuse or a viral harmful experience.

### 3. Premium Failures
- **Metric:** Premium activation failure rate
- **Threshold:** > 5% of premium attempts failing
- **Window:** 24 hours
- **Severity:** 🟠 High
- **Owner:** Engineering / Payments
- **Response:** Verify Stripe webhook, subscription service, and Membership sync.

### 4. Payment Errors
- **Metric:** Payment error rate
- **Threshold:** > 2% of charges erroring
- **Window:** 24 hours
- **Severity:** 🟠 High (🔴 if > 10%)
- **Owner:** Payments
- **Response:** Check Stripe status, webhook secret, and billing platform mapping.

### 5. Crash Rate
- **Metric:** Crash-free sessions
- **Threshold:** < 99.5% (🟠) / < 98% (🔴)
- **Window:** 24 hours
- **Severity:** 🟠 High / 🔴 Critical
- **Owner:** Engineering
- **Response:** Triage top crash; hotfix if P0.

### 6. Low Retention
- **Metric:** W1 retention
- **Threshold:** < 25% (🟠) / < 20% (🔴)
- **Window:** Weekly cohort
- **Severity:** 🟠 High
- **Owner:** Product
- **Response:** Investigate onboarding drop-off, first-experience quality, activation.

### 7. AI Failure
- **Metric:** AI invocation error rate
- **Threshold:** > 5% of invocations erroring
- **Window:** 24 hours
- **Severity:** 🟠 High
- **Owner:** AI / Engineering
- **Response:** Check model availability, prompt integrity, and integration credits.

### 8. AI Safety Block Spike
- **Metric:** AI blocked/flagged rate
- **Threshold:** > 10% of outputs flagged (vs baseline)
- **Window:** 24 hours
- **Severity:** 🟡 Medium (🟠 if prompt injection suspected)
- **Owner:** AI Governance
- **Response:** Review flagged prompts; check for attempted abuse or prompt injection.

### 9. Abuse Detection
- **Metric:** Suspicious account signals
- **Threshold:** > 10 suspicious accounts in 1 hour
- **Window:** 1 hour
- **Severity:** 🟠 High
- **Owner:** Trust & Safety
- **Response:** Review accounts; restrict/ban coordinated bad actors; check bot detection.

### 10. Suspicious Accounts
- **Metric:** SecurityEvent category = suspicious_account
- **Threshold:** Any single high-risk event
- **Window:** Real-time
- **Severity:** 🟠 High (🔴 if privileged account)
- **Owner:** Security
- **Response:** Investigate; force logout if account compromised (PB-007 mechanism).

### 11. Security Alerts
- **Metric:** SecurityEvent risk_level = critical
- **Threshold:** Any critical event
- **Window:** Real-time
- **Severity:** 🔴 Critical
- **Owner:** Founder + Security
- **Response:** Initiate security incident response (FO-008 §7); preserve evidence.

### 12. Revenue Drop
- **Metric:** Revenue WoW
- **Threshold:** > 20% drop WoW
- **Window:** Weekly
- **Severity:** 🟠 High (🔴 if > 40%)
- **Owner:** Founder
- **Response:** Diagnose: churn spike, payment failure, premium feature issue, or seasonality.

### 13. Growth Spike (Anomalous)
- **Metric:** New member signups
- **Threshold:** > 5× rolling average in 1 hour
- **Window:** 1 hour
- **Severity:** 🟡 Medium (🟠 if bot-like)
- **Owner:** Growth / Trust
- **Response:** Verify organic vs bot; if organic, ensure onboarding capacity; if bot, throttle.

### 14. MRR Decline
- **Metric:** MRR MoM
- **Threshold:** MRR down MoM
- **Window:** Monthly
- **Severity:** 🟠 High
- **Owner:** Founder
- **Response:** Diagnose churn vs downgrade vs refund; act on the dominant cause.

### 15. Churn Spike
- **Metric:** Monthly churn
- **Threshold:** > 7% monthly
- **Window:** Monthly
- **Severity:** 🟠 High
- **Owner:** Product / Customer Success
- **Response:** Exit interviews on churned members; identify common cause.

### 16. Refund Spike
- **Metric:** Refund rate
- **Threshold:** > 5% of charges
- **Window:** Weekly
- **Severity:** 🟡 Medium (🟠 if > 10%)
- **Owner:** Customer Success / Payments
- **Response:** Review refund reasons; fix root cause; check for billing error.

### 17. Localization Governance Failure
- **Metric:** Localization governance scan
- **Threshold:** Any error (missing key, fallback)
- **Window:** On scan (CI + scheduled)
- **Severity:** 🟠 High (blocks release)
- **Owner:** Engineering
- **Response:** Fix missing key; do not release until 0 errors.

### 18. Audit Log Gap
- **Metric:** Privileged actions without audit log
- **Threshold:** Any privileged action unlogged
- **Window:** On check
- **Severity:** 🔴 Critical
- **Owner:** Security
- **Response:** Investigate; a privileged action that isn't logged is a security failure.

### 19. Runway Warning
- **Metric:** Cash runway
- **Threshold:** < 12 months (🟠) / < 6 months (🔴)
- **Window:** Monthly
- **Severity:** 🟠 High / 🔴 Critical
- **Owner:** Founder
- **Response:** Fundraising plan or cost reduction; board informed at < 9 months.

### 20. P0 Bug Open Too Long
- **Metric:** Open P0 bug age
- **Threshold:** P0 open > 12 hours
- **Window:** Continuous
- **Severity:** 🔴 Critical
- **Owner:** Engineering
- **Response:** All-stop on the bug; Founder informed; hotfix path.

---

## Routing & Delivery

| Severity | Daily Brief | Mission Control 2.0 | Email | Push |
|---------|-------------|---------------------|-------|------|
| 🔴 Critical | Top of brief | Alert bar (red) | Yes | Yes |
| 🟠 High | Risk section | Alert bar (amber) | Yes | No |
| 🟡 Medium | Risk section | Alert widget | Digest | No |
| 🔵 Info | — | Dashboard | — | — |

Critical alerts bypass the morning cadence — they fire the moment the threshold is crossed, any time of day.

---

## Acknowledgment & Resolution

- Every alert is acknowledged by its owner within the severity SLA.
- Acknowledgment records the owner and a timestamp.
- Resolution records the action taken and closes the alert.
- Unacknowledged critical alerts escalate: if the owner doesn't acknowledge within 15 minutes, the Founder is called directly.

---

## Alert Hygiene

- Thresholds are reviewed quarterly (EOS-005 Quarterly Review) to prevent alert fatigue.
- An alert that fires too often is recalibrated or merged.
- An alert that never fires is checked for correctness — a silent system may be a broken system.
- No alert is disabled without Founder approval and a documented reason.