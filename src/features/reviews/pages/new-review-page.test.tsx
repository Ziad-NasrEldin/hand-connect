import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { NewReviewPage } from './new-review-page';

const mocks = vi.hoisted(() => ({
  user: { uid: 'customer-nour', role: 'customer' },
  createReview: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/use-contact-check', () => ({
  useContactCheck: () => ({ data: true }),
}));

vi.mock('@/services/reviews.service', () => ({
  createReview: (...args: unknown[]) => mocks.createReview(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

function renderNewReview() {
  return render(
    <MemoryRouter initialEntries={['/reviews/new/provider-demo']}>
      <Routes>
        <Route path="/reviews/new/:providerId" element={<NewReviewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NewReviewPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mocks.createReview.mockReset();
    mocks.navigate.mockReset();
  });

  it('shows localized rate-limit feedback and preserves review text', async () => {
    mocks.createReview.mockRejectedValueOnce(new Error('error.rateLimit.exceeded'));

    renderNewReview();

    const comment = screen.getByPlaceholderText('Write about your experience');
    await userEvent.type(comment, 'Detailed review body');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many actions in a short time. Try again later.',
    );
    expect(comment).toHaveValue('Detailed review body');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
