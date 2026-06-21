import type { SearchProvidersInput, SearchService } from './contracts/search.contract';
import { getDataSource } from './data-source';
import * as demo from './demo/search.demo';
import { firebaseSearchService } from './firebase/search.firebase';
import { normalizeSearchFilters } from '@/lib/search-filters';

export type { SearchProvidersInput } from './contracts/search.contract';

const demoSearchService: SearchService = demo;

function searchService(): SearchService {
  return getDataSource() === 'firebase' ? firebaseSearchService : demoSearchService;
}

export async function listProfessions() {
  return searchService().listProfessions();
}

export async function searchProviders(input: SearchProvidersInput) {
  const service = searchService();
  const filters = normalizeSearchFilters(input, await service.listProfessions());
  return service.searchProviders(filters);
}
