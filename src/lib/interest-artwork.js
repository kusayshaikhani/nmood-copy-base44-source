import artsCulture from '@/assets/in-orbit/in-orbit-arts-culture-gallery.png';
import coffee from '@/assets/in-orbit/in-orbit-coffee-cafe-morning.png';
import fitness from '@/assets/in-orbit/in-orbit-fitness-studio-daylight.png';
import foodDining from '@/assets/in-orbit/in-orbit-food-dining-bistro-evening.png';
import learningBooks from '@/assets/in-orbit/in-orbit-learning-books-reading-corner.png';
import musicNightclub from '@/assets/in-orbit/in-orbit-music-nightclub-dancefloor.png';
import outdoors from '@/assets/in-orbit/in-orbit-outdoors-mountain-trail.png';
import socialNightlife from '@/assets/in-orbit/in-orbit-social-nightlife-rooftop.png';
import technology from '@/assets/in-orbit/in-orbit-technology-electronics-lab.png';
import travel from '@/assets/in-orbit/in-orbit-travel-airport-sunrise.png';
import walking from '@/assets/in-orbit/in-orbit-walking-waterfront-sunset.png';
import wellness from '@/assets/in-orbit/in-orbit-wellness-yoga-studio.png';

export const INTEREST_NODE_OVERLAY_CLASS = 'bg-gradient-to-t from-black/80 via-black/35 to-black/15';

export const approvedInterestArtwork = {
 artsCulture,
 coffee,
 fitness,
 foodDining,
 learningBooks,
 musicNightclub,
 outdoors,
 socialNightlife,
 technology,
 travel,
 walking,
 wellness,
};

const artworkKeys = Object.keys(approvedInterestArtwork);

export function normalizeInterest(interest) {
 return String(interest || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();
}

const artworkRules = [
 ['travel', /\b(travel|trip|trips|holiday|holidays)\b/],
 ['walking', /\b(walking|walk|walks|running|run)\b/],
 ['outdoors', /\b(hiking|hike|outdoor|outdoors|nature|camping|camp|beach)\b/],
 ['coffee', /\b(coffee|cafe|cafes)\b/],
 ['foodDining', /\b(food|dining|restaurant|restaurants|brunch)\b/],
 ['fitness', /\b(gym|fitness|training|sport|sports)\b/],
 ['musicNightclub', /\b(music|dancing|dance|clubbing|club|pubs|pub|nightlife)\b/],
 ['artsCulture', /\b(art|arts|culture|museum|museums|photography|photo)\b/],
 ['technology', /\b(technology|tech|coding|code|gaming|games)\b/],
 ['wellness', /\b(wellness|yoga|meditation|self care|selfcare)\b/],
 ['socialNightlife', /\b(social|going out|events|event)\b/],
 ['learningBooks', /\b(books|book|reading|read|learning|learn|study|studying)\b/],
];

function stableIndex(value) {
 let hash = 0;
 for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
 return Math.abs(hash) % artworkKeys.length;
}

/** Resolves every interest to an approved local artwork, including future labels. */
export function interestArtwork(interest) {
 const normalized = normalizeInterest(interest);
 const matchedKey = artworkRules.find(([, expression]) => expression.test(normalized))?.[0];
 const key = matchedKey || artworkKeys[stableIndex(normalized || 'interest')];
 const fallbackKey = artworkKeys[(artworkKeys.indexOf(key) + 1) % artworkKeys.length];
 return {
  key,
  normalized,
  src: approvedInterestArtwork[key],
  fallbackSrc: approvedInterestArtwork[fallbackKey],
 };
}
