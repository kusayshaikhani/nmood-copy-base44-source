import React from 'react';
import {SmartSearchCard} from '@/components/search/SmartSearchResults';
import CommunityCard from '@/components/communities/CommunityCard';
export default function SearchResultCard({item}){
 if(item.type==='community')return <CommunityCard community={item}/>;
 const kind={circle:'circles',experience:'experiences',post:'posts',pal:'people',person:'people'}[item.type];
 return kind?<SmartSearchCard kind={kind} row={item}/>:null;
}
