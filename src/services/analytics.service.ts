import { providerContacts } from './providers.service';

export async function getProviderMetrics(providerId: string) {
  const contacts = await providerContacts(providerId);
  return {
    contactsCount: contacts.length,
  };
}
