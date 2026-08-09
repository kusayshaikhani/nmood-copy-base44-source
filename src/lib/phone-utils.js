// PV-TEL — E.164 phone normalization (UAE + international).
// Best-effort, no library. The backend re-validates. Callers should encourage
// entering the number with a leading + and country code for international use.

const COUNTRY_CODES = {
  AE: '971', US: '1', GB: '44', IN: '91', SA: '966', EG: '20', PK: '92',
  PH: '63', ID: '62', BD: '880', FR: '33', DE: '49', IT: '39', ES: '34',
  NG: '234', KE: '254', CA: '1', AU: '61', ZA: '27', TR: '90', JO: '962',
  KW: '965', QA: '974', BH: '973', OM: '968', LB: '961', IQ: '964', IR: '98',
};

/**
 * Normalize a raw phone string to E.164 (+country...).
 *  - Starts with '+': keep, strip non-digits after '+'.
 *  - Starts with '00': international prefix → '+'.
 *  - Starts with '0': local → strip 0, prefix default country code (AE 971).
 *  - Otherwise: prefix default country code.
 */
export function normalizeToE164(raw, opts = {}) {
  if (!raw) return '';
  let s = String(raw).trim().replace(/[\s\-().]/g, '');
  const defaultCC = COUNTRY_CODES[opts.defaultCountry || 'AE'] || '971';
  if (s.startsWith('+')) {
    return '+' + s.slice(1).replace(/\D/g, '');
  }
  if (s.startsWith('00')) {
    return '+' + s.slice(2).replace(/\D/g, '');
  }
  let digits = s.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = defaultCC + digits.slice(1);
  } else {
    // If it already starts with a known country code, keep it; else default.
    const startsKnown = Object.values(COUNTRY_CODES).some((cc) => digits.startsWith(cc));
    if (!startsKnown) digits = defaultCC + digits;
  }
  return '+' + digits;
}

export function isValidE164(phone) {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

export function maskPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length <= 7) return phone || '';
  return `+${digits.slice(0, 3)}•••${digits.slice(-4)}`;
}