import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProviderProfile } from '@/types/provider';
import { firebaseSearchService } from './search.firebase';

const getDocsMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('@/firebase/app', () => ({
  getFirebaseConfig: () => ({
    apiKey: 'api-key',
    projectId: 'hand-connect-cairo',
  }),
}));

vi.mock('@/firebase/db', () => ({
  getFirebaseDb: () => ({ app: 'test-db' }),
}));

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, path: string) => ({
    path,
    withConverter: (converter: unknown) => ({ path, converter }),
  }),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  orderBy: (field: string, direction?: string) => ({ type: 'orderBy', field, direction }),
  query: (collectionRef: unknown, ...constraints: unknown[]) => ({
    collectionRef,
    constraints,
  }),
  where: (field: string, op: string, value: unknown) => ({
    type: 'where',
    field,
    op,
    value,
  }),
}));

const provider = (patch: Partial<ProviderProfile>): ProviderProfile => ({
  id: 'provider-approved',
  userId: 'provider-user',
  ownerStatus: 'active',
  displayName: 'Approved Provider',
  profession: 'plumbing',
  bio: 'Bio',
  phone: '01000000000',
  whatsappNumber: '01000000000',
  whatsappVisible: true,
  serviceAreas: [{ neighborhood: 'new-cairo', city: 'cairo' }],
  serviceAreaKeys: ['new-cairo'],
  initialServiceAreaKey: 'new-cairo',
  coverageRadiusKm: 8,
  coverageAreaKeys: ['new-cairo'],
  avgRating: 4.5,
  reviewCount: 10,
  activityScore: 20,
  photos: [],
  status: 'approved',
  nationalIdVerified: true,
  visibilityTier: 'organic',
  visibilityPaidUntil: null,
  paidVisibilityStartedAt: null,
  activeVisibilityRequestId: null,
  activeVisibilityProductId: null,
  activeVisibilityProductVersion: null,
  paidVisibilityHoldUntil: null,
  rankingPenalty: 0,
  rankingPenaltyUntil: null,
  verificationStatus: 'verified',
  verificationReviewedAt: null,
  verificationReviewedBy: null,
  verificationNotes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  approvedAt: '2026-01-01T00:00:00.000Z',
  profileViews: 0,
  ...patch,
});

function encodeValue(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value)
    ? { integerValue: String(value) }
    : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(encodeValue).filter(Boolean),
      },
    };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .map(([key, item]) => [key, encodeValue(item)])
            .filter(([, item]) => Boolean(item)),
        ),
      },
    };
  }
  return undefined;
}

function restRow(input: ProviderProfile) {
  const { id, ...data } = input;
  return {
    document: {
      name: `projects/hand-connect-cairo/databases/(default)/documents/providers/${id}`,
      fields: Object.fromEntries(
        Object.entries(data)
          .map(([key, value]) => [key, encodeValue(value)])
          .filter(([, value]) => Boolean(value)),
      ),
    },
  };
}

describe('firebaseSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        restRow(provider({ id: 'provider-approved' })),
        restRow(provider({
          id: 'provider-outside-coverage',
          coverageAreaKeys: ['shorouk'],
          serviceAreaKeys: ['shorouk'],
          serviceAreas: [{ neighborhood: 'shorouk', city: 'cairo' }],
        })),
      ],
    });
  });

  it('runs a public REST search for approved active providers in the requested profession and coverage area', async () => {
    await firebaseSearchService.searchProviders({
      profession: 'plumbing',
      neighborhood: 'new-cairo',
      limit: 5,
    });

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    const filters = body.structuredQuery.where.compositeFilter.filters;

    expect(fetchMock.mock.calls[0][0]).toContain(
      'projects/hand-connect-cairo/databases/(default)/documents:runQuery?key=api-key',
    );
    expect(filters).toContainEqual({
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'approved' },
      },
    });
    expect(filters).toContainEqual({
      fieldFilter: {
        field: { fieldPath: 'ownerStatus' },
        op: 'EQUAL',
        value: { stringValue: 'active' },
      },
    });
    expect(filters).toContainEqual({
      fieldFilter: {
        field: { fieldPath: 'profession' },
        op: 'EQUAL',
        value: { stringValue: 'plumbing' },
      },
    });
    expect(filters).toContainEqual({
      fieldFilter: {
        field: { fieldPath: 'coverageAreaKeys' },
        op: 'ARRAY_CONTAINS',
        value: { stringValue: 'new-cairo' },
      },
    });
  });

  it('bounds the Firestore REST query and final ranked result size', async () => {
    const results = await firebaseSearchService.searchProviders({
      profession: 'plumbing',
      neighborhood: 'new-cairo',
      limit: 1,
    });

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(body.structuredQuery.limit).toBe(50);
    expect(results.map((item) => item.id)).toEqual(['provider-approved']);
  });

  it('filters approved providers by denormalized public owner status without user doc reads', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        restRow(provider({ id: 'provider-visible', userId: 'owner-visible' })),
        restRow(provider({ id: 'provider-banned', userId: 'owner-banned', ownerStatus: 'banned' })),
        restRow(provider({ id: 'provider-missing-owner-status', userId: 'owner-missing', ownerStatus: undefined })),
      ],
    });

    const results = await firebaseSearchService.searchProviders({
      profession: 'plumbing',
      neighborhood: 'new-cairo',
      limit: 10,
    });

    expect(results.map((item) => item.id)).toEqual(['provider-visible']);
  });
});
