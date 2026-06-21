import type { ProviderProfile } from '@/types/provider';
import type {
  ProviderProfileUpdateInput,
  ProvidersService,
} from './contracts/providers.contract';
import { getDataSource } from './data-source';
import * as demo from './demo/providers.demo';
import { firebaseProvidersService } from './firebase/providers.firebase';

export type {
  ProviderProfileUpdateInput,
  RevealWhatsAppResult,
} from './contracts/providers.contract';

const demoProvidersService: ProvidersService = demo;

function providersService(): ProvidersService {
  return getDataSource() === 'firebase' ? firebaseProvidersService : demoProvidersService;
}

export async function getProviderById(id: string) {
  return providersService().getProviderById(id);
}

export async function getProviderForOwner(userId: string) {
  return providersService().getProviderForOwner(userId);
}

export async function incrementProfileView(providerId: string, viewerId?: string) {
  return providersService().incrementProfileView(providerId, viewerId);
}

export async function revealWhatsApp(customerId: string, providerId: string) {
  return providersService().revealWhatsApp(customerId, providerId);
}

export async function reportProvider(reporterId: string, providerId: string, reason: string) {
  return providersService().reportProvider(reporterId, providerId, reason);
}

export async function updateProviderProfile(
  providerId: string,
  patch: ProviderProfileUpdateInput,
) {
  return providersService().updateProviderProfile(providerId, patch);
}

export async function providerContacts(providerId: string) {
  return providersService().providerContacts(providerId);
}

export type { ProviderProfile };
