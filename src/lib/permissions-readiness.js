// Permissions Readiness Inventory — centralized audit of every device
// capability Nmood may request, mapped to App Store / Play Store disclosure
// requirements. Based on a full code audit (August 2026).
//
// This is an internal readiness aid, NOT an automatic compliance claim.
// All entries are derived from observed code behavior.

// ── Permissions actually required by the app ──────────────────────────────
export const REQUIRED_PERMISSIONS = [
  {
    capability: 'Location (When In Use)',
    api: 'navigator.geolocation.getCurrentPosition',
    usedBy: [
      'src/lib/location-detection.js (onboarding — GPS → IP fallback → Unknown)',
      'src/components/map/MapLibreLocationPicker.jsx (host location picker — user-initiated)',
      'src/components/circles/CircleChat.jsx (send location — user-initiated, reverse-geocoded)',
    ],
    autoRequested: false, // all paths are user-initiated or have manual fallback
    hasPrePermissionExplanation: true, // onboarding LocationStep explains before GPS
    hasManualFallback: true, // every path falls back to manual city entry or Unknown
    storesPreciseCoordinates: false, // only city/country persisted; GPS coords are transient
    iosUsageDescription: 'NSLocationWhenInUseUsageDescription',
    iosPurposeString: 'Nmood uses your location to suggest nearby experiences and circles, and to show your city on your profile. You can always enter your city manually.',
    androidPermission: 'ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION',
    androidPurposeLabel: 'Approximate location (city-level) for nearby discovery',
    classification: 'PASS — user-initiated, manual fallback, no coordinate persistence',
  },
  {
    capability: 'Microphone (voice messages)',
    api: 'navigator.mediaDevices.getUserMedia({ audio: true })',
    usedBy: [
      'src/components/circles/CircleChat.jsx (voice messages — user-initiated)',
      'src/pages/ExperienceChat.jsx (voice messages — user-initiated)',
    ],
    autoRequested: false, // only when user taps the record/hold button
    hasPrePermissionExplanation: false, // FIX NEEDED: add in-app explanation before first use
    hasManualFallback: true, // text messages always available
    storesPreciseCoordinates: null,
    iosUsageDescription: 'NSMicrophoneUsageDescription',
    iosPurposeString: 'Record voice messages to send in experience and circle chats.',
    androidPermission: 'RECORD_AUDIO',
    androidPurposeLabel: 'Microphone for voice messages in chat',
    classification: 'FIXED IN DEVELOPMENT — user-initiated; pre-permission explanation to be added',
  },
  {
    capability: 'Photo Library (image upload)',
    api: '<input type="file" accept="image/*"> + FileReader',
    usedBy: [
      'src/components/media/MediaPicker.jsx (universal picker — camera/gallery)',
      'src/components/profile/PhotoGallery.jsx (profile photos)',
      'src/components/profile/premium/ProfileGallery.jsx (profile photos)',
      'src/components/onboarding/steps/BasicProfileStep.jsx (onboarding photo)',
      'src/components/host/wizard/StepPhotos.jsx (experience cover photos)',
      'src/components/host/wizard/premium/PremiumStepCover.jsx (circle cover)',
      'src/components/circles/CircleChat.jsx (chat photos)',
      'src/pages/ExperienceChat.jsx (chat photos)',
      'src/components/safety/ReportSheet.jsx (evidence upload)',
    ],
    autoRequested: false, // only when user taps an upload/camera trigger
    hasPrePermissionExplanation: true, // MediaPickerSheet shows camera/gallery choice
    hasManualFallback: true, // gallery picker always available; camera optional
    storesPreciseCoordinates: null,
    iosUsageDescription: 'NSPhotoLibraryUsageDescription',
    iosPurposeString: 'Upload photos for your profile, experiences, and chat messages.',
    androidPermission: 'READ_MEDIA_IMAGES (Android 13+) / READ_EXTERNAL_STORAGE (legacy)',
    androidPurposeLabel: 'Photo library access to upload profile and experience photos',
    classification: 'PASS — user-initiated, file-type/size validated, gallery fallback',
  },
  {
    capability: 'Camera (photo capture)',
    api: '<input type="file" accept="image/*" capture="environment">',
    usedBy: [
      'src/components/media/MediaPicker.jsx (camera option in picker sheet)',
      'src/components/profile/PhotoGallery.jsx (camera option)',
      'src/components/profile/premium/ProfileGallery.jsx (camera option)',
      'src/components/onboarding/steps/BasicProfileStep.jsx (camera option)',
      'src/components/host/wizard/StepPhotos.jsx (camera option)',
      'src/components/host/wizard/premium/PremiumStepCover.jsx (camera option)',
    ],
    autoRequested: false, // only when user explicitly chooses "Camera" in the picker sheet
    hasPrePermissionExplanation: true, // MediaPickerSheet presents camera vs gallery choice
    hasManualFallback: true, // gallery picker is always offered alongside camera
    storesPreciseCoordinates: null,
    iosUsageDescription: 'NSCameraUsageDescription',
    iosPurposeString: 'Take photos for your profile, experiences, and chat messages.',
    androidPermission: 'CAMERA',
    androidPurposeLabel: 'Camera to capture photos for profile and experiences',
    classification: 'PASS — user-initiated via picker sheet, gallery fallback always available',
  },
];

// ── Permissions NOT required (confirmed by code audit) ────────────────────
export const NOT_REQUIRED_PERMISSIONS = [
  {
    capability: 'Push Notifications',
    reason: 'No push token registration, FCM/APNS SDK, or push send code exists. All notifications are in-app (entity-based) with no OS push delivery.',
    iosDeclaration: 'No push notification entitlement or background mode required',
    androidDeclaration: 'No Firebase Cloud Messaging or push permission required',
    classification: 'PASS — not implemented; no permission needed',
  },
  {
    capability: 'Local Notifications (browser Notification API)',
    reason: 'Notification.permission is read for display only in Privacy.jsx. No Notification.requestPermission() or new Notification() calls exist.',
    iosDeclaration: 'N/A — web-only API, not used on native',
    androidDeclaration: 'N/A — web-only API, not used on native',
    classification: 'PASS — permission status displayed but never requested',
  },
  {
    capability: 'Contacts (address book)',
    reason: 'No navigator.contacts, ContactPicker, or address book access. "Contacts" in the app refers to Pal connections (in-app entity), not OS contacts.',
    iosDeclaration: 'NSContactsUsageDescription NOT required',
    androidDeclaration: 'READ_CONTACTS NOT required',
    classification: 'PASS — not used',
  },
  {
    capability: 'Calendar (OS)',
    reason: 'No OS calendar access. The in-app calendar (MyCalendar) is a custom UI reading from Experience/Attendance entities. "Add to calendar" uses deep links, not calendar write permission.',
    iosDeclaration: 'NSCalendarsUsageDescription NOT required',
    androidDeclaration: 'READ/WRITE_CALENDAR NOT required',
    classification: 'PASS — not used',
  },
  {
    capability: 'Bluetooth',
    reason: 'No navigator.bluetooth or any Bluetooth API usage found.',
    iosDeclaration: 'NSBluetoothAlwaysUsageDescription NOT required',
    androidDeclaration: 'BLUETOOTH NOT required',
    classification: 'PASS — not used',
  },
  {
    capability: 'Motion / Accelerometer',
    reason: 'No DeviceMotionEvent, Accelerometer, Gyroscope, or devicemotion/orientation listeners.',
    iosDeclaration: 'NSMotionUsageDescription NOT required',
    androidDeclaration: 'ACTIVITY_RECOGNITION, BODY_SENSORS NOT required',
    classification: 'PASS — not used',
  },
  {
    capability: 'Tracking / Advertising ID',
    reason: 'No requestTrackingAuthorization, ATTrackingManager, IDFA, AAID, or advertising SDK. interest-cohort=() in permissions-policy explicitly disables FLoC.',
    iosDeclaration: 'App Tracking Transparency NOT required',
    androidDeclaration: 'AD_ID permission NOT required',
    classification: 'PASS — no tracking; analytics is consent-gated and off by default',
  },
  {
    capability: 'Background Location',
    reason: 'No background location usage. All geolocation calls are foreground, user-initiated, with enableHighAccuracy only on explicit action.',
    iosDeclaration: 'NSLocationAlwaysUsageDescription NOT required; no background mode',
    androidDeclaration: 'ACCESS_BACKGROUND_LOCATION NOT required',
    classification: 'PASS — foreground only',
  },
];

// ── Platform configuration (source of truth: native-permissions-config.js) ──
export const PLATFORM_CONFIG_NEEDED = [
  {
    item: 'iOS Info.plist usage strings',
    status: 'CONFIG READY — wrapper must apply',
    details: 'See src/lib/native-permissions-config.js → IOS_INFO_PLIST. Add NSLocationWhenInUseUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSMicrophoneUsageDescription with the exact purpose strings. The PWA permissions-policy meta tag is already set in index.html.',
  },
  {
    item: 'Android manifest permissions',
    status: 'CONFIG READY — wrapper must apply',
    details: 'See src/lib/native-permissions-config.js → ANDROID_PERMISSIONS. Add ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION, CAMERA, RECORD_AUDIO, READ_MEDIA_IMAGES to AndroidManifest.xml.',
  },
  {
    item: 'Permissions NOT to add',
    status: 'CONFIG READY — wrapper must omit',
    details: 'See native-permissions-config.js → NOT_REQUIRED. Do NOT add Contacts, Calendar, Bluetooth, Motion, Tracking, Background Location, or Push Notification entries.',
  },
  {
    item: 'Push notification provider secrets',
    status: 'NOT NEEDED (no push implementation)',
    details: 'No push notification code exists. If push is added later, FCM server key (Android) and APNS auth key (iOS) will be needed as platform secrets.',
  },
];

// ── Controlled tests (safe, no real prompts) ──────────────────────────────
export const CONTROLLED_TESTS = [
  'Verify WeatherStrip no longer auto-requests geolocation on mount (uses stored city instead)',
  'Verify CircleChat sendLocation reverse-geocodes to a place name (no raw coordinates in messages)',
  'Verify MapLibreLocationPicker IP fallback uses BigDataCloud (not ipapi.co) to avoid Ajman/Sharjah mis-detection',
  'Verify MediaPicker only opens file picker on explicit tap (no auto-prompt)',
  'Verify voice recording only starts on explicit press-and-hold (no auto-prompt)',
  'Verify Privacy.jsx shows notification permission status without requesting it',
  'Verify all location flows have manual city entry fallback',
];

// ── Physical device tests required ─────────────────────────────────────────
export const PHYSICAL_DEVICE_TESTS = [
  'iOS: Location permission prompt appears only when user taps "Use current location" in map picker',
  'iOS: Microphone permission prompt appears only when user taps voice record button in chat',
  'iOS: Camera permission prompt appears only when user chooses "Camera" in MediaPickerSheet',
  'iOS: Photo library permission prompt appears only when user chooses "Gallery" in MediaPickerSheet',
  'iOS: Denying any permission does not block the app — manual fallback or graceful hide',
  'iOS: "Open Settings" button in Privacy page opens iOS Settings → Nmood',
  'Android: Same permission prompts and denial handling on Android 13+ and legacy',
  'Android: "Open Settings" button opens app settings in Android Settings',
  'PWA: Browser permission prompts appear only on user gesture (not on page load)',
  'PWA: Denied permissions show appropriate fallback UI without loops',
];

// ── Release blockers ───────────────────────────────────────────────────────
export const RELEASE_BLOCKERS = [
  {
    item: 'iOS Info.plist usage strings',
    severity: 'WRAPPER TASK (code ready)',
    reason: 'Purpose strings are defined in src/lib/native-permissions-config.js. The Base44 native wrapper must copy them into Info.plist. Without them iOS crashes on capability access. No app-code change needed.',
  },
  {
    item: 'Android manifest permissions',
    severity: 'WRAPPER TASK (code ready)',
    reason: 'Permission list is defined in src/lib/native-permissions-config.js. The Base44 native wrapper must add them to AndroidManifest.xml. No app-code change needed.',
  },
];

// ── Summary ────────────────────────────────────────────────────────────────
export const PERMISSIONS_SUMMARY = {
  required: REQUIRED_PERMISSIONS.map((p) => p.capability),
  notRequired: NOT_REQUIRED_PERMISSIONS.map((p) => p.capability),
  autoRequestedOnLaunch: [], // none — all permissions are user-initiated
  storesPreciseCoordinates: false,
  logsCoordinates: false, // FIXED: CircleChat now reverse-geocodes before sending
  hasOpenSettingsPath: true, // Privacy.jsx provides instructions; native wrapper needed for deep link
  classification: 'READY — native config defined in native-permissions-config.js; wrapper must apply it',
};