import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from './app';

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}
