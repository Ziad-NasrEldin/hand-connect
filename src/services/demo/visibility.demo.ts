import { createId, readDb, writeDb } from './demo-db';
import type { VisibilityRequest } from '@/types/visibility';
import { nowIso } from '@/lib/dates';

export async function createVisibilityRequest(providerId: string, serviceArea: string, paymentMethod: string, notes: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('error.provider.notFound');
  const isAreaExpansion = !provider.serviceAreaKeys.includes(serviceArea);
  if (isAreaExpansion && provider.reviewCount < 30) {
    throw new Error('error.visibility.areaExpansionRequiresReviews');
  }
  if (db.visibilityRequests.some((item) => item.providerId === providerId && item.serviceArea === serviceArea && item.status === 'pending')) {
    throw new Error('error.visibility.pendingExists');
  }
  const request: VisibilityRequest = {
    id: createId('visibility'),
    providerId,
    type: isAreaExpansion ? 'area_expansion' : 'boost',
    tier: 'paid',
    serviceArea,
    status: 'pending',
    paymentConfirmedBy: null,
    paymentMethod,
    notes,
    requestedAt: nowIso(),
    processedAt: null,
  };
  db.visibilityRequests.push(request);
  writeDb(db);
  return request;
}

export async function listProviderVisibilityRequests(providerId: string) {
  return readDb().visibilityRequests.filter((item) => item.providerId === providerId);
}
