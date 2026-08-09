# HM-UX-001 — Nmood Home Experience Engine v1.0 (Release 1.0 Final)

> **Status: FROZEN — Release 1.0 Home Architecture.**
> After implementation, the Home architecture is frozen. Future Home
> enhancements are deferred to Release 1.1+ unless they resolve a critical
> defect. Do not introduce additional Home widgets, major workflows, or
> redesigns before the Release 1.0 launch.

**PROJECT:** Nmood
**TYPE:** Release 1.0 UX Enhancement
**PRIORITY:** HIGH

## OBJECTIVE

Transform the Nmood Home screen into an intelligent, modular, AI-assisted,
hyper-local experience that inspires members to build meaningful real-world
connections.

The Home screen must immediately answer:

- What is happening around me?
- What should I do next?
- Why is this relevant to me?

without changing existing recommendation logic or business rules.

This is a **Release 1.0 presentation, workflow and UX enhancement only.**

## HOME PHILOSOPHY

The Home screen is no longer a static page. It becomes the **Nmood Home
Experience Engine** — responsible for presenting personalized, location-aware
and context-aware information through reusable widgets. The objective is to
encourage members to participate in real-life activities rather than endlessly
browsing.

## HOME ENGINE

Replace the fixed Home layout with a widget-based architecture. Each Home
section becomes an independent widget. Each widget:

- Loads independently.
- Has independent loading, empty and error states.
- Can be reordered.
- Can be enabled or disabled.
- Can be expanded later without redesigning Home.
- Supports future A/B testing.

## DEFAULT HOME ORDER

1. Context Greeting
2. What's Pulling You Today? (mood selector)
3. ✨ Magic Card (Conditional)
4. 🤖 Picked for You
5. 📍 Circles Near You
6. 🎉 Experiences Near You
7. 👥 Members Near You
8. 🔥 Trending Around You
9. 🌍 Explore Nearby Cities
10. 📅 Your Upcoming Activities
11. Continue Exploring

## WIDGET 1 — CONTEXT GREETING

Display intelligent greetings.

Examples:

- ☀️ Good morning.
- 🌤 Good afternoon.
- 🌆 Good evening.
- 🌙 Good evening.

Greeting adapts automatically using: Time, Language, Region.

**AI Greeting** — When useful information exists, enhance the greeting.

Examples:

- "There are 12 members and 4 Experiences happening near Ajman today."
- "Three Coffee Circles have become active near you."
- "Your Photography Circle has a new Experience this weekend."

If nothing meaningful exists, display only the greeting. Never generate
unnecessary AI messages.

## WIDGET 2 — WHAT'S PULLING YOU TODAY?

Keep the existing mood selector. Improve: Animation, Responsiveness,
Persistence, Smooth transitions. Mood selection should influence all
recommendations below.

## WIDGET 3 — MAGIC CARD

Display a maximum of ONE Magic Card. Never force it. Only display when AI
identifies a genuinely valuable opportunity.

Examples:

- ✨ You and Ahmed both enjoy Photography.
- ☕ Four Coffee Circles are active nearby.
- 🎉 An Experience matching your interests starts in two hours.
- 🌅 Outdoor Experiences are trending this evening.
- 🌍 You're visiting Dubai today. Discover what's happening nearby.

If nothing valuable exists, hide the widget.

## WIDGET 4 — PICKED FOR YOU

Replace "Today's Picks" with "🤖 Picked for You". Use existing AI
recommendations based on: Interests, Mood, Language, Previous Participation,
Trust Preferences, Recommendation History, Time of Day, Day of Week, Current
Location. Display horizontal cards. Provide "Show All" → opening Discovery
sorted by AI relevance.

## WIDGET 5 — CIRCLES NEAR YOU

Display "📍 Circles Near [Current City]". Provide "Show All" → opening the
complete Circles screen with location filters already applied.

## WIDGET 6 — EXPERIENCES NEAR YOU

Display "🎉 Experiences Near [Current City]". Provide "Show All" → opening the
complete Experiences screen while preserving filters.

## WIDGET 7 — MEMBERS NEAR YOU

Display compatible nearby members according to: Privacy Settings, Discovery
Preferences, Trust Rules, Shared Interests, AI Compatibility. Respect every
privacy control. Provide "Show All".

## WIDGET 8 — TRENDING AROUND YOU

Display "🔥 Trending Around You". If insufficient activity exists, expand
automatically: Current City → Nearby City → Nearby Region → Country. Never
display an empty Trending section.

## WIDGET 9 — EXPLORE NEARBY CITIES

Display nearby cities dynamically. Selecting a city refreshes Home
recommendations temporarily. Do not permanently change the member's home
location.

## WIDGET 10 — YOUR UPCOMING ACTIVITIES

Display together: Upcoming Experiences, Upcoming Circle Activities, Pending
Invitations. Hide when empty.

## WIDGET 11 — CONTINUE EXPLORING

Display: Suggested Interests, Popular Categories, Recently Added, Featured
Activities. Maintain existing recommendation logic.

## DYNAMIC WIDGET ORDERING

The Home Engine gradually learns member behaviour.

- Frequently joins Experiences → move Experiences higher.
- Frequently joins Circles → move Circles higher.
- Frequently connects with people → move Members higher.

Adjust gradually. Never make the interface unpredictable.

## SHOW ALL

Every widget displaying content must include "Show All", opening the
corresponding page while preserving filters and context.

## TERMINOLOGY

Review the entire application. Replace every remaining reference to
"Communities" with "Circles". Maintain consistency across every screen.

## EMPTY STATES

Replace technical messages.

Example:

- "No Experiences Found" → "No Experiences are happening nearby right now.
  Explore nearby cities or create a new Experience."
- "No Circles Found" → "No active Circles are available nearby yet. Why not
  create the first one?"

## MICROINTERACTIONS

Improve: Horizontal scrolling, Card animations, Skeleton loading,
Pull-to-refresh, Touch feedback, Button feedback, Smooth transitions. Maintain
Nmood's premium design language.

## PERFORMANCE

Widgets load independently. One widget must never block another. Cache Home
data intelligently. Support future pagination.

## ACCESSIBILITY

Support: RTL, Dynamic Text, Screen Readers, Keyboard Navigation, WCAG
Compliance.

## FUTURE READY (do not enable)

Weather Suggestions, Seasonal Activities, Business Communities, Sponsored
Experiences (clearly labelled), Founder Announcements, AI Daily Brief,
Achievement Highlights.

## HOME EXPERIENCE RULES

1. **Five Second Rule** — Within five seconds of opening Nmood, every member
   must immediately understand what is happening nearby, why AI recommended
   something, and what they can do next.
2. **Three Click Rule** — Members should reach any major destination (Circle,
   Experience, Member Profile, Search, Create, Messaging) within three taps.
3. **One Action Rule** — Every Home widget must encourage one clear action
   (Join, Explore, Connect, Create, View). Avoid passive information without a
   clear next step.
4. **Delight Rule** — Every visit should contain at least one pleasant
   surprise (Magic Card, fresh AI recommendation, new Circle, nearby
   Experience, Context Greeting). Home should feel fresh without becoming
   unpredictable.
5. **Never Empty Rule** — The Home screen must never appear empty. If local
   content is unavailable, automatically expand the search radius, show nearby
   cities, show AI recommendations, and encourage creation of the first Circle
   or Experience.
6. **Human Connection Rule** — Every recommendation, widget and interaction
   must reinforce Nmood's mission: help people move from the digital world into
   meaningful real-world human connections.

## IMPORTANT — DO NOT MODIFY

- Recommendation Engine
- AI Algorithms
- Trust System
- Membership Rules
- Database Structure
- Permissions
- Mission Control

Only improve the Home experience.

## SUCCESS CRITERIA

- Home becomes a modular Home Experience Engine.
- Hyper-local discovery becomes the primary experience.
- "Today's Picks" becomes "Picked for You".
- Context Greetings and AI Greetings work intelligently.
- One Magic Card appears only when valuable.
- Dynamic widget ordering learns member behaviour gradually.
- Every content widget includes "Show All".
- Remaining "Communities" references become "Circles".
- Home never appears empty.
- Every widget loads independently.
- Navigation is intuitive and premium.
- Members immediately understand what is happening around them and are
  encouraged to participate in real-world activities.
- Existing business logic remains unchanged.

## RELEASE 1.0 ARCHITECTURE DECISION

This prompt represents the final Home experience for Nmood Release 1.0. After
implementing this enhancement:

- Freeze the Home architecture.
- Future Home enhancements shall be considered for Release 1.1 or later unless
  they resolve a critical defect.
- Do not introduce additional Home widgets, major workflows or redesigns
  before the Release 1.0 launch.