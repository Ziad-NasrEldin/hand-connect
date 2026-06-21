export type UserRole = 'customer' | 'provider' | 'admin';
export type AppLanguage = 'ar' | 'en';
export type UserStatus = 'active' | 'banned';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  banReason?: string | null;
  bannedAt?: string | null;
  bannedBy?: string | null;
  displayName: string;
  phone: string;
  language: AppLanguage;
  createdAt: string;
}

export interface AuthSession {
  user: AppUser | null;
  providerStatus?: import('./provider').ProviderStatus;
}
