import { getFirestore } from 'firebase/firestore';
import { getFirebaseApp } from './app';

export function getFirebaseDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}
