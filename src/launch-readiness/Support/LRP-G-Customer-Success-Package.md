# LRP Section G — Customer Success Package

**Program:** LRP-001 — Nmood Launch Readiness Program  
**Section:** G — Customer Success  
**Status:** Production-ready support operations  
**Date:** 2026-07-11  
**Owner:** Nmood Support Lead  
**References:** FO-002 (Brand Bible), FO-007 (Community & Trust), FO-008 (Crisis), FO-001 §9

---

> Support voice (FO-002): empathetic first, accurate second, fast third. Own the problem. Plain language. Say sorry when sorry is owed. Close with a clear next step.

---

## 1. Support Standard Operating Procedure (SOP)

**Hours:** 7 days/week; first response within 24 hours (Beta); 12 hours (post-launch target).

**Channels:** In-app support form (priority for members), email, website contact form.

**Intake:** Every ticket creates a `SupportTicket` record with member id, category, severity, and created date.

**Triage:** Severity assigned within 1 hour of receipt (Section 5 Escalation Matrix).

**Resolution:** Respond in the member's language where possible (FO-001 §4). Close with a clear next step. Never blame the member.

**Quality:** A random 10% of resolved tickets are reviewed monthly for tone, accuracy, and resolution quality.

---

## 2. Response Templates

**Greeting:** "Hi {firstName}, thanks for reaching out — I'm {agentName}, and I've got this."

**Acknowledge + investigate (acknowledgment):**  
"Thanks for the details. I've reproduced this and I'm looking into it now. I'll get back to you within {SLA} with a fix or a next step."

**Resolved (bug):**  
"Good news — this is fixed. Here's what happened: {plain-language cause}. Here's what to do: {step}. If it's not working, reply here and I'll pick it straight back up."

**Resolved (safety/report):**  
"Thanks for reporting this. We've reviewed it and taken action. We take this seriously — you did the right thing. We can't share specifics, but the member is no longer able to contact you."

**Refund (approved):**  
"You're right, this wasn't right. I've refunded {amount} to your original payment method. It should show in 5–10 business days. I'm sorry for the trouble."

**Apology (service issue):**  
"I'm sorry — that's on us. Here's what happened and here's what we're doing so it doesn't happen again: {action}. Is there anything else I can do to make this right?"

**Closing:** "If there's anything else, just reply here. — {agentName}"

---

## 3. FAQ (Member-Facing)

**Is Nmood a dating app?**  
No. Nmood helps you build all kinds of real relationships — friendship, community, shared interests. Not romance.

**Is Nmood free?**  
Yes. Join, connect, and attend experiences for free. Premium adds deeper AI matching, unlimited experiences, and advanced insights — with no ads.

**Do you sell my data?**  
Never. Your data is not sold. You can access, export, or delete it anytime.

**How does the AI work?**  
Nmood's AI recommends people, experiences, and circles that fit your life. It explains its suggestions and never manipulates your attention. You can adjust or turn off personalization anytime.

**How do I report someone?**  
In any chat or profile, tap report. Every report is reviewed by a human, usually within 24 hours.

**How do I delete my account?**  
Settings → Privacy → Delete Account. Your data is removed per our retention policy.

**What's a circle?**  
A trusted group of people around a shared interest, location, or identity.

**How do I host an experience?**  
Tap Host on Home. Choose experience or circle. Fill in the details. We'll help you every step.

**Is my location shared?**  
Only approximate, only when you opt in, and only to show nearby experiences and circles. Off by default.

---

## 4. Escalation Matrix

| Severity | Trigger | Owner | SLA |
|---------|---------|-------|-----|
| S1 Critical | Threat to life, illegal activity, data breach | Founder + Safety lead + Legal | Immediate |
| S2 High | Safety report against a member, payment failure affecting many | Safety/Payments lead → Founder | 1 hour |
| S3 Medium | Account access issue, billing dispute, AI failure affecting one | Support lead | 4 hours |
| S4 Low | General question, feature request | Support agent | 24 hours |

All S1/S2 escalations are logged in SecurityEvent and reviewed in the Weekly Founder Review (FO-005).

---

## 5. Moderation SOP

**Principle (FO-007):** Consistent, transparent, proactive, human-led, fair.

**Flow:**
1. Report received → `SafetyReport` record created.
2. Triage within 1 hour; classify severity (FO-007 §5 Enforcement Framework).
3. AI flags assist but never decide; a human approves every enforcement action.
4. Action taken: warning, restriction, removal, or ban.
5. Member notified with the reason and the appeals path.
6. Appeal reviewed by a different human than the original decision.
7. Outcome logged in AuditLog.

**Moderator protection:** Moderators never handle S1 cases alone. Wellness support is available for distressing content.

---

## 6. Incident Response (Support view)

When an incident is declared (FO-008):
1. Support moves to a single response voice; no speculation.
2. The Founder or Communications lead owns member communication.
3. Support agents use the approved holding statement until facts are confirmed.
4. All member contacts are logged; no promise is made beyond the approved message.
5. Post-incident: a plain-language summary is sent to affected members.

**Holding statement (first 1 hour):**  
"We're aware of an issue affecting {area} and we're on it. We'll update you here as soon as we know more. Thanks for your patience."

---

## 7. Refund Policy Workflow

**Policy (guideline — formal copy in Terms):** Refunds are considered for service failures, duplicate charges, and Premium not delivered. Discretionary refunds for trust preservation.

**Workflow:**
1. Member requests refund via support.
2. Agent verifies eligibility (within 14 days for Premium; billing error any time).
3. S3 or below: agent approves up to {local currency equivalent of one month}.
4. S2 or large refunds: escalate to Support lead.
5. Refund processed via original payment method.
6. `Membership` updated to reflect status; AuditLog records the refund.
7. Member notified with confirmation and timeline.

**Rules:** Never argue. Never make the member prove the error. Err toward trust.

---

## 8. Membership Support Workflow

**Common cases:**
- "I paid but don't have Premium" → verify `Membership` status and payment; sync or grant override (Founder tool, FO-001 §6).
- "I want to cancel" → cancel renewal; Premium continues until period end.
- "I was charged after cancellation" → refund the disputed charge; verify cancellation timestamp.
- "I want to downgrade" → allow; no friction (FO-001 §12 — no dark patterns).
- "My friend was granted Premium by a founder" → confirm via audit log; explain it's a founder-granted override (no payment).

**Rule:** Cancellation is one tap, in the app, no phone call, no retention pressure (FO-001 §12).