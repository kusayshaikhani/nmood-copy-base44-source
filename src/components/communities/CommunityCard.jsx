import React from 'react';
import UnifiedContentCard from '@/components/shared/UnifiedContentCard';
export default function CommunityCard({community}){return <UnifiedContentCard kind="circles" row={community} href={`/community/${encodeURIComponent(community.id)}`}/>;}
