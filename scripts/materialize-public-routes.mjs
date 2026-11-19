import { copyFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';

const routes = [
  'auth', 'login', 'register', 'signup', 'create-account', 'verify-email',
  'verify-otp', 'forgot-password', 'reset-password', 'privacy',
  'privacy-policy', 'terms', 'community-guidelines', 'safety',
  'delete-account', 'account-deletion', 'refund-policy', 'subscription-terms',
  'cookie-notice', 'ai-concierge-notice', 'support', 'legal',
];

const dist = resolve('dist');
const source = resolve(dist, 'index.html');

await access(source, constants.R_OK);

for (const route of routes) {
  const destination = resolve(dist, route, 'index.html');
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

console.log(`Created ${routes.length} public route entry points.`);
