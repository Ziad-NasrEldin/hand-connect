import type { VisibilityRequest } from '@/types/visibility';
import type { PaymentMethod } from '@/types/monetization';

export interface VisibilityService {
  createVisibilityRequest(providerId: string, serviceArea: string, paymentMethod: PaymentMethod | 'manual', notes: string): Promise<VisibilityRequest>;
  completeVisibilityPayment?(requestId: string): Promise<VisibilityRequest>;
  listProviderVisibilityRequests(providerId: string): Promise<VisibilityRequest[]>;
}
