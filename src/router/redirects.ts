import type { ProviderStatus } from '@/types/provider';
import type { AppUser } from '@/types/user';

export function getPostLoginRedirect(user: AppUser | null, providerStatus?: ProviderStatus) {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'provider') return providerStatus === 'approved' ? '/dashboard' : '/pending';
  return '/search';
}
