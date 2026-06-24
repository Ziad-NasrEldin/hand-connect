import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firebaseProvidersService } from './providers.firebase';
import type { ProviderProfile } from '@/types/provider';

const getDocMock = vi.fn();
const getDocsMock = vi.fn();

vi.mock('@/firebase/db', () => ({
  getFirebaseDb: () => ({ app: 'test-db' }),
}));

vi.mock('@/firebase/storage', () => ({
  getFirebaseStorage: () => ({ app: 'test-storage' }),
}));

vi.mock('@/firebase/functions', () => ({
  callFirebaseFunction: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
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
  limit: (value: number) => ({ type: 'limit', value }),
  query: (collectionRef: unknown, ...constraints: unknown[]) => ({
    collectionRef,
    constraints,
  }),
  updateDoc: vi.fn(),
  where: (field: string, op: string, value: unknown) => ({
    type: 'where',
    field,
    op,
    value,
  }),
}));

const provider = (patch: Partial<ProviderProfile> = {}): ProviderProfile => ({
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

describe('firebaseProvidersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns public approved active-owner profiles without reading owner users', async () => {
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => provider(),
    });

    await expect(firebaseProvidersService.getProviderById('provider-approved')).resolves.toMatchObject({
      id: 'provider-approved',
    });

    expect(getDocMock).toHaveBeenCalledTimes(1);
  });

  it('hides public profiles with inactive or missing owner status', async () => {
    getDocMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => provider({ ownerStatus: 'banned' }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => provider({ ownerStatus: undefined }),
      });

    await expect(firebaseProvidersService.getProviderById('provider-banned')).resolves.toBeNull();
    await expect(firebaseProvidersService.getProviderById('provider-legacy')).resolves.toBeNull();
  });
});
