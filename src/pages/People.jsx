import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useDiscoveryPeople } from '@/lib/use-discovery-people';
import { useConnections } from '@/lib/connections-store';
import { newestMembers } from '@/lib/people-order';
import { useAuthorizedMemberIndicators } from '@/components/profile/MemberIndicators';
import { MemberCards } from '@/components/home/premium/NewPalsSection';
import DiscoveryStatus from '@/components/shared/DiscoveryStatus';
import { DiscoveryGate } from '@/components/membership/ExplorerPolicyGate';

function PeopleDirectory(){
 const {user}=useAuth();const connections=useConnections(user);
 const q=useDiscoveryPeople();const {indicators}=useAuthorizedMemberIndicators();
 const members=newestMembers(q.members||[],indicators);
 return <div className="px-6 pt-4 pb-24 space-y-4">
  <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Pals</h1><Link to="/pals" className="min-h-11 inline-flex items-center text-sm font-semibold text-primary">Your connections</Link></div>
  <p className="text-sm text-muted-foreground">Discover people on Nmood, newest first.</p>
  {q.isLoading||q.isError?<DiscoveryStatus label="People" loading={q.isLoading} error={q.isError} onRetry={q.refetch}/>:members.length===0?<p role="status">No discoverable members yet.</p>:<MemberCards members={members} fullList connections={connections} indicatorHome={false} label="Discoverable people"/>}
  {!q.isLoading&&!q.isError&&members.length>=200&&<p role="status" className="text-xs text-muted-foreground">Showing available members. More people may be available.</p>}
 </div>;
}
export default function People(){return <DiscoveryGate><PeopleDirectory/></DiscoveryGate>;}
