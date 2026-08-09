// Master Personality Traits Dataset — multi-select, universally recognized traits.

export const PERSONALITY_TRAITS = [
  { key:'curious', label:'Curious' }, { key:'friendly', label:'Friendly' },
  { key:'adventurous', label:'Adventurous' }, { key:'creative', label:'Creative' },
  { key:'calm', label:'Calm' }, { key:'thoughtful', label:'Thoughtful' },
  { key:'reliable', label:'Reliable' }, { key:'loyal', label:'Loyal' },
  { key:'funny', label:'Funny' }, { key:'playful', label:'Playful' },
  { key:'kind', label:'Kind' }, { key:'empathetic', label:'Empathetic' },
  { key:'optimistic', label:'Optimistic' }, { key:'ambitious', label:'Ambitious' },
  { key:'independent', label:'Independent' }, { key:'social', label:'Social' },
  { key:'outgoing', label:'Outgoing' }, { key:'reserved', label:'Reserved' },
  { key:'confident', label:'Confident' }, { key:'humble', label:'Humble' },
  { key:'patient', label:'Patient' }, { key:'open_minded', label:'Open Minded' },
  { key:'supportive', label:'Supportive' }, { key:'energetic', label:'Energetic' },
  { key:'relaxed', label:'Relaxed' }, { key:'organized', label:'Organized' },
  { key:'spontaneous', label:'Spontaneous' }, { key:'analytical', label:'Analytical' },
  { key:'leader', label:'Leader' }, { key:'listener', label:'Listener' },
  { key:'explorer', label:'Explorer' }, { key:'dreamer', label:'Dreamer' },
  { key:'practical', label:'Practical' }, { key:'artistic', label:'Artistic' },
  { key:'intellectual', label:'Intellectual' }, { key:'positive', label:'Positive' },
  { key:'resilient', label:'Resilient' }, { key:'respectful', label:'Respectful' },
  { key:'honest', label:'Honest' }, { key:'authentic', label:'Authentic' },
  { key:'generous', label:'Generous' }, { key:'disciplined', label:'Disciplined' },
  { key:'adaptable', label:'Adaptable' }, { key:'passionate', label:'Passionate' },
  { key:'diplomatic', label:'Diplomatic' }, { key:'curious_mind', label:'Curious Mind' },
  { key:'easygoing', label:'Easygoing' }, { key:'bold', label:'Bold' },
  { key:'sensitive', label:'Sensitive' }, { key:'logical', label:'Logical' },
];

export const PERSONALITY_TRAIT_MAP = Object.fromEntries(PERSONALITY_TRAITS.map((t) => [t.key, t]));