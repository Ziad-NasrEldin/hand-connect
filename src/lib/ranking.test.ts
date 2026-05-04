import { describe, expect, it } from 'vitest';
import { rankProviders } from './ranking';
import type { ProviderProfile } from '@/types/provider';

const baseProvider: ProviderProfile = {
  id: 'provider',
  userId: 'provider',
  displayName: 'Provider',
  phone: '+201001112222',
  profession: 'plumbing',
  bio: 'Bio',
  nationalIdVerified: true,
  status: 'approved',
  serviceAreas: [{ neighborhood: 'new-cairo', city: 'cairo' }],
  serviceAreaKeys: ['new-cairo'],
  whatsappNumber: '+201001112222',
  whatsappVisible: true,
  visibilityTier: 'organic',
  visibilityPaidUntil: null,
  profileViews: 10,
  avgRating: 4.8,
  reviewCount: 10,
  activityScore: 90,
  photos: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  approvedAt: '2026-05-04T00:00:00.000Z',
};

describe('rankProviders', () => {
  it('caps paid visibility so weak paid providers do not automatically beat strong organic providers', () => {
    const organic = { ...baseProvider, id: 'organic', visibilityTier: 'organic' as const, avgRating: 5, reviewCount: 20, activityScore: 95 };
    const paid = { ...baseProvider, id: 'paid', visibilityTier: 'paid' as const, avgRating: 2, reviewCount: 1, activityScore: 10 };
    expect(rankProviders([paid, organic], { profession: 'plumbing', neighborhood: 'new-cairo' })[0].id).toBe('organic');
  });
});
