import { useDiscoveryQuery } from '@/lib/discovery-query';
import { useSafety } from '@/lib/safety-store';
import { fetchDiscoverableMembers, fetchNewPals } from '@/lib/member-discovery';

export function useDiscoveryPeople({ recentOnly = false, enabled = true } = {}) {
  const { isBlocked } = useSafety();
  const query = useDiscoveryQuery(recentOnly ? 'new-pals' : 'people', signal => recentOnly ? fetchNewPals({ signal }) : fetchDiscoverableMembers(200, { signal }), { enabled });
  return {
    ...query,
    members: (query.data || []).filter(person => !isBlocked(person.id)).map(person => ({
      ...person, id: person.id, name: person.name || person.display_name || 'Member',
      avatar: person.photo_url || '', languages: person.languages || [],
      interests: person.interests || [], city: person.city || '', bio: person.bio || '',
      verified: !!person.identity_verified,
    })),
  };
}
