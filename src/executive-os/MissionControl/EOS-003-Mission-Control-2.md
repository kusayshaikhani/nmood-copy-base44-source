# EXEC-003 — Mission Control 2.0 (CEO Dashboard)

**Suite:** Nmood Executive Operating System  
**ID:** EOS-003  
**Status:** Permanent operating system  
**Date:** 2026-07-11  
**Owner:** Nmood Founder

---

## Purpose

Mission Control 2.0 is the Founder's CEO Dashboard — one screen that shows the entire company at a glance. It is the evolution of the existing Mission Control framework (FM-001) into an executive command center for running Nmood as a global company.

---

## Architecture

Mission Control 2.0 composes real-time widgets from the Executive KPI Dashboards (EOS-002), the Daily Brief (EOS-001), Executive Alerts (EOS-006), and OKRs (EOS-007). Each widget is independently loaded and error-isolated. The Founder opens Mission Control 2.0 at `/mission-control` and sees everything that matters without navigating.

---

## Widget Inventory

### 1. Platform Health
- Lowest subsystem health score
- Degraded/outage count
- Uptime (30d)
- p95 latency
- Crash-free sessions
- Traffic light: 🟢 operational / 🟡 degraded / 🔴 outage

### 2. Revenue
- Today / MTD / MRR / ARR
- Premium net adds (today)
- NRR
- Refund rate
- Sparkline: 30-day revenue

### 3. Growth
- New members (today / WoW)
- WAU / MAU
- Activation rate
- Referral share
- City density

### 4. Premium
- Premium members (count)
- Conversion rate
- Churn (30d)
- Net adds trend
- Founder-granted overrides (audit-logged)

### 5. Experiences
- Created today / this week
- Completion rate
- Upcoming today (with capacity flags)
- Cancelled rate
- Featured count

### 6. Circles
- Created today / this week
- Active circles (msg in 24h)
- Median size
- New memberships today

### 7. AI
- Invocations today
- Avg confidence
- Blocked/flagged count
- Escalation rate
- p95 latency
- Cost trend

### 8. Trust
- Member trust score (median)
- Organizer trust score (median)
- Verified share
- Trust score distribution

### 9. Safety
- Open reports (count, oldest age)
- Critical/high incidents
- Time to first response
- Enforcement actions this week
- Appeals open

### 10. Moderation
- Reports in queue
- Reports by category
- Moderator workload
- False-positive rate
- Appeal overturn rate

### 11. Reports (Safety Reports Feed)
- Latest 10 reports
- Severity and status
- One-tap assign / escalate
- Link to full Safety Center

### 12. Performance
- Crash-free sessions
- p95 API latency
- Error rate
- Frontend load time
- Lighthouse score trend

### 13. Releases
- Last release (name, date, status)
- In-progress release
- Deployment frequency
- MTTR
- Rollbacks (30d)

### 14. Infrastructure
- Subsystem health grid (api, database, storage, auth, notifications, ai, queues, media, search, workers)
- CDN status
- Backup last verified
- Secrets present/missing

### 15. Founder Tasks
- Action items from the Daily Brief
- Overdue decisions
- Open P0/P1 bugs (owner, age)
- Reports open > 24h
- Scheduled 1:1s today

### 16. Upcoming Milestones
- Next release target
- Next OKR checkpoint
- Next city launch (if planned)
- Beta exit gate (if in Beta)
- Annual Review date

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Mission Control 2.0 — [Date] — [Founder name]               │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│ PlatformHealth│   Revenue    │   Growth     │    Premium      │
├──────────────┼──────────────┼──────────────┼─────────────────┤
│ Experiences  │   Circles    │      AI      │     Trust       │
├──────────────┼──────────────┼──────────────┼─────────────────┤
│   Safety     │ Moderation   │   Reports    │   Performance   │
├──────────────┼──────────────┼──────────────┼─────────────────┤
│  Releases    │Infrastructure│ FounderTasks │ UpcomingMilestones│
└──────────────┴──────────────┴──────────────┴─────────────────┘
```

Top row: health and money. Middle rows: product and community. Lower rows: risk and operations. Bottom row: the Founder's own work and what's next.

---

## Executive Alerts Bar

A persistent alert bar at the top of Mission Control 2.0 surfaces every active alert from EOS-006, sorted by severity. Tapping an alert opens the relevant widget and the detail. The bar is never hidden — a red alert means something is wrong and the Founder sees it immediately.

---

## Drill-Down

Every widget links to its full dashboard:
- Platform Health → System Health page
- Revenue → Revenue Dashboard
- Growth → Growth Dashboard
- Safety → Trust & Safety page
- AI → AI Intelligence page
- Releases → Ops Releases page
- Founder Tasks → Daily Brief

Mission Control 2.0 is the summary; the underlying dashboards are the detail.

---

## Access & Refresh

- **Access:** Founder role only (`FounderRoute`). Admins see the Admin Portal, not the CEO Dashboard.
- **Refresh:** Realtime via entity subscriptions where available; widgets poll otherwise.
- **Mobile:** Responsive; the Founder can run the company from a phone.

---

## Relationship to Existing Mission Control

The existing Mission Control modules (MCDashboard, MCMembers, MCTrustSafety, etc.) remain the operational tools for each function. Mission Control 2.0 is the executive summary layer above them — it pulls the single most important metric from each module into one view. No existing module is removed; 2.0 aggregates.