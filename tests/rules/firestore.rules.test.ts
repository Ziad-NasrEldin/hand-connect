import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const hasFirestoreEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const rulesDescribe = hasFirestoreEmulator ? describe : describe.skip;

let testEnv: RulesTestEnvironment;

rulesDescribe('firestore security rules: users and providers', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'hand-connect-cairo',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/admin'), userDoc('admin', 'admin'));
      await setDoc(doc(db, 'users/customer-a'), userDoc('customer-a', 'customer'));
      await setDoc(doc(db, 'users/customer-b'), userDoc('customer-b', 'customer'));
      await setDoc(doc(db, 'users/provider-a'), userDoc('provider-a', 'provider'));
      await setDoc(doc(db, 'providers/provider-a'), providerDoc('provider-a', 'approved'));
      await setDoc(doc(db, 'providers/provider-pending'), providerDoc('provider-pending', 'pending'));
    });
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  it('lets users create/read only their own allowed customer/provider profile docs', async () => {
    const customer = testEnv.authenticatedContext('customer-a').firestore();
    const other = testEnv.authenticatedContext('customer-b').firestore();
    const admin = testEnv.authenticatedContext('admin').firestore();

    const newCustomer = testEnv.authenticatedContext('new-customer').firestore();

    await assertSucceeds(getDoc(doc(customer, 'users/customer-a')));
    await assertFails(getDoc(doc(other, 'users/customer-a')));
    await assertSucceeds(getDoc(doc(admin, 'users/customer-a')));

    await assertSucceeds(setDoc(doc(newCustomer, 'users/new-customer'), userDoc('new-customer', 'customer')));
    await assertFails(setDoc(doc(newCustomer, 'users/new-admin'), userDoc('new-customer', 'admin')));
  });

  it('enforces provider public/owner/admin visibility and owner-safe updates', async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    const owner = testEnv.authenticatedContext('provider-a').firestore();
    const customer = testEnv.authenticatedContext('customer-a').firestore();
    const admin = testEnv.authenticatedContext('admin').firestore();

    await assertSucceeds(getDoc(doc(anon, 'providers/provider-a')));
    await assertFails(getDoc(doc(anon, 'providers/provider-pending')));
    await assertSucceeds(getDoc(doc(owner, 'providers/provider-a')));
    await assertSucceeds(getDoc(doc(admin, 'providers/provider-pending')));

    await assertSucceeds(updateDoc(doc(owner, 'providers/provider-a'), { bio: 'Updated bio' }));
    await assertFails(updateDoc(doc(owner, 'providers/provider-a'), { status: 'suspended' }));
    await assertFails(updateDoc(doc(owner, 'providers/provider-a'), { nationalIdVerified: false }));
    await assertFails(updateDoc(doc(owner, 'providers/provider-a'), { visibilityTier: 'paid' }));
    await assertFails(updateDoc(doc(customer, 'providers/provider-a'), { bio: 'Not mine' }));
    await assertSucceeds(updateDoc(doc(admin, 'providers/provider-a'), { status: 'suspended' }));
  });

  it('lets signed-in providers create only pending owned provider profiles', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/provider-new'), userDoc('provider-new', 'provider'));
    });

    const provider = testEnv.authenticatedContext('provider-new').firestore();

    await assertSucceeds(setDoc(doc(provider, 'providers/provider-new'), providerDoc('provider-new', 'pending')));
    await assertFails(setDoc(doc(provider, 'providers/provider-new-approved'), providerDoc('provider-new', 'approved')));
    await assertFails(setDoc(doc(provider, 'providers/provider-other'), providerDoc('other-user', 'pending')));
  });

  it('allows admin-owned direct moderation writes without Cloud Functions', async () => {
    const admin = testEnv.authenticatedContext('admin').firestore();
    const customer = testEnv.authenticatedContext('customer-a').firestore();

    await assertSucceeds(updateDoc(doc(admin, 'providers/provider-pending'), {
      status: 'approved',
      nationalIdVerified: true,
      approvedAt: '2026-01-02T00:00:00.000Z',
      rejectionReason: null,
    }));
    await assertSucceeds(setDoc(doc(admin, 'adminActions/action-approve'), adminActionDoc('admin', 'provider', 'provider-pending', 'approve_provider')));
    await assertSucceeds(setDoc(doc(admin, 'adminActions/action-visibility'), adminActionDoc('admin', 'visibilityRequest', 'visibility-a', 'approve_visibility')));
    await assertSucceeds(setDoc(doc(admin, 'adminActions/action-ban'), adminActionDoc('admin', 'user', 'customer-a', 'ban_user')));
    await assertFails(setDoc(doc(customer, 'adminActions/action-fake'), adminActionDoc('customer-a', 'provider', 'provider-pending', 'approve_provider')));
  });

  it('allows admins to ban accounts and blocks banned user writes', async () => {
    const admin = testEnv.authenticatedContext('admin').firestore();
    const customer = testEnv.authenticatedContext('customer-a').firestore();

    await assertSucceeds(updateDoc(doc(admin, 'users/customer-a'), {
      status: 'banned',
      banReason: 'admin.reason.manualBan',
      bannedAt: '2026-01-02T00:00:00.000Z',
      bannedBy: 'admin',
    }));

    await assertFails(setDoc(doc(customer, 'reports/report-banned'), reportDoc('customer-a')));
    await assertFails(setDoc(doc(customer, 'contacts/customer-a_provider-a_whatsapp_reveal'), contactDoc('customer-a', 'provider-a')));
    await assertFails(updateDoc(doc(customer, 'users/customer-a'), { displayName: 'Banned edit' }));

    await assertSucceeds(updateDoc(doc(admin, 'users/customer-a'), {
      status: 'active',
      banReason: null,
      bannedAt: null,
      bannedBy: null,
    }));
    await assertSucceeds(updateDoc(doc(customer, 'users/customer-a'), { displayName: 'Allowed edit' }));
  });

  it('blocks direct abuse report creation so callable rate limits are required', async () => {
    const customer = testEnv.authenticatedContext('customer-a').firestore();

    await assertFails(setDoc(doc(customer, 'reports/report-valid'), reportDoc('customer-a')));
    await assertFails(setDoc(doc(customer, 'reports/report-spoofed'), reportDoc('customer-b')));
    await assertFails(setDoc(doc(customer, 'reports/report-closed'), { ...reportDoc('customer-a'), status: 'closed' }));
    await assertFails(setDoc(doc(customer, 'reports/report-resolved'), { ...reportDoc('customer-a'), resolvedBy: 'admin' }));
  });

  it('allows provider-owned visibility requests and admin-only processing', async () => {
    const provider = testEnv.authenticatedContext('provider-a').firestore();
    const other = testEnv.authenticatedContext('customer-a').firestore();
    const admin = testEnv.authenticatedContext('admin').firestore();

    await assertSucceeds(setDoc(doc(provider, 'visibilityRequests/visibility-a'), visibilityRequestDoc('provider-a')));
    await assertFails(setDoc(doc(provider, 'visibilityRequests/visibility-area-expansion'), {
      ...visibilityRequestDoc('provider-a'),
      type: 'area_expansion',
      serviceArea: 'maadi',
    }));
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'providers/provider-a'), { reviewCount: 30 });
    });
    await assertSucceeds(setDoc(doc(provider, 'visibilityRequests/visibility-area-expansion-eligible'), {
      ...visibilityRequestDoc('provider-a'),
      type: 'area_expansion',
      serviceArea: 'maadi',
    }));
    await assertFails(setDoc(doc(provider, 'visibilityRequests/visibility-area-expansion-existing'), {
      ...visibilityRequestDoc('provider-a'),
      type: 'area_expansion',
      serviceArea: 'new-cairo',
    }));
    await assertFails(setDoc(doc(other, 'visibilityRequests/visibility-b'), visibilityRequestDoc('provider-a')));
    await assertFails(updateDoc(doc(provider, 'visibilityRequests/visibility-a'), { status: 'approved' }));
    await assertSucceeds(updateDoc(doc(admin, 'visibilityRequests/visibility-a'), {
      status: 'approved',
      paymentConfirmedBy: 'admin',
      processedAt: '2026-01-02T00:00:00.000Z',
    }));
  });

  it('blocks direct review creation so callable aggregate path is required', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'contacts/customer-a_provider-a_platform_message'), contactDoc('customer-a', 'provider-a'));
    });

    const customer = testEnv.authenticatedContext('customer-a').firestore();
    const other = testEnv.authenticatedContext('customer-b').firestore();

    await assertFails(setDoc(doc(customer, 'reviews/customer-a_provider-a'), reviewDoc('customer-a', 'provider-a', 'customer-a_provider-a_platform_message')));
    await assertFails(updateDoc(doc(customer, 'contacts/customer-a_provider-a_platform_message'), { hasReview: true }));
    await assertFails(setDoc(doc(customer, 'reviews/random-review-id'), reviewDoc('customer-a', 'provider-a', 'customer-a_provider-a_platform_message')));
    await assertFails(setDoc(doc(other, 'reviews/customer-b_provider-a'), reviewDoc('customer-b', 'provider-a', 'customer-a_provider-a_platform_message')));
  });

  it('limits conversation writes to send/read state and protects participants', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'conversations/customer-a_provider-a'), conversationDoc('customer-a', 'provider-a'));
      await setDoc(doc(db, 'conversations/customer-a_provider-a/messages/message-a'), messageDoc('message-a', 'customer-a'));
    });

    const customer = testEnv.authenticatedContext('customer-a').firestore();
    const provider = testEnv.authenticatedContext('provider-a').firestore();

    await assertSucceeds(updateDoc(doc(customer, 'conversations/customer-a_provider-a'), {
      lastMessage: 'Updated',
      lastMessageAt: '2026-01-02T00:00:00.000Z',
      unreadCount: { 'customer-a': 0, 'provider-a': 1 },
    }));
    await assertFails(updateDoc(doc(customer, 'conversations/customer-a_provider-a'), {
      participants: ['customer-a', 'customer-b'],
    }));
    await assertSucceeds(updateDoc(doc(provider, 'conversations/customer-a_provider-a/messages/message-a'), { read: true }));
    await assertFails(updateDoc(doc(customer, 'conversations/customer-a_provider-a/messages/message-a'), { read: true }));
    await assertFails(updateDoc(doc(provider, 'conversations/customer-a_provider-a/messages/message-a'), { text: 'tampered' }));
  });
});

if (!hasFirestoreEmulator) {
  describe('firestore security rules', () => {
    it('requires the Firestore emulator', () => {
      expect(process.env.FIRESTORE_EMULATOR_HOST).toBeUndefined();
    });
  });
}

function userDoc(uid: string, role: 'admin' | 'customer' | 'provider') {
  return {
    uid,
    role,
    status: 'active',
    banReason: null,
    bannedAt: null,
    bannedBy: null,
    email: `${uid}@example.test`,
    displayName: uid,
    phone: '+201000000000',
    language: 'ar',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function providerDoc(userId: string, status: 'pending' | 'approved' | 'suspended' | 'rejected') {
  return {
    id: userId,
    userId,
    displayName: userId,
    phone: '+201****0000',
    profession: 'cleaning',
    bio: '',
    nationalIdVerified: status === 'approved',
    status,
    serviceAreas: [{ neighborhood: 'new-cairo', city: 'cairo' }],
    serviceAreaKeys: ['new-cairo'],
    whatsappNumber: '+201****0000',
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
    profileViews: 0,
    avgRating: 0,
    reviewCount: 0,
    activityScore: 0,
    photos: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    approvedAt: status === 'approved' ? '2026-01-01T00:00:00.000Z' : null,
  };
}

function contactDoc(customerId: string, providerId: string) {
  return {
    id: `${customerId}_${providerId}_platform_message`,
    customerId,
    providerId,
    type: 'platform_message',
    createdAt: '2026-01-01T00:00:00.000Z',
    hasReview: false,
  };
}

function reviewDoc(customerId: string, providerId: string, contactId: string) {
  return {
    providerId,
    customerId,
    customerName: customerId,
    contactId,
    rating: 5,
    comment: 'Great service',
    status: 'visible',
    createdAt: '2026-01-02T00:00:00.000Z',
  };
}

function reportDoc(reporterId: string) {
  return {
    targetType: 'provider',
    targetId: 'provider-a',
    targetLabel: 'provider-a',
    reporterId,
    reporterName: reporterId,
    reason: 'report.reason.providerIssue',
    status: 'open',
    resolvedBy: null,
    resolvedAt: null,
    resolutionReason: null,
    createdAt: '2026-01-02T00:00:00.000Z',
  };
}

function adminActionDoc(adminId: string, targetType: 'provider' | 'profession' | 'visibilityRequest' | 'review' | 'report' | 'user', targetId: string, action: string) {
  return {
    adminId,
    targetType,
    targetId,
    action,
    reason: 'manual no-blaze action',
    createdAt: '2026-01-02T00:00:00.000Z',
  };
}

function visibilityRequestDoc(providerId: string) {
  return {
    providerId,
    type: 'boost',
    tier: 'paid',
    serviceArea: 'new-cairo',
    status: 'pending',
    paymentConfirmedBy: null,
    paymentMethod: 'manual',
    notes: 'manual cash payment pending',
    requestedAt: '2026-01-01T00:00:00.000Z',
    processedAt: null,
  };
}

function conversationDoc(customerId: string, providerId: string) {
  return {
    id: `${customerId}_${providerId}`,
    participants: [customerId, providerId],
    providerId,
    customerId,
    lastMessage: 'Hello',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    unreadCount: { [customerId]: 0, [providerId]: 0 },
  };
}

function messageDoc(id: string, senderId: string) {
  return {
    id,
    conversationId: 'customer-a_provider-a',
    senderId,
    text: 'Hello',
    createdAt: '2026-01-01T00:00:00.000Z',
    read: false,
  };
}
