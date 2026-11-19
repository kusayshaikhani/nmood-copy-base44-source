const entries = value => Array.isArray(value) ? value.filter(Boolean) : [];

export function profileDiscoveryReadiness(member = {}) {
  const photos = Math.max(entries(member.photo_gallery || member.gallery_photos).length, member.photo_url || member.avatar ? 1 : 0);
  const prompts = entries(member.prompts).filter(prompt => typeof prompt === 'string' ? prompt.trim() : prompt?.answer || prompt?.text).length;
  const interests = entries(member.interests).length;
  const bio = String(member.bio || '').trim().length >= 24;
  const verified = member.identity_verified === true;
  const checks = [
    { label: 'Add 3 photos', complete: photos >= 3, points: 30 },
    { label: 'Answer a profile prompt', complete: prompts >= 1, points: 20 },
    { label: 'Choose 3 interests', complete: interests >= 3, points: 20 },
    { label: 'Add a short bio', complete: bio, points: 15 },
    { label: 'Verify your profile', complete: verified, points: 15 },
  ];
  const score = checks.reduce((total, check) => total + (check.complete ? check.points : 0), 0);
  return { score, checks, missing: checks.filter(check => !check.complete), ready: score === 100 };
}
