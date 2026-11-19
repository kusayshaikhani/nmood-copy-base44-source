export function heightInFeet(cm) {
 if (!Number.isFinite(cm) || cm <= 0) return null;
 const inches = Math.round(cm / 2.54);
 return { feet: Math.floor(inches / 12), inches: inches % 12 };
}
export function heightInCm(feet, inches) {
 return Math.round((feet * 12 + inches) * 254) / 100;
}
export function heightLabel(cm) {
 const value = heightInFeet(cm);
 return value ? `${cm} cm (${value.feet} ft ${value.inches} in)` : '';
}
