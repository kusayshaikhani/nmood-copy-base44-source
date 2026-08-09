# FO-004 — Nmood AI Constitution

**Document ID:** FO-004  
**Classification:** Founder Documentation Suite — Permanent  
**Version:** 1.0  
**Status:** Approved  
**Effective Date:** 2026-07-11  
**Document Owner:** Nmood Founder  
**Governs:** All AI systems, models, prompts, and automated decisions at Nmood  
**References:** FO-001 (Founder Operating Manual), FO-002 (Brand Bible), FO-007 (Community & Trust Playbook)

---

> This Constitution is the supreme law of AI at Nmood. It is binding on every model, prompt, agent, and automated decision the company operates. No AI system may be deployed, updated, or retired in violation of this document.

---

## Version History

| Version | Date | Reason | Approved By |
|---------|------|--------|-------------|
| 1.0 | 2026-07-11 | Initial issuance of the AI Constitution. | Nmood Founder |

---

## Purpose

To ensure that every AI system at Nmood serves human connection, respects human dignity, and remains under human control. This Constitution exists because AI that is fast, persuasive, and unaccountable can harm people at scale. Nmood refuses that risk.

## Scope

This document governs all AI at Nmood: recommendation engines, concierge assistants, moderation assistance, personalization, memory systems, generative content, and any future model or agent. It applies to in-house models, third-party models, and any system that makes or informs a decision affecting a member.

---

## Table of Contents

1. AI Mission
2. Responsible AI
3. Human Oversight
4. Explainability
5. Transparency
6. Bias Mitigation
7. Privacy
8. Safety
9. AI Decision Rules
10. AI Escalation Rules
11. Prompt Governance
12. AI Ethics
13. AI Release Policy
14. AI Audit Policy

---

## 1. AI Mission

AI at Nmood exists to help people build meaningful real-world relationships. It recommends, explains, and assists — it never manipulates, ranks, or replaces human judgment.

## 2. Responsible AI

- Every AI system has a named human owner accountable for its behavior.
- Every AI system is evaluated before deployment and monitored after.
- AI output that affects a member is reviewable, correctable, and reversible.
- AI is never used to maximize attention at the expense of the member.

## 3. Human Oversight

- A human can review any AI decision affecting a member.
- A human can override any AI decision.
- A human can halt any AI system at any time.
- High-impact decisions (membership, safety, trust, account status) require human approval before action.
- AI never autonomously bans, restricts, or removes a member.

## 4. Explainability

- Any recommendation AI produces can be explained in plain language to the affected member.
- Explanations name the relevant factors, not just the outcome.
- Where an explanation cannot be produced, the AI does not ship.
- Explanations are localized through the Nmood Localization Service (FO-001, Section 4).

## 5. Transparency

- Members are told when they are interacting with AI.
- Members are told what data an AI system uses about them.
- Members are told how to adjust, reset, or refuse AI personalization.
- No AI system at Nmood is hidden or impersonates a human.

## 6. Bias Mitigation

- AI systems are tested for bias across nationality, culture, religion, language, gender, and age before deployment.
- Bias testing is repeated on a regular cadence and after material data changes.
- Where bias is found, the system is corrected or restricted until corrected.
- Bias findings and corrections are recorded.

## 7. Privacy

- AI uses only the data a member has consented to provide.
- AI never uses member data to train shared or third-party models without explicit, separate consent.
- Personalization is member-controllable and resettable.
- Privacy by Design (FO-001, Section 10) applies fully to AI.

## 8. Safety

- AI must never produce, recommend, or amplify hate, harassment, racism, discrimination, violence, extremism, fraud, or exploitation (FO-001, Section 8).
- AI must never manipulate a member's attention, emotion, or behavior against the member's interest.
- AI must never create urgency or pressure to act against a member's preference.
- Safety outweighs AI capability. A more capable model that is less safe is not deployed.

## 9. AI Decision Rules

Every AI decision must satisfy all of the following:

1. **It serves the member's interest**, not Nmood's engagement metric.
2. **It is explainable** in plain language.
3. **It uses only consented data.**
4. **It is reversible** by a human.
5. **It does not manipulate.**
6. **It does not violate** a Permanent Rule (FO-001, Section 18).

If any rule is violated, the decision is not made.

## 10. AI Escalation Rules

- Any AI interaction that touches safety, trust, account status, payment, or legal risk is escalated to a human.
- AI must offer a human escalation path in every relevant interaction.
- Escalation is fast, visible, and never penalized.
- AI must surface uncertainty to the member rather than guessing confidently.

## 11. Prompt Governance

- All production prompts are versioned and stored.
- Prompts are reviewed for bias, manipulation, and safety before deployment.
- Prompts that instruct AI to persuade, retain, or pressure a member are prohibited.
- Prompt changes require the same review and approval as code changes.
- No prompt may override this Constitution or FO-001.

## 12. AI Ethics

Nmood's AI ethics are the company's ethics (FO-001, Core Values), applied to machines:

- AI respects human dignity.
- AI is accountable to humans.
- AI serves connection, not attention.
- AI is inclusive by design.
- AI is honest about what it is and what it can do.

## 13. AI Release Policy

An AI system may be released only when:

1. It has a named human owner.
2. It has passed bias and safety evaluation.
3. It produces explainable outputs.
4. It has a human escalation path.
5. It has been reviewed against this Constitution and FO-001.
6. It has been approved by the Founder (for high-impact systems) or designated AI governance owner.

An AI release that degrades trust, safety, privacy, or explainability is not released.

## 14. AI Audit Policy

- Every material AI decision is logged in an immutable audit record (AiAuditRecord entity).
- Logs include the model, prompt version, inputs (anonymized where possible), output, and human review status.
- AI audit logs are retained per the Nmood data retention policy and are available to the Founder.
- AI systems are audited on a regular cadence for bias, safety, and explainability drift.
- Audit findings that indicate harm trigger immediate restriction or retirement of the system.

---

*End of Document — FO-004 — Nmood AI Constitution v1.0*