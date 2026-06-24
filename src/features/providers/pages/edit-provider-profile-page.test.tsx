import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { EditProviderProfilePage } from './edit-provider-profile-page';
import type { ProviderProfile } from '@/types/provider';

const mocks = vi.hoisted(() => ({
  updateProviderProfile: vi.fn(),
  provider: null as ProviderProfile | null,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { uid: 'provider-demo', role: 'provider' } }),
}));

vi.mock('@/hooks/use-provider-profile', () => ({
  useOwnedProvider: () => ({ data: mocks.provider }),
}));

vi.mock('@/services/providers.service', () => ({
  updateProviderProfile: mocks.updateProviderProfile,
}));

function provider(): ProviderProfile {
  return {
    id: 'provider-demo',
    userId: 'provider-demo',
    displayName: 'Ahmed Plumbing',
    phone: '+201011113333',
    profession: 'plumbing',
    bio: 'Repairs leaks.',
    nationalIdVerified: true,
    status: 'approved',
    serviceAreas: [{ neighborhood: 'new-cairo', city: 'cairo' }],
    serviceAreaKeys: ['new-cairo'],
    initialServiceAreaKey: 'new-cairo',
    coverageRadiusKm: 8,
    coverageAreaKeys: ['new-cairo'],
    whatsappNumber: '+201011113333',
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
    paidVisibilityStartedAt: null,
    verificationStatus: 'verified',
    profileViews: 0,
    avgRating: 0,
    reviewCount: 0,
    activityScore: 0,
    photos: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    approvedAt: '2026-01-02T00:00:00.000Z',
  };
}

function renderEditProfile() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditProviderProfilePage />
    </QueryClientProvider>,
  );
}

describe('EditProviderProfilePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mocks.provider = provider();
    mocks.updateProviderProfile.mockReset();
  });

  it('blocks malformed WhatsApp numbers before saving', async () => {
    renderEditProfile();

    await userEvent.type(screen.getByLabelText('WhatsApp number'), 'not-a-number');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a valid Egyptian mobile number',
    );
    expect(mocks.updateProviderProfile).not.toHaveBeenCalled();
  });
});
