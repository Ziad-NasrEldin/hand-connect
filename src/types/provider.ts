export type ProviderStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type VisibilityTier = 'organic' | 'paid';
export type ProviderVerificationStatus =
  | 'not_submitted'
  | 'submitted'
  | 'verified'
  | 'rejected'
  | 'needs_more_info';

export interface ServiceArea {
  neighborhood: string;
  city: 'cairo';
}

export interface ProviderPhoto {
  id: string;
  url: string;
  alt: string;
}

export interface ProviderIdentityDocument {
  providerId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  previewDataUrl?: string;
  downloadUrl?: string;
  storagePath?: string;
  storageFallback?: 'firestore-preview-data-url';
}

export interface ProviderProfile {
  id: string;
  userId: string;
  ownerStatus?: 'active' | 'banned';
  displayName: string;
  phone: string;
  profession: string;
  bio: string;
  nationalIdVerified: boolean;
  status: ProviderStatus;
  rejectionReason?: string;
  serviceAreas: ServiceArea[];
  serviceAreaKeys: string[];
  initialServiceAreaKey: string;
  coverageRadiusKm: number;
  coverageAreaKeys: string[];
  whatsappNumber: string;
  whatsappVisible: boolean;
  visibilityTier: VisibilityTier;
  visibilityPaidUntil: string | null;
  paidVisibilityStartedAt: string | null;
  activeVisibilityRequestId?: string | null;
  activeVisibilityProductId?: string | null;
  activeVisibilityProductVersion?: number | null;
  paidVisibilityHoldUntil?: string | null;
  rankingPenalty?: number;
  rankingPenaltyUntil?: string | null;
  verificationStatus: ProviderVerificationStatus;
  verificationReviewedAt?: string | null;
  verificationReviewedBy?: string | null;
  verificationNotes?: string | null;
  profileViews: number;
  avgRating: number;
  reviewCount: number;
  activityScore: number;
  photos: ProviderPhoto[];
  createdAt: string;
  approvedAt: string | null;
}

export interface Profession {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  active: boolean;
  sortOrder: number;
}
