import { rankProviders } from '@/lib/ranking';
import { providerCoversNeighborhood } from '@/lib/provider-coverage';
import type { ProviderProfile } from '@/types/provider';
import { activeProfessions, readDb } from './demo-db';

export interface SearchProvidersInput {
  profession: string;
  neighborhood: string;
  limit?: number;
}

export async function listProfessions() {
  return activeProfessions();
}

export async function searchProviders(input: SearchProvidersInput): Promise<ProviderProfile[]> {
  const db = readDb();
  const candidates = db.providers.filter(
    (provider) =>
      provider.status === 'approved' &&
      provider.ownerStatus === 'active' &&
      provider.profession === input.profession &&
      providerCoversNeighborhood(provider, input.neighborhood),
  );
  return rankProviders(candidates, input).slice(0, input.limit);
}
