import { useContext } from 'react';
import { LocalizationContext } from './LocalizationProvider';

/**
 * LOC-001 — Access the Localization Manager. Returns { lang, language, dir,
 * t, setLang, settings, updateSettings, formatDate, formatTime,
 * formatNumber, formatCurrency }.
 */
export function useLocalization() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization must be used within a LocalizationProvider');
  return ctx;
}

export default useLocalization;