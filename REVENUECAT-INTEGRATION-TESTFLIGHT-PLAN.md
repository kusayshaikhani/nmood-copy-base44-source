# RevenueCat Integration — TestFlight Test Plan

**Version**: 1.0  
**Build**: 54  
**Date**: 2025-01-15  
**Scope**: Official RevenueCat Capacitor SDK integration; iOS in-app purchases via Apple App Store.

## Prerequisites

- **TestFlight Build**: iOS Build 54 installed on test device
- **Apple Developer Account**: Access to App Store Connect
- **Sandbox Tester Credentials**: Create 2–3 test accounts in App Store Connect under Sandbox Testers
  - Test Account 1 (FirstName: "Sandbox", LastName: "Tester1", Email: "sandbox1@example.com")
  - Test Account 2 (FirstName: "Sandbox", LastName: "Tester2", Email: "sandbox2@example.com")
- **Real Device**: Test on physical iPhone (RevenueCat SDK requires native platform, simulator may not work for all flows)
- **Network**: Stable internet connection (required for Supabase auth, RevenueCat sync, App Store validation)

## Test Environment Setup

### 1. Sandbox Tester Account Creation (App Store Connect)

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Sandbox Testers** → **iOS Testers**
3. Create a new test account:
   - **Full Name**: "Sandbox Tester 1"
   - **Email**: `sandbox1+nmood@example.com` (use unique email each time)
   - **Password**: Use a strong, memorable password (record securely)
   - **Date of Birth**: Set to any valid date making user 18+
4. Repeat for second test account
5. **Important**: Do NOT sign into these accounts with real Apple ID password; use ONLY in Sandbox environment

### 2. App Store Products Verification (App Store Connect)

Before starting tests, verify all RevenueCat products are available in App Store Connect:

1. **Go to App Store Connect** → **Apps** → **Nmood** → **In-App Purchases**
2. Verify these products exist and are in "Ready to Submit" or "Approved" status:
   - `com.nmood.realconnections.premium.monthly`
   - `com.nmood.realconnections.premium.quarterly`
   - `com.nmood.realconnections.premium.halfyear`
   - `com.nmood.realconnections.premium.annual`
3. Verify each product is:
   - **Type**: "Auto-Renewable Subscription"
   - **Duration**: Correct duration (1 month, 3 months, 6 months, 1 year)
   - **Price Tier**: Assigned (e.g., Tier 1 = $4.99/month)
   - **Subscription Group**: "nmood_premium" (or verify the correct group)
4. **If products are missing or inactive**: STOP. Report missing App Store products to developer; cannot proceed with purchase flow tests.

### 3. Device Setup

1. Install TestFlight build 54 on device via TestFlight app
2. **Sign out** of App Store (Settings → [Apple ID] → Sign Out) to ensure clean Sandbox state
3. Launch Nmood app
4. Verify app starts and reaches onboarding/home screen
5. Do NOT sign in yet (wait for test case instructions)

## Test Cases

### TC-001: Initial Authentication & RevenueCat Initialization
**Objective**: Verify RevenueCat initializes correctly after Supabase login.

**Steps**:
1. On Nmood home screen, sign up or log in with Supabase (use real email)
2. Complete onboarding if presented
3. Navigate to **Profile** or **Settings**
4. Verify user is authenticated (profile shows user info)

**Expected Results**:
- ✓ User successfully authenticates with Supabase
- ✓ RevenueCat SDK initializes silently in background (no visible dialogs)
- ✓ Profile page loads without errors
- ✓ No console errors related to RevenueCat initialization

**Notes**: RevenueCat initialization should happen once per authenticated session. If network is slow, there may be a brief delay.

---

### TC-002: Premium Membership Status (Explorer Default)
**Objective**: Verify default Explorer membership shows on unauthenticated device.

**Steps**:
1. From Profile page, scroll to membership section
2. Observe membership status

**Expected Results**:
- ✓ Membership card shows "Explorer" status
- ✓ "Upgrade" or "Become Premium" button visible
- ✓ No premium features/benefits visible (locked)

---

### TC-003: Load Available Plans from RevenueCat
**Objective**: Verify PremiumPlans fetches real products from RevenueCat's default offering (not hardcoded).

**Steps**:
1. From Profile, tap "Upgrade to Premium" or navigate to `/upgrade` page
2. Observe Premium Plans card section
3. Verify plan options displayed

**Expected Results**:
- ✓ Plan cards load (monthly, quarterly, half-year, annual)
- ✓ Each card displays **real App Store price** (e.g., "$4.99/month", "US$39.99/year")
- ✓ Prices match App Store Connect product configuration
- ✓ Plans are NOT hardcoded (if price in App Store changes, reflected here within 24h cache)
- ✓ One plan has "Recommended" badge (e.g., annual = "Best Value")

**Validation**:
- Compare displayed prices with App Store Connect:
  - Monthly: Should show per-month price + renewal message
  - Annual: Should show per-month breakdown + annual total

---

### TC-004: Monthly Plan Purchase (Sandbox Tester)
**Objective**: Verify purchase flow initiates and uses RevenueCat SDK.

**Prerequisites**:
- Sandbox Tester Account 1 created in App Store Connect
- Device signed out of App Store

**Steps**:
1. From Premium Plans screen, select "Monthly" plan card
2. Tap "Continue" button
3. Native Apple purchase sheet appears
4. Sign in with Sandbox Tester Account 1 credentials (first time will prompt)
5. Verify purchase in prompt
6. Tap "Confirm Purchase"

**Expected Results**:
- ✓ Native Apple purchase dialog appears (not web fallback)
- ✓ Dialog shows correct product ($4.99/month or equivalent)
- ✓ Login prompt accepts Sandbox Tester credentials
- ✓ Purchase completes without errors
- ✓ "Welcome to Premium" screen appears OR membership automatically updates
- ✓ Success toast/notification shown (e.g., "You're now Premium!" or similar)

**Validation**:
- After purchase, navigate to **Settings** → **Manage Subscription**:
  - ✓ Native Apple Manage Subscriptions screen opens
  - ✓ Shows active subscription "Nmood Premium – Monthly"
  - ✓ Renewal date displayed (30 days from purchase)

---

### TC-005: Annual Plan Purchase (Different Account)
**Objective**: Verify purchase works for different plan tier and sandbox account.

**Prerequisites**:
- Sandbox Tester Account 2 created
- Device still signed into Account 1 from TC-004
- Navigate back to Premium Plans

**Steps**:
1. From Premium Plans screen, select "Annual" plan
2. Tap "Continue"
3. Purchase dialog appears, showing annual product
4. Sign out from current Sandbox Tester and sign in with Account 2 (if prompted)
5. Confirm purchase

**Expected Results**:
- ✓ Annual product shown in purchase dialog (correct price, e.g., $39.99 or equivalent)
- ✓ Account switches to Sandbox Tester Account 2
- ✓ Purchase completes
- ✓ Membership updated to annual plan
- ✓ Profile shows "Annual" plan with renewal date 365 days out

---

### TC-006: Premium Badge & Renewal Date on Profile
**Objective**: Verify purchased membership displays correctly on Profile page.

**Prerequisites**:
- Just completed TC-005 (subscribed to annual plan)

**Steps**:
1. Navigate to **Profile** page
2. Scroll to membership section
3. Observe membership card details

**Expected Results**:
- ✓ Membership card shows "Premium" (not "Explorer")
- ✓ Plan name displayed: "Annual" or "Nmood Premium – Annual"
- ✓ Renewal date shown: "Renews on [Date]" (365 days from purchase)
- ✓ "Manage Subscription" button visible
- ✓ Premium features/benefits accessible (if any gated features)

---

### TC-007: Restore Purchases (Cross-Device Sync)
**Objective**: Verify RevenueCat restore purchases flow works correctly.

**Prerequisites**:
- Nmood account with at least one active subscription (from TC-004 or TC-005)
- Access to second device OR same device with fresh install

**Steps (Option A — Same Device)**:
1. From Premium Plans page, tap "Restore Purchases" button
2. Button shows loading state briefly
3. Observe result

**Steps (Option B — New Device)**:
1. Install TestFlight build 54 on second device
2. Sign in with same Supabase account that has subscription
3. Navigate to Premium Plans
4. Tap "Restore Purchases"

**Expected Results**:
- ✓ Restore completes within 2–3 seconds
- ✓ Subscription from first device is found and synced
- ✓ Membership updates to show active subscription
- ✓ Renewal date matches original subscription
- ✓ No duplicate charges (RevenueCat handles deduplication)
- ✓ Success toast shown (e.g., "Subscription restored" or similar)

**Validation**:
- Check App Store Connect Sandbox Testers:
  - Subscription should still show as active
  - No new charge recorded
  - Cross-device sync verified: same entitlement on both devices

---

### TC-008: Manage Subscriptions — Apple Native Interface
**Objective**: Verify opening native Apple Manage Subscriptions UI.

**Prerequisites**:
- Active premium subscription (from TC-004 or TC-005)

**Steps**:
1. From Profile membership card, tap "Manage Subscription" button
2. Native iOS Manage Subscriptions screen opens

**Expected Results**:
- ✓ Native iOS Settings page opens (not web page or in-app screen)
- ✓ Shows "Nmood Premium" subscription
- ✓ Displays plan (Monthly / Annual / etc.)
- ✓ Shows next renewal date
- ✓ Cancel subscription button available
- ✓ Option to change plan visible

---

### TC-009: Cancel Subscription (Grace Period Handling)
**Objective**: Verify cancellation in Apple Settings and grace period behavior.

**Prerequisites**:
- Active premium subscription
- Can access Apple Settings (from TC-008)

**Steps**:
1. Tap subscription in Apple Settings
2. Tap "Cancel Subscription" or "Delete Subscription"
3. Confirm cancellation
4. Return to Nmood app
5. Navigate to Profile membership card

**Expected Results**:
- ✓ Cancellation confirmed in Apple Settings
- ✓ Nmood app still shows active premium until expiration (grace period)
- ✓ Renewal date no longer updates
- ✓ Membership status may show "Cancelling" or "Expires on [Date]"
- ✓ After renewal date passes, membership reverts to Explorer
- ✓ No error when checking entitlement after cancellation

---

### TC-010: Entitlement Refresh on App Foreground
**Objective**: Verify membership refreshes when app returns to foreground (e.g., after returning from Manage Subscriptions).

**Prerequisites**:
- Active premium subscription

**Steps**:
1. Open Nmood app (already on Profile with active premium)
2. Minimize app (press Home button)
3. Wait 5 seconds
4. Open another app (e.g., Safari)
5. Navigate to Manage Subscriptions (in Settings)
6. Simulate a subscription change (or just navigate around)
7. Return to Nmood app
8. Observe membership status

**Expected Results**:
- ✓ Membership refreshes from RevenueCat when app becomes active
- ✓ Any changes in Manage Subscriptions (cancellation, plan change) reflected within 5 seconds
- ✓ No user action required (automatic refresh)
- ✓ No error messages

---

### TC-011: Error Handling — Network Failure
**Objective**: Verify graceful error handling if RevenueCat SDK is unreachable.

**Prerequisites**:
- Device has active subscription

**Steps**:
1. Enable Airplane Mode on device
2. Go to Premium Plans page
3. Try to load plans
4. Try to restore purchases
5. Disable Airplane Mode

**Expected Results**:
- ✓ Error message displayed (e.g., "Unable to load plans" or "Check your connection")
- ✓ App does NOT crash
- ✓ After re-enabling connection, retry works
- ✓ Cached membership still shows (no loss of access)

---

### TC-012: Quarterly & Half-Year Plan Verification
**Objective**: Verify all plan durations work (not just Monthly & Annual).

**Prerequisites**:
- Sandbox Tester Account 3 (create new one for clean account)

**Steps**:
1. Sign in with fresh Sandbox Tester Account 3
2. Navigate to Premium Plans
3. Verify "Quarterly" and "Half-Year" options are visible
4. Select "Quarterly" plan
5. Complete purchase
6. Verify renewal date = 90 days from purchase

**Expected Results**:
- ✓ All four plan options visible: Monthly, Quarterly, Half-Year, Annual
- ✓ Quarterly purchase completes
- ✓ Renewal date correctly calculated (89–91 days from purchase)
- ✓ Plan name shows "Quarterly" or "3-Month"

---

### TC-013: Membership State Persistence
**Objective**: Verify membership state persists across app kill/restart.

**Prerequisites**:
- Active premium subscription

**Steps**:
1. Open Nmood app; observe premium membership on Profile
2. Force-kill app (swipe up or use Xcode)
3. Reopen app from icon
4. Wait for auth to restore
5. Navigate to Profile

**Expected Results**:
- ✓ Auth restores (user logged in)
- ✓ Membership loads (no delay > 3 seconds)
- ✓ Premium status still shows correctly
- ✓ No re-authentication required

---

### TC-014: Premium Features Gating (If Applicable)
**Objective**: Verify premium-only features are accessible with subscription, locked without.

**Prerequisites**:
- Two test accounts: one Explorer, one Premium (subscribed)

**Steps**:
1. Log in with Explorer account
2. Identify premium-gated feature (e.g., advanced search, AI assistant, etc.)
3. Attempt to use feature
4. Observe: should show "Upgrade" prompt
5. Log out
6. Log in with Premium account (subscribed)
7. Attempt same feature

**Expected Results**:
- ✓ Explorer account: Feature locked, upgrade prompt shown
- ✓ Premium account: Feature accessible, no upgrade prompt
- ✓ Permissions checked via RevenueCat entitlement (not hardcoded)

---

### TC-015: Regression Testing — Existing Features
**Objective**: Verify RevenueCat integration doesn't break existing features.

**Test Scope**:
- Authentication flow (Supabase login/signup)
- Home page (no demo content, real Supabase data)
- Circles (real data, no PREVIEW_CIRCLES)
- Nmood Assistant (Supabase backend, no simulated responses)
- Settings page (loading, navigation)
- Profile page (user info, membership card)

**Steps**:
1. Navigate through each section
2. Perform key actions (create circle, message, etc.)
3. Verify no new errors appear in console

**Expected Results**:
- ✓ All existing features work as before
- ✓ No console errors related to new code
- ✓ No regressions in UX/layout
- ✓ Load times acceptable (< 3 seconds for pages)

---

## Test Execution Log

| TC ID | Date | Tester | Device | Result | Notes |
|-------|------|--------|--------|--------|-------|
| TC-001 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-002 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-003 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-004 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-005 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-006 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-007 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-008 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-009 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-010 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-011 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-012 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-013 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-014 |  |  |  | ☐ Pass ☐ Fail |  |
| TC-015 |  |  |  | ☐ Pass ☐ Fail |  |

## Sign-Off

- **Tester Name**: ________________________
- **Date**: ________________________
- **All Tests Passed**: ☐ Yes ☐ No
- **Known Issues**: 

---

## Rollback Plan

If critical issues found during TestFlight:

1. **Immediate Revert**: Checkout previous commit (dc5c6cb), build iOS 53
2. **Hotfix**: If issue is localized (e.g., single UI bug), patch and increment to 54
3. **Escalation**: If RevenueCat SDK has blocking bugs, contact RevenueCat support or revert to Base44 backend approach

---

## Documentation Links

- RevenueCat API: https://docs.revenuecat.com/docs/capacitor
- App Store Connect: https://appstoreconnect.apple.com
- Nmood GitHub: [repository URL]
- Session Notes: See AGENTS.md for project context
