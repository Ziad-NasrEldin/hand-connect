import type { VisibilityService } from '../contracts/visibility.contract';

function firebaseNotImplemented(): never {
  throw new Error('Firebase visibility service is not implemented yet. Complete Phase 9 before enabling firebase data source.');
}

export const firebaseVisibilityService: VisibilityService = {
  createVisibilityRequest: async () => firebaseNotImplemented(),
  listProviderVisibilityRequests: async () => firebaseNotImplemented(),
};
