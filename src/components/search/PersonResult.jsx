import React from 'react';
import { Link } from 'react-router-dom';
import CompactProfile from '@/components/shared/CompactProfile';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { recordLocalRecommendationSignal } from '@/lib/recommendation-preferences';
export default function PersonResult({person}) {
 return <article data-testid="pal-search-card" data-search-card="people" className="discovery-card compact-discovery-card unified-card">
  <Link to={`/pal/${encodeURIComponent(person.id)}`} onClick={()=>{trackProductEvent(PRODUCT_EVENTS.SEARCH_RESULT_SELECTED,{resultType:'person'});recordLocalRecommendationSignal(person.interests?.[0],'open_person');}} className="compact-profile-link"><CompactProfile person={person}/></Link>
 </article>;
}
