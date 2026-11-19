// Presentation only: never changes stored profile values or authorization.
export function displayDetail(value) {
 if (typeof value !== 'string') return '';
 const text = value.trim();
 return !text || /^[_\s–—-]+$/.test(text) || /^(?:n\/?a|null|undefined|not specified|not set|placeholder|select(?: an? option)?|none)$/i.test(text) ? '' : text;
}
export function lookingForDetails(value) {
 return (Array.isArray(value) ? value : [value]).map(displayDetail).filter(Boolean);
}

// Card labels only: keep stored keys intact for profile grouping and localization.
export function lookingForLabels(value) {
 return lookingForDetails(value).map(text => text.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
}
