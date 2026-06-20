import { createId, readDb, writeDb } from './demo-db';
import type { VisibilityRequest } from '@/types/visibility';
import { nowIso } from '@/lib/dates';

export async function createVisibilityRequest(providerId: string, serviceArea: string, paymentMethod: string, notes: string) {
  const db = readDb();
  const request: VisibilityRequest = {
    id: createId('visibility'),
    providerId,
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
