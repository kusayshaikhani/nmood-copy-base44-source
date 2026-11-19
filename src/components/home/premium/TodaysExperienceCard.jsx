import React from 'react';
import {SmartSearchCard} from '@/components/search/SmartSearchResults';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import {useLocalization} from '@/lib/i18n/useLocalization';
export default function TodaysExperienceCard({experiences=[]}){const {t}=useLocalization();return experiences[0]?<section><SectionTitle>{t('home.todays_experiences')}</SectionTitle><SmartSearchCard kind="experiences" row={experiences[0]}/></section>:null;}
