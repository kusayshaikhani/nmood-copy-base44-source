export const filterToken = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/[ _-]+/g, '_') : '';
export const containsAny = (stored, selected) => !selected?.length || (Array.isArray(stored) ? stored : []).some(value => selected.some(choice => filterToken(value) === filterToken(choice)));
const includesToken = (stored, selected) => selected.some(choice => filterToken(stored) === filterToken(choice));
const values = value => Array.isArray(value) ? value : value == null ? [] : [value];
const numberValue = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function matchesActivity(person, selected) {
  if (!selected.length) return true;
  const presence = String(person.presence || '').toLowerCase();
  const bucket = String(person.last_seen_bucket || '');
  return selected.some(value => {
    const choice = filterToken(value);
    if (choice === 'online') return presence === 'online';
    if (choice === 'day') return presence === 'online' || /^(m([2-9]|[1-5][0-9])|h([1-9]|1[0-9]|2[0-3]))$/.test(bucket);
    if (choice === 'week') return presence === 'online' || /^(m([2-9]|[1-5][0-9])|h([1-9]|1[0-9]|2[0-3])|d[1-6])$/.test(bucket);
    return false;
  });
}

function matchesLocation(person, selected) {
  if (!selected.length) return true;
  const places = [person.city, person.location, person.location_area, person.location_city]
    .filter(Boolean)
    .map(value => String(value).toLowerCase());
  return selected.some(choice => places.some(place => place.includes(String(choice).trim().toLowerCase())));
}
// Consume only server-authorized discovery previews; never derive hidden values.
export function filterPeople(people, filters = {}) {
  const genders = values(filters.gender).map(value => ({ men: 'male', women: 'female' })[filterToken(value)]).filter(Boolean);
  return people.filter(person => {
    if (genders.length && !includesToken(person.gender, genders)) return false;
    if (values(filters.dating_looking_for_gender).length && !includesToken(person.dating_looking_for_gender, values(filters.dating_looking_for_gender))) return false;
    const age = person.show_age === false ? null : person.age;
    const min = numberValue(values(filters.age_min)[0]) ?? 18, max = numberValue(values(filters.age_max)[0]) ?? 99;
    // Selecting an age range must exclude a withheld or unknown age. It must
    // never treat missing private information as a match.
    if ((min !== 18 || max !== 99) && (age == null || age < min || age > max)) return false;
    for (const [field, sharing] of [['marital_status', 'share_marital_status'], ['family_plan', 'share_family_plan'], ['smoking', 'share_smoking'], ['drinking', 'share_drinking']]) {
      // The RPC omits unshared values; also honor explicit opt-outs if supplied.
      if (filters[field]?.length && (person[sharing] === false || !person[field] || !includesToken(person[field], filters[field]))) return false;
    }
    for (const [filter, field] of [['looking_for_tags', 'looking_for_tags'], ['interests', 'interests']]) {
      const selected = values(filters[filter] || (filter === 'looking_for_tags' ? filters.looking_for : []));
      if (selected.length && !containsAny(person[field], selected)) return false;
    }
    if (values(filters.languages).length && !containsAny(person.languages, values(filters.languages))) return false;
    if (values(filters.zodiac).length && !includesToken(person.zodiac, values(filters.zodiac))) return false;
    if (!matchesActivity(person, values(filters.activity))) return false;
    if (!matchesLocation(person, values(filters.location))) return false;
    const distance = numberValue(person.distance_km ?? person.distance);
    const selectedDistances = values(filters.distance).map(numberValue).filter(value => value != null);
    if (selectedDistances.length && (distance == null || !selectedDistances.some(limit => distance <= limit))) return false;
    return true;
  });
}
