// Presentation only. These claims mirror the server-enforced benefits; they
// must not imply a different AI model, priority ranking, or bypass of privacy.
export const PREMIUM_BENEFITS = Object.freeze([
  { key: 'requests', title: 'Unlimited Likes', description: 'The Explorer allowance of 30 Likes per rolling 24 hours does not apply. Passing is always unlimited; approval, capacity and safety rules still apply.' },
  { key: 'ai', title: '5 Ask Nmood questions', description: 'Ask up to five questions per rolling 24 hours. Failed attempts also count.' },
  { key: 'drafts', title: 'Turn answers into drafts', description: 'Create private Circle, Experience and Share drafts from an answer. Review and complete details before publishing.' },
  { key: 'group_chat', title: 'Circle and Experience chat', description: 'Chat in eligible groups you belong to. Membership and privacy rules still apply.' },
]);
export const MEMBERSHIP_COMPARISON = Object.freeze([
  { key: 'requests', label: 'Profile Likes', explorer: '25 per rolling 24 hours', premium: 'Unlimited' },
  { key: 'ai', label: 'Ask Nmood', explorer: '1 per rolling 24 hours', premium: '5 per rolling 24 hours' },
  { key: 'drafts', label: 'AI action drafts', explorer: false, premium: true },
  { key: 'group_chat', label: 'Eligible group chat', explorer: false, premium: true },
  { key: 'discovery', label: 'Public discovery', explorer: 'Eligible public content', premium: 'Eligible public content' },
  { key: 'verification', label: 'Account verification', explorer: 'Same required checks', premium: 'Same required checks' },
  { key: 'support', label: 'Support', explorer: 'Settings → Support', premium: 'Settings → Support' },
  { key: 'messaging', label: 'Direct messages', explorer: 'Connection and privacy rules', premium: 'Connection and privacy rules' },
]);
