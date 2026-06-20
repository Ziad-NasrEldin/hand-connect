import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFirebaseConfig,
  getMissingFirebaseConfigKeys,
  hasFirebaseConfig,
} from './app';

const firebaseEnv = {
  VITE_FIREBASE_API_KEY: 'api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'herafy.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'herafy',
  VITE_FIREBASE_STORAGE_BUCKET: 'herafy.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abc',
};

describe('firebase app config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports missing Firebase env keys', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'api-key');

    expect(hasFirebaseConfig()).toBe(false);
    expect(getMissingFirebaseConfigKeys()).toContain('VITE_FIREBASE_PROJECT_ID');
    expect(getFirebaseConfig()).toBeNull();
  });

  it('returns trimmed Firebase config when complete', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'firebase');
    for (const [key, value] of Object.entries(firebaseEnv)) {
      vi.stubEnv(key, ` ${value} `);
    }

    expect(hasFirebaseConfig()).toBe(true);
    expect(getMissingFirebaseConfigKeys()).toEqual([]);
    expect(getFirebaseConfig()).toMatchObject({
      apiKey: firebaseEnv.VITE_FIREBASE_API_KEY,
      projectId: firebaseEnv.VITE_FIREBASE_PROJECT_ID,
      appId: firebaseEnv.VITE_FIREBASE_APP_ID,
    });
  });

  it('throws when Firebase data source is selected without full config', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'firebase');
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'api-key');

    expect(() => getFirebaseConfig()).toThrow(
      'Firebase data source selected, but required Firebase environment configuration is missing.',
    );
  });
});
