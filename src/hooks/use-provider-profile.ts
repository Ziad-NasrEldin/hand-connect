import { useQuery } from '@tanstack/react-query';
import { getProviderById, getProviderForOwner } from '@/services/providers.service';

export function useProviderProfile(providerId?: string) {
  return useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => getProviderById(providerId!),
    enabled: Boolean(providerId),
  });
}

export function useOwnedProvider(userId?: string) {
  return useQuery({
    queryKey: ['provider', 'owner', userId],
    queryFn: () => getProviderForOwner(userId!),
    enabled: Boolean(userId),
  });
}
