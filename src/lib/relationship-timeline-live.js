import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// RC-005A/CRITICAL-3 — Real Relationship Timeline data.
// Derives timeline events, memories, milestones, insights, and upcoming
// shared experiences from real PalConnection + Attendance + Experience entities.
// All functions accept the real pal shape from real-pals.js mapConnectionToPal.

export function getRelationshipStrength(pal) {
  const count = pal?.mutualExperiences || 0;
  if (count >= 6) return { label: 'Deep Connection', level: 3 };
  if (count >= 3) return { label: 'Growing', level: 2 };
  return { label: 'New Connection', level: 1 };
}

export function getTimelineEvents(pal) {
  if (!pal) return [];
  const events = [];
  const connectedDate = pal.connectedDate || '';

  if (pal.firstExperienceTogether) {
    events.push({
      id: 'evt-1',
      icon: '☕',
      title: 'First Met',
      experience: pal.firstExperienceTogether,
      date: connectedDate ? `${connectedDate}` : '',
      photos: [],
      notes: 'Your journey began here.',
      hidden: false,
    });
  }

  events.push({
    id: 'evt-2',
    icon: '🎉',
    title: 'Became Pals',
    date: connectedDate || '',
    photos: [],
    notes: 'You officially became pals.',
    hidden: false,
  });

  (pal.experiencesTogether || []).forEach((exp, i) => {
    const photos = (pal.photosTogether || []).slice(i, i + 1);
    events.push({
      id: `evt-exp-${i}`,
      icon: '📍',
      title: 'Attended Together',
      experience: exp,
      date: i === 0 ? (connectedDate || '') : '',
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
      date: connectedDate || '',
      photos: [pal.photosTogether[0]],
      notes: 'A moment to remember.',
      hidden: false,
    });
  }

  return events;
}

export function getMemories(pal) {
  if (!pal) return [];
  return (pal.experiencesTogether || []).slice(0, 4).map((exp, i) => ({
    id: `mem-${i}`,
    experienceName: exp,
    date: pal.connectedDate || '',
    photos: (pal.photosTogether || []).slice(i, i + 2),
  }));
}

export function getMilestones(pal) {
  const count = pal?.mutualExperiences || 0;
  const connectedDate = pal?.connectedDate || '';
  return [
    { id: 'ms-1', icon: '🎯', title: 'First Experience Together', description: `You met at ${pal?.firstExperienceTogether || ''}`, date: connectedDate, achieved: true },
    { id: 'ms-2', icon: '🎂', title: 'First Year as Pals', description: 'Your one-year paliversary', date: connectedDate, achieved: false },
    { id: 'ms-3', icon: '🏆', title: '10 Experiences Together', description: `${count} of 10 experiences`, progress: Math.min(count / 10, 1), achieved: count >= 10 },
  ];
}

export function getInsights(pal) {
  if (!pal) return {};
  const cities = new Set([pal.city || 'Dubai']);
  const categories = new Set();
  (pal.interests || []).forEach((i) => categories.add(i));
  return {
    experiencesTogether: pal.mutualExperiences || 0,
    citiesExplored: cities.size,
    categoriesExplored: categories.size,
    mostCommonActivity: (pal.sharedInterests || [])[0] || 'Coffee',
    lastTimeTogether: pal.lastExperienceDate || 'Recently',
  };
}

// Hook: fetch upcoming experiences matching the pal's interests.
export function useUpcomingShared(pal) {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!pal || !pal.interests || pal.interests.length === 0) {
        setUpcoming([]);
        return;
      }
      try {
        const exps = await base44.entities.Experience.filter(
          { status: 'active', is_hidden: false },
          '-created_date',
          50
        );
        if (!active) return;
        const palInterests = pal.interests.map((i) => i.toLowerCase());
        const matching = (exps || [])
          .filter((e) => {
            const cat = (e.category || '').toLowerCase();
            return palInterests.some((i) => cat.includes(i));
          })
          .slice(0, 3)
          .map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time,
            location: e.location || '',
            image: e.cover_image || '',
          }));
        setUpcoming(matching);
      } catch {
        if (active) setUpcoming([]);
      }
    })();
    return () => { active = false; };
  }, [pal?.id, JSON.stringify(pal?.interests)]);

  return upcoming;
}