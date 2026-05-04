export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface VisibilityRequest {
  id: string;
  providerId: string;
  tier: 'paid';
  serviceArea: string;
  status: RequestStatus;
  paymentConfirmedBy: string | null;
  paymentMethod: string;
  notes: string;
  requestedAt: string;
  processedAt: string | null;
  rejectionReason?: string;
}
