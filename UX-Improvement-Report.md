# Nmood — UX Improvement Report (First-Time User Friction Audit)

**Scope:** Usability and friction only. Implementation, business logic, and development effort are intentionally ignored. Every finding is scored against one question: *can the same goal be reached with fewer taps or less confusion?*

**Method:** Walked the real first-run journey — Splash → Welcome → Language Select → Onboarding (7 steps) → Home → navigation → create → join — reading the actual screen source for each.

**Summary:** Onboarding alone costs a first-time user **8+ taps and 7 full screens** before they see Home. Roughly **3 of those screens and 4 taps are removable** without changing any stored data, defaults, or permissions. Below are the concrete opportunities, each with Current Flow, Problem, Recommendation, and Expected Benefit.

---

## 1. Splash — forced 2.6s wait on every cold launch

- **Current Flow:** App opens → animated Splash renders → a fixed `2600ms` timer runs → only then is auth checked and routing happens.
- **Problem:** Every cold launch costs a mandatory ~2.6s of staring at a spinner before *anything* can be tapped. The auth check itself is near-instant and could run in parallel; the wait exists only for the animation. For a returning user this is pure dead time, repeated daily.
- **Recommendation:** Run `isAuthenticated()` immediately on mount, in parallel with the animation. Navigate as soon as auth resolves *or* the animation minimum (≈1.2s) elapses — whichever is first. Keep the brand moment, just stop blocking on it.
- **Expected User Benefit:** Cuts ~1.4s off every launch; returning users reach Home noticeably faster while new users still get the brand beat.

---

## 2. Language Select — a full screen + search box for 7 languages

- **Current Flow:** First launch → dedicated Language Select screen with a search input and a scrollable list of 7 supported languages → tap a language → tap **Continue**.
- **Problem:** A search box is overkill for 7 options, and this is a whole extra screen *before* onboarding even starts. Worse, the app then asks about languages **again** inside onboarding (see #5), so a first-time user encounters "pick your language" twice and may not understand the difference (UI language vs. languages you speak).
- **Recommendation:** Drop the standalone screen. Auto-detect the device language, apply it instantly, and show a small "Language" control on the Welcome screen (one tap to change). Move the *spoken-languages* question into onboarding only.
- **Expected User Benefit:** Removes one screen and one Continue tap from every new user's journey; eliminates the "I already did this" confusion.

---

## 3. Onboarding length — 7 steps, 8+ taps to reach Home

- **Current Flow:** Profile → Interests → Languages → Location → Notifications → Privacy → Complete. Each step has its own **Continue** button, and Complete has a final **Enter Nmood** tap that triggers the save.
- **Problem:** Seven sequential screens with hard gates is well above the 3–4 step norm for social apps. A first-time user must commit to the whole funnel before seeing any value, which is the highest-dropoff moment in the product.
- **Recommendation:** Collapse to **4 steps**: (1) Profile essentials, (2) Interests, (3) Location + Notifications together, (4) Privacy defaults + Go. Save on the final tap, not behind a separate celebration button. Keep the confetti as a brief auto-dismissing Home overlay instead of a gated screen.
- **Expected User Benefit:** ~3 fewer taps and 3 fewer screens; users reach Home (and their first recommendation) meaningfully faster, reducing signup abandonment.

---

## 4. Profile step — three name fields

- **Current Flow:** First name (required) + Last name (required) + Display name (required) + DOB (required) + Gender (required) + Bio (optional).
- **Problem:** Three name inputs is two more than most users expect. `display_name` is functionally derivable from first + last, so asking for it separately forces the user to retype or re-decide information they just gave. Gender is required to proceed even though it has a "prefer not to say" option — that's a values choice surfaced as a form gate.
- **Recommendation:** Ask for **First name** and **Last name** only; auto-suggest `display_name` = first + last and let it be edited later in Settings. Make Gender optional with "prefer not to say" as the silent default (no blocker). Move Bio off the first screen entirely — it belongs in profile editing, not the signup gate.
- **Expected User Benefit:** Removes ~3 taps and one required decision from the very first screen; faster to clear, less "why am I filling a form" friction.

---

## 5. Languages step — duplicated language interaction

- **Current Flow:** After the pre-onboarding Language Select screen, the onboarding **Languages** step asks the user to pick the languages they *speak*, with a search box and a min-1 requirement.
- **Problem:** The user has just chosen a language; being shown another language-picker with a search box reads as a repeat or a bug. The two concepts (UI language vs. spoken languages) are not distinguished visually, so the user pauses to figure out what's different.
- **Recommendation:** Merge spoken-languages into the Interests step as a single combined "You" card (interests + languages you speak), or default the spoken language to the UI language already chosen and let the user *add more* from one inline chip row — no separate screen, no search box for a handful of options.
- **Expected User Benefit:** Removes one screen and one Continue tap; removes the "didn't I just do this?" confusion entirely.

---

## 6. Notifications step — a full screen to ask for permission

- **Current Flow:** A dedicated screen with a bell illustration, 4 benefit cards, then **Enable** / **Not now** buttons. The OS permission prompt follows.
- **Problem:** The real gate is the OS-level permission, not this screen. Four benefit cards before a yes/no decision is heavy for a first-time user who hasn't seen the app yet — they're being sold on notifications before they've seen a single experience.
- **Recommendation:** Replace the standalone screen with a single inline permission card on the Location/Notifications combined step: one line of value + an Enable button. Keep "Not now" as a secondary text link. The OS prompt does the actual persuading.
- **Expected User Benefit:** One fewer screen; the decision is made in context with location, where the user is already thinking about relevance.

---

## 7. Privacy step — 5 controls presented as a blocker

- **Current Flow:** A full step showing Profile visibility (select), Who can message (select), Online status (toggle), Personalized recommendations (toggle), Analytics consent (toggle) — all pre-filled with sensible defaults — then **Continue**.
- **Problem:** Every control already has a safe default, so ~95% of users will change nothing — yet everyone must scroll through 5 cards and tap Continue just to accept the defaults. This is the single most skippable step in the funnel and it's currently mandatory.
- **Recommendation:** Replace with a single acceptance line: **"Use recommended privacy settings"** as the primary CTA, and a disclosure / "Customize" that expands the 5 controls for the minority who want them. Defaults stay identical; only the mandatory full-screen review is removed.
- **Expected User Benefit:** Removes 5 scroll-pasts and a Continue tap for the vast majority; privacy-conscious users still get full control on demand.

---

## 8. Complete step — celebration gate before Home

- **Current Flow:** After Privacy, a Complete screen fires confetti, shows a success illustration, and requires a final **Enter Nmood** tap — which then runs the actual save and redirects to Home.
- **Problem:** The save hasn't happened yet; the user must tap to *trigger* it. That means the celebration is shown before the work is done, and the final tap is a gate, not a delight. If the save fails, the user has already "celebrated."
- **Recommendation:** Save automatically when Privacy is accepted; show the confetti as a brief auto-dismissing overlay *on Home* (1.2s) rather than a separate screen with a button. Drop the gate entirely.
- **Expected User Benefit:** One fewer screen and one fewer tap; the delight moment still happens, but after success and without blocking.

---

## 9. Bottom navigation — no quick-create entry

- **Current Flow:** 5 tabs — Home, Discover, Circles, Chats, Profile. To create an experience or circle the user must open the menu → go to Host Dashboard → **Create** → pick host type → begin the wizard.
- **Problem:** The single most valuable action for retention (hosting) is buried 3 taps deep with no persistent entry point. A first-time user who wants to create something has to discover that the path exists at all.
- **Recommendation:** Promote a persistent create affordance — either a center "+" tab in the nav (standard pattern) or a floating action on Home/Discover that opens the host-type choice directly. Routing only; no logic change.
- **Expected User Benefit:** Cuts create-flow entry from ~3 taps to 1; removes the "where do I start?" moment for new hosts.

---

## 10. Joining an experience — three taps to join

- **Current Flow:** Experience card → detail page → **Join** button → confirmation sheet → confirm.
- **Problem:** A low-risk action (joining a public experience) is gated behind a detail-page open *and* a separate confirmation sheet. For a first-time user exploring, that's friction on the exact action the app wants them to take.
- **Recommendation:** Allow quick-join directly from the card for public experiences (one tap → joined, with an **Undo** toast for 5s). Keep the confirmation sheet only for private/connection-gated or paid experiences where the decision genuinely needs a second look.
- **Expected User Benefit:** Joining drops from 3 taps to 1; the detail page still exists for users who want to read more before committing.

---

## 11. Bottom nav + create-wizard labels — not localized

- **Current Flow:** `MobileNav` labels ("Home", "Discover", "Circles", "Chats", "Profile") and the Create-Experience `stepLabels` ("Cover", "Basics", "Time & Location", …) are hardcoded English strings.
- **Problem:** A first-time user who chose Arabic, Spanish, or French sees the five most-used navigation labels in English on every screen — constant low-grade cognitive friction and an inconsistency with the localized rest of the app.
- **Recommendation:** Route both label sets through the Localization Service (mirror the existing Circle-wizard patch pattern). No structural change.
- **Expected User Benefit:** Non-English users navigate without translating in their head on every screen; brand consistency restored.

---

## 12. Empty states — turn "nothing here" into a next action

- **Current Flow:** List screens (Chats, Pals, Saved, My Experiences, Circles) show an empty-state illustration + copy when there's no content.
- **Problem:** Empty states are the highest-intent teaching moment for a first-time user, yet most are informational ("You have no chats yet") rather than actionable. The user lands on a dead end and has to figure out the next step themselves.
- **Recommendation:** Every empty state should carry a single primary CTA that advances the user toward their first record (e.g. Chats → "Find people to message"; Pals → "Discover people"; Saved → "Browse experiences"). One tap, no dead end.
- **Expected User Benefit:** First-time users are never stranded on an empty screen; each empty state becomes a guided next step, increasing activation.

---

## Priority ranking

| # | Finding | Taps/screens removed | Impact |
|---|---|---|---|
| 3 | Onboarding 7 → 4 steps | ~3 screens / 3 taps | Critical |
| 7 | Privacy defaults acceptance | 1 screen / 1 tap + 5 scroll-pasts | Critical |
| 8 | Complete celebration gate | 1 screen / 1 tap | Critical |
| 5 | Languages step duplication | 1 screen / 1 tap | High |
| 6 | Notifications full screen | 1 screen / 1 tap | High |
| 4 | Three name fields → two | ~2 taps + 1 decision | High |
| 2 | Language Select standalone screen | 1 screen / 1 tap | High |
| 1 | Splash forced wait | ~1.4s time | Medium |
| 10 | Join = 3 taps | 2 taps on key action | Medium |
| 9 | No quick-create entry | ~2 taps to create | Medium |
| 11 | Nav labels not localized | 0 taps / cognitive | Medium |
| 12 | Empty states not actionable | 0 taps / dead ends | Medium |

**Total estimated reduction:** a first-time user reaches Home with **~5 fewer taps and 4 fewer screens**, and every subsequent empty screen becomes a guided next step — without changing a single stored field, permission, or default.