# EXEC-010 — Executive Governance

**Suite:** Nmood Executive Operating System  
**ID:** EOS-010  
**Status:** Permanent operating system  
**Date:** 2026-07-11  
**Owner:** Nmood Founder  
**Reference:** FO-001 §10 (Permanent Rules), FO-004 (AI), FO-008 (Crisis)

---

## Purpose

Governance is how Nmood makes decisions, manages risk, and controls change as it grows from a founder to a global company. Good governance is not bureaucracy — it is the structure that keeps the company fast, safe, and aligned with its mission.

---

## 1. Decision Making

**Principle:** Decisions are made by the person closest to the problem, with the authority commensurate to the stakes. The Founder decides what only the Founder can decide; everything else is delegated.

**Decision levels:**

| Level | Examples | Decided by | Recorded in |
|------|---------|-----------|-------------|
| Strategic | Mission, strategy, funding, hires, city launches | Founder | Decision Log + Review |
| Material | Roadmap changes, pricing, policies, partnerships | Founder + lead | Decision Log |
| Operational | Releases, moderation actions, support refunds | Lead / on-call | AuditLog |
| Routine | Day-to-day product, eng, support | Individual | Ticket / commit |

**Decision Log rules:**
- Every Strategic and Material decision is recorded with: decision, rationale, alternatives considered, decider, date.
- The log is immutable; a decision can be superseded but not erased.
- The Founder reviews the Decision Log at every Quarterly Review.

**Reversibility principle:** Reversible decisions are made fast. Irreversible decisions (mission, permanent rules, equity, major partnerships) are made slowly, with consultation.

---

## 2. Risk Management

**Principle:** Nmood manages risk proactively. The risk register is a living document, reviewed at every Quarterly Review (EOS-005).

**Risk register fields:**
- Risk description
- Likelihood (low/medium/high)
- Impact (low/medium/high/critical)
- Owner
- Mitigation
- Status (open/closed)
- Last reviewed

**Top risk categories (FO-010 §9):**
1. Trust & safety failure
2. Data breach
3. Financial runway
4. AI misuse or failure
5. Regulatory / legal
6. Key-person dependency
7. Competitive pressure
8. Operational outage
9. Reputation
10. People & culture

**Risk appetite:** Nmood has low appetite for trust, safety, and privacy risk; moderate appetite for product and commercial experimentation; low appetite for financial risk that threatens runway.

---

## 3. Escalation

**Principle:** Problems escalate to the level that can resolve them — no higher, no lower.

**Escalation paths:**

| Trigger | Escalates to | SLA |
|---------|-------------|-----|
| P0 bug | Engineering lead → Founder | Immediate |
| S1 safety incident | Safety lead → Founder → Legal | Immediate |
| Critical security event | Security → Founder | Immediate |
| Revenue drop > 20% WoW | Founder | Within 24h |
| Public relations issue | Founder (sole spokesperson) | Within 1h |
| Runway < 9 months | Founder → board/advisors | Immediate |

**Rules:**
- Escalation is encouraged, never penalized. Hiding a problem is the only escalation failure.
- Every escalation is acknowledged with a timestamp.
- Unresolved escalations auto-escalate to the Founder after the SLA.

---

## 4. Change Control

**Principle:** Change is controlled, not prevented. Every change to production is intentional, reviewed, and reversible.

**Change types:**
- **Code change** — reviewed (PR), tested (QA suites), deployed with a DeploymentRecord.
- **Configuration change** — reviewed, logged, rollback path defined.
- **Data change** — schema migration reviewed; backward-compatible; data backed up first.
- **Policy change** — reviewed by owner; Founder approves material policy changes.
- **Secret change** — rotated; old secret invalidated; audit-logged.

**Emergency changes:** A critical fix may bypass normal review with Founder (or lead with Founder informed) approval, but is retroactively reviewed within 24 hours and documented.

---

## 5. Version Control

**Principle:** Everything that matters is versioned. History is recoverable.

**Versioned assets:**
- Source code (git)
- Documents (FO-*, LRP-*, EOS-* — versioned in the archive)
- Entity schemas (every schema change is a versioned write)
- Policies (superseded, not deleted)
- Release notes (every release)

**Tagging:** Releases are tagged with a version (semver for code; dated versions for documents). A release is traceable from tag → deployment → audit log.

---

## 6. Document Governance

**Principle:** Documents have owners, versions, and review cycles. A document without an owner is an orphan.

**Rules:**
- Every document has a named owner.
- Every document has a last-updated date and a review cadence.
- Superseded documents are archived, not deleted.
- Documents shared externally (investors, press, partners) are reviewed for accuracy before sharing.
- NEXUS (EOS-009) is the index; documents are never stored only in chat or email.

**Review cadence:**
- Founder Suite (FO-*): annual
- Policies: on change + annual check
- Roadmaps: quarterly
- Operational SOPs: when the process changes
- A document unchanged for 12 months is flagged for review

---

## 7. Product Governance

**Principle:** Product decisions serve the mission. Growth never compromises trust (FO-001 §12).

**Product governance rules:**
- Every new feature answers a member need, not an engagement metric.
- Features are reviewed against FO-001 Permanent Rules and FO-002 (brand) before ship.
- Dark patterns are prohibited (FO-001 §12) — no forced continuity, no manipulative urgency, no hidden costs.
- A feature that increases screen time without increasing connection is a failure signal.
- Accessibility and localization are gates, not afterthoughts (0 errors to release).

---

## 8. AI Governance

**Principle:** AI serves the member, never the platform's attention. FO-004 is the constitution; this is the enforcement.

**AI governance rules:**
- AI is explainable — members see why a recommendation was made.
- AI never manipulates attention or uses dark patterns.
- Human oversight on high-impact decisions (enforcement, sensitive recommendations).
- Every AI invocation is audited (AiAuditRecord).
- Members control personalization — adjust, reset, or turn off.
- AI safety blocks are logged and reviewed; a spike triggers investigation (EOS-006 alert #8).
- Model changes pass the FO-004 release policy before deployment.
- AI is never used to infer sensitive attributes (race, religion, sexual orientation) for targeting.

**AI review cadence:** Monthly AI health check (EOS-005); quarterly FO-004 compliance review; annual AI Constitution review.

---

## 9. Release Governance

**Principle:** A release improves the product. Every release clears a defined gate (LRP-H §6).

**Release gate:**
- [ ] Release improves at least one of: Security, Performance, Accessibility, UX, Trust, Safety, Reliability
- [ ] Localization governance: 0 errors
- [ ] Accessibility: no new violations
- [ ] Security: no new secrets in source; auth checks verified
- [ ] AI: changes pass FO-004
- [ ] Audit: privileged actions still logged
- [ ] Performance: no regression beyond budget
- [ ] Empty/loading/error states present
- [ ] Release notes written and localized
- [ ] Founder approval recorded

**Rollback readiness:** No release ships without a verified rollback path and a tested previous version.

---

## 10. Company Governance

**Principle:** Nmood is governed to outlast its founder. The mission is permanent; the team is not.

**Company governance rules:**
- The Permanent Rules (FO-001 §10) are immutable. They cannot be overridden for convenience, growth, or investment.
- The Founder is accountable to the mission, the members, and the team — in that order.
- The board/advisors (FO-010) provide oversight; the Founder makes final decisions on mission and strategy.
- Compensation, equity, and people decisions are fair, transparent, and documented (FO-009).
- Financial decisions are recorded; runway is monitored monthly (EOS-006 alert #19).
- The Annual Review (EOS-005 §5) is the company's governance checkpoint: mission, strategy, people, financials, risk, and the Permanent Rules are reaffirmed.

**Succession:** Nmood builds for the founder's absence — NEXUS (EOS-009), documented decisions, and the Executive Operating System ensure the company runs on systems, not on one person's memory.

---

## Governance Summary

| Domain | Principle | Cadence |
|--------|-----------|---------|
| Decision Making | Closest person decides; material decisions logged | Continuous |
| Risk Management | Living risk register; low appetite for trust/safety/privacy risk | Quarterly review |
| Escalation | Problems reach the level that can resolve them | By SLA |
| Change Control | Intentional, reviewed, reversible | Per change |
| Version Control | Everything versioned; history recoverable | Continuous |
| Document Governance | Owner, version, review cycle per document | Annual / on change |
| Product Governance | Mission before growth; no dark patterns | Per feature |
| AI Governance | Explainable, controllable, human-overseen, audited | Monthly / quarterly / annual |
| Release Governance | Release gate cleared; rollback ready | Per release |
| Company Governance | Mission permanent; systems over memory; annual checkpoint | Annual |

---

Governance is what allows Nmood to grow without losing what makes it Nmood. The Permanent Rules are the anchor; this Executive Operating System is the structure around them.