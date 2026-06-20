import type { AdminAction, AbuseReport } from '@/types/admin';
import type { Profession, ProviderIdentityDocument, ProviderProfile } from '@/types/provider';
import type { VisibilityRequest } from '@/types/visibility';

export type ProviderApplication = ProviderProfile & {
  identityDocument: ProviderIdentityDocument | null;
};

export interface AdminOverview {
  pendingApplications: number;
  approvedProviders: number;
  suspendedProviders: number;
  pendingVisibility: number;
  reviewsUnderReview: number;
}

export interface AdminService {
  getAdminOverview(): Promise<AdminOverview>;
  listProviderApplications(): Promise<ProviderApplication[]>;
  listAllProviders(): Promise<ProviderProfile[]>;
  approveProvider(adminId: string, providerId: string): Promise<void>;
  rejectProvider(adminId: string, providerId: string, reason: string): Promise<void>;
  suspendProvider(adminId: string, providerId: string, reason: string): Promise<void>;
  approveVisibilityRequest(adminId: string, requestId: string, notes: string): Promise<void>;
  listVisibilityRequests(): Promise<VisibilityRequest[]>;
  listAdminActions(): Promise<AdminAction[]>;
  listReports(): Promise<AbuseReport[]>;
  resolveReport(adminId: string, reportId: string, reason: string): Promise<void>;
  hideReview(adminId: string, reviewId: string, reason: string, reportId?: string): Promise<void>;
  listProfessions(): Promise<Profession[]>;
}
