import { useQuery } from '@tanstack/react-query';
import { searchProviders, type SearchProvidersInput } from '@/services/search.service';

export function useSearchProviders(input: SearchProvidersInput) {
  return useQuery({
    queryKey: ['providers', 'search', input],
    queryFn: () => searchProviders(input),
    enabled: Boolean(input.profession && input.neighborhood),
  });
}
