import { describe, expect, it } from 'vitest';
import { approvedProviderPatch, isActiveAdmin, rejectedProviderPatch, suspendedProviderPatch } from '../src/providers.js';

describe('provider moderation helpers', () => {
  it('builds approval and rejection patches', () => {
    expect(approvedProviderPatch('2026-01-01T00:00:00.000Z')).toEqual({
      status: 'approved',
      nationalIdVerified: true,
      approvedAt: '2026-01-01T00:00:00.000Z',
      rejectionReason: null,
    });
    expect(rejectedProviderPatch('bad document')).toEqual({
      status: 'rejected',
      nationalIdVerified: false,
      approvedAt: null,
      rejectionReason: 'bad document',
    });
    expect(suspendedProviderPatch('policy violation')).toEqual({
      status: 'suspended',
      suspensionReason: 'policy violation',
    });
  });

  it('rejects banned admins for provider moderation callables', () => {
    expect(isActiveAdmin({ role: 'admin', status: 'active' })).toBe(true);
    expect(isActiveAdmin({ role: 'admin', status: 'banned' })).toBe(false);
    expect(isActiveAdmin({ role: 'customer', status: 'active' })).toBe(false);
  });
});
