import React from 'react';
import {SmartSearchCard} from '@/components/search/SmartSearchResults';
export default function NmoodHostCard({post}) {return <SmartSearchCard kind="people" row={{id:post.owner_id||post.member_id,display_name:post.member_first_name,avatar:post.member_avatar}}/>;}
