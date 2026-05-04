export type ProviderStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type VisibilityTier = 'organic' | 'paid';

export interface ServiceArea {
  neighborhood: string;
  city: 'cairo';
}

export interface ProviderPhoto {
  id: string;
  url: string;
  alt: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  displayName: string;
  phone: string;
  profession: string;
  bio: string;
  nationalIdVerified: boolean;
  status: ProviderStatus;
  rejectionReason?: string;
  serviceAreas: ServiceArea[];
  serviceAreaKeys: string[];
  whatsappNumber: string;
  whatsappVisible: boolean;
  visibilityTier: VisibilityTier;
  visibilityPaidUntil: string | null;
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
