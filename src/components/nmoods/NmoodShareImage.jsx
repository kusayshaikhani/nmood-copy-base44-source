import React,{useEffect,useState} from 'react';
import SmartImage from '@/components/shared/SmartImage';
import {getNmoodShareImageUrl} from '@/lib/nmood-posts';
import {useAuth} from '@/lib/AuthContext';

export default function NmoodShareImage({path,alt='',fallback,className='discovery-image',portraitPosition='50% 15%'}) {
 const {user}=useAuth();const [url,setUrl]=useState(null);
 useEffect(()=>{let active=true;setUrl(null);if(!path||!user?.id)return undefined;getNmoodShareImageUrl(path,{expectedUserId:user.id}).then(value=>{if(active)setUrl(value);}).catch(()=>{if(active)setUrl(null);});return()=>{active=false;};},[path,user?.id]);
 return <SmartImage portraitPosition={portraitPosition} src={url} alt={alt} rounded="rounded-none" className={className} fallback={fallback}/>;
}
