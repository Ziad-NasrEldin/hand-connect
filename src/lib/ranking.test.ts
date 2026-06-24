import { describe, expect, it } from 'vitest';
import { isPaidVisibilityActive, rankProviders } from './ranking';
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
  initialServiceAreaKey: 'new-cairo',
  coverageRadiusKm: 8,
  coverageAreaKeys: ['new-cairo'],
  whatsappNumber: '+201001112222',
  whatsappVisible: true,
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
  verificationReviewedAt: '2026-05-04T00:00:00.000Z',
  verificationReviewedBy: 'admin-demo',
  verificationNotes: null,
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

  it('treats expired paid visibility as organic', () => {
    const expiredPaid = {
      ...baseProvider,
      visibilityTier: 'paid' as const,
      visibilityPaidUntil: '2026-05-01T00:00:00.000Z',
    };
    expect(isPaidVisibilityActive(expiredPaid, new Date('2026-05-04T00:00:00.000Z'))).toBe(false);
  });

  it('recognizes active paid visibility before expiry', () => {
    const activePaid = {
      ...baseProvider,
      visibilityTier: 'paid' as const,
      visibilityPaidUntil: '2026-06-01T00:00:00.000Z',
    };
    expect(isPaidVisibilityActive(activePaid, new Date('2026-05-04T00:00:00.000Z'))).toBe(true);
  });

  it('ranks closer providers above farther providers when other signals are equal', () => {
    const closeProvider = {
      ...baseProvider,
      id: 'close',
      serviceAreas: [{ neighborhood: 'nasr-city', city: 'cairo' as const }],
      serviceAreaKeys: ['nasr-city'],
      initialServiceAreaKey: 'nasr-city',
      coverageRadiusKm: 1,
      coverageAreaKeys: ['nasr-city', 'heliopolis'],
    };
    const farProvider = { ...baseProvider, id: 'far', serviceAreaKeys: ['new-cairo'], coverageRadiusKm: 20, coverageAreaKeys: ['new-cairo', 'heliopolis'] };

    expect(rankProviders([farProvider, closeProvider], { profession: 'plumbing', neighborhood: 'heliopolis' })[0].id).toBe('close');
  });

  it('does not let paid visibility overcome a covered organic provider by itself', () => {
    const organic = { ...baseProvider, id: 'organic', coverageAreaKeys: ['new-cairo'] };
    const paidOutsideCoverage = {
      ...baseProvider,
      id: 'paid-outside',
      serviceAreaKeys: ['shorouk'],
      coverageAreaKeys: ['shorouk'],
      visibilityTier: 'paid' as const,
      visibilityPaidUntil: '2026-06-01T00:00:00.000Z',
    };

    expect(rankProviders([paidOutsideCoverage, organic], { profession: 'plumbing', neighborhood: 'new-cairo' })[0].id).toBe('organic');
  });
});
