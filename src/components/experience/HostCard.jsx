import React from 'react';
import {SmartSearchCard} from '@/components/search/SmartSearchResults';
export default function HostCard({experience}) {return <SmartSearchCard kind="people" row={{...experience.host,id:experience.host_user_id||experience.owner_id}}/>;}
