import { createId, readDb, writeDb } from './demo-db';
import type { ProviderProfile } from '@/types/provider';
import type { Contact } from '@/types/contact';
import { nowIso } from '@/lib/dates';

export async function getProviderById(id: string) {
  const provider = readDb().providers.find((item) => item.id === id && item.status === 'approved');
  return provider ?? null;
}

export async function getProviderForOwner(userId: string) {
  return readDb().providers.find((item) => item.userId === userId) ?? null;
}

export async function incrementProfileView(providerId: string, viewerId?: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider || provider.userId === viewerId) return;
  const key = `profile-viewed-${providerId}`;
  if (sessionStorage.getItem(key)) return;
  provider.profileViews += 1;
  sessionStorage.setItem(key, 'true');
  writeDb(db);
}

export async function revealWhatsApp(customerId: string, providerId: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId && item.status === 'approved');
  if (!provider) throw new Error('Provider not found');
  let contact = db.contacts.find(
    (item) => item.customerId === customerId && item.providerId === providerId && item.type === 'whatsapp_reveal',
  );
  if (!contact) {
    contact = {
      id: createId('contact'),
      customerId,
      providerId,
      type: 'whatsapp_reveal',
      createdAt: nowIso(),
      hasReview: false,
    };
    db.contacts.push(contact);
    writeDb(db);
  }
  return { provider, contact, whatsappUrl: `https://wa.me/${provider.whatsappNumber.replace(/\D/g, '')}` };
}

export async function updateProviderProfile(providerId: string, patch: Partial<ProviderProfile>) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('Provider not found');
  Object.assign(provider, {
    displayName: patch.displayName ?? provider.displayName,
    bio: patch.bio ?? provider.bio,
    profession: patch.profession ?? provider.profession,
    whatsappNumber: patch.whatsappNumber ?? provider.whatsappNumber,
    whatsappVisible: patch.whatsappVisible ?? provider.whatsappVisible,
    serviceAreas: patch.serviceAreas ?? provider.serviceAreas,
    serviceAreaKeys: patch.serviceAreaKeys ?? provider.serviceAreaKeys,
    photos: patch.photos ?? provider.photos,
  });
  writeDb(db);
  return provider;
}

export async function providerContacts(providerId: string): Promise<Contact[]> {
  return readDb().contacts.filter((item) => item.providerId === providerId);
}
