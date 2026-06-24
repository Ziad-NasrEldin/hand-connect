import { describe, expect, it } from 'vitest';
import { resolveLoginEmail } from './auth.firebase';

describe('firebase auth identifier resolution', () => {
  it('does not query private user docs for phone identifiers', async () => {
    await expect(resolveLoginEmail('+201001112222')).rejects.toThrow('error.auth.invalidCredentials');
  });

  it('accepts email identifiers directly', async () => {
    await expect(resolveLoginEmail(' user@example.test ')).resolves.toBe('user@example.test');
  });
});
