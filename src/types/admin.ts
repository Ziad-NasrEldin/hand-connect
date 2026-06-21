export type AdminTargetType =
  | 'provider'
  | 'profession'
  | 'visibilityRequest'
  | 'review'
  | 'report'
  | 'user';

export interface AdminAction {
  id: string;
  adminId: string;
  targetType: AdminTargetType;
  targetId: string;
  action: string;
  reason: string;
  createdAt: string;
}

export interface AbuseReport {
  id: string;
  targetType: 'provider' | 'review' | 'message';
  targetId: string;
  targetLabel?: string | null;
  reporterId: string;
  reporterName?: string | null;
  reason: string;
  status: 'open' | 'closed';
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionReason?: string | null;
  createdAt: string;
}
