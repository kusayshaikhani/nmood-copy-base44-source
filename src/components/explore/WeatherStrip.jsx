import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, Moon, CloudSun } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

/**
 * UI-004 Phase 6 — Compact weather strip.
 * Uses the member's stored city (from onboarding) + Open-Meteo geocoding.
 * Does NOT request geolocation — no permission prompt on mount or navigation.
 * Hides gracefully if the member has no city or any fetch fails.
 */
function getWeatherIcon(code, isDay) {
  if (code === 0) return isDay ? Sun : Moon;
  if (code === 1 || code === 2) return isDay ? CloudSun : Cloud;
  if (code >= 51 && code <= 67) return CloudRain;
  return Cloud;
}

export default function WeatherStrip() {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadWeather() {
      try {
        // Read the member's stored city — no geolocation permission needed.
        const members = await base44.entities.Member.filter(
          { created_by_id: String(user?.id || '') }, '-updated_date', 1
        );
        const member = members?.[0];
        const city = member?.city;
        if (!city || city === 'Unknown' || !active) return;

        // Geocode the stored city to coordinates (Open-Meteo, free, keyless).
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) return;
        const geoData = await geoRes.json();
        const place = geoData?.results?.[0];
        if (!place || !active) return;

        // Fetch weather for the geocoded coordinates.
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,is_day`
        );
        if (!wRes.ok) return;
        const wData = await wRes.json();
        if (!active) return;
        setWeather({
          temp: Math.round(wData.current.temperature_2m),
          code: wData.current.weather_code,
          isDay: wData.current.is_day === 1,
          city: place.name || city,
        });
      } catch { /* hide gracefully */ }
    }
    if (user?.id) loadWeather();
    return () => { active = false; };
  }, [user?.id]);

  if (!weather) return null;
  const Icon = getWeatherIcon(weather.code, weather.isDay);
  const insightKey = weather.temp >= 30
    ? 'discovery.weather.hot'
    : weather.temp >= 18
      ? 'discovery.weather.perfect'
      : 'discovery.weather.cool';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="flex items-center gap-2.5 mt-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15"
    >
      <Icon className="w-5 h-5 text-white flex-shrink-0" />
      <span className="text-white text-sm font-semibold">{weather.temp}°C</span>
      {weather.city && (
        <>
          <span className="text-white/40 text-sm">•</span>
          <span className="text-white/80 text-sm truncate">{weather.city}</span>
        </>
      )}
      <span className="text-white/60 text-xs ml-auto truncate">{t(insightKey)}</span>
    </motion.div>
  );
}