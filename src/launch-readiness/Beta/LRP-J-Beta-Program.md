# LRP Section J — Beta Program

**Program:** LRP-001 — Nmood Launch Readiness Program  
**Section:** J — Beta Program  
**Status:** Production-ready beta program and go/no-go gates  
**Date:** 2026-07-11  
**Owner:** Nmood Founder  
**References:** FO-001 §13 (Decision Framework), FO-003, FO-008

---

> Closed Beta exists to prove the mission, not to inflate numbers. We are testing whether Nmood helps real people build real relationships — and whether we can do it safely.

---

## 1. Beta Recruitment

**Cohort size:** 100–300 testers.

**Profile:**
- Locally present in the launch city.
- Genuinely interested in real-world connection (not app reviewers).
- Diverse across age, background, language, and interest.
- Willing to give structured feedback weekly.

**Recruitment channels:**
- Founder network and ambassadors (FO-006 §5).
- University and local community partners.
- Waitlist with values-fit screening.

**Consent:** Each tester signs a Beta agreement: data is real, feedback is honest, deletion honored at end. Beta accounts are clearly marked.

---

## 2. Testing Plan

**Duration:** 4 weeks.

**Focus areas (by week):**
1. **Onboarding & profile** — signup, verification, interests, first recommendations.
2. **Experiences** — create, join, attend, chat, rate.
3. **Circles** — create, join, chat, manage.
4. **Trust & safety** — reporting, blocking, support, AI concierge.

**Test types:**
- **Functional** — does the flow complete?
- **Trust** — does the member feel safe and respected?
- **AI** — are recommendations useful and explainable?
- **Localization** — does it work in the tester's language (incl. Arabic RTL)?
- **Accessibility** — can a tester with assistive tech use the core flow?

---

## 3. Feedback Forms

**Weekly pulse (5 questions):**
1. Did you attend a real experience this week? (Y/N)
2. Did you connect with someone you'd meet again? (Y/N + optional detail)
3. How safe did Nmood feel this week? (1–5)
4. What was the most confusing moment this week? (free text)
5. What should we build or fix first? (free text)

**Post-experience survey (3 questions, in-app):**
1. Did this experience help you build a meaningful connection? (1–5)
2. Would you do something like this again? (Y/N)
3. One thing we could improve: (free text)

**Exit interview (end of Beta):** 15-minute call or form — what worked, what didn't, would you stay.

---

## 4. Bug Severity Matrix

| Severity | Definition | Response | Fix SLA |
|---------|-----------|----------|---------|
| P0 Blocker | Core flow broken; data loss; safety risk | Immediate; all-stop | Same day |
| P1 Critical | Major feature broken; no workaround | Same day triage | 48 hours |
| P2 Major | Feature broken with workaround | This week | 1 week |
| P3 Minor | Polish, cosmetic, edge case | Next sprint | 2 weeks |
| P4 Nuisance | Trivial, rare | Backlog | Release 1.1 |

**Rule:** A P0 in safety or data blocks the release candidate (Section 7).

---

## 5. Known Issues Template

```
Known Issue #[ID]
Title: [short]
Severity: P[0-4]
Affected: [flow / screen]
Description: [plain language]
Workaround: [if any]
Status: Open / In progress / Fixed / Deferred to 1.1
Owner: [name]
```

**Publication:** Known issues shared with Beta testers in their feedback channel, updated daily. No issue is hidden from testers.

---

## 6. Release Candidate Checklist

For a build to be declared a Release Candidate:
- [ ] All P0 bugs resolved and verified
- [ ] All P1 bugs resolved or have an approved workaround
- [ ] Localization governance scan: 0 errors
- [ ] Accessibility: no new violations
- [ ] Security: no new secrets; auth checks verified
- [ ] AI: changes pass FO-004 release policy
- [ ] Crash-free sessions ≥ 99.5% over 24h
- [ ] All new flows have empty / loading / error states
- [ ] Release notes written and localized
- [ ] Founder sign-off recorded

---

## 7. Go / No-Go Checklist

The Founder makes the Go/No-Go decision. **Go** requires ALL of the following:

### Product
- [ ] Release Candidate checklist passes
- [ ] Core flows (onboarding, experience, circle, messaging, safety) verified by testers
- [ ] AI concierge explainable and controllable

### Trust & Safety
- [ ] Reporting and blocking verified end-to-end
- [ ] Moderation SOP trained and active
- [ ] No open P0/P1 safety issues

### Infrastructure
- [ ] Domain + TLS + HSTS live
- [ ] Stripe keys configured and tested
- [ ] Monitoring + alerts active; Founder receives S1/S2
- [ ] Backup restore tested

### Launch readiness
- [ ] App Store + Play listings submitted (approval pending is acceptable for Beta)
- [ ] Privacy Policy + Terms live
- [ ] Support SOP live; tickets routing correctly
- [ ] Beta cohort recruited and consented

### Mission test
- [ ] At least 30% of testers attended a real experience
- [ ] At least 20% reported a meaningful connection
- [ ] Average safety rating ≥ 4/5

**If any "Product" or "Trust & Safety" item fails → No-Go.**  
**If only non-blocking items fail → Conditional Go with a remediation date.**

---

## Beta Exit Criteria (to Public Launch)

- Go/No-Go passed for at least one Release Candidate.
- Mission test thresholds met for two consecutive weeks.
- No open P0; no open P1 without workaround.
- Founder approval recorded with date and reasoning.