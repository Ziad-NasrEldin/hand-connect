import type { VisibilityRequest } from '@/types/visibility';

export interface VisibilityService {
  createVisibilityRequest(providerId: string, serviceArea: string, paymentMethod: string, notes: string): Promise<VisibilityRequest>;
  listProviderVisibilityRequests(providerId: string): Promise<VisibilityRequest[]>;
}
