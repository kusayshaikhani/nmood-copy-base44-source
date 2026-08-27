LC-002-Compliance-Report.md
LC-002A-Final-Audit.md
LC-002A-Verification-Report.md
import { useEffect } from 'react';


// Contextual browser titles — "Page Name | Nmood" or just "Nmood" for home.
// Usage: usePageTitle('Sign In') → "Sign In | Nmood"
//       usePageTitle()          → "Nmood"
const APP_NAME = 'Nmood';
const DEFAULT_TITLE = 'Nmood — Zero swipes, authentic connection.';


export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : DEFAULT_TITLE;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
}
