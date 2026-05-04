import { useQuery } from '@tanstack/react-query';
import { canCustomerReviewProvider } from '@/services/reviews.service';

export function useContactCheck(customerId?: string, providerId?: string) {
  return useQuery({
    queryKey: ['contact-check', customerId, providerId],
    queryFn: () => canCustomerReviewProvider(customerId!, providerId!),
    enabled: Boolean(customerId && providerId),
  });
}
