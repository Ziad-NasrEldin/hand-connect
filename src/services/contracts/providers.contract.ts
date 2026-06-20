import type { Contact } from '@/types/contact';
import type { ProviderProfile } from '@/types/provider';

export interface RevealWhatsAppResult {
  provider: ProviderProfile;
  contact: Contact;
  whatsappUrl: string;
}

export type ProviderProfileUpdateInput = Partial<ProviderProfile> & {
  profilePhotoFile?: File | null;
};

export interface ProvidersService {
  getProviderById(id: string): Promise<ProviderProfile | null>;
  getProviderForOwner(userId: string): Promise<ProviderProfile | null>;
  incrementProfileView(providerId: string, viewerId?: string): Promise<void>;
  revealWhatsApp(customerId: string, providerId: string): Promise<RevealWhatsAppResult>;
  updateProviderProfile(providerId: string, patch: ProviderProfileUpdateInput): Promise<ProviderProfile>;
  providerContacts(providerId: string): Promise<Contact[]>;
}
