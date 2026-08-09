import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PV-TEL — Phone verification (OTP) service.
// Twilio Verify is the only production provider. Twilio generates AND validates
// the OTP server-side; we store only the verification SID (never the code).
// In non-production with no Twilio secrets configured, a local dev path
// generates and hashes a code (no SMS sent) and returns devCode for testing.
//
// Hardening preserved:
//   - E.164 validation, per-phone cooldown + hourly cap, per-IP send cap,
//     per-record attempt limit, aggregate rate-limit window.
//   - Generic anti-enumeration responses (no phone/code leak).
//   - AuditLog events for send/verify (no phone or code logged).

function isProduction() {
  return Deno.env.get('APP_ENV') === 'production';
}

function isValidSmsToken(v) {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (!s || s.length > 64) return false;
  if (/[\s\r\n\t\u0000-\u001f]/.test(s)) return false;
  if (/https?:\/\//i.test(s)) return false;
  if (/[\/\\:@]/.test(s)) return false;
  return /^[\w.+-]+$/.test(s);
}

function isValidPhone(v) {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  return /^\+[1-9]\d{6,14}$/.test(s); // E.164
}

function twilioVerifyConfigured() {
  return isValidSmsToken(Deno.env.get('TWILIO_ACCOUNT_SID'))
    && isValidSmsToken(Deno.env.get('TWILIO_AUTH_TOKEN'))
    && isValidSmsToken(Deno.env.get('TWILIO_VERIFY_SERVICE_SID'));
}

function smsConfigured() {
  return twilioVerifyConfigured();
}

// --- Crypto helpers (Web Crypto, available in Deno) ---
function randomCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, '0');
}
function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function clientIp(req) {
  const v = req.headers.get('x-forwarded-for') || '';
  return v.split(',')[0].trim().slice(0, 64) || 'unknown';
}

const UNAVAILABLE_MSG = 'Phone verification is currently unavailable.';

const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MIN = 10;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const SEND_COOLDOWN_SEC = 60;
const SEND_WINDOW_MIN = 60;
const SEND_MAX_PER_WINDOW = 5;
const IP_SEND_WINDOW_MIN = 60;
const IP_SEND_MAX_PER_WINDOW = 20;

const TWILIO_VERIFY_MARKER = 'twilio_verify';
const DEV_MARKER = 'dev_local';

// Audit without logging phone or code.
async function audit(svc, action, details) {
  try {
    await svc.asServiceRole.entities.AuditLog.create({
      administrator: 'phoneAuthService',
      action,
      target_type: 'PhoneOtp',
      details: details || '',
    });
  } catch { /* audit must never block */ }
}

// --- Twilio Verify adapter (verify.twilio.com) ---
// Twilio generates AND validates the OTP server-side; we store only the
// verification SID. Never logs phone, code, or credentials. Provider error
// codes are logged to AuditLog (server-side only) for diagnostics.
async function twilioVerifyCreate(phone, locale) {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const serviceSid = (Deno.env.get('TWILIO_VERIFY_SERVICE_SID') || '').trim();
  const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}/Verifications`;
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, Channel: 'sms', ...(locale ? { Locale: locale } : {}) }),
  });
  let parsed = null;
  try { parsed = await res.json(); } catch { /* non-json */ }
  return { status: res.status, parsed };
}

async function twilioVerifyCheck(phone, code) {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const serviceSid = (Deno.env.get('TWILIO_VERIFY_SERVICE_SID') || '').trim();
  const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}/VerificationCheck`;
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, Code: String(code) }),
  });
  let parsed = null;
  try { parsed = await res.json(); } catch { /* non-json */ }
  return { status: res.status, parsed };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, phone, code, purpose, locale } = body;

    // config_status — reports presence (never values). Does NOT call Twilio.
    if (action === 'config_status') {
      return Response.json({
        provider: Deno.env.get('SMS_PROVIDER') || null,
        configured: smsConfigured(),
        twilioVerifyConfigured: twilioVerifyConfigured(),
        production: isProduction(),
      });
    }

    if (!isValidPhone(phone)) return Response.json({ error: 'A valid phone number (E.164) is required' }, { status: 400 });

    if (isProduction() && !smsConfigured()) {
      return Response.json({ error: UNAVAILABLE_MSG }, { status: 503 });
    }

    if (action === 'send_otp') {
      const now = Date.now();
      const ip = clientIp(req);

      // Per-phone cool-down + hourly cap.
      const existing = await base44.asServiceRole.entities.PhoneOtp.filter({ phone });
      const recent = (existing || []).filter((otp) => new Date(otp.created_date) >= new Date(now - SEND_WINDOW_MIN * 60 * 1000));
      if (recent.length >= SEND_MAX_PER_WINDOW) {
        return Response.json({ error: 'Too many codes requested. Please try again later.' }, { status: 429 });
      }
      const mostRecent = recent.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      if (mostRecent && now - new Date(mostRecent.created_date).getTime() < SEND_COOLDOWN_SEC * 1000) {
        const waitSec = Math.ceil((SEND_COOLDOWN_SEC * 1000 - (now - new Date(mostRecent.created_date).getTime())) / 1000);
        return Response.json({ error: `Please wait ${waitSec}s before requesting another code.` }, { status: 429 });
      }

      // Per-IP send cap (telephony-exhaustion guard across many numbers).
      const ipRecords = await base44.asServiceRole.entities.PhoneOtp.filter({ ip });
      const ipRecent = (ipRecords || []).filter((otp) => new Date(otp.created_date) >= new Date(now - IP_SEND_WINDOW_MIN * 60 * 1000));
      if (ipRecent.length >= IP_SEND_MAX_PER_WINDOW) {
        await audit(base44, 'phone_otp_ip_limited', `ip=${ip}`);
        return Response.json({ error: 'Too many requests from your network. Please try again later.' }, { status: 429 });
      }

      const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();

      // --- Twilio Verify: Twilio generates/validates the OTP; store only the sid ---
      if (twilioVerifyConfigured()) {
        const r = await twilioVerifyCreate(phone, locale);
        if (r.status >= 200 && r.status < 300) {
          const verificationSid = r.parsed?.sid || '';
          if (!verificationSid) return Response.json({ error: UNAVAILABLE_MSG }, { status: 502 });
          await base44.asServiceRole.entities.PhoneOtp.create({
            phone,
            code: verificationSid,
            code_salt: TWILIO_VERIFY_MARKER,
            ip,
            expires_at: expiresAt,
            verified: false,
            purpose: purpose || 'register',
          });
          await audit(base44, 'phone_otp_sent', `purpose=${purpose || 'register'}`);
          return Response.json({ success: true, devCode: null });
        }
        // Log provider code server-side only; return a generic user error.
        const tCode = r.parsed?.code || '';
        await audit(base44, 'phone_otp_send_failed', `twilio status=${r.status} code=${tCode}`);
        if (r.status === 429) return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        return Response.json({ error: UNAVAILABLE_MSG }, { status: 503 });
      }

      // --- Dev path (non-production only; no external SMS secrets) ---
      const otpCode = randomCode();
      const salt = randomHex(16);
      const codeHash = await sha256Hex(otpCode + salt);
      await base44.asServiceRole.entities.PhoneOtp.create({
        phone,
        code: codeHash,
        code_salt: DEV_MARKER,
        ip,
        expires_at: expiresAt,
        verified: false,
        purpose: purpose || 'register',
      });
      await audit(base44, 'phone_otp_sent', `purpose=${purpose || 'register'}`);
      return Response.json({ success: true, devCode: otpCode });
    }

    if (action === 'verify_otp') {
      if (!code) return Response.json({ error: 'Code required' }, { status: 400 });

      // --- Twilio Verify: delegate code check to Twilio VerificationCheck ---
      if (twilioVerifyConfigured()) {
        const otps = await base44.asServiceRole.entities.PhoneOtp.filter({ phone, verified: false });
        const now = new Date();
        const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000);
        const recentAttempts = otps.reduce((sum, otp) => (new Date(otp.created_date) >= windowStart ? sum + (otp.attempts || 0) : sum), 0);
        if (recentAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
          await audit(base44, 'phone_otp_rate_limited', 'aggregate attempts exceeded');
          return Response.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
        }
        const pending = (otps || [])
          .filter((otp) => otp.code_salt === TWILIO_VERIFY_MARKER && new Date(otp.expires_at) > now && (otp.attempts || 0) < MAX_ATTEMPTS)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        if (!pending) {
          await audit(base44, 'phone_otp_failed', 'no pending twilio verify record');
          return Response.json({ verified: false, error: 'Invalid or expired code' }, { status: 400 });
        }
        const r = await twilioVerifyCheck(phone, code);
        if (r.status >= 200 && r.status < 300 && r.parsed?.status === 'approved') {
          await base44.asServiceRole.entities.PhoneOtp.update(pending.id, { verified: true }).catch(() => {});
          await audit(base44, 'phone_otp_verified', `purpose=${pending.purpose || 'verify'}`);
          return Response.json({ verified: true });
        }
        // Pending (wrong code) or error — increment attempts, log provider code.
        const nextAttempts = (pending.attempts || 0) + 1;
        if (nextAttempts >= MAX_ATTEMPTS) {
          await base44.asServiceRole.entities.PhoneOtp.delete(pending.id).catch(() => {});
        } else {
          await base44.asServiceRole.entities.PhoneOtp.update(pending.id, { attempts: nextAttempts }).catch(() => {});
        }
        const tCode = r.parsed?.code || '';
        await audit(base44, 'phone_otp_failed', `twilio status=${r.parsed?.status || r.status} code=${tCode}`);
        if (r.status === 429) return Response.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
        return Response.json({ verified: false, error: 'Invalid or expired code' }, { status: 400 });
      }

      // --- Dev path verify (non-production only; local hashed code) ---
      const otps = await base44.asServiceRole.entities.PhoneOtp.filter({ phone, verified: false });
      const now = new Date();
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000);
      const recentAttempts = otps.reduce((sum, otp) => (new Date(otp.created_date) >= windowStart ? sum + (otp.attempts || 0) : sum), 0);
      if (recentAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
        await audit(base44, 'phone_otp_rate_limited', 'aggregate attempts exceeded');
        return Response.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
      }

      let validOtp = null;
      for (const otp of otps) {
        if (otp.code_salt === TWILIO_VERIFY_MARKER) continue;
        if (new Date(otp.expires_at) <= now || (otp.attempts || 0) >= MAX_ATTEMPTS || !otp.code_salt) continue;
        const hash = await sha256Hex(String(code) + otp.code_salt);
        if (hash === otp.code) { validOtp = otp; break; }
      }

      if (!validOtp) {
        const pending = otps.filter((otp) => otp.code_salt === DEV_MARKER && new Date(otp.expires_at) > now && (otp.attempts || 0) < MAX_ATTEMPTS).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        if (pending) {
          const nextAttempts = (pending.attempts || 0) + 1;
          if (nextAttempts >= MAX_ATTEMPTS) {
            await base44.asServiceRole.entities.PhoneOtp.delete(pending.id).catch(() => {});
          } else {
            await base44.asServiceRole.entities.PhoneOtp.update(pending.id, { attempts: nextAttempts }).catch(() => {});
          }
        }
        await audit(base44, 'phone_otp_failed', 'invalid or expired code');
        return Response.json({ verified: false, error: 'Invalid or expired code' }, { status: 400 });
      }

      await base44.asServiceRole.entities.PhoneOtp.update(validOtp.id, { verified: true });
      await audit(base44, 'phone_otp_verified', `purpose=${validOtp.purpose || 'verify'}`);
      return Response.json({ verified: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});