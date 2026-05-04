export type AdminTargetType =
  | 'provider'
  | 'profession'
  | 'visibilityRequest'
  | 'review'
  | 'report';

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
  reporterId: string;
  reason: string;
  status: 'open' | 'closed';
  createdAt: string;
}
