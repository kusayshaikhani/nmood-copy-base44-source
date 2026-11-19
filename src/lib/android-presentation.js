// Shared approved presentation across native apps and web.
export function installAndroidPresentation(document, platform) {
  if (['android', 'ios', 'web'].includes(platform)) document.documentElement.dataset.nmoodPlatform = platform;
}
