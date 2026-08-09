# EXEC-002 — Executive KPI Dashboard

**Suite:** Nmood Executive Operating System  
**ID:** EOS-002  
**Status:** Permanent operating system  
**Date:** 2026-07-11  
**Owner:** Nmood Founder  
**Reference:** FO-003 §13 (North Star & Avoided Metrics)

---

## Purpose

A single source of truth for the metrics that govern Nmood. Every metric has a definition, a source, a cadence, a target, and a traffic-light state. The Founder never guesses the health of the company.

---

## Traffic-Light Convention

| Light | Meaning | Action |
|-------|---------|--------|
| 🟢 Green | At or above target | Maintain |
| 🟡 Amber | Within 10% below target | Watch; owner investigates |
| 🔴 Red | > 10% below target or threshold breached | Act now; Founder notified |

---

## Dashboard Index

Ten dashboards, each with the same structure: definition, source, cadences (D/W/M/Q/Y), target, trend, alert.

---

## 1. Growth Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| New members | First-time registered | Member | D/W/M | WoW growth ≥ 5% (Beta) |
| WAU | Unique active in 7 days | Analytics | W | Trend up |
| MAU | Unique active in 30 days | Analytics | M | Trend up |
| Activation rate | Members who completed onboarding + first action | Analytics | W | ≥ 60% |
| Referral share | Referral-driven signups ÷ total | Analytics | W | ≥ 25% |
| City density | Members per launch city | Member | M | Trend up |

**Trend:** WoW and MoM growth rate. **Alert:** growth negative two weeks running.

---

## 2. Revenue Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Daily revenue | Gross premium (net refunds) | Membership/billing | D | Trend up |
| MRR | Monthly recurring revenue | Membership | M | Trend up |
| ARR | Annualized recurring revenue | Membership | Q | Trend up |
| ARPU | Revenue ÷ active members | Membership | M | Stable/up |
| NRR | Net revenue retention | Membership | M | ≥ 100% |
| Premium conversion | Premium ÷ active members | Membership | M | 3–6% |
| Churn | Cancelled ÷ premium base | Membership | M | < 5% monthly |
| Refund rate | Refunds ÷ charges | Membership/billing | M | < 2% |

**Trend:** MRR trajectory vs path to profitability. **Alert:** MRR down MoM; churn > 7%.

---

## 3. Retention Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| D1 retention | Returned day after signup | Analytics | D | ≥ 40% |
| W1 retention | Returned within first week | Analytics | W | ≥ 25% |
| W4 retention | Returned within 4 weeks | Analytics | M | ≥ 20% |
| Stickiness | DAU ÷ MAU | Analytics | M | ≥ 25% |
| Cohort retention | Retention by signup cohort | Analytics | M | Flat or improving |

**Trend:** Cohort curves overlaid. **Alert:** W1 retention < 20%.

---

## 4. Trust Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Trust score (member) | Composite member trust | Member/Trust | M | Trend up |
| Trust score (organizer) | Composite organizer trust | useOrganizerTrust | M | Trend up |
| Verified member share | Verified ÷ total | Member | M | ≥ 70% (post-launch) |
| Reports per 1k members | Reports ÷ members × 1000 | SafetyReport | W | Stable/declining |
| Report resolution time | Avg time to resolve | SafetyReport | W | < 24h |
| Appeal rate | Appeals ÷ actions | SafetyReport | M | < 5% |
| NPS | Post-experience net promoter | Survey | M | ≥ 40 |

**Trend:** Trust score distribution. **Alert:** reports per 1k rising 2 weeks; NPS < 20.

---

## 5. Safety Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Open reports | Count unresolved | SafetyReport | D | < 24h oldest |
| Critical incidents | SecurityEvent critical | SecurityEvent | D | 0 |
| Time to first response | Reports triaged within | SafetyReport | D | < 1h |
| Enforcement actions | Warnings/restrictions/bans | AuditLog | W | Logged |
| False-positive rate | Overturned on appeal | SafetyReport/AuditLog | M | < 10% |
| Moderator workload | Reports per moderator | SafetyReport | W | Sustainable |

**Trend:** Incident count and severity. **Alert:** any critical incident; report spike > 3× average.

---

## 6. AI Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Invocations | Total AI calls | AiAuditRecord | D/W/M | Trend with usage |
| Avg confidence | Mean confidence | AiAuditRecord | D | ≥ 0.75 |
| Blocked/flagged | Safety-blocked outputs | AiAuditRecord | D | Tracked, not zero-target |
| Escalation rate | Human-review triggers | AiAuditRecord | W | < 2% |
| Recommendation CTR | Members acting on recs | Analytics | W | Trend up |
| Latency p95 | Processing time | AiAuditRecord | D | < 3s |
| Cost per invocation | Credits ÷ calls | AiAuditRecord | M | Stable |

**Trend:** Confidence and escalation rate. **Alert:** confidence < 0.6; escalation > 5%.

---

## 7. Community Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Circles created | New circles | Circle | W | Trend up |
| Active circles | Message in 7 days | Circle/ChatMessage | W | Trend up |
| Circle size | Median members | CircleMembership | M | Stable/up |
| Messages sent | Total | ChatMessage + PrivateMessage | D/W | Trend up |
| Connection success | Pals accepted ÷ requested | PalConnection | M | ≥ 30% |
| Experience completion | Completed ÷ created | Experience | W | ≥ 60% |

**Trend:** Community density per city. **Alert:** active circles declining 2 weeks.

---

## 8. Marketing Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Waitlist signups | New waitlist entries | Analytics | D | Trend up |
| Waitlist → signup | Conversion | Analytics | W | ≥ 30% |
| CAC | Cost per acquired member | Finance/Analytics | M | < LTV ÷ 3 |
| Organic share | Non-paid signups | Analytics | M | ≥ 60% |
| Press mentions | Earned media count | Manual | M | Trend up |
| Ambassador activity | Experiences hosted | Experience | W | On plan |

**Trend:** Channel mix and CAC trend. **Alert:** CAC rising without LTV movement.

---

## 9. Operations Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Crash-free sessions | 1 − crashes/sessions | ErrorLog | D | ≥ 99.5% |
| p95 latency | API response | PerformanceMetric | D | < 500ms |
| Uptime | Platform availability | SubsystemHealth | M | ≥ 99.9% |
| Deploy frequency | Releases per week | DeploymentRecord | W | ≥ 1 |
| MTTR | Mean time to restore | IncidentRecord | M | < 2h |
| Open P0/P1 | Count | ErrorLog/QaResult | D | 0 P0 |
| Support SLA | First response within | SupportTicket | D | ≥ 90% within SLA |

**Trend:** Stability and velocity. **Alert:** crash-free < 99%; P0 open > 12h.

---

## 10. Founder Dashboard

| Metric | Definition | Source | Cadence | Target |
|--------|-----------|--------|---------|--------|
| Founder hours | Time on strategic vs reactive | Manual | W | ≥ 60% strategic |
| Decisions logged | Recorded decisions | AuditLog/Reviews | W | All material decisions logged |
| 1:1s held | People meetings | Calendar | W | On plan |
| OKR progress | Key results on track | OKRs (EOS-007) | W | ≥ 70% on track |
| Mission check | "Are we helping people connect?" | Reviews | M | Evidence yes |
| Burn rate | Cash spend per month | Finance | M | Within plan |
| Runway | Months of cash | Finance | M | ≥ 12 months |

**Trend:** Founder time allocation and OKR velocity. **Alert:** runway < 9 months; strategic time < 40%.

---

## Cadence Summary

| View | Refresh | Purpose |
|------|---------|---------|
| Daily | Every morning (Daily Brief, EOS-001) | Yesterday + today |
| Weekly | Monday (Weekly Review, EOS-005) | Trend and focus |
| Monthly | First week (Monthly Business Review) | Strategic check |
| Quarterly | End of quarter (Quarterly Review) | OKRs and roadmap |
| Yearly | Annual Review | Mission, strategy, people |

---

## Alerting

Every metric with a target has an alert threshold defined in EOS-006 (Executive Alerts). Alerts route to the Founder via the Daily Brief, the Mission Control alerts widget, and email for critical items.