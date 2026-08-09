/**
 * Discovery / recommendation empty-state + card subtitle patches.
 * Contextual, accurate no-results guidance for people discovery surfaces,
 * plus the "New member" freshness label shown on member cards.
 * Patched at the registry level (see index.js) to keep the oversized base
 * en.js file untouched. Keys fall back to English for partial translations.
 */
export const discoveryEmptyPatches = {
  en: {
    'discovery.empty.hint_filters': 'Relax your filters to welcome more people into view.',
    'discovery.members.no_matches.title_plain': 'No one here yet — but not for long',
    'discovery.members.no_matches.desc_plain': 'New members arrive all the time. Try widening your world in the meantime.',
    'discovery.card.new_member': 'New member',
  },
  ar: {
    'discovery.empty.hint_filters': 'خفّف عوامل التصفية لإظهار المزيد من الأشخاص.',
    'discovery.members.no_matches.title_plain': 'لا أحد هنا بعد — لكن ليس لفترة طويلة',
    'discovery.members.no_matches.desc_plain': 'يصل أعضاء جدد طوال الوقت. حاول توسيع نطاقك في هذه الأثناء.',
    'discovery.card.new_member': 'عضو جديد',
  },
  es: {
    'discovery.empty.hint_filters': 'Afloja tus filtros para dar la bienvenida a más personas.',
    'discovery.members.no_matches.title_plain': 'Nadie aquí todavía — pero no por mucho',
    'discovery.members.no_matches.desc_plain': 'Nuevos miembros llegan todo el tiempo. Intenta ampliar tu mundo mientras tanto.',
    'discovery.card.new_member': 'Nuevo miembro',
  },
  fr: {
    'discovery.empty.hint_filters': 'Assouplissez vos filtres pour accueillir plus de personnes.',
    'discovery.members.no_matches.title_plain': "Personne ici pour l'instant — mais pas pour longtemps",
    'discovery.members.no_matches.desc_plain': 'De nouveaux membres arrivent tout le temps. Essayez d’élargir votre monde d’ici là.',
    'discovery.card.new_member': 'Nouveau membre',
  },
  de: {
    'discovery.empty.hint_filters': 'Lockere deine Filter, um mehr Menschen willkommen zu heißen.',
    'discovery.members.no_matches.title_plain': 'Noch niemand hier — aber nicht mehr lange',
    'discovery.members.no_matches.desc_plain': 'Neue Mitglieder kommen ständig dazu. Versuche in der Zwischenzeit, deinen Horizont zu erweitern.',
    'discovery.card.new_member': 'Neues Mitglied',
  },
  it: {
    'discovery.empty.hint_filters': 'Allenta i filtri per far entrare più persone.',
    'discovery.members.no_matches.title_plain': 'Nessuno qui ancora — ma non per molto',
    'discovery.members.no_matches.desc_plain': 'Nuovi membri arrivano di continuo. Prova ad ampliare il tuo mondo nel frattempo.',
    'discovery.card.new_member': 'Nuovo membro',
  },
  ru: {
    'discovery.empty.hint_filters': 'Ослабьте фильтры, чтобы увидеть больше людей.',
    'discovery.members.no_matches.title_plain': 'Здесь пока никого — но ненадолго',
    'discovery.members.no_matches.desc_plain': 'Новые участники приходят постоянно. Попробуйте расширить свой мир тем временем.',
    'discovery.card.new_member': 'Новый участник',
  },
};