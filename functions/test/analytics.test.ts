import { describe, expect, it } from 'vitest';
import { writeAnalyticsEvent, type AnalyticsEventType } from '../src/analytics.js';

const expectedEventTypes: AnalyticsEventType[] = [
  'profile_view',
  'chat_initiated',
  'whatsapp_reveal',
  'review_created',
  'review_moderated',
  'provider_status_changed',
  'paid_visibility_started',
  'paid_visibility_expired',
  'area_expansion_approved',
];

describe('analytics event schema', () => {
  it('keeps the trusted backend event type union explicit', () => {
    expect(expectedEventTypes).toEqual([
      'profile_view',
      'chat_initiated',
      'whatsapp_reveal',
      'review_created',
      'review_moderated',
      'provider_status_changed',
      'paid_visibility_started',
      'paid_visibility_expired',
      'area_expansion_approved',
    ]);
  });

  it('writes deduped analytics events through backend-owned documents', () => {
    const setCalls: unknown[] = [];
    const transaction = {
      set: (...args: unknown[]) => setCalls.push(args),
    };
    const firestore = {
      collection: (name: string) => ({
        doc: (id?: string) => ({ path: `${name}/${id ?? 'generated'}` }),
      }),
    };

    writeAnalyticsEvent(transaction as never, firestore as never, {
      type: 'whatsapp_reveal',
      actorId: 'customer-1',
      targetType: 'provider',
      targetId: 'provider-1',
      metadata: { contactId: 'contact-1' },
      dedupeKey: 'customer-1_provider-1_whatsapp_reveal',
      createdAt: '2026-05-01T00:00:00.000Z',
    });

    expect(setCalls).toEqual([
      [
        { path: 'analyticsEvents/customer-1_provider-1_whatsapp_reveal' },
        {
          type: 'whatsapp_reveal',
          actorId: 'customer-1',
          targetType: 'provider',
          targetId: 'provider-1',
          metadata: { contactId: 'contact-1' },
          dedupeKey: 'customer-1_provider-1_whatsapp_reveal',
          createdAt: '2026-05-01T00:00:00.000Z',
        },
        { merge: false },
      ],
    ]);
  });
});
