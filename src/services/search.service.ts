import { rankProviders } from '@/lib/ranking';
import type { ProviderProfile } from '@/types/provider';
import { activeProfessions, readDb } from './demo-db';

export interface SearchProvidersInput {
  profession: string;
  neighborhood: string;
}

export async function listProfessions() {
  return activeProfessions();
}

export async function searchProviders(input: SearchProvidersInput): Promise<ProviderProfile[]> {
  const db = readDb();
  const candidates = db.providers.filter(
    (provider) =>
      provider.status === 'approved' &&
      provider.profession === input.profession &&
      provider.serviceAreaKeys.includes(input.neighborhood),
  );
  return rankProviders(candidates, input);
}
