/**
 * PB-004 — Relationship Timeline data utilities.
 * No longer imports from discover-data.js. `getUpcomingShared` accepts
 * a live experiences array from the caller.
 */

export const getRelationshipStrength = (pal) => {
  const count = pal?.mutualExperiences || 0;
  if (count >= 6) return { label: 'Deep Connection', level: 3 };
  if (count >= 3) return { label: 'Growing', level: 2 };
  return { label: 'New Connection', level: 1 };
};

export const getTimelineEvents = (pal) => {
  if (!pal) return [];
  const events = [
    { id: 'evt-1', icon: '☕', title: 'First Met', experience: pal.firstExperienceTogether, date: `${pal.connectedDate}, 2025`, photos: [], notes: 'Your journey began here.', hidden: false },
    { id: 'evt-2', icon: '🎉', title: 'Became Pals', date: `${pal.connectedDate}, 2025`, photos: [], notes: 'You officially became pals.', hidden: false },
  ];

  (pal.experiencesTogether || []).forEach((exp, i) => {
    const photos = (pal.photosTogether || []).slice(i * 1, i * 1 + 1);
    events.push({
      id: `evt-exp-${i}`,
      icon: '📍',
      title: 'Attended Together',
      experience: exp,
      date: i === 0 ? `${pal.connectedDate}, 2025` : `Experience ${i + 1}`,
      photos: photos.length > 0 ? photos : [],
      notes: '',
      hidden: false,
    });
  });

  if (pal.photosTogether?.length > 0) {
    events.push({
      id: 'evt-photo',
      icon: '📸',
      title: 'Shared First Photo',
      date: `${pal.connectedDate}, 2025`,
      photos: [pal.photosTogether[0]],
      notes: 'A moment to remember.',
      hidden: false,
    });
  }

  return events;
};

export const getMemories = (pal) => {
  if (!pal) return [];
  return (pal.experiencesTogether || []).slice(0, 4).map((exp, i) => ({
    id: `mem-${i}`,
    experienceName: exp,
    date: `${pal.connectedDate}, 2025`,
    photos: (pal.photosTogether || []).slice(i, i + 2),
  }));
};

export const getMilestones = (pal) => {
  const count = pal?.mutualExperiences || 0;
  return [
    { id: 'ms-1', icon: '🎯', title: 'First Experience Together', description: `You met at ${pal?.firstExperienceTogether || ''}`, date: `${pal?.connectedDate || ''}, 2025`, achieved: true },
    { id: 'ms-2', icon: '🎂', title: 'First Year as Pals', description: 'Your one-year paliversary', date: `${pal?.connectedDate || ''}, 2026`, achieved: false },
    { id: 'ms-3', icon: '🏆', title: '10 Experiences Together', description: `${count} of 10 experiences`, progress: Math.min(count / 10, 1), achieved: count >= 10 },
  ];
};

export const getInsights = (pal) => {
  if (!pal) return {};
  const cities = new Set([pal.city || 'Dubai', 'Dubai']);
  const categories = new Set();
  (pal.interests || []).forEach(i => categories.add(i));
  return {
    experiencesTogether: pal.mutualExperiences || 0,
    citiesExplored: cities.size,
    categoriesExplored: categories.size,
    mostCommonActivity: (pal.sharedInterests || [])[0] || 'Coffee',
    lastTimeTogether: pal.lastExperienceDate || 'Recently',
  };
};

/** Accepts a live experiences array from the caller (no mock import). */
export const getUpcomingShared = (pal, experiences = []) => {
  if (!pal) return [];
  const palInterests = (pal.interests || []).map(i => i.toLowerCase());
  return (experiences || []).filter(e =>
    palInterests.some(i => (e.category || '').toLowerCase().includes(i) || (e.mood || '').toLowerCase().includes(i))
  ).slice(0, 3);
};