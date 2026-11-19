import React from 'react';
import {Link} from 'react-router-dom';
import CompactProfile, {profileSummary} from '@/components/shared/CompactProfile';
export default function HomePersonCard({row}) {
 return <article data-search-card="people" className="discovery-card compact-discovery-card unified-card"><Link to={`/pal/${encodeURIComponent(row.id)}`} aria-label={`View profile: ${profileSummary(row).name}`} className="compact-profile-link"><CompactProfile person={row} home/></Link></article>;
}
