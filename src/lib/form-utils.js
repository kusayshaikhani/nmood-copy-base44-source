// DP-002 — Shared form validation primitives. Use across every form so
// validation messages, email/phone/URL rules, and counters stay consistent.

export const validators = {
  required: (v) => (!!String(v ?? '').trim()) || 'This field is required',
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) || 'Enter a valid email address',
  phone: (v) => !v || /^[+]?[\d\s()-]{7,}$/.test(String(v).trim()) || 'Enter a valid phone number',
  url: (v) => !v || /^https?:\/\/[^\s]+$/i.test(String(v).trim()) || 'Enter a valid URL (https://…)',
  minLength: (n) => (v) => !v || String(v).length >= n || `At least ${n} characters`,
  maxLength: (n) => (v) => !v || String(v).length <= n || `At most ${n} characters`,
  minItems: (n) => (arr) => !arr || (Array.isArray(arr) && arr.length >= n) || `Select at least ${n}`,
};

// Human character counter: "34/200". Use under textareas/inputs with maxLength.
export const charCounter = (value, max) => `${String(value ?? '').length}/${max}`;

// Returns true when every field's validator passes. `schema` is
// { field: validatorFn | [validatorFn, ...] }.
export const isFormValid = (values, schema) => {
  for (const [field, rule] of Object.entries(schema)) {
    const fns = Array.isArray(rule) ? rule : [rule];
    for (const fn of fns) {
      const result = fn(values[field]);
      if (result !== true && result !== undefined) return false;
    }
  }
  return true;
};