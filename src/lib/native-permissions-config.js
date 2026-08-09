/**
 * Native Permission Configuration — single source of truth for the Base44
 * native wrapper (Capacitor / Cordova) to populate iOS Info.plist and
 * Android AndroidManifest.xml.
 *
 * Only capabilities Nmood genuinely invokes are listed.  Each entry includes
 * the exact plist key / manifest permission and a truthful, user-facing
 * purpose string that explains *why* Nmood needs it.
 *
 * Rules enforced by this file:
 *  - No permission is requested at startup.  Every capability is triggered
 *    only by an explicit user action (tap a button, open a picker, etc.).
 *  - Location has a manual city-entry fallback on every path.
 *  - Camera, Photo Library, and Microphone are included because the app
 *    genuinely invokes them for profile photos, experience covers, chat
 *    media, and voice messages.
 *  - Contacts, Calendar, Bluetooth, Motion, Tracking, and Push
 *    Notifications are NOT included — the app does not use them.
 *
 * This file is consumed by the native wrapper build step; it is not
 * imported by the web app at runtime.
 */

// ── iOS Info.plist entries ───────────────────────────────────────────────
export const IOS_INFO_PLIST = {
  NSLocationWhenInUseUsageDescription:
    'Nmood uses your location to suggest nearby experiences and circles, and to show your city on your profile. You can always enter your city manually.',

  NSCameraUsageDescription:
    'Take photos for your profile, experiences, and chat messages.',

  NSPhotoLibraryUsageDescription:
    'Upload photos for your profile, experiences, and chat messages.',

  NSMicrophoneUsageDescription:
    'Record voice messages to send in experience and circle chats.',
};

// ── Android manifest permissions ─────────────────────────────────────────
export const ANDROID_PERMISSIONS = [
  'ACCESS_COARSE_LOCATION',
  'ACCESS_FINE_LOCATION',
  'CAMERA',
  'RECORD_AUDIO',
  'READ_MEDIA_IMAGES',   // Android 13+
];

// ── Permissions explicitly NOT required ──────────────────────────────────
export const NOT_REQUIRED = {
  contacts: 'No navigator.contacts or ContactPicker API. "Contacts" in-app means Pal connections.',
  calendar: 'No OS calendar access. In-app calendar reads from Experience entities. "Add to calendar" uses deep links.',
  bluetooth: 'No navigator.bluetooth or any Bluetooth API usage.',
  motion: 'No DeviceMotionEvent, Accelerometer, or Gyroscope listeners.',
  tracking: 'No requestTrackingAuthorization, IDFA, or advertising SDK.',
  pushNotifications: 'No push token registration, FCM/APNS SDK, or push send code. All notifications are in-app (entity-based).',
  backgroundLocation: 'All geolocation calls are foreground, user-initiated.',
};

// ── Behavioral guarantees (verified by code audit) ───────────────────────
export const BEHAVIORAL_GUARANTEES = {
  autoRequestedOnStartup: [],
  locationManualFallback: true,
  locationRequestOnlyAfterUserAction: true,
  microphoneRequestOnlyAfterUserAction: true,
  cameraRequestOnlyAfterUserAction: true,
  photoLibraryRequestOnlyAfterUserAction: true,
  storesPreciseCoordinates: false,
  logsRawCoordinates: false,
};

// ── What the Base44 native wrapper must configure ────────────────────────
export const NATIVE_WRAPPER_TASKS = [
  {
    platform: 'iOS',
    file: 'Info.plist',
    action: 'Add the four usage-description keys from IOS_INFO_PLIST with their exact purpose strings.',
    blocker: true,
  },
  {
    platform: 'Android',
    file: 'AndroidManifest.xml',
    action: 'Add the five permissions from ANDROID_PERMISSIONS.',
    blocker: true,
  },
  {
    platform: 'iOS',
    file: 'Info.plist',
    action: 'Do NOT add NSContactsUsageDescription, NSCalendarsUsageDescription, NSBluetoothAlwaysUsageDescription, NSMotionUsageDescription, or NSLocationAlwaysUsageDescription — the app does not use these capabilities.',
    blocker: false,
  },
  {
    platform: 'Android',
    file: 'AndroidManifest.xml',
    action: 'Do NOT add READ_CONTACTS, READ/WRITE_CALENDAR, BLUETOOTH, ACTIVITY_RECOGNITION, or ACCESS_BACKGROUND_LOCATION — the app does not use these capabilities.',
    blocker: false,
  },
];