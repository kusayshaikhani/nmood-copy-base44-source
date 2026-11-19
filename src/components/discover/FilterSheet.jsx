import React from 'react';
import UnifiedSearchFilters from '@/components/search/UnifiedSearchFilters';
import {nmoodCategories} from '@/lib/nmoods-data';
const legacyCategories=['Coffee','Food','Sports','Networking','Photography','Wellness','Learning','Arts','Gaming','Music','Nature','Outdoors'];
const categories=[...new Set([...legacyCategories,...nmoodCategories.map(x=>x.id)])];
export default function FilterSheet({open,onOpenChange,onApply,onReset,initialFilters,type='All'}) {
 const tab=({People:'pals',Pals:'pals',Circles:'circles',Experiences:'experiences','Nmood shares':'nmoods'})[type]||'all';
 const filters={...initialFilters,category:initialFilters?.category||initialFilters?.categories||[]};delete filters.categories;
 return <UnifiedSearchFilters tab={tab} open={open} onOpenChange={onOpenChange} onApply={onApply} onReset={onReset} filters={filters} availableCategories={categories}/>;
}
