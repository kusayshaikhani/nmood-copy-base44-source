import { callSupabaseRpc } from '@/api/supabaseClient';
export const ensureOnboardingProfile=()=>callSupabaseRpc('ensure_my_onboarding_profile');
export const saveOnboardingProgress=(updates)=>callSupabaseRpc('save_my_onboarding_progress',{p_updates:updates});
export const completeOnboarding=()=>callSupabaseRpc('complete_my_onboarding');
