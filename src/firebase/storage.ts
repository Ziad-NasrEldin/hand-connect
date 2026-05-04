import { getStorage } from 'firebase/storage';
import { getFirebaseApp } from './app';

export function getFirebaseStorage() {
  const app = getFirebaseApp();
  return app ? getStorage(app) : null;
}
