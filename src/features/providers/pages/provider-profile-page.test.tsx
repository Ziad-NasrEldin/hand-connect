import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { ProviderProfilePage } from './provider-profile-page';
import type { ProviderProfile } from '@/types/provider';
import type { Review } from '@/types/review';

const mocks = vi.hoisted(() => ({
  provider: null as ProviderProfile | null,
  reviews: [] as Review[],
  reviewError: null as Error | null,
  user: { uid: 'customer-nour', role: 'customer' },
  revealWhatsApp: vi.fn(),
  startConversation: vi.fn(),
  reportReview: vi.fn(),
  reportProvider: vi.fn(),
  incrementProfileView: vi.fn(),
}));

vi.mock('@/hooks/use-provider-profile', () => ({
  useProviderProfile: () => ({ data: mocks.provider }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/services/providers.service', () => ({
  incrementProfileView: mocks.incrementProfileView,
  reportProvider: mocks.reportProvider,
  revealWhatsApp: mocks.revealWhatsApp,
}));

vi.mock('@/services/messaging.service', () => ({
  startConversation: mocks.startConversation,
}));

vi.mock('@/services/reviews.service', () => ({
  getProviderReviews: () => (
    mocks.reviewError
      ? Promise.reject(mocks.reviewError)
      : Promise.resolve(mocks.reviews)
  ),
  reportReview: mocks.reportReview,
}));

function provider(overrides: Partial<ProviderProfile> = {}): ProviderProfile {
  return {
    id: 'provider-demo',
    userId: 'provider-demo',
    displayName: 'Ahmed Plumbing',
    phone: '+201011113333',
    profession: 'plumbing',
    bio: 'Repairs leaks and installs fixtures in New Cairo.',
    nationalIdVerified: true,
    status: 'approved',
    serviceAreas: [{ neighborhood: 'new-cairo', city: 'cairo' }],
    serviceAreaKeys: ['new-cairo'],
    initialServiceAreaKey: 'new-cairo',
    coverageRadiusKm: 8,
    coverageAreaKeys: ['new-cairo', 'nasr-city'],
    whatsappNumber: '+201011113333',
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
    paidVisibilityStartedAt: null,
    verificationStatus: 'verified',
    profileViews: 12,
    avgRating: 4.8,
    reviewCount: 2,
    activityScore: 80,
    photos: [{ id: 'photo-1', url: '/provider.jpg', alt: 'Ahmed Plumbing' }],
    createdAt: '2026-01-01T00:00:00.000Z',
    approvedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function review(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    providerId: 'provider-demo',
    customerId: 'customer-nour',
    customerName: 'Nour',
    contactId: 'contact-1',
    rating: 5,
    comment: 'Careful and clear work.',
    status: 'visible',
    createdAt: '2026-01-03T00:00:00.000Z',
    ...overrides,
  };
}

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/providers/provider-demo']}>
        <Routes>
          <Route path="/providers/:id" element={<ProviderProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProviderProfilePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mocks.provider = provider();
    mocks.reviews = [review()];
    mocks.reviewError = null;
    mocks.user = { uid: 'customer-nour', role: 'customer' };
    mocks.revealWhatsApp.mockReset();
    mocks.startConversation.mockReset();
    mocks.reportReview.mockReset();
    mocks.reportProvider.mockReset();
    mocks.incrementProfileView.mockReset();
  });

  it('renders required profile fields, reputation, reviews, contacts, and boundary copy', async () => {
    renderProfile();

    expect(screen.getByRole('heading', { name: 'Ahmed Plumbing' })).toBeInTheDocument();
    expect(screen.getByText('Plumber')).toBeInTheDocument();
    expect(screen.getByText(/Repairs leaks/)).toBeInTheDocument();
    expect(screen.getByText('New Cairo')).toBeInTheDocument();
    expect(screen.getByText('Covers about 8 km around listed areas')).toBeInTheDocument();
    expect(screen.getByAltText('Ahmed Plumbing')).toBeInTheDocument();
    expect(await screen.findByText('Careful and clear work.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('4.8 / 5 from 2 reviews')).toHaveLength(2));
    expect(screen.getAllByText('Reveal WhatsApp')).toHaveLength(2);
    expect(screen.getAllByText('Message in app')).toHaveLength(2);
    expect(screen.getByText(/does not set price or guarantee the job/i)).toBeInTheDocument();
  });

  it('shows a no-review state instead of a zero rating when no visible reviews exist', async () => {
    mocks.provider = provider({ avgRating: 0, reviewCount: 0 });
    mocks.reviews = [];

    renderProfile();

    await waitFor(() => expect(screen.getAllByText('No reviews yet.')).toHaveLength(2));
    expect(screen.queryByText(/0\.0 \/ 5/)).not.toBeInTheDocument();
  });

  it('hides unavailable public provider profiles', () => {
    mocks.provider = null;

    renderProfile();

    expect(screen.getByText('This provider is currently unavailable or no longer visible.')).toBeInTheDocument();
    expect(screen.queryByText('Reveal WhatsApp')).not.toBeInTheDocument();
  });

  it('shows review loading, error, and retry states', async () => {
    mocks.reviewError = new Error('reviews unavailable');

    renderProfile();

    expect(screen.getByRole('status')).toHaveTextContent('Loading reviews...');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load reviews right now.',
    );

    mocks.reviewError = null;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Careful and clear work.')).toBeInTheDocument();
  });

  it('reports contact and abuse failures with localized feedback', async () => {
    mocks.revealWhatsApp.mockRejectedValueOnce(new Error('error.provider.whatsappUnavailable'));
    mocks.reportReview.mockRejectedValueOnce(new Error('error.rateLimit.exceeded'));

    renderProfile();

    await userEvent.click(screen.getAllByRole('button', { name: /Reveal WhatsApp/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'WhatsApp contact is not available for this provider.',
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Report review' }));
    expect(await screen.findByText('Too many actions in a short time. Try again later.')).toBeInTheDocument();
  });
});
