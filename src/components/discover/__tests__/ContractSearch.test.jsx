import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.join(process.cwd(), 'src/components/discover/ContractSearch.jsx'), 'utf8');

describe('Community View all controls', () => {
  it('selects a full Circle or Experience list through the URL', () => {
    expect(source).toContain("['circles','experiences'].includes(params.get('view'))");
    expect(source).toContain("next.set('view',key)");
    expect(source).toContain('Show Circles & Experiences');
  });
});
