import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { fetchMemberVerification, verificationSummary } from '@/lib/member-verification-badge';
export function useMemberVerification(memberId) {
 const {user}=useAuth();
 const key=`${user?.id || ''}:${memberId || ''}`;
 const [state,setState]=useState(null);
 useEffect(()=>{let active=true;setState(null);if(user?.id&&memberId)fetchMemberVerification(memberId).then(value=>{if(active)setState({key,value});});return()=>{active=false;};},[key,memberId,user?.id]);
 return state?.key===key?state.value:verificationSummary(null);
}
