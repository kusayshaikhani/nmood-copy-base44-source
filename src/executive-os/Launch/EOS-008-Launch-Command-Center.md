# EXEC-008 — Launch Command Center

**Suite:** Nmood Executive Operating System  
**ID:** EOS-008  
**Status:** Permanent operating system  
**Date:** 2026-07-11  
**Owner:** Nmood Founder  
**Reference:** FO-008 (Crisis), LRP-J (Beta Go/No-Go)

---

## Purpose

The Launch Command Center is the Founder's playbook for launch day and the hours around it. Every action, owner, and fallback is defined in advance. Launch day is rehearsed, not improvised.

---

## 1. Launch Checklist (T-0 gate)

All items must be ✅ before the Go decision (Section 9).

- [ ] Production domain live; TLS verified; HSTS header set
- [ ] Stripe configured; subscription webhook tested end-to-end
- [ ] App Store + Play listings approved and live
- [ ] Privacy Policy + Terms live at production domain
- [ ] Monitoring + alerts active; Founder receives critical alerts
- [ ] Backup restore tested in staging
- [ ] Localization governance: 0 errors
- [ ] Accessibility: no new violations
- [ ] No open P0; no open P1 without workaround
- [ ] Moderation SOP trained and staffed
- [ ] Support SOP live; tickets routing
- [ ] Press kit published; press release embargoed
- [ ] Ambassadors briefed; first experiences scheduled
- [ ] Referral program live
- [ ] Beta Go/No-Go passed (LRP-J §7)
- [ ] Founder sign-off recorded

---

## 2. Hour-by-Hour Launch Day Plan

All times GST (Asia/Dubai). Adjust for the launch city's local time.

```
T-24h  Final go/no-go review (Founder + leads, 30 min)
T-20h  Press release distributed under embargo
T-12h  Social posts scheduled; ambassadors confirm
T-4h   Engineering on-call confirmed; war room channel open
T-2h   Final smoke test of signup, payment, experience creation
T-1h   Status page set to "launching"; holding statement ready

T+0    GO. Press release lifts. Social posts publish.
       App store links live. Website updates.

T+0:15 Monitor signup rate, error rate, crash rate
T+0:30 First support tickets — ensure SLA holding
T+1:00 Founder checks KPIs; first public metrics snapshot
T+2:00 First experience signups expected; monitor experience flow
T+4:00 First member reports expected; moderation on watch
T+6:00 Mid-day check: any critical alerts? Any P0?
T+8:00 Evening: first experiences may run; monitor attendance
T+12h  Launch-day retrospective prep; collect metrics
T+24h  Launch-day report to Founder (signups, revenue, incidents, sentiment)
```

---

## 3. Rollback Plan

A rollback is a valid, prepared action — not a failure.

**Triggers for rollback:**
- P0 bug in a core flow (signup, payment, experience creation) that cannot be hotfixed within 1 hour.
- Data integrity issue affecting member data.
- Security incident requiring isolation.
- Crash rate > 5% on launch day.

**Rollback steps:**
1. Founder (or Engineering lead with Founder informed) declares rollback.
2. Engineering reverts to the last verified release (DeploymentRecord).
3. Status page updated: "We've rolled back a change to protect members. Investigating."
4. Support uses approved holding statement.
5. Root cause investigated; fix prepared; forward-fix deployed (not a second rollback).
6. Post-incident review within 24 hours (FO-008).

**Rules:**
- Rollback is always possible — no release ships without a verified previous version.
- Rollback is a first-class action, rehearsed in staging before launch.
- Member data is never lost in a rollback (backward-compatible migrations only).

---

## 4. Incident Plan (Launch Day)

Launch day incidents are handled per FO-008, with launch-day specifics:

**Severity escalation is faster on launch day:**
- Any P0 → Critical incident immediately (not just "high").
- Founder is on-call for the full launch window.
- War room channel (Slack/other) is active and monitored.

**Launch-day-specific risks:**
- **Traffic spike overload** — autoscaling confirmed; rate limiting on auth; degradation plan ready.
- **Payment surge** — Stripe capacity confirmed; monitor for webhook lag.
- **Abuse onboarding** — bot detection active; manual review queue staffed for first 24h.
- **App store discovery issues** — if listing not indexed, fallback to direct download links (Android) / TestFlight stopgap.

**Communication:**
- Status page is the single source of truth for members.
- Founder owns the public voice; no speculation; facts only.
- Holding statement: "We're aware some members are experiencing [issue]. We're on it and will update here as soon as we know more."

---

## 5. Press Timeline

```
T-7d   Press list finalized; embargo set for T+0
T-3d   Press kit sent to embargoed journalists
T-1d   Embargo reminder to press list
T+0    Embargo lifts; press release published to wire
T+0:30 Founder available for interviews (booked in advance)
T+1d   Follow-up with journalists who opened the kit
T+3d   First coverage round-up; share internally and on social
T+7d   Launch press retrospective; what landed, what didn't
```

**Spokesperson:** Founder only on launch day (FO-002). No other team member speaks to press without Founder approval.

---

## 6. Social Timeline

```
T-1h   Final post review; all assets in scheduler
T+0    Launch announcement (all channels): "Meet real people, in real life."
T+0:30 Founder personal post (LinkedIn): the why behind Nmood
T+2h   First member moment (if consented and available)
T+4h   Ambassador post: hosting the first Nmood experience
T+8h   "Less screen time. More life." + referral CTA
T+12h  Thank-you post to first members
T+24h  Launch-day recap: the numbers, the stories
```

**Rules (FO-002):** Warm, honest, no hype. No engagement-bait. No urgency tactics.

---

## 7. Customer Support Timeline

```
T-2h   Support channel confirmed; agents staffed for 12h window
T+0    Watch for first tickets; SLA clock starts
T+1h   First response to every ticket within SLA (priority on launch day)
T+4h   Mid-day support review: common questions → FAQ update
T+8h   Evening: reduced staffing; critical queue only
T+12h  Launch-day support report: volume, top issues, CSAT
T+24h  Post-launch support retrospective
```

**Tone:** Empathetic, calm, fast. Every member who finds Nmood on launch day is the community's first impression. Own the problem, fix it, say sorry when sorry is owed (LRP-G).

---

## 8. Founder Checklist (Launch Day)

```
[ ] Final go/no-go confirmed (Section 9)
[ ] War room channel open; all leads present
[ ] Status page live and monitored
[ ] Phone charged, alerts routed to phone
[ ] Press kit and spokespeople ready
[ ] Personal launch post written and scheduled
[ ] First 1:1 with each lead scheduled for T+1h, T+4h, T+12h
[ ] Evening: launch-day report drafted
[ ] Next morning: first Daily Brief reflects launch day (EOS-001)
```

---

## 9. Go / No-Go Decision Tree

```
START: All Launch Checklist items ✅?
├── NO → Do not launch. Resolve blocking item. Re-check.
└── YES → Production smoke test passed?
    ├── NO → Rollback / fix. Do not launch.
    └── YES → Beta Go/No-Go (LRP-J §7) passed?
        ├── NO → Do not launch. Remain in Beta.
        └── YES → Founder sign-off recorded?
            ├── NO → Do not launch. Founder decides.
            └── YES → GO. Execute Launch Day Plan.

POST-LAUNCH (T+1h):
Any critical alert?
├── YES → Initiate Incident Plan (Section 4). Consider Rollback (Section 3).
└── NO → Continue. Monitor at T+2h, T+4h, T+6h, T+12h, T+24h.

POST-LAUNCH (T+24h):
Launch-day report reviewed. Any P0 unresolved?
├── YES → Emergency fix or rollback. Incident review within 24h.
└── NO → Launch successful. Transition to steady-state operations.
```

**Rule:** The Founder makes the Go decision. No one else. The decision is recorded with a timestamp and reasoning.

---

## Post-Launch Transition

At T+24h (or T+7d for a softer launch), Nmood transitions from Launch Command Center to steady-state operations:
- Daily Brief (EOS-001) becomes the morning rhythm.
- Mission Control 2.0 (EOS-003) becomes the command view.
- Executive Alerts (EOS-006) remain the alarm system.
- The Launch Command Center is archived; it reactivates for each new city launch (FO-006 §8).