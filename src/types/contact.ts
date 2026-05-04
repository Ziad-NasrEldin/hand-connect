export type ContactType = 'whatsapp_reveal' | 'platform_message';

export interface Contact {
  id: string;
  customerId: string;
  providerId: string;
  type: ContactType;
  createdAt: string;
  hasReview: boolean;
}
