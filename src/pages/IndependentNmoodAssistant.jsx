import React from 'react';
import {useAuth} from '@/lib/AuthContext';
import ContractSearch from '@/components/discover/ContractSearch';

// One deterministic search destination. Optional explicit Ask action; results have no provider dependency.
export default function IndependentNmoodAssistant() {
 const {member}=useAuth();
 return <div className="min-w-0 bg-background pb-[calc(6rem+env(safe-area-inset-bottom))]"><ContractSearch embedded homeCity={member?.city}/></div>;
}
