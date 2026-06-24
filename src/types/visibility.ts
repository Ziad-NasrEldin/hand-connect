import type { PaidProductSnapshot, PaymentMethod, PaymentStatus } from './monetization';

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type VisibilityRequestType = 'boost' | 'area_expansion';

export interface VisibilityRequest {
  id: string;
  providerId: string;
  type?: VisibilityRequestType;
  tier: 'paid';
  serviceArea: string;
  status: RequestStatus;
  paymentConfirmedBy: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
  paymentFailureReason?: string | null;
  paymentSession?: {
    provider: 'paymob';
    mode: 'mock' | 'live';
    status: 'initiated' | 'requires_action' | 'paid' | 'failed';
    checkoutUrl: string | null;
    merchantOrderId: string;
    integrationId: string;
    orderId?: string | null;
    intentionId?: string | null;
    paymentKey?: string | null;
    updatedAt: string;
  } | null;
  productSnapshot?: PaidProductSnapshot;
  disclosureVersion?: string;
  disclosureAcceptedAt?: string | null;
  notes: string;
  requestedAt: string;
  processedAt: string | null;
  rejectionReason?: string;
}
