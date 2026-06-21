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
  paymentMethod: string;
  notes: string;
  requestedAt: string;
  processedAt: string | null;
  rejectionReason?: string;
}
