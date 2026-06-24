import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { SearchPage } from './search-page';

const mocks = vi.hoisted(() => ({
  providersQuery: {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}));

vi.mock('@/hooks/use-search-providers', () => ({
  useSearchProviders: () => mocks.providersQuery,
}));

vi.mock('@/services/search.service', () => ({
  listProfessions: () => Promise.resolve([
    { slug: 'plumbing', nameEn: 'Plumber', nameAr: 'سباك', active: true, sortOrder: 1 },
  ]),
}));

function renderSearch() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SearchPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mocks.providersQuery.data = undefined;
    mocks.providersQuery.isLoading = false;
    mocks.providersQuery.isError = false;
    mocks.providersQuery.refetch.mockReset();
  });

  it('shows a retryable localized error when provider search fails', async () => {
    mocks.providersQuery.isError = true;

    renderSearch();

    expect(screen.getByText('Search could not load right now.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry search' }));

    expect(mocks.providersQuery.refetch).toHaveBeenCalledOnce();
  });
});
