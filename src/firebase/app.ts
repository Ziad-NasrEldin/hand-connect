import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { assertFirebaseDataSourceReady } from '@/services/data-source';

const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

type FirebaseEnvKey = (typeof FIREBASE_ENV_KEYS)[number];

let app: FirebaseApp | null = null;

function readEnv(key: FirebaseEnvKey) {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function getMissingFirebaseConfigKeys() {
  return FIREBASE_ENV_KEYS.filter((key) => !readEnv(key));
}

export function hasFirebaseConfig() {
  return getMissingFirebaseConfigKeys().length === 0;
}

export function getFirebaseConfig(): FirebaseOptions | null {
  const missingKeys = getMissingFirebaseConfigKeys();
  assertFirebaseDataSourceReady(missingKeys.length === 0);

  if (missingKeys.length > 0) return null;

  return {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
  };
}

export function getFirebaseApp() {
  const config = getFirebaseConfig();
  if (!config) return null;
  if (app) return app;

  const existingApp = getApps()[0];
  app = existingApp ?? initializeApp(config);
  return app;
}
