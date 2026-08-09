# EXEC-009 — Founder Knowledge Center (NEXUS)

**Suite:** Nmood Executive Operating System  
**ID:** EOS-009  
**Status:** Permanent operating system  
**Date:** 2026-07-11  
**Owner:** Nmood Founder

---

## Purpose

NEXUS is the searchable company brain. It indexes every document, decision, policy, blueprint, and record the company has produced — so any answer is one query away. NEXUS is how institutional memory survives people leaving.

---

## Information Architecture

NEXUS organizes knowledge into ten indexes, each with a curator and an update cadence.

| Index | Contents | Curator | Cadence |
|-------|---------|---------|---------|
| Founder Suite | FO-000 through FO-010 | Founder | Annual review |
| Launch Suite | LRP-001 sections A–J + Executive Summary | Founder | Per launch |
| Engineering Blueprints | Architecture, MAP-*, PB-*, data models, function specs | Engineering lead | On change |
| Legal Suite | Privacy Policy, Terms, Community Guidelines, data retention, compliance | Legal | Quarterly |
| QA Suite | QA results, suites, runner, release certification | QA | Per release |
| Marketing | Campaigns, press, social, ambassador, brand assets | Marketing | Per campaign |
| Policies | FO-001 Permanent Rules, governance, AI Constitution, safety | Founder | On change |
| Roadmaps | FO-003 product vision, release plan, city expansion | Founder | Quarterly |
| Meeting Notes | All review notes (EOS-005), decision logs | Founder/leads | Per meeting |
| Release Notes | Every release's notes, localized | Engineering | Per release |
| Business Documents | Pricing, forecasts, investor materials, OKRs | Founder | Quarterly |

---

## Source Documents (indexed)

NEXUS indexes the real document set:

**Founder Suite (FO-):**
- FO-000 Master Index
- FO-001 Founder Operating Manual
- FO-002 Brand Bible
- FO-003 Product Vision & Roadmap
- FO-004 AI Constitution
- FO-005 Founder Playbook
- FO-006 Growth Playbook
- FO-007 Community & Trust Playbook
- FO-008 Crisis Management Manual
- FO-009 Company Culture Handbook
- FO-010 Investor & Board Handbook

**Launch Suite (LRP-):**
- LRP-001 Executive Summary
- LRP-A Product Completion
- LRP-B UX Polish Report
- LRP-C Launch Infrastructure Guide
- LRP-D Website Package
- LRP-E App Store Package
- LRP-F Marketing Package
- LRP-G Customer Success Package
- LRP-H Operations Package
- LRP-I Business Package
- LRP-J Beta Program

**Executive Operating System (EOS-):**
- EOS-001 through EOS-010 (this suite)

**Engineering:**
- MAP-001 Production Verification Report
- PB-004 Release 1.0 Final Certification
- RC1 Release Certification Report
- Entity schemas, function specs, architecture notes

**Legal:**
- Privacy Policy, Terms of Service, Community Guidelines (in-app)

---

## Search Architecture

NEXUS uses a hybrid retrieval model:

1. **Keyword index** — every document is tokenized; exact phrase and keyword search return ranked results.
2. **Semantic search** — an embedding index (via `Core.InvokeLLM`) maps documents to vectors; natural-language queries return conceptually related results even without keyword overlap.
3. **Metadata filtering** — results filter by index, date, owner, and document type.

**Query path:**
```
User query → [keyword index + semantic index] → ranked results → metadata filter → ranked, filtered results → snippet + link + source + last-updated
```

---

## AI Search Examples

NEXUS is accessed through a natural-language search box. The AI interprets the query, retrieves the most relevant passages, and answers with citations.

**Example 1 — Policy question:**
> Query: "Can we show a member's exact location to other members?"
>
> NEXUS answer: No. Location is approximate only, opt-in, and off by default. FO-001 §9 and the Member entity (`location_enabled`, default false) enforce this. Map views use approximate coordinates. Exact location is never shared (FO-001 Permanent Rules).
> Sources: FO-001 §9, Member entity schema, LRP-C.

**Example 2 — Operational question:**
> Query: "What do I do if a member reports a safety incident?"
>
> NEXUS answer: Follow the Trust & Safety SOP (LRP-G §5) and FO-008. Triage within 1 hour, classify severity, human approves every enforcement action, member notified with reason and appeals path, outcome logged in AuditLog. For S1/critical, initiate incident response immediately and notify the Founder.
> Sources: LRP-G §5, FO-008 §5, EOS-006 alert #11.

**Example 3 — Historical question:**
> Query: "Why did we choose MapTiler over Google Maps?"
>
> NEXUS answer: MAP-001 standardized all maps on MapLibre + MapTiler. Rationale (LRP-C §1): vector tiles, lower cost, no Google account dependency, offline-friendly rendering, no vendor lock-in. Google Maps is not required for Closed Beta; migration is deferred to Release 2.0+ only if justified.
> Sources: MAP-001, LRP-C §1, MAP-001 Production Verification Report.

**Example 4 — Decision question:**
> Query: "What was decided about Premium pricing?"
>
> NEXUS answer: Monthly $9.99, Annual $79.99 (USD reference, localized per market). Cancellation is one tap, no retention pressure (FO-001 §12). Free tier is genuinely useful; Premium is deeper, not a paywall. Founder-grant path exists for ambassadors/support/partners (FO-001 §6), audit-logged.
> Sources: LRP-I §1, FO-001 §6, FO-006.

**Example 5 — Compliance question:**
> Query: "What's our AI governance policy on explainability?"
>
> NEXUS answer: FO-004 requires AI recommendations to be explainable — members see why a recommendation was made. AI never manipulates attention. Human oversight on high-impact decisions. Members can adjust, reset, or turn off personalization. Every AI invocation is audited (AiAuditRecord).
> Sources: FO-004, AiAuditRecord entity, EOS-010 §8 (AI Governance).

**Example 6 — Status question:**
> Query: "Are we ready to launch?"
>
> NEXUS answer: Conditional Go at 92% readiness (LRP-001 Executive Summary). Six configuration tasks remain: production domain, Stripe keys, store submission, backup test, beta cohort, UX polish kickoff. The Beta Go/No-Go gate (LRP-J §7) is the final Founder decision.
> Sources: LRP-001 Executive Summary, LRP-J §7.

---

## Access & Permissions

- **Full access:** Founder (all indexes).
- **Function access:** Leads see their index plus shared indexes (Policies, Roadmaps, Meeting Notes).
- **Member-facing:** Community Guidelines, Privacy Policy, Terms are public (in-app + website).
- **Confidential:** Investor materials, security details, and personnel records are Founder-only.

---

## Document Governance (link to EOS-010 §6)

- Every document has an owner, a version, and a last-updated date.
- Documents are versioned; superseded versions are archived, not deleted.
- NEXUS serves the current version by default; history is queryable.
- A document unchanged for 12 months is flagged for review.
- No document is edited without the owner's approval.

---

## Maintenance

- **Indexing:** New and updated documents are indexed within 1 hour of publish.
- **Stale check:** Documents not updated in 12 months are flagged.
- **Broken links:** Quarterly scan for references to deleted/moved documents.
- **Search quality:** Monthly review of top queries; results that miss trigger index tuning.

---

## Why NEXUS Exists

A company's knowledge disappears when people leave and memories fade. NEXUS ensures that the answer to "why did we decide X?" is never "I'm not sure" — it is a query away, with the source, the date, and the reasoning. NEXUS is how Nmood stays coherent as it grows.