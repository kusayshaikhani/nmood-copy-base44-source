#!/usr/bin/env node
/**
 * MP-004A — Localization Governance Scanner (development-time, authoritative).
 *
 * Permanent engineering standard for the Nmood platform. Runs the full set
 * of quality gates that the in-browser runtime validator (validate.js) cannot
 * perform because it has no filesystem access:
 *
 *   1. Missing translation keys (parity vs English)
 *   2. Duplicate keys within a translation file
 *   3. Invalid interpolation (malformed {token} placeholders)
 *   4. Invalid ICU plural syntax (bad categories, missing `other` branch)
 *   5. Malformed translation files (no keys parsed / empty)
 *   6. Unused translation keys (not referenced by any t('key') call site)
 *   7. Hardcoded user-facing strings in localized modules
 *
 * Every diagnostic includes: file, line, offending string, and a recommended
 * localization key. Fails the build when any error-level rule is violated.
 *
 * Runnable:
 *   node src/lib/i18n/governance.cjs            # human report, exit code
 *   node src/lib/i18n/governance.cjs --json     # machine-readable JSON
 *
 * Also importable:  const { run } = require('./src/lib/i18n/governance.cjs')
 *
 * This file is CommonJS so Vite never bundles it; it is a dev tool only and
 * does not touch business logic.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '..', '..', '..');
const TRANSLATIONS_DIR = path.join(HERE, 'translations');
const SUPPORTED_LANGS = ['en', 'ar', 'es', 'fr', 'de', 'it', 'ru'];
const VALID_PLURAL_CATS = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

// Fail the gate when unused keys exceed this count (governance: zero tolerance).
const UNUSED_THRESHOLD = 0;
// Brand proper nouns that may appear as literals (prefer system-config constants).
const BRAND_EXCEPTIONS = new Set(['Nmood']);

// Shared base vocabulary namespaces — intentionally pre-seeded for reuse
// across all modules (see LOCALIZATION_GUIDE.md §2.3). Exempt from the
// unused-key gate; they are the reusable word set, not dead keys.
const SHARED_VOCAB_NAMESPACES = new Set(['common', 'nav']);

// Namespaces actively seeded for the immediate next localization phase.
// Reported as "planned" rather than failed. Remove from this set once the
// module ships and all keys are referenced.
const PLANNED_NAMESPACES = new Set(['home', 'discovery', 'search', 'livepulse', 'profile', 'trust', 'connections', 'messaging', 'safety', 'circles', 'experiences', 'hosting', 'attendance', 'calendar', 'community', 'invitation']);

/**
 * MP-005+ append new files here as each module is localized. The governance
 * gate scans only these files for hardcoded strings, so un-localized legacy
 * modules do not produce noise while localized modules stay clean.
 */
const LOCALIZED_MODULES = [
  // Authentication
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/ForgotPassword.jsx',
  'src/pages/ResetPassword.jsx',
  'src/pages/Welcome.jsx',
  'src/pages/LanguageSelect.jsx',
  'src/pages/Splash.jsx',
  'src/components/AuthLayout.jsx',
  // Onboarding
  'src/pages/Onboarding.jsx',
  'src/components/onboarding/OnboardingShell.jsx',
  'src/components/onboarding/steps/BasicProfileStep.jsx',
  'src/components/onboarding/steps/InterestsStep.jsx',
  'src/components/onboarding/steps/LanguagesStep.jsx',
  'src/components/onboarding/steps/LocationStep.jsx',
  'src/components/onboarding/steps/NotificationsStep.jsx',
  'src/components/onboarding/steps/PrivacyStep.jsx',
  'src/components/onboarding/steps/CompleteStep.jsx',
  // Home
  'src/pages/Home.jsx',
  'src/components/home/ContextGreeting.jsx',
  'src/components/home/HomeWidget.jsx',
  'src/components/home/InMoodForCard.jsx',
  'src/components/home/MagicCard.jsx',
  'src/components/home/ExperienceSection.jsx',
  'src/components/home/CirclesNearYou.jsx',
  'src/components/home/ExperiencesNearYou.jsx',
  'src/components/home/UpcomingActivities.jsx',
  'src/components/home/ContinueExploring.jsx',
  'src/components/home/HomeEmptyState.jsx',
  'src/components/home/HomeSkeleton.jsx',
  'src/components/home/ExperienceCard.jsx',
  'src/components/home/HostTypeSheet.jsx',
  // Discovery & Search (MP-006)
  'src/pages/Explore.jsx',
  'src/pages/Search.jsx',
  'src/pages/DiscoverPeople.jsx',
  'src/components/discover/DiscoverCard.jsx',
  'src/components/discover/SearchResultCard.jsx',
  'src/components/discover/QuickFilters.jsx',
  'src/components/discover/MapView.jsx',
  'src/components/discover/ExperienceSkeleton.jsx',
  'src/components/discover/DiscoverError.jsx',
  'src/components/discover/ExperienceSection.jsx',
  'src/components/discover/FilterSheet.jsx',
  'src/components/search/SearchBar.jsx',
  'src/components/search/PersonResult.jsx',
  'src/components/search/CategoryResult.jsx',
  'src/components/search/RecentSearches.jsx',
  'src/components/search/SearchFilters.jsx',
  'src/components/search/SearchEmpty.jsx',
  'src/components/search/ActivityResult.jsx',
  'src/components/search/TrendingSearches.jsx',
  'src/components/search/SearchCategories.jsx',
  'src/components/search/HostResult.jsx',
  'src/components/matchmaker/MatchmakerSection.jsx',
  'src/components/matchmaker/MemberDiscoveryCard.jsx',
  'src/components/matchmaker/MatchmakerFilters.jsx',
  'src/components/matchmaker/WhyRecommendedSheet.jsx',
  'src/components/matchmaker/MemberActionsSheet.jsx',
  'src/components/matchmaker/PhotoViewer.jsx',
  // Live Pulse
  'src/components/live-pulse/LivePulseSection.jsx',
  'src/components/live-pulse/LocalDiscovery.jsx',
  'src/components/live-pulse/PopularNow.jsx',
  'src/components/live-pulse/AreaTrends.jsx',
  'src/components/live-pulse/CityTrends.jsx',
  'src/components/live-pulse/SmartDiscovery.jsx',
  // Profile & Trust/Verification (MP-007)
  'src/pages/Profile.jsx',
  'src/pages/ConnectedProfile.jsx',
  'src/components/profile/ProfileStatusCard.jsx',
  'src/components/profile/BioCard.jsx',
  'src/components/profile/AboutSection.jsx',
  'src/components/profile/PhotoGallery.jsx',
  'src/components/profile/MemberInfo.jsx',
  'src/components/profile/PrivacyControls.jsx',
  'src/components/profile/SafetySection.jsx',
  'src/components/profile/TrustVerification.jsx',
  'src/components/profile/EditProfileSheet.jsx',
  'src/components/profile/ProfileAvatar.jsx',
  'src/components/myinmood/MyInMoodHeader.jsx',
  // Connections & Messaging (MP-008)
  'src/pages/Pals.jsx',
  'src/pages/Messages.jsx',
  'src/pages/Chat.jsx',
  'src/components/pals/PalCard.jsx',
  'src/components/pals/RequestCard.jsx',
  'src/components/pals/EmptyPals.jsx',
  'src/components/pals/PalDetailSheet.jsx',
  'src/components/pals/InvitePalSheet.jsx',
  'src/components/pals/PalsAcceptedSheet.jsx',
  'src/components/pals/PalCardMenu.jsx',
  'src/components/pals/MultiInviteBar.jsx',
  'src/components/pals/PalTimeline.jsx',
  'src/components/pals/FilterTabs.jsx',
  'src/components/pals/SuggestedPalCard.jsx',
  'src/components/connections/ConnectButton.jsx',
  'src/components/connections/ExplorerLimitNotice.jsx',
  'src/components/invite/InvitePalsSheet.jsx',
  'src/components/invite/PalSelectionList.jsx',
  'src/components/invite/InvitationPreview.jsx',
  'src/components/invite/SelectedPalChips.jsx',
  'src/components/invite/InvitationCard.jsx',
  'src/components/messaging/ConversationCard.jsx',
  'src/components/messaging/MessagesEmpty.jsx',
  'src/components/messaging/ChatHeader.jsx',
  'src/components/messaging/MessageBubble.jsx',
  'src/components/messaging/MessageComposer.jsx',
  'src/components/messaging/MessageOptionsSheet.jsx',
  'src/components/messaging/ShareMessage.jsx',
  'src/components/safety/ReportSheet.jsx',
  'src/components/safety/BlockConfirmSheet.jsx',
  // Community Platform (MP-009)
  'src/pages/CircleDetail.jsx',
  'src/pages/ExperienceDetail.jsx',
  'src/pages/ExperienceChat.jsx',
  'src/pages/ExperienceDay.jsx',
  'src/pages/MyExperiences.jsx',
  'src/pages/HostDashboard.jsx',
  'src/pages/CreateActivity.jsx',
  'src/pages/MyCalendar.jsx',
  'src/pages/Communities.jsx',
  'src/pages/CommunityDetail.jsx',
  'src/pages/CommunityGuidelines.jsx',
  'src/components/circles/CircleCard.jsx',
  'src/components/circles/CircleAbout.jsx',
  'src/components/circles/CircleMembers.jsx',
  'src/components/circles/CircleChat.jsx',
  'src/components/circles/CircleActionBar.jsx',
  'src/components/circles/CircleInviteSheet.jsx',
  'src/components/circles/CircleExperiences.jsx',
  'src/components/circles/CircleMemories.jsx',
  'src/components/circles/CircleLocation.jsx',
  'src/components/circles/CircleSection.jsx',
  'src/components/circles/EditCircleSheet.jsx',
  'src/components/circles/DeleteConfirmSheet.jsx',
  'src/components/circles/ManageCircleSheet.jsx',
  'src/components/circles/ManageMembersSheet.jsx',
  'src/components/circles/MessageBubble.jsx',
  'src/components/circles/MessageActionsSheet.jsx',
  'src/components/circles/InMoodActions.jsx',
  'src/components/circles/TransferOwnershipSheet.jsx',
  'src/components/circles/EmojiPicker.jsx',
  'src/components/experience/ExperienceHero.jsx',
  'src/components/experience/ExperienceSummary.jsx',
  'src/components/experience/ExperienceAbout.jsx',
  'src/components/experience/HostCard.jsx',
  'src/components/experience/BudgetSection.jsx',
  'src/components/experience/ExperienceLocation.jsx',
  'src/components/experience/AttendeesList.jsx',
  'src/components/experience/JoinStateButton.jsx',
  'src/components/experience/JoinOptions.jsx',
  'src/components/experience/JoinConfirmationSheet.jsx',
  'src/components/experience/JoinSuccessOverlay.jsx',
  'src/components/experience/WaitingListSheet.jsx',
  'src/components/experience/LeaveConfirmationSheet.jsx',
  'src/components/experience/RateExperienceSheet.jsx',
  'src/components/experience/BecomePalsSheet.jsx',
  'src/components/experience/ShareSheet.jsx',
  'src/components/experience/AddToCalendarSheet.jsx',
  'src/components/experience/RemindersSection.jsx',
  'src/components/experience/SafetyTrustSection.jsx',
  'src/components/experience/SimilarExperiences.jsx',
  'src/components/experience/HostControlsBar.jsx',
  'src/components/experience/EditExperienceSheet.jsx',
  'src/components/experience/ExperienceDetailSkeleton.jsx',
  'src/components/experience/PhotoGallery.jsx',
  'src/components/experience-chat/ExperienceChatHeader.jsx',
  'src/components/experience-chat/SystemCard.jsx',
  'src/components/experience-chat/AnnouncementCard.jsx',
  'src/components/experience-chat/QuickActionsBar.jsx',
  'src/components/experience-chat/SharedMomentsStrip.jsx',
  'src/components/experience-chat/ChatInfoSheet.jsx',
  'src/components/experience-chat/TypingIndicator.jsx',
  'src/components/experience-chat/ChatMessageBubble.jsx',
  'src/components/experience-day/DayHeader.jsx',
  'src/components/experience-day/PhaseTimeline.jsx',
  'src/components/experience-day/DayInfoCard.jsx',
  'src/components/experience-day/GettingReadyActions.jsx',
  'src/components/experience-day/TimeToLeave.jsx',
  'src/components/experience-day/LiveActions.jsx',
  'src/components/experience-day/AfterExperience.jsx',
  'src/components/experience-day/FollowUp.jsx',
  'src/components/host/HostHeader.jsx',
  'src/components/host/HostSummaryCards.jsx',
  'src/components/host/HostActivityCard.jsx',
  'src/components/host/HostActivityActions.jsx',
  'src/components/host/HostRequestCard.jsx',
  'src/components/host/HostAnalytics.jsx',
  'src/components/host/HostFilterSheet.jsx',
  'src/components/host/WizardStepper.jsx',
  'src/components/host/wizard/StepHostType.jsx',
  'src/components/host/wizard/StepPhotos.jsx',
  'src/components/host/wizard/StepTitle.jsx',
  'src/components/host/wizard/StepBasicInfo.jsx',
  'src/components/host/wizard/StepDateTime.jsx',
  'src/components/host/wizard/StepLocation.jsx',
  'src/components/host/wizard/StepCapacity.jsx',
  'src/components/host/wizard/StepBudget.jsx',
  'src/components/host/wizard/StepRequirements.jsx',
  'src/components/host/wizard/StepPreview.jsx',
  'src/components/host/wizard/StepCircleMeta.jsx',
  'src/components/host/wizard/CreateSuccess.jsx',
  'src/components/calendar/CalendarHeader.jsx',
  'src/components/calendar/CalendarFilters.jsx',
  'src/components/calendar/CalendarEmptyState.jsx',
  'src/components/calendar/TodayCard.jsx',
  'src/components/calendar/ConflictWarning.jsx',
  'src/components/calendar/FreeTimeCard.jsx',
  'src/components/calendar/SyncSheet.jsx',
  'src/components/calendar/ReminderSheet.jsx',
  'src/components/calendar/AgendaView.jsx',
  'src/components/calendar/WeekView.jsx',
  'src/components/calendar/MonthView.jsx',
  'src/components/calendar/DayView.jsx',
  'src/components/calendar/SocialView.jsx',
  'src/components/calendar/CalendarActivityCard.jsx',
  'src/components/communities/CommunityCard.jsx',
  'src/components/communities/CommunityAbout.jsx',
  'src/components/communities/CommunityChat.jsx',
  'src/components/communities/CommunityCalendar.jsx',
  'src/components/communities/CommunityMembers.jsx',
  'src/components/communities/CommunityInsights.jsx',
  'src/components/communities/CommunityRules.jsx',
  'src/components/interest-poll/InterestPollCard.jsx',
  'src/components/interest-poll/InterestPollDashboard.jsx',
  'src/components/interest-poll/InterestPollWizard.jsx',
  'src/components/my-experiences/MyExperienceCard.jsx',
  'src/components/my-activities/ActivityCard.jsx',
  'src/components/my-activities/EmptyActivities.jsx',
  // Settings, Membership, Notifications, AI & Platform (MP-010)
  'src/pages/Settings.jsx',
  'src/pages/Membership.jsx',
  'src/pages/Notifications.jsx',
  'src/components/notifications/NotificationsHeader.jsx',
  'src/components/notifications/NotificationTabs.jsx',
  'src/components/notifications/NotificationsEmpty.jsx',
  'src/components/notifications/NotificationsSettings.jsx',
  'src/components/notifications/NotificationCard.jsx',
  'src/components/membership/MembershipCenterHeader.jsx',
  'src/components/membership/PricingPlans.jsx',
  'src/components/membership/ExplorerBenefits.jsx',
  'src/components/membership/PremiumBenefits.jsx',
  'src/components/membership/MembershipActionsCard.jsx',
  'src/components/membership/PremiumManager.jsx',
  'src/components/membership/PlanCard.jsx',
  'src/components/membership/UpgradeDialog.jsx',
  'src/components/membership/WelcomeToPremium.jsx',
  'src/components/membership/ProfileMembershipSection.jsx',
  'src/components/membership/AdminTierSelector.jsx',
  'src/components/membership/ComparisonTable.jsx',
  'src/components/concierge/ConciergeCard.jsx',
  'src/components/concierge/ConciergeSheet.jsx',
  'src/components/concierge/ConciergeBrief.jsx',
  'src/components/concierge/ConciergeWeekly.jsx',
  'src/components/concierge/ConciergeChat.jsx',
  'src/components/concierge/ConciergeSuggestion.jsx',
  // MP-011 — Enterprise Administration, Mission Control & Founder Console
  'src/pages/admin/AdminLogin.jsx',
  'src/pages/admin/AdminDashboard.jsx',
  'src/pages/admin/AdminMembers.jsx',
  'src/pages/admin/AdminActivities.jsx',
  'src/pages/admin/AdminCircles.jsx',
  'src/pages/admin/AdminHosts.jsx',
  'src/pages/admin/AdminReports.jsx',
  'src/pages/admin/AdminMemberships.jsx',
  'src/pages/admin/AdminNotifications.jsx',
  'src/pages/admin/AdminContent.jsx',
  'src/pages/admin/AdminAnalytics.jsx',
  'src/pages/admin/AdminProduct.jsx',
  'src/pages/admin/AdminSettings.jsx',
  'src/pages/admin/AdminAuditLogs.jsx',
  'src/pages/admin/AdminSupport.jsx',
  'src/pages/admin/QaDashboard.jsx',
  'src/pages/admin/SecurityCenter.jsx',
  'src/pages/admin/ObservabilityCenter.jsx',
  'src/pages/admin/ops/OpsDashboard.jsx',
  'src/pages/admin/ops/OpsChecklist.jsx',
  'src/pages/admin/ops/OpsIssues.jsx',
  'src/pages/admin/ops/OpsReleases.jsx',
  'src/pages/admin/ops/OpsReleaseDefinition.jsx',
  'src/pages/admin/ops/OpsBuildNotes.jsx',
  'src/pages/admin/ops/OpsQuality.jsx',
  'src/pages/admin/ops/OpsHealth.jsx',
  'src/pages/admin/ops/OpsErrors.jsx',
  'src/pages/admin/ops/OpsAudit.jsx',
  'src/pages/admin/ops/OpsFlags.jsx',
  'src/pages/admin/ops/OpsConfig.jsx',
  'src/pages/admin/ops/OpsPerformance.jsx',
  'src/pages/admin/ops/FounderAcceptanceTesting.jsx',
  'src/pages/admin/ops/StoreReadiness.jsx',
  'src/pages/admin/ops/LegalCompliance.jsx',
  'src/pages/admin/ops/LaunchPlan.jsx',
  'src/pages/mission-control/MCDashboard.jsx',
  'src/pages/mission-control/MCMembers.jsx',
  'src/pages/mission-control/MCTrustSafety.jsx',
  'src/pages/mission-control/MCMessaging.jsx',
  'src/pages/mission-control/MCAiIntelligence.jsx',
  'src/pages/mission-control/MCAiBrain.jsx',
  'src/pages/mission-control/MCPersonalIntelligence.jsx',
  'src/pages/mission-control/MCAiOps.jsx',
  'src/pages/mission-control/MCCommunity.jsx',
  'src/pages/mission-control/MCNotifications.jsx',
  'src/pages/mission-control/MCMemberships.jsx',
  'src/pages/mission-control/MCAnalytics.jsx',
  'src/pages/mission-control/MCRevenue.jsx',
  'src/pages/mission-control/MCCountries.jsx',
  'src/pages/mission-control/MCLanguages.jsx',
  'src/pages/mission-control/MCPlatformSettings.jsx',
  'src/pages/mission-control/MCSecurity.jsx',
  'src/pages/mission-control/MCAuditLogs.jsx',
  'src/pages/mission-control/MCMediaLibrary.jsx',
  'src/pages/mission-control/MCSystemHealth.jsx',
  'src/pages/mission-control/MCFeatureFlags.jsx',
  'src/pages/mission-control/MCPlatformOperations.jsx',
  'src/pages/mission-control/MCProductionHardening.jsx',
  'src/pages/mission-control/MCLaunchCenter.jsx',
  'src/components/admin/AdminConfirmProvider.jsx',
  'src/components/admin/AdminLayout.jsx',
  'src/components/admin/AdminListPage.jsx',
  'src/components/admin/AdminRoute.jsx',
  'src/components/admin/AdminRowActions.jsx',
  'src/components/admin/AdminSidebar.jsx',
  'src/components/admin/AdminTable.jsx',
  'src/components/admin/AdminTopBar.jsx',
  'src/components/admin/AnnouncementComposer.jsx',
  'src/components/admin/CircleEditSheet.jsx',
  'src/components/admin/ExperienceEditSheet.jsx',
  'src/components/admin/GlobalSearch.jsx',
  'src/components/admin/KpiCard.jsx',
  'src/components/admin/MemberProfileSheet.jsx',
  'src/components/admin/QuickActions.jsx',
  'src/components/admin/RecentActivityList.jsx',
  'src/components/admin/SystemStatus.jsx',
  'src/components/admin/analytics/AnalyticsExportBar.jsx',
  'src/components/admin/analytics/OrganizerInsights.jsx',
  'src/components/admin/analytics/ExperienceInsights.jsx',
  'src/components/admin/analytics/RelationshipInsights.jsx',
  'src/components/admin/analytics/AnalyticsFilterBar.jsx',
  'src/components/admin/analytics/KpiGrid.jsx',
  'src/components/admin/analytics/TrendAnalytics.jsx',
  'src/components/admin/analytics/MemberInsights.jsx',
  'src/components/admin/analytics/CommunityHealth.jsx',
  'src/components/admin/analytics/ProductionOverview.jsx',
  'src/components/admin/analytics/ChartCard.jsx',
  'src/components/admin/analytics/PlatformOverview.jsx',
  'src/components/admin/product/ProductRetentionCard.jsx',
  'src/components/admin/product/ProductPopularInterests.jsx',
  'src/components/admin/product/ProductKpiGrid.jsx',
  'src/components/admin/product/ProductEventBreakdown.jsx',
  'src/components/admin/product/ProductTopCategories.jsx',
  'src/components/admin/product/ProductDashboardSkeleton.jsx',
  'src/components/mission-control/FounderRoute.jsx',
  'src/components/mission-control/MissionControlLayout.jsx',
  'src/components/mission-control/MissionControlPlaceholder.jsx',
  'src/components/mission-control/MissionControlSidebar.jsx',
  'src/components/mission-control/MissionControlHeader.jsx',
  'src/components/mission-control/command-center/ExecutiveBrief.jsx',
  'src/components/mission-control/command-center/PlatformScore.jsx',
  'src/components/mission-control/command-center/TodaysFocus.jsx',
  'src/components/mission-control/command-center/PlatformHealth.jsx',
  'src/components/mission-control/command-center/CommunityPulse.jsx',
  'src/components/mission-control/command-center/TrustSafetyPulse.jsx',
  'src/components/mission-control/command-center/AiIntelligence.jsx',
  'src/components/mission-control/command-center/LiveActivity.jsx',
  'src/components/mission-control/command-center/QuickActions.jsx',
  'src/components/mission-control/command-center/GlobalInsights.jsx',
  'src/components/mission-control/command-center/FounderInsights.jsx',
  'src/components/mission-control/command-center/SystemAlerts.jsx',
  'src/components/mission-control/command-center/RecentDeployments.jsx',
  'src/components/mission-control/command-center/CommandSection.jsx',
  'src/components/mission-control/trust-safety/MCTrustFilters.jsx',
  'src/components/mission-control/trust-safety/MCTrustBadges.jsx',
  'src/components/mission-control/trust-safety/MCReportSheet.jsx',
  'src/components/mission-control/trust-safety/MCAppealSheet.jsx',
  'src/components/mission-control/members/MCMemberActionsMenu.jsx',
  'src/components/mission-control/members/MCMemberProfileSheet.jsx',
  'src/components/mission-control/members/MCMemberEditSheet.jsx',
  'src/components/mission-control/members/MCMemberNotes.jsx',
  'src/components/mission-control/members/MCMemberFilters.jsx',
  'src/components/mission-control/members/MCMemberShared.jsx',
  'src/components/mission-control/members/DevHardDeleteDialog.jsx',
  'src/components/mission-control/community/CommunityOverview.jsx',
  'src/components/mission-control/community/CommunityTransferSheet.jsx',
  'src/components/mission-control/community/CommunityDetailSheet.jsx',
  'src/components/mission-control/community/CommunityFilters.jsx',
  'src/components/mission-control/community/FeaturedManagement.jsx',
  'src/components/mission-control/community/CommunityEditSheet.jsx',
  'src/components/mission-control/community/CommunityCenter.jsx',
  'src/components/mission-control/community/CommunityTable.jsx',
  'src/components/mission-control/messaging/CommunicationCenter.jsx',
  'src/components/mission-control/messaging/TemplateLibrary.jsx',
  'src/components/mission-control/messaging/CampaignDetailSheet.jsx',
  'src/components/mission-control/messaging/CommunicationTabs.jsx',
  'src/components/mission-control/messaging/CommunicationOverview.jsx',
  'src/components/mission-control/messaging/AudienceTargeting.jsx',
  'src/components/mission-control/messaging/MessagePreview.jsx',
  'src/components/mission-control/messaging/CampaignTable.jsx',
  'src/components/mission-control/messaging/CampaignComposer.jsx',
  'src/components/mission-control/messaging/CampaignFilters.jsx',
  'src/components/mission-control/ai-intelligence/AiQuality.jsx',
  'src/components/mission-control/ai-intelligence/MemberInsights.jsx',
  'src/components/mission-control/ai-intelligence/FutureAiFeatures.jsx',
  'src/components/mission-control/ai-intelligence/AiSafety.jsx',
  'src/components/mission-control/ai-intelligence/PromptManagement.jsx',
  'src/components/mission-control/ai-intelligence/AiFilters.jsx',
  'src/components/mission-control/ai-intelligence/ModelPerformance.jsx',
  'src/components/mission-control/ai-intelligence/AiOverview.jsx',
  'src/components/mission-control/ai-intelligence/AiKnowledge.jsx',
  'src/components/mission-control/ai-intelligence/AiHealth.jsx',
  'src/components/mission-control/ai-intelligence/RecommendationPerformance.jsx',
  'src/components/mission-control/ai-intelligence/AiAlerts.jsx',
  'src/components/mission-control/ai-brain/AiBrainCenter.jsx',
  'src/components/mission-control/ai-brain/AiBrainProviders.jsx',
  'src/components/mission-control/ai-brain/AiBrainObservability.jsx',
  'src/components/mission-control/ai-brain/AiBrainRegistry.jsx',
  'src/components/mission-control/ai-brain/AiBrainPlayground.jsx',
  'src/components/mission-control/ai-brain/AiBrainOverview.jsx',
  'src/components/mission-control/ai-ops/AiOpsRegistry.jsx',
  'src/components/mission-control/ai-ops/AiOpsAuditQuality.jsx',
  'src/components/mission-control/ai-ops/AiOpsOverview.jsx',
  'src/components/mission-control/ai-ops/AiOpsAssistants.jsx',
  'src/components/mission-control/ai-ops/AiOpsGovernance.jsx',
  'src/components/mission-control/ai-ops/AiOpsCenter.jsx',
  'src/components/mission-control/personal-intelligence/PiSemantic.jsx',
  'src/components/mission-control/personal-intelligence/PiOverview.jsx',
  'src/components/mission-control/personal-intelligence/PersonalIntelligenceCenter.jsx',
  'src/components/mission-control/personal-intelligence/PiKnowledgeGraph.jsx',
  'src/components/mission-control/personal-intelligence/PiMemory.jsx',
  'src/components/mission-control/personal-intelligence/PiObservability.jsx',
  'src/components/mission-control/ops/PlatformOperationsCenter.jsx',
  'src/components/mission-control/ops/OpsOverview.jsx',
  'src/components/mission-control/ops/OpsConfiguration.jsx',
  'src/components/mission-control/ops/OpsFeatureFlags.jsx',
  'src/components/mission-control/ops/OpsJobs.jsx',
  'src/components/mission-control/ops/OpsSecurity.jsx',
  'src/components/mission-control/ops/OpsLogs.jsx',
  'src/components/mission-control/ops/OpsExport.jsx',
  'src/components/mission-control/ops/OpsGlobalSearch.jsx',
  'src/components/mission-control/ops/OpsMediaLibrary.jsx',
  'src/components/mission-control/ops/OpsStatusBadge.jsx',
  'src/components/mission-control/ops/OpsFuture.jsx',
  'src/components/mission-control/ops/OpsSettings.jsx',
  'src/components/mission-control/ops/OpsDeployment.jsx',
  'src/components/mission-control/ops/OpsAudit.jsx',
  'src/components/mission-control/ops/OpsSystemHealth.jsx',
  'src/components/mission-control/ops/OpsBackup.jsx',
  'src/components/mission-control/ops/OpsStorage.jsx',
  'src/components/mission-control/ops/OpsApiHealth.jsx',
  'src/components/mission-control/ops/bi/BiOverview.jsx',
  'src/components/mission-control/ops/bi/BiEngagement.jsx',
  'src/components/mission-control/ops/bi/BiGrowth.jsx',
  'src/components/mission-control/ops/bi/BiInsights.jsx',
  'src/components/mission-control/ops/bi/BiMembership.jsx',
  'src/components/mission-control/ops/bi/BiGeographic.jsx',
  'src/components/mission-control/ops/bi/BiLanguage.jsx',
  'src/components/mission-control/ops/bi/BiReportBuilder.jsx',
  'src/components/mission-control/ops/bi/BiFilterBar.jsx',
  'src/components/mission-control/ops/bi/BiComingSoon.jsx',
  'src/components/mission-control/ops/bi/BiChart.jsx',
  'src/components/mission-control/ops/bi/BiTable.jsx',
  'src/components/mission-control/ops/bi/BiInterest.jsx',
  'src/components/mission-control/ops/bi/BusinessIntelligenceCenter.jsx',
  'src/components/mission-control/production-hardening/PHMonitoring.jsx',
  'src/components/mission-control/production-hardening/PHSecurity.jsx',
  'src/components/mission-control/production-hardening/PHOverview.jsx',
  'src/components/mission-control/production-hardening/ProductionHardeningCenter.jsx',
  'src/components/mission-control/production-hardening/PHContinuity.jsx',
  'src/components/mission-control/production-hardening/PHDeployments.jsx',
  'src/components/mission-control/production-hardening/PHAlerting.jsx',
  'src/components/mission-control/production-hardening/PHPerformance.jsx',
  'src/components/mission-control/production-hardening/PHReliability.jsx',
  'src/components/mission-control/launch-center/LaunchChecklist.jsx',
  'src/components/mission-control/launch-center/SecurityCertification.jsx',
  'src/components/mission-control/launch-center/AiCertification.jsx',
  'src/components/mission-control/launch-center/StoreReadiness.jsx',
  'src/components/mission-control/launch-center/AccessibilityCertification.jsx',
  'src/components/mission-control/launch-center/CertificationTable.jsx',
  'src/components/mission-control/launch-center/LaunchCenter.jsx',
  'src/components/mission-control/launch-center/LaunchOverview.jsx',
  'src/components/mission-control/launch-center/LegalCertification.jsx',
  'src/components/mission-control/launch-center/ReleaseCertification.jsx',
  'src/components/mission-control/launch-center/LocalizationCertification.jsx',
  'src/components/mission-control/ui/index.js',
  'src/components/mission-control/ui/MCKpiCard.jsx',
  'src/components/mission-control/ui/MCEmptyState.jsx',
  'src/components/mission-control/ui/MCSection.jsx',
  'src/components/mission-control/ui/MCPageShell.jsx',
  'src/components/mission-control/ui/MCDataGrid.jsx',
  'src/components/mission-control/ui/MCModuleHeader.jsx',
  'src/components/mission-control/ui/MCStateViews.jsx',
  'src/components/mission-control/ui/MCActivityTimeline.jsx',
  'src/components/mission-control/ui/MCActionToolbar.jsx',
  'src/components/ops/QualityMetricCard.jsx',
  'src/components/ops/HealthDot.jsx',
  'src/components/ops/ReadinessScore.jsx',
  'src/components/ops/ReadinessSectionCard.jsx',
  'src/components/ops/StoreReadinessItem.jsx',
  'src/components/ops/StoreReadinessSummary.jsx',
  'src/components/ops/FounderDailyBrief.jsx',
  'src/components/ops/StatusBadge.jsx',
];

// ---------------------------------------------------------------------------
// Translation-file parsing
// ---------------------------------------------------------------------------

function extractKeys(filePath) {
  const result = { keys: [], duplicates: [], malformed: false, lines: 0 };
  let src;
  try {
    src = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    result.malformed = true;
    result.error = `cannot read file: ${e.message}`;
    return result;
  }
  result.lines = src.split('\n').length;
  const seen = new Map();
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // Matches:  'some.key': 'value',  (single-quoted, single-line entries)
    const m = line.match(/^\s*'([^']+)'\s*:\s*'(.*)',?\s*$/);
    if (m) {
      const key = m[1];
      const value = m[2];
      if (seen.has(key)) {
        result.duplicates.push({ key, firstLine: seen.get(key), dupLine: i + 1 });
      } else {
        seen.set(key, i + 1);
      }
      result.keys.push({ key, value, line: i + 1 });
    }
  });
  if (result.keys.length === 0) result.malformed = true;
  return result;
}

function validateValue(lang, entry) {
  const issues = [];
  const { key, value, line } = entry;
  const opens = (value.match(/\{/g) || []).length;
  const closes = (value.match(/\}/g) || []).length;
  if (opens !== closes) {
    issues.push({ type: 'malformed', lang, key, line, detail: 'unbalanced braces' });
    return issues; // further checks unreliable if braces are unbalanced
  }
  // ICU plural blocks
  const pluralRe = /\{(\w+),\s*plural,\s*((?:\w+\{[^{}]*\}\s*)+)\}/g;
  let pm;
  while ((pm = pluralRe.exec(value)) !== null) {
    const body = pm[2];
    const branchRe = /(\w+)\{([^{}]*)\}/g;
    let bm;
    const cats = new Set();
    while ((bm = branchRe.exec(body)) !== null) {
      cats.add(bm[1]);
      if (!VALID_PLURAL_CATS.has(bm[1])) {
        issues.push({ type: 'malformed', lang, key, line, detail: `invalid plural category '${bm[1]}'` });
      }
    }
    if (!cats.has('other')) {
      issues.push({ type: 'malformed', lang, key, line, detail: 'plural missing other branch' });
    }
  }
  // Interpolation validity: after removing plural blocks, every {…} must be a
  // valid identifier placeholder.
  const stripped = value.replace(/\{\w+,\s*plural,\s*(?:\w+\{[^{}]*\}\s*)+\}/g, '');
  const tokens = stripped.match(/\{[^{}]*\}/g) || [];
  tokens.forEach((tok) => {
    const inner = tok.slice(1, -1);
    if (inner === '') {
      issues.push({ type: 'malformed', lang, key, line, detail: `empty interpolation '{}'` });
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(inner)) {
      issues.push({ type: 'malformed', lang, key, line, detail: `invalid interpolation '${tok}'` });
    }
  });
  return issues;
}

// ---------------------------------------------------------------------------
// Source scanning: used keys + hardcoded strings
// ---------------------------------------------------------------------------

function walkSrc(dir, acc) {
  acc = acc || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
      walkSrc(full, acc);
    } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function collectUsedKeys(allKeySet) {
  const used = new Set();
  const allKeys = allKeySet ? [...allKeySet] : [];
  const files = walkSrc(path.join(ROOT, 'src'));
  // Exclude the i18n infrastructure itself (translation definitions, the
  // validator, this scanner) — keys appear there as definitions, not usages.
  const i18nDir = path.join(ROOT, 'src', 'lib', 'i18n') + path.sep;
  for (const f of files) {
    if (f.startsWith(i18nDir)) continue;
    let src;
    try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
    // 1. Every quoted string literal that exactly equals a known key — catches
    //    literal t('key') calls AND mapping-object values (e.g. auth-errors.js
    //    PATTERNS) where keys appear as object property string values.
    const litRe = /'([^'\n]+)'|"([^"\n]+)"|`([^`\n]*)`/g;
    let m;
    while ((m = litRe.exec(src)) !== null) {
      const s = m[1] ?? m[2] ?? m[3];
      if (s && allKeySet && allKeySet.has(s)) used.add(s);
    }
    // 1b. t('literal') call sites — catches keys passed to t() even when they
    //     sit inside a template literal (e.g. `🤖 ${t('home.picked_for_you')}`),
    //     which the generic literal scan above cannot reach because the
    //     backtick match consumes the inner quotes.
    const tCallRe = /\bt\(\s*'([^'\n]+)'/g;
    while ((m = tCallRe.exec(src)) !== null) {
      if (allKeySet && allKeySet.has(m[1])) used.add(m[1]);
    }
    // 2. Dynamic prefixes — t(`ns.${var}.title`) and t('ns.' + var) — mark every
    //    key sharing that literal prefix as used. Resolves dynamic lookups for
    //    reference data (interests, gender, step titles) that a literal scan
    //    cannot otherwise detect.
    const dynRe = /\bt\(\s*(`[^`]*\$\{|'[^']*'\s*\+|"[^"]*"\s*\+)/g;
    while ((m = dynRe.exec(src)) !== null) {
      const frag = m[0];
      let prefix = null;
      const bt = frag.match(/`([^`]*)\$\{/);
      if (bt) prefix = bt[1];
      else {
        const q = frag.match(/'([^']*)'\s*\+|"([^"]*)"\s*\+/);
        if (q) prefix = q[1] ?? q[2];
      }
      if (prefix) {
        for (const k of allKeys) if (k.startsWith(prefix)) used.add(k);
      }
    }
  }
  return used;
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

function suggestKey(file, text) {
  // namespace from path
  let rel = file.replace(/\\/g, '/');
  let ns = 'app';
  if (rel.includes('/onboarding/')) ns = 'onboarding';
  else if (rel.includes('/pages/Login') || rel.includes('/pages/Register') || rel.includes('/pages/ForgotPassword') || rel.includes('/pages/ResetPassword') || rel.includes('/pages/Welcome') || rel.includes('/pages/LanguageSelect')) ns = 'auth';
  else if (rel.includes('/auth/')) ns = 'auth';
  const slug = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim().split(/\s+/).slice(0, 4).join('_').replace(/__/g, '_');
  return slug ? `${ns}.${slug}` : `${ns}.label`;
}

function findHardcoded(filePath) {
  const out = [];
  let src;
  try { src = fs.readFileSync(filePath, 'utf8'); } catch { return out; }
  const rel = path.relative(ROOT, filePath);
  // strip line comments to reduce false positives (newlines preserved so line
  // numbers stay accurate).
  const cleaned = src.replace(/^\s*\/\/.*$/gm, '');
  // JSX text nodes: a tag-closing '>' preceded by a tag char (NOT '=' from an
  // arrow `=>`), followed by text up to the next '<'. Expressions {…} excluded.
  const textRe = /(?<=[A-Za-z0-9/'")\]}])>([^<>{}]+)</g;
  let m;
  while ((m = textRe.exec(cleaned)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    if (!/[a-zA-Z]{2,}/.test(raw)) continue;
    if (/^[\d\s.,:;!?\-–—/·#]+$/.test(raw)) continue;
    if (BRAND_EXCEPTIONS.has(raw)) continue;
    // skip code-like captures (arrow leakage, statement terminators, calls,
    // ternary control-flow that leaks across newlines between adjacent tags)
    if (/=>|;|`|\breturn\b|\bconst\b|\bfunction\b|\bt\(['"`]|\?\s*\(|\)\s*:|\)\s*&&|^\s*:|===|\|\||\brole\b\b/.test(raw)) continue;
    out.push({ file: rel, line: lineOf(cleaned, m.index), kind: 'jsx-text', text: raw.slice(0, 80), suggestedKey: suggestKey(rel, raw) });
  }
  // user-facing attributes
  const attrRe = /\b(placeholder|title|alt|aria-label)\s*=\s*"([^"]*)"/g;
  while ((m = attrRe.exec(cleaned)) !== null) {
    const raw = m[2].trim();
    if (!raw || raw.startsWith('{')) continue;
    if (!/[a-zA-Z]{2,}/.test(raw)) continue;
    if (BRAND_EXCEPTIONS.has(raw)) continue;
    out.push({ file: rel, line: lineOf(cleaned, m.index), kind: 'attr:' + m[1], text: raw.slice(0, 80), suggestedKey: suggestKey(rel, raw) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

function run(opts) {
  opts = opts || {};
  const report = {
    generatedAt: new Date().toISOString(),
    rules: [],
    summary: { errors: 0, warnings: 0, passed: 0 },
    details: {
      missingKeys: [],
      duplicateKeys: [],
      malformed: [],
      unusedKeys: [],
      hardcodedStrings: [],
    },
  };

  const parsed = {};
  for (const code of SUPPORTED_LANGS) {
    parsed[code] = extractKeys(path.join(TRANSLATIONS_DIR, code + '.js'));
  }

  // Rule 5: malformed files
  for (const code of SUPPORTED_LANGS) {
    if (parsed[code].malformed) {
      report.details.malformed.push({ file: `src/lib/i18n/translations/${code}.js`, detail: parsed[code].error || 'no translation keys parsed' });
    }
  }

  // Rule 2: duplicate keys (per file)
  for (const code of SUPPORTED_LANGS) {
    parsed[code].duplicates.forEach((d) => {
      report.details.duplicateKeys.push({ file: `src/lib/i18n/translations/${code}.js`, key: d.key, firstLine: d.firstLine, dupLine: d.dupLine });
    });
  }

  // Rules 1, 3, 4: parity + interpolation + ICU (per value)
  const enKeys = parsed.en.keys.map((k) => k.key);
  for (const code of SUPPORTED_LANGS) {
    const dictKeys = new Set(parsed[code].keys.map((k) => k.key));
    if (code !== 'en') {
      enKeys.forEach((k) => {
        if (!dictKeys.has(k)) report.details.missingKeys.push({ file: `src/lib/i18n/translations/${code}.js`, key: k });
      });
    }
    parsed[code].keys.forEach((entry) => {
      const issues = validateValue(code, entry);
      issues.forEach((i) => report.details.malformed.push({ file: `src/lib/i18n/translations/${code}.js`, line: i.line, key: i.key, detail: i.detail }));
    });
  }

  // Rule 6: unused keys — dynamic-usage aware. Shared base vocabulary
  // (common, nav) and planned namespace seeds (home) are categorized, not
  // failed; only genuinely dead keys fail the gate.
  const allKeySet = new Set(enKeys);
  const used = collectUsedKeys(allKeySet);
  const sharedVocabUnused = [];
  const plannedUnused = [];
  enKeys.forEach((k) => {
    if (used.has(k)) return;
    const ns = k.split('.')[0];
    if (SHARED_VOCAB_NAMESPACES.has(ns)) sharedVocabUnused.push({ key: k });
    else if (PLANNED_NAMESPACES.has(ns)) plannedUnused.push({ key: k });
    else report.details.unusedKeys.push({ key: k });
  });
  report.details.sharedVocabUnused = sharedVocabUnused;
  report.details.plannedUnused = plannedUnused;

  // Rule 7: hardcoded strings in localized modules
  for (const rel of LOCALIZED_MODULES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const found = findHardcoded(full);
    found.forEach((f) => report.details.hardcodedStrings.push(f));
  }

  // Aggregate — dead unused keys count as errors; shared/planned are
  // informational warnings.
  const errBlocks = ['missingKeys', 'duplicateKeys', 'malformed', 'hardcodedStrings', 'unusedKeys'];
  errBlocks.forEach((b) => { report.summary.errors += report.details[b].length; });
  report.summary.warnings += report.details.sharedVocabUnused.length + report.details.plannedUnused.length;
  report.summary.passed = report.summary.errors === 0 ? 1 : 0;

  report.rules = [
    { id: 'R1', name: 'No missing translation keys', status: report.details.missingKeys.length ? 'fail' : 'pass', count: report.details.missingKeys.length },
    { id: 'R2', name: 'No duplicate keys', status: report.details.duplicateKeys.length ? 'fail' : 'pass', count: report.details.duplicateKeys.length },
    { id: 'R3', name: 'Valid interpolation', status: report.details.malformed.filter((m) => /interpol|empty/.test(m.detail)).length ? 'fail' : 'pass', count: report.details.malformed.filter((m) => /interpol|empty/.test(m.detail)).length },
    { id: 'R4', name: 'Valid ICU plural syntax', status: report.details.malformed.filter((m) => /plural|brace/.test(m.detail)).length ? 'fail' : 'pass', count: report.details.malformed.filter((m) => /plural|brace/.test(m.detail)).length },
    { id: 'R5', name: 'No malformed translation files', status: report.details.malformed.filter((m) => m.detail.includes('no translation keys') || m.detail.includes('cannot read')).length ? 'fail' : 'pass', count: report.details.malformed.filter((m) => m.detail.includes('no translation keys') || m.detail.includes('cannot read')).length },
    { id: 'R6', name: `No dead unused keys (shared/planned exempt, threshold ${UNUSED_THRESHOLD})`, status: report.details.unusedKeys.length > UNUSED_THRESHOLD ? 'fail' : 'pass', count: report.details.unusedKeys.length },
    { id: 'R6a', name: 'Shared base vocabulary pre-seeded (informational)', status: 'pass', count: report.details.sharedVocabUnused.length },
    { id: 'R6b', name: 'Planned namespace seed (informational)', status: 'pass', count: report.details.plannedUnused.length },
    { id: 'R7', name: 'No hardcoded strings in localized modules', status: report.details.hardcodedStrings.length ? 'fail' : 'pass', count: report.details.hardcodedStrings.length },
  ];

  return report;
}

function formatHuman(report) {
  const lines = [];
  lines.push('MP-004A — Localization Governance Report');
  lines.push('========================================');
  lines.push('');
  lines.push('Quality Gate Rules:');
  report.rules.forEach((r) => {
    lines.push(`  [${r.status === 'pass' ? 'PASS' : 'FAIL'}] ${r.id}: ${r.name} (${r.count})`);
  });
  lines.push('');
  lines.push(`Summary: ${report.summary.errors} error(s), ${report.summary.warnings} warning(s) — gate ${report.summary.passed ? 'PASSED' : 'FAILED'}`);
  const push = (title, items, fmt) => {
    if (!items.length) return;
    lines.push('');
    lines.push(`${title} (${items.length}):`);
    items.slice(0, 50).forEach((i) => lines.push('  ' + fmt(i)));
    if (items.length > 50) lines.push(`  ... and ${items.length - 50} more`);
  };
  push('Missing keys', report.details.missingKeys, (i) => `${i.file}: ${i.key}`);
  push('Duplicate keys', report.details.duplicateKeys, (i) => `${i.file}:${i.dupLine} "${i.key}" (first at line ${i.firstLine})`);
  push('Malformed', report.details.malformed, (i) => `${i.file}:${i.line} "${i.key}" — ${i.detail}`);
  push('Dead unused keys', report.details.unusedKeys, (i) => `en+all: "${i.key}" — remove or wire up`);
  push('Shared base (pre-seeded, exempt)', report.details.sharedVocabUnused, (i) => `"${i.key}"`);
  push('Planned namespace seed (exempt)', report.details.plannedUnused, (i) => `"${i.key}"`);
  push('Hardcoded strings', report.details.hardcodedStrings, (i) => `${i.file}:${i.line} [${i.kind}] "${i.text}" → suggested key: ${i.suggestedKey}`);
  return lines.join('\n');
}

if (require.main === module) {
  const report = run();
  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(report, null, 2));
  } else {
    process.stdout.write(formatHuman(report) + '\n');
  }
  process.exit(report.summary.passed ? 0 : 1);
}

module.exports = { run, formatHuman, LOCALIZED_MODULES, SUPPORTED_LANGS };