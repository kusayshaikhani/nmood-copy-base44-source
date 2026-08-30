import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCircle, createExperience, listCircles, listExperiences, getCircleById, getExperienceById } from '@/api/contentRecords';
import { getRecommendedCircles } from '@/lib/circle-store';

vi.mock('@/api/supabaseClient', () => ({
  getSupabaseSession: () => ({
    access_token: 'token-123',
    user: { id: 'owner-123' },
  }),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(async (url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null;
    const method = options.method || 'GET';
    const query = String(url).split('?')[1] || '';

    if (method === 'POST') {
      const row = {
        id: `row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        entity_type: body.entity_type,
        owner_id: 'owner-123',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        data: body.data,
      };
      return {
        ok: true,
        json: async () => [row],
      };
    }

    if (query.includes('entity_type=eq.Circle')) {
      if (query.includes('id=eq.')) {
        const id = decodeURIComponent(query.split('id=eq.')[1].split('&')[0]);
        return {
          ok: true,
          json: async () => [
            {
              id,
              entity_type: 'Circle',
              owner_id: 'owner-123',
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-01T00:00:00.000Z',
              data: { id, name: 'Persisted Circle', privacy: 'public', status: 'active', member_count: 2 },
            },
          ],
        };
      }

      return {
        ok: true,
        json: async () => [
          {
            id: 'circle-1',
            entity_type: 'Circle',
            owner_id: 'owner-123',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            data: { id: 'circle-1', name: 'Persisted Circle', privacy: 'public', status: 'active', member_count: 2 },
          },
        ],
      };
    }

    if (query.includes('entity_type=eq.Experience')) {
      if (query.includes('id=eq.')) {
        const id = decodeURIComponent(query.split('id=eq.')[1].split('&')[0]);
        return {
          ok: true,
          json: async () => [
            {
              id,
              entity_type: 'Experience',
              owner_id: 'owner-123',
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-01T00:00:00.000Z',
              data: { id, title: 'Persisted Experience', privacy: 'public', status: 'active', max_participants: 10 },
            },
          ],
        };
      }

      return {
        ok: true,
        json: async () => [
          {
            id: 'exp-1',
            entity_type: 'Experience',
            owner_id: 'owner-123',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            data: { id: 'exp-1', title: 'Persisted Experience', privacy: 'public', status: 'active', max_participants: 10 },
          },
        ],
      };
    }

    return { ok: true, json: async () => [] };
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Supabase-backed creation and observable re-open flow', () => {
  it('persists a Circle, lists it, and reopens it by id without restart', async () => {
    const created = await createCircle({ name: 'Persisted Circle', privacy: 'public', status: 'active', member_count: 2 });
    const listed = await listCircles();
    const reopened = await getCircleById(created.id);

    expect(created.id).toBeTruthy();
    expect(listed.some((c) => c.name === 'Persisted Circle')).toBe(true);
    expect(reopened.name).toBe('Persisted Circle');
  });

  it('persists an Experience, lists it, and reopens it by id without restart', async () => {
    const created = await createExperience({ title: 'Persisted Experience', privacy: 'public', status: 'active', max_participants: 10 });
    const listed = await listExperiences();
    const reopened = await getExperienceById(created.id);

    expect(created.id).toBeTruthy();
    expect(listed.some((e) => e.title === 'Persisted Experience')).toBe(true);
    expect(reopened.title).toBe('Persisted Experience');
  });

  it('keeps private and invite-only circles out of public discovery and public results', () => {
    const publicCircle = { id: 'pub', name: 'Public Circle', privacy: 'public', status: 'active', member_count: 1, is_hidden: false, is_demo: false };
    const inviteOnly = { id: 'invite', name: 'Private Circle', privacy: 'invite', status: 'active', member_count: 1, is_hidden: false, is_demo: false };
    const privateCircle = { id: 'private', name: 'Private Circle 2', privacy: 'private', status: 'active', member_count: 1, is_hidden: false, is_demo: false };
    const visible = getRecommendedCircles([publicCircle, inviteOnly, privateCircle], { interests: ['books'], limit: 10 });

    expect(visible.map((c) => c.id)).toEqual(['pub']);
  });
});
