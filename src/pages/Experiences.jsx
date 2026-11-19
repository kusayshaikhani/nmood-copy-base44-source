import ContractSearch from '@/components/discover/ContractSearch';
import { MAIN_PASSPORT as MAIN_SEARCH_CONTRACT } from '@/lib/passport/enabled';
import {useExperiences} from '@/lib/discover-store';
import DiscoverCard from '@/components/discover/DiscoverCard';
import DedicatedListing from '@/components/discover/DedicatedListing';
function LegacyExperiences(){const query=useExperiences();return <DedicatedListing title="Experiences" rows={query.experiences} query={query} renderItem={experience=><DiscoverCard experience={experience}/>}/>;}

export default function Experiences(props) { return MAIN_SEARCH_CONTRACT ? <ContractSearch initialKind="experiences" lockedKind /> : <LegacyExperiences {...props}/>; }
