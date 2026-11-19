import ContractSearch from '@/components/discover/ContractSearch';
import { MAIN_PASSPORT as MAIN_SEARCH_CONTRACT } from '@/lib/passport/enabled';
import {useCircleDiscovery} from '@/lib/circle-store';
import CircleCard from '@/components/circles/CircleCard';
import DedicatedListing from '@/components/discover/DedicatedListing';
function LegacyCircles(){const query=useCircleDiscovery();return <DedicatedListing title="Circles" rows={query.circles} query={query} renderItem={circle=><CircleCard circle={circle}/>}/>;}

export default function Circles(props) { return MAIN_SEARCH_CONTRACT ? <ContractSearch initialKind="community" lockedKind /> : <LegacyCircles {...props}/>; }
