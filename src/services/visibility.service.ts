import type { VisibilityService } from './contracts/visibility.contract';
import { getDataSource } from './data-source';
import * as demo from './demo/visibility.demo';
import { firebaseVisibilityService } from './firebase/visibility.firebase';

const demoVisibilityService: VisibilityService = demo;

function visibilityService(): VisibilityService {
  return getDataSource() === 'firebase' ? firebaseVisibilityService : demoVisibilityService;
}

export async function createVisibilityRequest(providerId: string, serviceArea: string, paymentMethod: string, notes: string) {
  return visibilityService().createVisibilityRequest(providerId, serviceArea, paymentMethod, notes);
}

export async function listProviderVisibilityRequests(providerId: string) {
  return visibilityService().listProviderVisibilityRequests(providerId);
}
