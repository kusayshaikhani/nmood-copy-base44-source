// Base44's OAuth broker expects an in-app return path.
// Use the app root instead of rebuilding the current absolute origin.

export function getSocialReturnUrl() {
  return '/';
}

export default getSocialReturnUrl;