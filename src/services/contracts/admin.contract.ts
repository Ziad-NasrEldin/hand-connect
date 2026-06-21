import type { AdminAction, AbuseReport } from '@/types/admin';
import type { Profession, ProviderIdentityDocument, ProviderProfile } from '@/types/provider';
import type { UserStatus } from '@/types/user';
import type { VisibilityRequest } from '@/types/visibility';

export type ProviderApplication = ProviderProfile & {
  identityDocument: ProviderIdentityDocument | null;
};

export type AdminProviderAccount = ProviderProfile & {
  accountStatus: UserStatus;
  banReason?: string | null;
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
  listAllProviders(): Promise<AdminProviderAccount[]>;
  approveProvider(adminId: string, providerId: string): Promise<void>;
  rejectProvider(adminId: string, providerId: string, reason: string): Promise<void>;
  suspendProvider(adminId: string, providerId: string, reason: string): Promise<void>;
  approveVisibilityRequest(adminId: string, requestId: string, notes: string): Promise<void>;
  rejectVisibilityRequest(adminId: string, requestId: string, reason: string): Promise<void>;
  listVisibilityRequests(): Promise<VisibilityRequest[]>;
  listAdminActions(): Promise<AdminAction[]>;
  listReports(): Promise<AbuseReport[]>;
  resolveReport(adminId: string, reportId: string, reason: string): Promise<void>;
  hideReview(adminId: string, reviewId: string, reason: string, reportId?: string): Promise<void>;
  setUserBanned(adminId: string, userId: string, banned: boolean, reason: string): Promise<void>;
  listProfessions(): Promise<Profession[]>;
  saveProfession(adminId: string, profession: Profession): Promise<void>;
  setProfessionActive(adminId: string, professionId: string, active: boolean): Promise<void>;
}
