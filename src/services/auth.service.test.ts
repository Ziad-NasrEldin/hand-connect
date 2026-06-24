import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  login,
  loginWithGoogle,
  registerCustomer,
  registerProvider,
} from './auth.service';
import { readDb, resetDemoDb } from './demo/demo-db';

describe('auth service localization', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

  it('throws translation keys for invalid credentials and duplicates', async () => {
    await expect(login('missing@hand.test', 'password')).rejects.toThrow(
      'error.auth.invalidCredentials',
    );

    await expect(
      registerCustomer({
        displayName: 'Test User',
        email: 'customer@hand.test',
        password: 'password',
        phone: '+201001112222',
      }),
    ).rejects.toThrow('error.auth.emailExists');
  });

  it('logs in with phone plus password without SMS', async () => {
    const session = await login('+201001112222', 'password');

    expect(session.user).toMatchObject({
      email: 'customer@hand.test',
      role: 'customer',
    });
  });

  it('creates a customer session for Google login without provider approval', async () => {
    const session = await loginWithGoogle();

    expect(session.user).toMatchObject({
      email: 'google.customer@hand.test',
      role: 'customer',
      status: 'active',
    });
    expect(session.providerStatus).toBeUndefined();

    const db = readDb();
    expect(
      db.providers.some((provider) => provider.userId === session.user?.uid),
    ).toBe(false);
  });

  it('keeps provider registration pending for manual verification', async () => {
    const session = await registerProvider({
      displayName: 'Pending Provider',
      email: 'pending.social@hand.test',
      password: 'password',
      phone: '+201001119999',
      profession: 'plumbing',
      serviceArea: 'new-cairo',
      whatsappNumber: '+201001119999',
      identityDocument: {
        fileName: 'national-id.svg',
        fileType: 'image/svg+xml',
        fileSize: 128,
        uploadedAt: new Date().toISOString(),
        previewDataUrl: 'data:image/svg+xml,<svg />',
      },
    });

    expect(session.user).toMatchObject({
      email: 'pending.social@hand.test',
      role: 'provider',
      status: 'active',
    });
    expect(session.providerStatus).toBe('pending');

    const provider = readDb().providers.find(
      (item) => item.userId === session.user?.uid,
    );
    expect(provider).toMatchObject({
      status: 'pending',
      nationalIdVerified: false,
    });
  });
});
