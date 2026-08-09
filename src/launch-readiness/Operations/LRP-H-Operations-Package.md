# LRP Section H — Operations Package

**Program:** LRP-001 — Nmood Launch Readiness Program  
**Section:** H — Operations  
**Status:** Production-ready operational templates and checklists  
**Date:** 2026-07-11  
**Owner:** Nmood Founder  
**References:** FO-005 (Founder Playbook), FO-003 (Roadmap), FO-008 (Crisis)

---

## 1. Founder KPI Dashboard

**Cadence:** Reviewed weekly (FO-005 §7).

| Metric | Source | Target (Beta) |
|--------|--------|---------------|
| Meaningful Real-World Connections (MRWC) | Analytics | Trend up WoW |
| Active members (weekly) | Auth/Member | Trend up WoW |
| Experiences created (weekly) | Experience entity | Trend up |
| Experiences completed (weekly) | Attendance/Experience | > 60% of created |
| Circle activation (new circles active) | Circle entity | Trend up |
| Messages sent (weekly) | ChatMessage/PrivateMessage | Trend up |
| Referral-driven signups (share) | Analytics | > 25% |
| Reports open (count + age) | SafetyReport | < 24h avg resolution |
| Trust score distribution | Member/Trust | Stable or improving |
| Crash-free sessions | ErrorLog | > 99.5% |
| Localization completeness | Governance scan | 100% (R1) |
| Audit log entries (overrides) | AuditLog | Reviewed weekly |

**Avoided as primary (FO-003 §13):** screen time, DAU as an end, vanity engagement.

---

## 2. Weekly Review Template

**Time:** 30 minutes, every Monday.

**Agenda:**
1. **Trust & safety** — open incidents, resolved incidents, any S1/S2 in the past week.
2. **AI health** — escalations, bias flags, audit findings (FO-004).
3. **Product** — releases shipped, in progress, blocked.
4. **Member feedback** — top 3 themes from support and reviews.
5. **Metrics** — KPI dashboard deltas vs last week.
6. **Decisions** — made this week; pending next week.
7. **People** — blockers, wins, culture pulse (FO-009).

**Output:** A short written summary, stored in the operations archive.

---

## 3. Monthly Business Review

**Time:** 90 minutes, first week of each month.

**Sections:**
1. **Mission check** — Are we still helping people build meaningful relationships? Evidence.
2. **Roadmap progress** — vs FO-003; slips and reasons.
3. **Community health** — FO-007 metrics; enforcement actions; appeals.
4. **Brand** — consistency audit; press and social sentiment.
5. **Financial** — revenue, burn, runway, unit economics (where available).
6. **People** — hiring, retention, culture (FO-009).
7. **Risk register** — top 5 risks and mitigations (FO-010 §9).
8. **Decisions for the month ahead.**

---

## 4. Launch Checklist

- [ ] Domain live + TLS verified + HSTS header set
- [ ] Stripe keys configured; subscription webhook tested end-to-end
- [ ] App Store + Play listings approved and live
- [ ] Privacy Policy + Terms live at production domain
- [ ] Press kit published; press release embargoed
- [ ] Ambassadors briefed; first experiences scheduled
- [ ] Referral program live for first members
- [ ] Support SOP trained; tickets route correctly
- [ ] Monitoring + alerts active; Founder receives S1/S2
- [ ] Backup restore tested in staging
- [ ] Localization governance scan passing (0 errors)
- [ ] Accessibility audit baseline captured
- [ ] Beta cohort recruited and consented (Section J)

---

## 5. Beta Checklist

- [ ] Beta NDA / consent collected from each tester
- [ ] Test accounts provisioned; onboarding flow validated
- [ ] Feedback channel live (form + in-app)
- [ ] Bug severity matrix shared with testers (Section J)
- [ ] Known issues list published to testers
- [ ] Daily standup on P0/P1 bugs during Beta
- [ ] Release candidate gates defined (Section J)
- [ ] Go/No-Go criteria signed off by Founder
- [ ] Data retention + deletion honored for beta accounts

---

## 6. Release Checklist (every release)

- [ ] Release improves at least one of: Security, Performance, Accessibility, UX, Trust, Safety, Reliability (FO-001 §14)
- [ ] Localization governance scan: 0 errors
- [ ] Accessibility: no new violations
- [ ] Security: no new secrets in source; auth checks verified
- [ ] AI: changes pass FO-004 release policy
- [ ] Audit: privileged actions still logged
- [ ] Performance: no regression beyond budget
- [ ] Empty/loading/error states present on new flows
- [ ] Release notes written and localized
- [ ] Founder approval recorded

---

## 7. Production Checklist

- [ ] APP_ENV = production server-side
- [ ] No dev/debug/test routes reachable
- [ ] No seed/mock/demo flags active
- [ ] Console.log cleaned from production paths
- [ ] Global error handler active
- [ ] CSP + security headers verified
- [ ] Rate limiting active on auth + sensitive endpoints
- [ ] Audit log retention confirmed
- [ ] Secrets present, rotated, and owned
- [ ] Backups verified
- [ ] Monitoring + alerting verified with a test alert

---

## 8. Incident Checklist

- [ ] Incident declared; severity assigned (FO-008)
- [ ] Founder + relevant leads notified
- [ ] Containment action taken
- [ ] Members protected first
- [ ] Holding statement published (FO-008 §6)
- [ ] Evidence preserved (logs, audit trails)
- [ ] Legal/regulator notified if required
- [ ] Root cause identified
- [ ] Fix deployed and verified
- [ ] Post-incident review scheduled within 5 business days
- [ ] Member summary sent
- [ ] Audit log + SecurityEvent records complete