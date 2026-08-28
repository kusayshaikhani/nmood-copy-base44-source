import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Check, AlertCircle, RefreshCw, Flag, Search, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { detectLocation } from '@/lib/location-detection';
import { countryNameFromEnglish } from '@/lib/i18n/display-names';
import { COUNTRIES, getCountry } from '@/lib/master-data';
import { CITIES } from '@/lib/master-data/cities';
import { detectLocaleSettings } from '@/lib/master-data/detect-locale-settings';
import BottomSheet from '@/components/shared/BottomSheet';
import MasterDataPicker from '@/components/master-data/MasterDataPicker';

const NAME_TO_KEY = Object.fromEntries(COUNTRIES.map((c) => [c.name.toLowerCase(), c.key]));

export default function LocationStep({ data, update, onNext }) {
  const { t, lang } = useLocalization();
  const [status, setStatus] = useState('idle'); // idle | detecting | done | denied
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showNationalitySheet, setShowNationalitySheet] = useState(false);

  const runDetection = useCallback(async () => {
    setPermissionRequested(true);
    setStatus('detecting');
    try {
      const detected = await detectLocation();
      setResult(detected);
      const countryKey = NAME_TO_KEY[(detected.country || '').toLowerCase()] || detected.country || '';
      const countryObj = countryKey ? getCountry(countryKey) : null;
      const countryCode = countryObj?.key?.toUpperCase() || '';
      const isUnknown = detected.source === 'unknown' || (detected.country === 'Unknown' && detected.city === 'Unknown');
      update({
        country: countryKey,
        country_code: countryCode,
        state: detected.state || '',
        city: detected.city !== 'Unknown' ? detected.city : '',
        latitude: detected.latitude ?? null,
        longitude: detected.longitude ?? null,
        location_enabled: detected.source === 'gps',
        timezone: detectLocaleSettings().timezone,
      });
      // Only show the denied/unavailable card when we truly could not resolve a
      // location at all (GPS + IP both failed). A GPS denial that still
      // resolves an approximate location via IP is a success, not a failure.
      setStatus(isUnknown ? 'denied' : 'done');
    } catch {
      setStatus('denied');
    }
  }, [update]);

  useEffect(() => {
    if (status === 'idle') {
      runDetection();
    }
  }, [status, runDetection]);

  // Autocomplete: search cities and countries
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const cityMatches = CITIES.filter((c) =>
      c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    ).slice(0, 8);
    const coveredCodes = new Set(cityMatches.map((c) => c.country_code));
    const countryMatches = COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(q) && !coveredCodes.has(c.key.toUpperCase())
    ).slice(0, 3).map((c) => ({
      key: c.key,
      name: c.name,
      country: c.name,
      country_code: c.key.toUpperCase(),
      isCountryOnly: true,
    }));
    return [...cityMatches, ...countryMatches];
  }, [search]);

  const handleSelectLocation = (item) => {
    if (item.isCountryOnly) {
      update({
        country: item.key,
        country_code: item.country_code,
        state: '',
        city: '',
        latitude: null,
        longitude: null,
        location_enabled: false,
      });
      setResult({ country: item.country, city: '', state: '', source: 'manual' });
    } else {
      update({
        country: item.country_code.toLowerCase(),
        country_code: item.country_code,
        state: '',
        city: item.name,
        latitude: null,
        longitude: null,
        location_enabled: false,
      });
      setResult({ country: item.country, city: item.name, state: '', source: 'manual' });
    }
    setStatus('done');
    setSearch('');
    setShowResults(false);
  };

  const handleRetry = () => {
    setStatus('idle');
    setResult(null);
  };

  const handleChooseAnother = () => {
    setResult(null);
    setStatus('idle');
    setSearch('');
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="Search city"]');
      if (input) input.focus();
    }, 100);
  };

  // Display values
  const displayCity = data.city || (result?.city && result.city !== 'Unknown' ? result.city : '');
  const displayState = data.state || result?.state || '';
  const countryObj = data.country ? getCountry(data.country) : null;
  const displayCountryName = countryObj
    ? `${countryObj.flag} ${countryObj.name}`
    : (result?.country && result.country !== 'Unknown'
      ? (countryNameFromEnglish(result.country, lang) || result.country)
      : '');

  const isDenied = status === 'denied' && permissionRequested;
  const isDetecting = status === 'detecting';
  const isDone = status === 'done';
  const hasLocation = !!(displayCity || data.country);

  return (
    <div className="flex flex-col items-center text-center pt-2">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="w-20 h-20 rounded-3xl bg-nmood-gradient flex items-center justify-center shadow-elevated mb-6"
      >
        {isDetecting ? (
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        ) : isDenied ? (
          <AlertCircle className="w-10 h-10 text-white" />
        ) : (
          <MapPin className="w-10 h-10 text-white" strokeWidth={1.6} />
        )}
      </motion.div>

      {/* Heading */}
      <h2 className="font-heading text-xl font-bold mb-2">{t('onboarding.location.premium_heading')}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm">
        {t('onboarding.location.description')}
      </p>

      {/* === DETECTING STATE === */}
      {isDetecting && (
        <div className="w-full mb-4 p-5 rounded-card bg-card border border-border/50 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div className="flex-1 text-start">
              <p className="text-[14px] font-semibold">{t('onboarding.location.detecting')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('onboarding.location.requesting_permission')}</p>
            </div>
          </div>
        </div>
      )}

      {/* === LOCATION DETECTED CARD === */}
      {isDone && hasLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full mb-4"
        >
          <div className="p-5 rounded-card bg-card border border-primary/20 shadow-elevated">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {result?.source === 'gps' ? t('onboarding.location.gps_location') : result?.source === 'manual' ? t('onboarding.location.selected_location') : t('onboarding.location.approximate_location')}
              </span>
            </div>
            <p className="text-2xl font-bold text-start mb-1">{displayCity || displayState || t('onboarding.location.unknown')}</p>
            <p className="text-sm text-muted-foreground text-start mb-4">
              {displayState && displayState !== displayCity ? `${displayState}, ` : ''}{displayCountryName}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button className="flex-1 h-11" onClick={onNext}>
                <Check className="w-4 h-4 me-1.5" />
                {t('onboarding.location.use_location') || 'Use this location'}
              </Button>
              <Button variant="outline" className="flex-1 h-11" onClick={handleChooseAnother}>
                <MapPin className="w-4 h-4 me-1.5" />
                {t('onboarding.location.choose_another') || 'Choose another'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* === DENIED STATE === */}
      {isDenied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full mb-4"
        >
          <div className="p-5 rounded-card bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {t('onboarding.location.denied_title') || 'Location permission is disabled'}
              </span>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-3 text-start">
              {t('onboarding.location.denied_hint') || 'Allow access or search manually.'}
            </p>
            <Button className="w-full h-10 mb-2" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 me-1.5" />
              {t('onboarding.location.retry') || 'Try again'}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={onNext}
            >
              Skip for now
            </Button>
          </div>
        </motion.div>
      )}

      {/* === SEARCH FIELD — always visible === */}
      <div className="w-full mb-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder={t('onboarding.location.search_placeholder') || 'Search city, country or region…'}
            className="h-12 rounded-xl ps-10 pe-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setShowResults(false); }}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        {/* Autocomplete results */}
        {showResults && search.trim() && (
          <div className="mt-1.5 rounded-xl border border-border bg-card shadow-elevated overflow-hidden max-h-[280px] overflow-y-auto momentum-scroll">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 px-3">
                {t('onboarding.location.no_results') || 'No results found. Try a different search.'}
              </p>
            ) : (
              searchResults.map((item, i) => (
                <button
                  key={`${item.key}-${i}`}
                  type="button"
                  onClick={() => handleSelectLocation(item)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-muted/50 transition-default text-start border-b border-border/30 last:border-b-0"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.country}</p>
                  </div>
                  {item.isCountryOnly && <span className="text-xs text-muted-foreground flex-shrink-0">{t('onboarding.location.country_label')}</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* === WHY explanation === */}
      <div className="w-full mb-5 p-3.5 rounded-card bg-primary/5 border border-primary/15 text-start">
        <p className="text-[13px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          {t('onboarding.permissions.location_why')}
        </p>
      </div>

      {/* === Country correction === */}
      <div className="w-full mb-4">
        <button
          type="button"
          onClick={() => setShowCountrySheet(true)}
          className="w-full text-sm font-medium text-primary py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-default"
        >
          {t('onboarding.location.change_country') || 'Change country'}
        </button>
      </div>

      {/* === Nationality section === */}
      <div className="w-full mt-5">
        <h3 className="font-heading text-lg font-bold mb-1.5">{t('onboarding.location.nationality_heading')}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-sm">
          {t('onboarding.location.nationality_description')}
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowNationalitySheet(true)}
            className="w-full flex items-center gap-3 p-4 rounded-card bg-card border border-border/50 shadow-soft hover:border-primary/30 transition-default text-start"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Flag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold truncate">
                {data.nationality
                  ? (data.nationality === 'prefer_not_to_say'
                    ? t('onboarding.location.nationality_prefer_not_to_say')
                    : (getCountry(data.nationality)?.name || data.nationality))
                  : t('onboarding.location.nationality_select')}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => update({ nationality: 'prefer_not_to_say' })}
            className={`w-full text-sm font-medium py-2.5 rounded-xl border transition-default ${
              data.nationality === 'prefer_not_to_say'
                ? 'border-primary/30 bg-primary/5 text-primary'
                : 'border-border/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {t('onboarding.location.nationality_prefer_not_to_say')}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">{t('onboarding.location.nationality_optional')}</p>
      </div>

      {/* === Country picker sheet === */}
      <BottomSheet open={showCountrySheet} onOpenChange={setShowCountrySheet} title={t('onboarding.location.select_country') || 'Select your country'}>
        <div className="h-[60vh] pb-2">
          <MasterDataPicker
            type="countries"
            multi={false}
            value={data.country}
            onChange={(key) => {
              if (key) {
                const c = getCountry(key);
                update({ country: key, country_code: c?.key?.toUpperCase() || '' });
                setShowCountrySheet(false);
              }
            }}
            placeholder={t('common.search') || 'Search countries…'}
          />
        </div>
      </BottomSheet>

      {/* === Nationality picker sheet === */}
      <BottomSheet open={showNationalitySheet} onOpenChange={setShowNationalitySheet} title={t('onboarding.location.nationality_select')}>
        <div className="h-[60vh] pb-2">
          <MasterDataPicker
            type="countries"
            multi={false}
            value={data.nationality && data.nationality !== 'prefer_not_to_say' ? data.nationality : ''}
            onChange={(key) => { if (key) { update({ nationality: key }); setShowNationalitySheet(false); } }}
            placeholder={t('common.search') || 'Search nationalities…'}
          />
        </div>
      </BottomSheet>

      {/* === Continue button === */}
      <div className="w-full space-y-2.5 mt-6">
        <Button className="w-full h-12 shadow-elevated" onClick={onNext}>
          {t('common.continue')}
        </Button>
        {isDetecting && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t('onboarding.location.detecting')}
          </div>
        )}
      </div>

      {/* === Location notice === */}
      <div className="w-full mt-4 p-3 rounded-xl bg-muted/40 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed text-center">
          {t('lc002.location.notice')}
        </p>
      </div>
    </div>
  );
}