import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LocalizationProvider } from '@/lib/i18n/LocalizationProvider';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import EligibilityGate from '@/components/eligibility/EligibilityGate';
import { MembershipProvider } from '@/components/membership/MembershipProvider';
import { SafetyProvider } from '@/lib/safety-store';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { SuccessProvider } from '@/components/ux/SuccessProvider';
import { ConfirmProvider } from '@/components/ux/ConfirmProvider';
import BrandLogo from '@/components/brand/BrandLogo';
import BrandedSplash from '@/components/brand/BrandedSplash';
import { BRAND } from '@/lib/system-config';
import { installGlobalErrorHandler, captureError } from '@/lib/error-reporter';
import { recordAppStartup } from '@/lib/performance-monitor';
import { runStartupValidation } from '@/lib/startup-validation';
import { installNativeRecoveryLinkHandler } from '@/lib/native-recovery-link';
import SectionBoundary from '@/components/shared/SectionBoundary';

// Public pages
import Splash from '@/pages/Splash';
import Welcome from '@/pages/Welcome';
import LanguageSelect from '@/pages/LanguageSelect';
import SignIn from '@/pages/SignIn';
import CreateAccount from '@/pages/CreateAccount';
import EmailVerification from '@/pages/EmailVerification';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ErrorPage from '@/pages/ErrorPage';
import Offline from '@/pages/Offline';

// PERF-001: protected + admin pages are code-split so they never ship in the
// initial bundle. Public auth pages stay eager for fast first-login.
const AppShell = lazy(() => import('@/components/layout/AppShell'));
const Home = lazy(() => import('@/pages/Home'));
const Explore = lazy(() => import('@/pages/Explore'));
const Journal = lazy(() => import('@/pages/Journal'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Help = lazy(() => import('@/pages/Help'));
const About = lazy(() => import('@/pages/About'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const ExperienceDetail = lazy(() => import('@/pages/ExperienceDetail'));
const ExperienceChat = lazy(() => import('@/pages/ExperienceChat'));
const ExperienceDay = lazy(() => import('@/pages/ExperienceDay'));
const MyExperiences = lazy(() => import('@/pages/MyExperiences'));
const Saved = lazy(() => import('@/pages/Saved'));
const Communities = lazy(() => import('@/pages/Communities'));
const CommunityDetail = lazy(() => import('@/pages/CommunityDetail'));
const CircleDetail = lazy(() => import('@/pages/CircleDetail'));
const CommunityGuidelines = lazy(() => import('@/pages/CommunityGuidelines'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'));
const SubscriptionTerms = lazy(() => import('@/pages/SubscriptionTerms'));
const CookieNotice = lazy(() => import('@/pages/CookieNotice'));
const AiConciergeNotice = lazy(() => import('@/pages/AiConciergeNotice'));
const AccountDeletion = lazy(() => import('@/pages/AccountDeletion'));
const Support = lazy(() => import('@/pages/Support'));
const LegalCenter = lazy(() => import('@/pages/LegalCenter'));
const Pals = lazy(() => import('@/pages/Pals'));
const RelationshipTimeline = lazy(() => import('@/pages/RelationshipTimeline'));
const ConnectedProfile = lazy(() => import('@/pages/ConnectedProfile'));
const HostDashboard = lazy(() => import('@/pages/HostDashboard'));
const CreateActivity = lazy(() => import('@/pages/CreateActivity'));
const CreateCircle = lazy(() => import('@/pages/CreateCircle'));
const MyCalendar = lazy(() => import('@/pages/MyCalendar'));
const SafetyCenter = lazy(() => import('@/pages/SafetyCenter'));
const SafetyCenterPublic = lazy(() => import('@/pages/SafetyCenterPublic'));
const Membership = lazy(() => import('@/pages/Membership'));
const Upgrade = lazy(() => import('@/pages/Upgrade'));
const RelationshipHub = lazy(() => import('@/pages/RelationshipHub'));
const Search = lazy(() => import('@/pages/Search'));
const Journey = lazy(() => import('@/pages/Journey'));
const Goals = lazy(() => import('@/pages/Goals'));
const GoalDetail = lazy(() => import('@/pages/GoalDetail'));
const LookingFor = lazy(() => import('@/pages/LookingFor'));
const DiscoverPeople = lazy(() => import('@/pages/DiscoverPeople'));
const Nmoods = lazy(() => import('@/pages/Nmoods'));
const NmoodDetail = lazy(() => import('@/pages/NmoodDetail'));
const SocialPlanner = lazy(() => import('@/pages/SocialPlanner'));
const InMood = lazy(() => import('@/pages/InMood'));
const InMoodV2 = lazy(() => import('@/pages/InMoodV2'));
const AiConciergeTest = lazy(() => import('@/pages/AiConciergeTest'));
const Concierge = lazy(() => import('@/pages/Concierge'));
const IndependentNmood = lazy(() => import('@/pages/IndependentNmood'));
const ProfileViews = lazy(() => import('@/pages/ProfileViews'));
const Messages = lazy(() => import('@/pages/Messages'));
const Chat = lazy(() => import('@/pages/Chat'));

// Admin — even heavier; isolated in their own chunks.
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminRoute = lazy(() => import('@/components/admin/AdminRoute'));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminMembers = lazy(() => import('@/pages/admin/AdminMembers'));
const AdminActivities = lazy(() => import('@/pages/admin/AdminActivities'));
const AdminCircles = lazy(() => import('@/pages/admin/AdminCircles'));
const AdminHosts = lazy(() => import('@/pages/admin/AdminHosts'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));
const AdminMemberships = lazy(() => import('@/pages/admin/AdminMemberships'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminContent = lazy(() => import('@/pages/admin/AdminContent'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminProduct = lazy(() => import('@/pages/admin/AdminProduct'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'));
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport'));
const QaDashboard = lazy(() => import('@/pages/admin/QaDashboard'));
const SecurityCenter = lazy(() => import('@/pages/admin/SecurityCenter'));
const ObservabilityCenter = lazy(() => import('@/pages/admin/ObservabilityCenter'));
const OpsDashboard = lazy(() => import('@/pages/admin/ops/OpsDashboard'));
const OpsChecklist = lazy(() => import('@/pages/admin/ops/OpsChecklist'));
const OpsIssues = lazy(() => import('@/pages/admin/ops/OpsIssues'));
const OpsReleases = lazy(() => import('@/pages/admin/ops/OpsReleases'));
const OpsReleaseDefinition = lazy(() => import('@/pages/admin/ops/OpsReleaseDefinition'));
const OpsBuildNotes = lazy(() => import('@/pages/admin/ops/OpsBuildNotes'));
const OpsQuality = lazy(() => import('@/pages/admin/ops/OpsQuality'));
const OpsHealth = lazy(() => import('@/pages/admin/ops/OpsHealth'));
const OpsErrors = lazy(() => import('@/pages/admin/ops/OpsErrors'));
const OpsAudit = lazy(() => import('@/pages/admin/ops/OpsAudit'));
const OpsFlags = lazy(() => import('@/pages/admin/ops/OpsFlags'));
const OpsConfig = lazy(() => import('@/pages/admin/ops/OpsConfig'));
const OpsPerformance = lazy(() => import('@/pages/admin/ops/OpsPerformance'));
const FounderAcceptanceTesting = lazy(() => import('@/pages/admin/ops/FounderAcceptanceTesting'));
const StoreReadiness = lazy(() => import('@/pages/admin/ops/StoreReadiness'));
const LegalCompliance = lazy(() => import('@/pages/admin/ops/LegalCompliance'));
const LaunchPlan = lazy(() => import('@/pages/admin/ops/LaunchPlan'));

// Founder Mission Control (FM-001) — framework + 19 modular placeholder pages.
const FounderRoute = lazy(() => import('@/components/mission-control/FounderRoute'));
const MissionControlLayout = lazy(() => import('@/components/mission-control/MissionControlLayout'));
const MCDashboard = lazy(() => import('@/pages/mission-control/MCDashboard'));
const MCMembers = lazy(() => import('@/pages/mission-control/MCMembers'));
const MCTrustSafety = lazy(() => import('@/pages/mission-control/MCTrustSafety'));
const MCMessaging = lazy(() => import('@/pages/mission-control/MCMessaging'));
const MCAiIntelligence = lazy(() => import('@/pages/mission-control/MCAiIntelligence'));
const MCAiBrain = lazy(() => import('@/pages/mission-control/MCAiBrain'));
const MCPersonalIntelligence = lazy(() => import('@/pages/mission-control/MCPersonalIntelligence'));
const MCAiOps = lazy(() => import('@/pages/mission-control/MCAiOps'));
const MCCommunity = lazy(() => import('@/pages/mission-control/MCCommunity'));
const MCNotifications = lazy(() => import('@/pages/mission-control/MCNotifications'));
const MCMemberships = lazy(() => import('@/pages/mission-control/MCMemberships'));
const MCAnalytics = lazy(() => import('@/pages/mission-control/MCAnalytics'));
const MCRevenue = lazy(() => import('@/pages/mission-control/MCRevenue'));
const MCCountries = lazy(() => import('@/pages/mission-control/MCCountries'));
const MCLanguages = lazy(() => import('@/pages/mission-control/MCLanguages'));
const MCPlatformSettings = lazy(() => import('@/pages/mission-control/MCPlatformSettings'));
const MCSecurity = lazy(() => import('@/pages/mission-control/MCSecurity'));
const MCAuditLogs = lazy(() => import('@/pages/mission-control/MCAuditLogs'));
const MCMediaLibrary = lazy(() => import('@/pages/mission-control/MCMediaLibrary'));
const MCSystemHealth = lazy(() => import('@/pages/mission-control/MCSystemHealth'));
const MCFeatureFlags = lazy(() => import('@/pages/mission-control/MCFeatureFlags'));
const MCPlatformOperations = lazy(() => import('@/pages/mission-control/MCPlatformOperations'));
const MCProductionHardening = lazy(() => import('@/pages/mission-control/MCProductionHardening'));
const MCLaunchCenter = lazy(() => import('@/pages/mission-control/MCLaunchCenter'));

// PERF-001: lightweight fallback shown while a lazy route chunk loads.
function RouteFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}

// Nmood's assistant uses optional AI and conversation services.  A failure in
// one of those services must not turn the entire route into a blank screen or
// trap a member away from the rest of the app.
function NmoodRouteFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">✦</div>
      <h1 className="text-lg font-semibold text-foreground">Nmood needs a moment</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We could not open your Nmood assistant right now. Your account and conversations are safe.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 rounded-full bg-nmood-cta px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-default hover:shadow-elevated"
      >
        Try again
      </button>
    </div>
  );
}

// Public paths that render without authentication — legal/support pages must
// stay accessible to signed-out visitors. Keep in sync with the <Route> list below.
const PUBLIC_PATHS = new Set([
  '/splash', '/welcome', '/language-select',
  '/auth', '/login',
  '/register', '/signup', '/create-account',
  '/verify-email', '/verify-otp',
  '/forgot-password', '/reset-password',
  '/error', '/offline',
  '/privacy', '/privacy-policy', '/terms', '/refund-policy',
  '/account-deletion', '/support', '/legal',
  '/community-guidelines', '/subscription-terms', '/cookie-notice', '/ai-concierge-notice',
  '/safety', '/delete-account',
]);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isPublicPath = PUBLIC_PATHS.has(normalizedPath);

  if (isLoadingPublicSettings || isLoadingAuth) {
    // Single startup surface — the SAME branded splash as the /splash route
    // (gradient + N mark + slogan), so the native system splash, auth
    // bootstrap, and slogan screen present as ONE continuous branded splash
    // instead of a spinner-only loading screen followed by a second timed splash.
    return <BrandedSplash />;
  }

  // Public routes render regardless of auth state — never redirect them to login.
  if (authError && !isPublicPath) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Navigate to="/splash" replace />;
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public */}
      <Route path="/splash" element={<Splash />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/language-select" element={<LanguageSelect />} />
      <Route path="/auth" element={<SignIn />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<CreateAccount />} />
      <Route path="/signup" element={<CreateAccount />} />
      <Route path="/create-account" element={<CreateAccount />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/verify-otp" element={<EmailVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/offline" element={<Offline />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/community-guidelines" element={<CommunityGuidelines />} />
      <Route path="/safety" element={<SafetyCenterPublic />} />
      <Route path="/delete-account" element={<AccountDeletion />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/subscription-terms" element={<SubscriptionTerms />} />
      <Route path="/cookie-notice" element={<CookieNotice />} />
      <Route path="/ai-concierge-notice" element={<AiConciergeNotice />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/account-deletion" element={<AccountDeletion />} />
      <Route path="/support" element={<Support />} />
      <Route path="/legal" element={<LegalCenter />} />

      {/* Protected — wrapped in AppShell */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/splash" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/nmood/:id" element={<NmoodDetail />} />
        <Route element={<EligibilityGate />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/inmood" element={<InMood />} />
          <Route path="/inmood-v2" element={<InMoodV2 />} />
          <Route path="/ai-concierge-test" element={<AiConciergeTest />} />
          <Route path="/nmood" element={
            <SectionBoundary fallback={<NmoodRouteFallback />}>
              <IndependentNmood />
            </SectionBoundary>
          } />
          <Route path="/profile-views" element={<ProfileViews />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/privacy" element={<Privacy />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route path="/experience/:id" element={<ExperienceDetail />} />
          <Route path="/experience/:id/chat" element={<ExperienceChat />} />
          <Route path="/experience/:id/day" element={<ExperienceDay />} />
          <Route path="/my-experiences" element={<MyExperiences />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/pals" element={<Pals />} />
          <Route path="/messages" element={<SectionBoundary fallback={<NmoodRouteFallback />}><Messages /></SectionBoundary>} />
          <Route path="/messages/:palId" element={<Chat />} />
          <Route path="/pal/:id/timeline" element={<RelationshipTimeline />} />
          <Route path="/pal/:id" element={<ConnectedProfile />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/create" element={<CreateActivity />} />
          <Route path="/host/create-circle" element={<CreateCircle />} />
          <Route path="/calendar" element={<MyCalendar />} />
          <Route path="/safety-center" element={<SafetyCenter />} />
          <Route path="/membership" element={<Navigate to="/settings" replace />} />
          <Route path="/upgrade" element={<Navigate to="/settings" replace />} />
          <Route path="/relationship-hub" element={<RelationshipHub />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/goals/:id" element={<GoalDetail />} />
          <Route path="/looking-for" element={<LookingFor />} />
          <Route path="/discover-people" element={<DiscoverPeople />} />
          <Route path="/nmoods" element={<Nmoods />} />
          <Route path="/planner" element={<SocialPlanner />} />
          <Route path="/search" element={<Search />} />
          <Route path="/communities" element={<SectionBoundary fallback={<NmoodRouteFallback />}><Communities /></SectionBoundary>} />
          <Route path="/community/:id" element={<CommunityDetail />} />
          <Route path="/circle/:id" element={<CircleDetail />} />
        </Route>
        </Route>
      </Route>

      {/* Admin Portal */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="activities" element={<AdminActivities />} />
          <Route path="circles" element={<AdminCircles />} />
          <Route path="hosts" element={<AdminHosts />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="memberships" element={<AdminMemberships />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="product" element={<AdminProduct />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="qa" element={<QaDashboard />} />
          <Route path="security" element={<SecurityCenter />} />
          <Route path="observability" element={<ObservabilityCenter />} />
          <Route path="ops" element={<OpsDashboard />} />
          <Route path="ops/checklist" element={<OpsChecklist />} />
          <Route path="ops/issues" element={<OpsIssues />} />
          <Route path="ops/releases" element={<OpsReleases />} />
          <Route path="ops/release-definition" element={<OpsReleaseDefinition />} />
          <Route path="ops/build-notes" element={<OpsBuildNotes />} />
          <Route path="ops/quality" element={<OpsQuality />} />
          <Route path="ops/health" element={<OpsHealth />} />
          <Route path="ops/errors" element={<OpsErrors />} />
          <Route path="ops/audit" element={<OpsAudit />} />
          <Route path="ops/flags" element={<OpsFlags />} />
          <Route path="ops/config" element={<OpsConfig />} />
          <Route path="ops/performance" element={<OpsPerformance />} />
          <Route path="ops/acceptance-testing" element={<FounderAcceptanceTesting />} />
          <Route path="ops/store-readiness" element={<StoreReadiness />} />
          <Route path="ops/legal-compliance" element={<LegalCompliance />} />
          <Route path="ops/launch-plan" element={<LaunchPlan />} />
        </Route>
      </Route>

      {/* Founder Mission Control (FM-001) — framework only, no dashboards yet */}
      <Route element={<FounderRoute />}>
        <Route path="/mission-control" element={<MissionControlLayout />}>
          <Route index element={<MCDashboard />} />
          <Route path="members" element={<MCMembers />} />
          <Route path="trust-safety" element={<MCTrustSafety />} />
          <Route path="messaging" element={<MCMessaging />} />
          <Route path="ai-intelligence" element={<MCAiIntelligence />} />
          <Route path="ai-brain" element={<MCAiBrain />} />
          <Route path="personal-intelligence" element={<MCPersonalIntelligence />} />
          <Route path="ai-operations" element={<MCAiOps />} />
          <Route path="community" element={<MCCommunity />} />
          <Route path="experiences" element={<Navigate to="/mission-control/community" replace />} />
          <Route path="circles" element={<Navigate to="/mission-control/community" replace />} />
          <Route path="notifications" element={<MCNotifications />} />
          <Route path="memberships" element={<MCMemberships />} />
          <Route path="analytics" element={<MCAnalytics />} />
          <Route path="revenue" element={<MCRevenue />} />
          <Route path="countries" element={<MCCountries />} />
          <Route path="languages" element={<MCLanguages />} />
          <Route path="platform-settings" element={<MCPlatformSettings />} />
          <Route path="security" element={<MCSecurity />} />
          <Route path="audit-logs" element={<MCAuditLogs />} />
          <Route path="media-library" element={<MCMediaLibrary />} />
          <Route path="system-health" element={<MCSystemHealth />} />
          <Route path="feature-flags" element={<MCFeatureFlags />} />
          <Route path="platform-operations" element={<MCPlatformOperations />} />
          <Route path="production-hardening" element={<MCProductionHardening />} />
          <Route path="launch-center" element={<MCLaunchCenter />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

function App() {
  useEffect(() => {
    installGlobalErrorHandler();
    recordAppStartup();
    runStartupValidation();

    let removeRecoveryListener = () => {};
    installNativeRecoveryLinkHandler()
      .then((remove) => { removeRecoveryListener = remove; })
      .catch((error) => console.error('[Native recovery link]', error));

    return () => removeRecoveryListener();
  }, []);
  return (
    <ThemeProvider>
      <LocalizationProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <MembershipProvider>
              <SafetyProvider>
                <SuccessProvider>
                  <ConfirmProvider>
                    <AuthenticatedApp />
                  </ConfirmProvider>
                </SuccessProvider>
              </SafetyProvider>
            </MembershipProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App
