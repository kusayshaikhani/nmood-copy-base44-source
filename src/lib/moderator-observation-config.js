import { MAIN_DEVICE_BUILD } from './ios-asset-flavor';
import {supabaseConfig} from '@/config/supabase-config';
export function observationEnabled(mode, config) {
  return ((mode === 'rehearsal' && config.target === 'rehearsal') || (mode === 'production' && config.target === 'production'))
    && config.projectRef === 'vudvrofhxwopgbldunky'
    && config.baseUrl === 'https://vudvrofhxwopgbldunky.supabase.co';
}
export const moderatorObservationEnabled = MAIN_DEVICE_BUILD ? false : observationEnabled(import.meta.env.MODE, supabaseConfig);
