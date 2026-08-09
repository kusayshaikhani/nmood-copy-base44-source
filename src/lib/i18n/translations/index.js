/**
 * LOC-001 / MP-001 — Translation registry.
 * To add a language: create `<code>.js` with the same keys, import it here,
 * and add it to the map. Missing keys automatically fall back to English so
 * partially-translated languages still work.
 */
import en from './en';
import ar from './ar';
import es from './es';
import fr from './fr';
import de from './de';
import it from './it';
import ru from './ru';
import { locationTypeKeys } from './location-types';
import { rc004Patches } from './rc004_patches';
import { circlePremiumPatches } from './circle_premium_patches';
import { profilePremiumPatches } from './profile_premium_patches';
import { notificationsPremiumPatches } from './notifications_premium_patches';
import { createPremiumPatches } from './create_premium_patches';
import { createCirclePatches } from './create_circle_patches';
import { settingsPremiumPatches } from './settings_premium_patches';
import { membershipPremiumPatches } from './membership_premium_patches';
import { authOnboardingPremiumPatches } from './auth_onboarding_premium_patches';
import { mcPremiumPatches } from './mc_premium_patches';
import { uxStatesPatches } from './ux_states_patches';
import { safetyTrustPatches } from './safety_trust_patches';
import { discoverHeroPatches } from './discover_hero_patches';
import { nmoodsPatches } from './nmoods_patches';
import { inmoodIntelPatches } from './inmood_intelligence_patches';
import { discoveryEmptyPatches } from './discovery_empty_patches';
import { nationalityPatches } from './nationality_patches';
import { profileExpandPatches } from './profile_expand_patches';
import { conciergePatches } from './concierge_patches';
import { eligibilityPatches } from './eligibility_patches';
import { locationUxPatches } from './location_ux_patches';
import { founderAccessPatches } from './founder_access_patches';
import { socialAuthPatches } from './social_auth_patches';
import { authRegisterPatches } from './auth_register_patches';
import { authResetPatches } from './auth_reset_patches';
import { messagingComposerPatches } from './messaging_composer_patches';
import { verificationPatches } from './verification_patches';
import { discoveryUpgradePatches } from './discovery_upgrade_patches';
import { homeQuickPatches } from './home_quick_patches';
import { peopleDiscoveryPatches } from './people_discovery_patches';

export const translations = {
  en: { ...en, ...locationTypeKeys.en, ...rc004Patches.en, ...circlePremiumPatches.en, ...profilePremiumPatches.en, ...notificationsPremiumPatches.en, ...createPremiumPatches.en, ...createCirclePatches.en, ...settingsPremiumPatches.en, ...membershipPremiumPatches.en, ...authOnboardingPremiumPatches.en, ...mcPremiumPatches.en, ...uxStatesPatches.en, ...safetyTrustPatches.en, ...discoverHeroPatches.en, ...nmoodsPatches.en, ...inmoodIntelPatches.en, ...discoveryEmptyPatches.en, ...nationalityPatches.en, ...profileExpandPatches.en, ...conciergePatches.en, ...eligibilityPatches.en, ...locationUxPatches.en, ...founderAccessPatches.en, ...socialAuthPatches.en, ...authRegisterPatches.en, ...authResetPatches.en, ...messagingComposerPatches.en, ...verificationPatches.en, ...discoveryUpgradePatches.en, ...homeQuickPatches.en, ...peopleDiscoveryPatches.en },
  ar: { ...ar, ...locationTypeKeys.ar, ...rc004Patches.ar, ...circlePremiumPatches.ar, ...profilePremiumPatches.ar, ...notificationsPremiumPatches.ar, ...createPremiumPatches.ar, ...createCirclePatches.ar, ...settingsPremiumPatches.en, ...membershipPremiumPatches.en, ...authOnboardingPremiumPatches.en, ...mcPremiumPatches.en, ...uxStatesPatches.ar, ...discoverHeroPatches.ar, ...nmoodsPatches.ar, ...inmoodIntelPatches.ar, ...discoveryEmptyPatches.ar, ...nationalityPatches.ar, ...profileExpandPatches.ar, ...conciergePatches.ar, ...eligibilityPatches.ar, ...locationUxPatches.ar, ...founderAccessPatches.en, ...socialAuthPatches.ar, ...authRegisterPatches.ar, ...authResetPatches.ar, ...messagingComposerPatches.ar, ...verificationPatches.en, ...discoveryUpgradePatches.en, ...homeQuickPatches.en, ...peopleDiscoveryPatches.en },
  es: { ...es, ...locationTypeKeys.es, ...rc004Patches.es, ...circlePremiumPatches.es, ...profilePremiumPatches.es, ...notificationsPremiumPatches.es, ...createPremiumPatches.es, ...createCirclePatches.es, ...settingsPremiumPatches.en, ...membershipPremiumPatches.en, ...authOnboardingPremiumPatches.en, ...mcPremiumPatches.en, ...uxStatesPatches.es, ...discoverHeroPatches.es, ...nmoodsPatches.es, ...inmoodIntelPatches.es, ...discoveryEmptyPatches.es, ...nationalityPatches.es, ...profileExpandPatches.es, ...conciergePatches.es, ...eligibilityPatches.es, ...locationUxPatches.es, ...founderAccessPatches.en, ...socialAuthPatches.es, ...authRegisterPatches.es, ...authResetPatches.es, ...messagingComposerPatches.es, ...verificationPatches.en, ...discoveryUpgradePatches.en, ...homeQuickPatches.en, ...peopleDiscoveryPatches.en },
  fr: { ...fr, ...locationTypeKeys.fr, ...rc004Patches.fr, ...circlePremiumPatches.fr, ...profilePremiumPatches.fr, ...notificationsPremiumPatches.fr, ...createPremiumPatches.fr, ...createCirclePatches.fr, ...settingsPremiumPatches.en, ...membershipPremiumPatches.en, ...authOnboardingPremiumPatches.en, ...mcPremiumPatches.en, ...uxStatesPatches.fr, ...discoverHeroPatches.fr, ...nmoodsPatches.fr, ...inmoodIntelPatches.fr, ...discoveryEmptyPatches.fr, ...nationalityPatches.fr, ...profileExpandPatches.fr, ...conciergePatches.fr, ...eligibilityPatches.fr, ...locationUxPatches.fr, ...founderAccessPatches.en, ...socialAuthPatches.fr, ...authRegisterPatches.fr, ...authResetPatches.fr, ...messagingComposerPatches.fr, ...verificationPatches.en, ...discoveryUpgradePatches.en, ...homeQuickPatches.en, ...peopleDiscoveryPatches.en },
  de: { ...de, ...locationTypeKeys.de, ...rc004Patches.de, ...circlePremiumPatches.de, ...profilePremiumPatches.de, ...notificationsPremiumPatches.de, ...createPremiumPatches.de, ...createCirclePatches.de, ...settingsPremiumPatches.en, ...membershipPremiumPatches.en, ...authOnboardingPremiumPatches.en, ...mcPremiumPatches.en, ...uxStatesPatches.de, ...discoverHeroPatches.de, ...nmoodsPatches.de, ...inmoodIntelPatches.de, ...discoveryEmptyPatches.de, ...nationalityPatches.de, ...profileExpandPatches.de, ...conciergePatches.de, ...eligibilityPatches.de, ...locationUxPatches.de, ...founderAccessPatches.en, ...socialAuthPatches.de, ...authRegisterPatches.de, ...authResetPatches.de, ...messagingComposerPatches.de, ...verificationPatches.en, ...discoveryUpgradePatches.en, ...homeQuickPatches.en, ...peopleDiscoveryPatches.en },
  it: { ...it, ...locationTypeKeys.it, ...rc004Patches.it, ...circlePremiumPatches.it, ...profilePremiumPatches.it, ...notificationsPremiumPatches.it, ...createPremiumPatches.it, ...createCirclePatches.it, ...settingsPremiumPatches.en, ...membershipPremiumPatches.en, ...authOnboardingPremiumPatches.en, ...mcPremiumPatches.en, ...uxStatesPatches.it, ...discoverHeroPatches.it, ...nmoodsPatches.it, ...inmoodIntelPatches.it, ...discoveryEmptyPatches.it, ...nationalityPatches.it, ...profileExpandPatches.it, ...conciergePatches.it, ...eligibilityPatches.it, ...locationUxPatches.it, ...founderAccessPatches.en, ...socialAuthPatches.it, ...authRegisterPatches.it, ...authResetPatches.it, ...messagingComposerPatches.it, ...verificationPatches.en, ...discoveryUpgradePatches.en, ...homeQuickPatches.en, ...peopleDiscoveryPatches.en },
  ru: { ...ru, ...locationTypeKeys.ru, ...rc004Patches.ru, ...circlePremiumPatches.ru, ...profilePremiumPatches.ru, ...notificationsPremiumPatches.ru, ...createPremiumPatches.ru, ...createCirclePatches.ru, ...settingsPremiumPatches.en, ...membershipPremiumPatches.en, ...authOnboardingPremiumPatches.en, ...mcPremiumPatches.en, ...uxStatesPatches.ru, ...discoverHeroPatches.ru, ...nmoodsPatches.ru, ...inmoodIntelPatches.ru, ...discoveryEmptyPatches.ru, ...nationalityPatches.ru, ...profileExpandPatches.ru, ...conciergePatches.ru, ...eligibilityPatches.ru, ...locationUxPatches.ru, ...founderAccessPatches.en, ...socialAuthPatches.ru, ...authRegisterPatches.ru, ...authResetPatches.ru, ...messagingComposerPatches.ru, ...verificationPatches.en, ...discoveryUpgradePatches.en, ...homeQuickPatches.en, ...peopleDiscoveryPatches.en },
  // PB-003 — Release 1.0 resource languages (en/ar/es/fr/de/it/ru) supported.
  // Arabic (ar) is RTL; all others are LTR.
};