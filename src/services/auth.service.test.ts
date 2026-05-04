import { beforeEach, describe, expect, it } from 'vitest';
import { login, registerCustomer } from './auth.service';
import { resetDemoDb } from './demo-db';

describe('auth service localization', () => {
  beforeEach(() => {
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
});
