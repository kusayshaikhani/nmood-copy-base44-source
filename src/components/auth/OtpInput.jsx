import React, { useRef } from 'react';

// R3.1 — Simple, accessible, fully controlled OTP input.
// Replaces the input-otp library which could not be controlled reliably
// during testing. Uses 6 controlled single-digit inputs with support for
// typing, paste, Backspace, mobile numeric keyboard, focus movement, and
// correction. Ignores spaces and non-numeric characters.
//
// Accessibility: each input has an aria-label, the group has role="group".
// Mobile: inputMode="numeric" triggers the numeric keyboard.
// Autofill: autoComplete="one-time-code" on the first input for SMS autofill.
export default function OtpInput({ value, onChange, disabled, length = 6 }) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const focusInput = (index) => {
    if (index >= 0 && index < length) {
      const el = inputsRef.current[index];
      if (el) {
        el.focus();
        el.select();
      }
    }
  };

  const handleChange = (index, raw) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      // Multiple digits (paste or SMS autofill) — distribute across inputs.
      const newDigits = [...digits];
      for (let i = 0; i < cleaned.length && index + i < length; i++) {
        newDigits[index + i] = cleaned[i];
      }
      onChange(newDigits.join(''));
      focusInput(Math.min(index + cleaned.length, length - 1));
      return;
    }
    const digit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(''));
    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        focusInput(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pasted) {
      const newDigits = Array.from({ length }, (_, i) => pasted[i] || '');
      onChange(newDigits.join(''));
      focusInput(Math.min(pasted.length, length - 1));
    }
  };

  return (
    <div
      className="flex justify-center gap-1 sm:gap-2"
      data-testid="auth-verification-code"
      role="group"
      aria-label="6-digit verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className="h-12 w-9 sm:h-16 sm:w-14 text-base sm:text-xl font-bold rounded-xl border-2 border-border/70 bg-card text-center text-foreground transition-all focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50"
        />
      ))}
    </div>
  );
}