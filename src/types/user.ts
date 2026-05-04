export type UserRole = 'customer' | 'provider' | 'admin';
export type AppLanguage = 'ar' | 'en';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  phone: string;
  language: AppLanguage;
  createdAt: string;
}

export interface AuthSession {
  user: AppUser | null;
  providerStatus?: import('./provider').ProviderStatus;
}
