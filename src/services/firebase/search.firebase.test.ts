import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProviderProfile } from '@/types/provider';
import { firebaseSearchService } from './search.firebase';

const getDocsMock = vi.fn();
const getDocMock = vi.fn();
const queryMock = vi.fn((collectionRef: unknown, ...constraints: unknown[]) => ({
  collectionRef,
  constraints,
}));
const whereMock = vi.fn((field: string, op: string, value: unknown) => ({
  type: 'where',
  field,
  op,
  value,
}));
const orderByMock = vi.fn((field: string, direction?: string) => ({
  type: 'orderBy',
  field,
  direction,
}));
const limitMock = vi.fn((value: number) => ({ type: 'limit', value }));

vi.mock('@/firebase/db', () => ({
  getFirebaseDb: () => ({ app: 'test-db' }),
}));

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, path: string) => ({
    path,
    withConverter: (converter: unknown) => ({ path, converter }),
  }),
  doc: (_db: unknown, path: string, id: string) => ({
    path,
    id,
    withConverter: (converter: unknown) => ({ path, id, converter }),
  }),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  limit: (...args: [number]) => limitMock(...args),
  orderBy: (field: string, direction?: string) => orderByMock(field, direction),
  query: (collectionRef: unknown, ...constraints: unknown[]) => queryMock(collectionRef, ...constraints),
  where: (...args: [string, string, unknown]) => whereMock(...args),
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

describe('firebaseSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocsMock.mockResolvedValue({
      docs: [
        {
          data: () => provider({ id: 'provider-approved' }),
        },
        {
          data: () =>
            provider({
              id: 'provider-outside-coverage',
              coverageAreaKeys: ['shorouk'],
              serviceAreaKeys: ['shorouk'],
              serviceAreas: [{ neighborhood: 'shorouk', city: 'cairo' }],
            }),
        },
      ],
    });
    getDocMock.mockResolvedValue({ data: () => ({ status: 'active' }) });
  });

  it('queries approved providers for the requested profession and coverage area only', async () => {
    await firebaseSearchService.searchProviders({
      profession: 'plumbing',
      neighborhood: 'new-cairo',
      limit: 5,
    });

    const constraints = queryMock.mock.calls[0].slice(1);
    expect(constraints).toContainEqual({
      type: 'where',
      field: 'status',
      op: '==',
      value: 'approved',
    });
    expect(constraints).toContainEqual({
      type: 'where',
      field: 'profession',
      op: '==',
      value: 'plumbing',
    });
    expect(constraints).toContainEqual({
      type: 'where',
      field: 'coverageAreaKeys',
      op: 'array-contains',
      value: 'new-cairo',
    });
  });

  it('bounds the Firestore query and final ranked result size', async () => {
    const results = await firebaseSearchService.searchProviders({
      profession: 'plumbing',
      neighborhood: 'new-cairo',
      limit: 1,
    });

    expect(limitMock).toHaveBeenCalledWith(50);
    expect(results.map((item) => item.id)).toEqual(['provider-approved']);
  });

  it('filters approved providers by denormalized public owner status without user doc reads', async () => {
    getDocsMock.mockResolvedValueOnce({
      docs: [
        {
          data: () => provider({ id: 'provider-visible', userId: 'owner-visible' }),
        },
        {
          data: () => provider({ id: 'provider-banned', userId: 'owner-banned', ownerStatus: 'banned' }),
        },
        {
          data: () => provider({ id: 'provider-missing-owner-status', userId: 'owner-missing', ownerStatus: undefined }),
        },
      ],
    });

    const results = await firebaseSearchService.searchProviders({
      profession: 'plumbing',
      neighborhood: 'new-cairo',
      limit: 10,
    });

    expect(results.map((item) => item.id)).toEqual(['provider-visible']);
    expect(getDocMock).not.toHaveBeenCalled();
  });
});
