import type { Profession, ProviderProfile } from '@/types/provider';

export interface SearchProvidersInput {
  profession: string;
  neighborhood: string;
  limit?: number;
}

export interface SearchService {
  listProfessions(): Promise<Profession[]>;
  searchProviders(input: SearchProvidersInput): Promise<ProviderProfile[]>;
}
