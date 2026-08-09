import React, { useState } from 'react';
import { MapPin, Loader2, AlertCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateMemberProfile } from '@/lib/member-update';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';

/**
 * User-initiated location flow for distance-based search.
 *
 * Privacy rules:
 * - Never auto-prompts on page load — only fires on explicit tap.
 * - Never infers precise location — uses browser geolocation API only.
 * - On grant, stores ONLY approximate lat/lng on the member profile via
 *   the established safe update path (authorizationGate updateProfile).
 * - On deny/unavailable, explains neutrally and offers a settings link.
 */
export default function LocationRequestButton({ onLocationGranted, className = '' }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { refreshMember } = useAuth();
  const [state, setState] = useState('idle'); // idle | requesting | error
  const [errorMsg, setErrorMsg] = useState('');

  const requestLocation = () => {
    if (!navigator?.geolocation) {
      setState('error');
      setErrorMsg(t('search.location_unsupported'));
      return;
    }
    setState('requesting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = Math.round(pos.coords.latitude * 1000) / 1000;
          const lng = Math.round(pos.coords.longitude * 1000) / 1000;
          // Store via the safe backend update path — strips protected fields.
          await updateMemberProfile({
            latitude: lat,
            longitude: lng,
            location_enabled: true,
          });
          // Refresh the auth context member so memberLocation recomputes.
          if (refreshMember) await refreshMember();
          setState('idle');
          if (onLocationGranted) onLocationGranted({ lat, lng });
        } catch {
          setState('error');
          setErrorMsg(t('search.location_store_error'));
        }
      },
      (err) => {
        setState('error');
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg(t('search.location_denied'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg(t('search.location_unavailable'));
        } else {
          setErrorMsg(t('search.location_error'));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  if (state === 'requesting') {
    return (
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 ${className}`}>
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <span className="text-xs font-medium text-primary">{t('search.location_requesting')}</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-start gap-2 px-4 py-2.5 rounded-xl bg-destructive/5 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="text-xs text-primary font-medium mt-1 flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              {t('search.location_manage')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-default"
        >
          <MapPin className="w-4 h-4" />
          {t('search.use_my_location')}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={requestLocation}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-default ${className}`}
    >
      <MapPin className="w-4 h-4" />
      {t('search.use_my_location')}
    </button>
  );
}