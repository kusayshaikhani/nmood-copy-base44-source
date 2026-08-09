# EXEC-004 — Business Intelligence

**Suite:** Nmood Executive Operating System  
**ID:** EOS-004  
**Status:** Permanent operating system  
**Date:** 2026-07-11  
**Owner:** Nmood Founder / BI  
**Reference:** FO-003 §13, FO-010

---

## Purpose

Business Intelligence is the analytical layer beneath the Executive KPI Dashboards (EOS-002). Where the dashboards show *what is happening*, BI defines *what each metric means, how it is computed, and how it is interpreted*. Every number in the company is defined here once.

---

## North Star

**Meaningful Real-World Connections (MRWC)** — the count of relationships formed on Nmood that resulted in a real-world meeting with a positive outcome. This is the only metric that ultimately matters. All other metrics are inputs to or proxies for MRWC.

**Computation:** A connection counts toward MRWC when two members meet in person (via an experience or circle) and at least one reports the interaction as positive (post-experience survey or continued messaging). Reported, not inferred.

---

## Metric Definitions

### Audience

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| DAU | Daily Active Users | Unique members with ≥1 action in a day | D |
| WAU | Weekly Active Users | Unique members with ≥1 action in 7 days | W |
| MAU | Monthly Active Users | Unique members with ≥1 action in 30 days | M |
| Stickiness | Engagement depth | DAU ÷ MAU | M |

**Interpretation:** DAU is monitored, not optimized. Nmood is built for less screen time; high DAU driven by addictive loops is a failure signal, not a success. Stickiness ≥ 25% indicates the product is a habit; above 50% may indicate unhealthy engagement and warrants review.

---

### Retention

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| D1 retention | Day-1 return | Members returning the day after signup ÷ new signups that day | D |
| W1 retention | Week-1 return | Members returning within first week ÷ new signups that week | W |
| W4 retention | Week-4 return | Members returning within 4 weeks ÷ new signups that cohort | M |
| Cohort retention | Retention curve | Retention by signup cohort over time | M |
| Churn (member) | Member loss | Members inactive 30+ days ÷ MAU | M |

**Interpretation:** Retention is the truest measure of product-market fit. W4 retention is the key early signal. A flat or improving cohort curve is the goal; a decaying curve that steepens means the product is not creating durable value.

---

### Activation

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Activation rate | Onboarding + first action | Members who complete onboarding and perform a core action (join/view/explore) ÷ new signups | W |
| Time to activation | Onboarding duration | Median time from signup to first core action | W |
| Onboarding completion | Finished onboarding | Members completing onboarding ÷ new signups | W |

**Interpretation:** Activation is the funnel's gate. Members who don't activate don't retain. Time to activation under 5 minutes is the target.

---

### Growth & Virality

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Referral rate | Members who refer | Members sending ≥1 referral ÷ active members | W |
| Referral conversion | Invites to signups | Accepted referrals ÷ sent referrals | W |
| Virality (k-factor) | Organic growth coefficient | (Invites sent per member) × (acceptance rate) | M |
| Organic share | Non-paid acquisition | Organic signups ÷ total signups | M |
| CAC | Customer acquisition cost | Total acquisition spend ÷ new members | M |

**Interpretation:** Nmood grows through trust and referrals (FO-006). A k-factor > 1 organically is ideal. Paid acquisition is supplementary and must keep CAC < LTV ÷ 3. Virality engineered through dark patterns is explicitly prohibited (FO-001 §12).

---

### Monetization

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Conversion (Premium) | Free to paid | Premium members ÷ active members | M |
| MRR | Monthly recurring revenue | Sum of active monthly-equivalent subscriptions | M |
| ARR | Annual recurring revenue | MRR × 12 | Q |
| ARPU | Revenue per user | Revenue ÷ active members | M |
| LTV | Lifetime value | ARPU × gross margin × (1 ÷ churn rate) | Q |
| CAC payback | Months to recover CAC | CAC ÷ (ARPU × gross margin) | Q |
| Refund rate | Refunds ÷ charges | Refunded amount ÷ gross charges | M |

**Interpretation:** LTV:CAC ≥ 3 is the target. CAC payback < 12 months. Nmood does not run at a loss on unit economics indefinitely; the path to profitability in the primary market is by Year 3 (FO-003 §9).

---

### Engagement

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Messages per active | Messaging depth | Total messages ÷ active members | W |
| Experiences per member | Activity depth | Experiences attended ÷ active members | M |
| Session quality | Meaningful actions | Core actions per session (not raw taps) | W |

**Interpretation:** Engagement is measured in *meaningful actions*, not time or taps. A member who attends one experience and messages two people is more engaged than one who scrolls for an hour.

---

### Product — Experiences

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Experiences created | New experiences | Count where created_date in window | W |
| Experience completion | Completed ÷ created | Completed experiences ÷ created experiences | W |
| Attendance rate | Joined ÷ capacity | Total attendees ÷ total capacity offered | M |
| Cancellation rate | Cancelled ÷ created | Cancelled ÷ created | M |
| Repeat host rate | Hosts who host again | Hosts with ≥2 experiences ÷ total hosts | M |

**Interpretation:** Experience completion ≥ 60% is the target. Cancellation rate rising indicates host friction or member flakiness — both addressable.

---

### Product — Circles

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Circles created | New circles | Count in window | W |
| Active circles | Messaging in 7 days | Circles with ≥1 message in 7d ÷ total circles | W |
| Circle activation | First message within 7d of creation | New circles with activity in first week ÷ new circles | W |
| Median circle size | Members per circle | Median of CircleMembership counts | M |
| Circle longevity | Active at 90 days | Circles still active at 90d ÷ created 90d ago | M |

**Interpretation:** Active circles and longevity are the community health signals. A circle that forms and goes quiet in a week is a churn signal.

---

### Product — Connections

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Connection requests | Pal requests sent | Count | W |
| Connection success | Accepted ÷ requested | Accepted pal requests ÷ sent | M |
| Repeat connection | Members who connect again | Members with ≥2 pals ÷ members with ≥1 pal | M |
| MRWC | Meaningful real-world connections | See North Star | M |

**Interpretation:** Connection success ≥ 30% and MRWC trending up are the relationship-formation signals. MRWC is the ultimate proxy for mission success.

---

### Trust

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Trust score (member) | Composite trust | Verified + history + reports + endorsements | M |
| Trust score (organizer) | Host trust | Completed experiences + ratings + reports | M |
| Verified share | Verified ÷ total | Verified members ÷ total | M |
| Trust score distribution | Spread | Percentile distribution of trust scores | M |

**Interpretation:** Trust is the product. Distribution matters more than average — a few high-trust members don't compensate for a long low-trust tail.

---

### Safety

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Reports per 1k | Reporting rate | Reports ÷ members × 1000 | W |
| Resolution time | Avg time to close | Mean resolved report duration | W |
| Time to first response | Triage speed | Mean time from report to first action | D |
| Enforcement rate | Action ÷ report | Actioned reports ÷ total reports | M |
| False-positive rate | Overturned on appeal | Overturned ÷ actioned | M |
| Critical incidents | S1 count | SecurityEvent risk_level = critical | D |

**Interpretation:** Reports per 1k is not zero-targeted — members reporting is healthy. Resolution time and false-positive rate are the quality metrics. Critical incidents must be zero.

---

### Support

| Metric | Definition | Formula | Cadence |
|--------|-----------|---------|---------|
| Ticket volume | New tickets | Count | D |
| First response SLA | Within target | Tickets answered within SLA ÷ total | D |
| Resolution time | Avg time to resolve | Mean resolved ticket duration | W |
| CSAT | Satisfaction score | Avg post-resolution rating | M |
| Repeat contact | Same member reopens | Reopened tickets ÷ resolved | M |

**Interpretation:** SLA compliance ≥ 90%. CSAT trending down triggers a support quality review (EOS-005 Monthly Review).

---

## Dashboards

BI metrics surface in these dashboards:

1. **Executive KPI Dashboard** (EOS-002) — the 10 top-line metrics per function.
2. **Mission Control 2.0** (EOS-003) — the CEO summary.
3. **Founder Daily Brief** (EOS-001) — yesterday/today/week/month.
4. **BI Center** (existing Mission Control module) — deep analysis and cohort tools.

---

## Data Governance

- **Source of truth:** Entity data is authoritative; analytics events are supplementary.
- **No vanity metrics:** Screen time, raw DAU spikes, and follower counts are not reported as success (FO-001 §17).
- **Honesty:** Metrics are shown as computed; no rounding to flatter the number.
- **Privacy:** BI uses aggregated, anonymized data. No individual member is identified in a metric.
- **Retention:** Raw event data is retained per the data retention policy; aggregates are kept indefinitely for trend analysis.