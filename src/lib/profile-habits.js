// Canonical private-profile preference values. Labels remain client copy so
// storage and filters never depend on translated display text.
export const smokingOptions = Object.freeze([
  { value: 'does_not_smoke', label: "I don't smoke" },
  { value: 'smokes', label: 'I do smoke' },
  { value: 'only_when_drinking', label: 'Only when I drink' },
  { value: 'vapes', label: 'Vape' },
  { value: 'e_cigarettes', label: 'E-cigs' },
  { value: 'sheesha', label: 'Sheesha' },
  { value: 'trying_to_quit', label: 'Trying to quit' },
]);
export const drinkingOptions = Object.freeze([
  { value: 'does_not_drink', label: "I don't drink" },
  { value: 'weekends', label: 'On weekends' },
  { value: 'socially', label: 'Socially' },
  { value: 'frequently', label: 'Frequently' },
]);
export function preferenceLabel(options, value) {
  return options.find((option) => option.value === value)?.label || '';
}
