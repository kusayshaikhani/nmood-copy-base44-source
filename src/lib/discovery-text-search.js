// Match only explicit fields from already-authorized discovery responses.
// Never stringify whole records or inspect private profile/location fields.
const fields = {
  people: ['display_name', 'name', 'city', 'country', 'bio', 'interests', 'languages', 'looking_for_tags', 'public_tags', 'zodiac'],
  circles: ['name', 'description', 'city', 'country', 'community_name', 'shared_interests', 'category', 'tags'],
  experiences: ['title', 'description', 'city', 'country', 'location', 'category', 'mood', 'tags'],
  communities: ['name', 'description', 'category', 'location'],
};
export const normalizeDiscoveryQuery = value => String(value || '').trim().toLocaleLowerCase();
export function searchDiscoveryRows(rows, kind, query) {
  const term = normalizeDiscoveryQuery(query);
  if (!term) return rows;
  return rows.filter(row => (fields[kind] || []).some(field => {
    const values = Array.isArray(row[field]) ? row[field] : [row[field]];
    return values.some(value => typeof value === 'string' && value.toLocaleLowerCase().includes(term));
  }));
}
