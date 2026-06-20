import { describe, expect, it } from 'vitest';
import { Timestamp, type QueryDocumentSnapshot } from 'firebase/firestore';
import { providerConverter, userConverter } from './converters';

function snapshotWith(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  } as unknown as QueryDocumentSnapshot;
}

describe('Firestore converters', () => {
  it('removes client ids and converts ISO strings before writing', () => {
    const data = providerConverter.toFirestore({
      id: 'provider-1',
      userId: 'user-1',
      displayName: 'Provider',
      phone: '+201000000000',
      profession: 'plumber',
      bio: 'Bio',
      nationalIdVerified: false,
      status: 'pending',
      serviceAreas: [],
      serviceAreaKeys: [],
      whatsappNumber: '+201000000000',
      whatsappVisible: false,
      visibilityTier: 'organic',
      visibilityPaidUntil: null,
      profileViews: 0,
      avgRating: 0,
      reviewCount: 0,
      activityScore: 0,
      photos: [],
      createdAt: '2026-06-19T00:00:00.000Z',
      approvedAt: null,
    });

    expect(data.id).toBeUndefined();
    expect(data.createdAt).toBeInstanceOf(Timestamp);
    expect(data.visibilityPaidUntil).toBeNull();
  });

  it('adds document id and converts Firestore timestamps after reading', () => {
    const createdAt = Timestamp.fromDate(new Date('2026-06-19T00:00:00.000Z'));
    const user = userConverter.fromFirestore(
      snapshotWith('user-1', {
        email: 'customer@example.com',
        role: 'customer',
        displayName: 'Customer',
        phone: '+201000000000',
        language: 'ar',
        createdAt,
      }),
      {},
    );

    expect(user.uid).toBe('user-1');
    expect(user.createdAt).toBe('2026-06-19T00:00:00.000Z');
  });
});
