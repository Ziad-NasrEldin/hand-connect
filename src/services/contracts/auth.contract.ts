import type { ProviderIdentityDocument, ProviderStatus } from '@/types/provider';
import type { AppUser } from '@/types/user';

export interface RegisterCustomerInput {
  displayName: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterProviderInput extends RegisterCustomerInput {
  profession: string;
  serviceArea: string;
  whatsappNumber: string;
  identityDocument: Omit<ProviderIdentityDocument, 'providerId'>;
}

export interface AuthSession {
  user: AppUser | null;
  providerStatus?: ProviderStatus;
}

export interface AuthService {
  getCurrentSession(): Promise<AuthSession>;
  subscribeToSession(onSession: (session: AuthSession) => void): () => void;
  login(email: string, password: string): Promise<AuthSession>;
  loginWithGoogle(): Promise<AuthSession>;
  logout(): Promise<void>;
  registerCustomer(input: RegisterCustomerInput): Promise<AuthSession>;
  registerProvider(input: RegisterProviderInput): Promise<AuthSession>;
}
