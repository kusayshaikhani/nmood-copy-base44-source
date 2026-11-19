import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/components/circles/CircleLocation.jsx'),
  'utf8',
);

describe('CircleLocation', () => {
  it('uses the shared map view instead of a browser-only Maps-key gate', () => {
    expect(source).toContain("import UnifiedMapView from '@/components/map/UnifiedMapView'");
    expect(source).toContain('<UnifiedMapView markers=');
    expect(source).not.toContain('isGoogleMapsBrowserAvailable');
    expect(source).not.toContain('Circle map unavailable until Google Maps is configured.');
  });
});
