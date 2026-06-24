import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CallableRequest } from 'firebase-functions/v2/https';

type DocData = Record<string, unknown>;

class DocSnapshot {
  constructor(
    readonly ref: DocRef,
    private readonly value: DocData | undefined,
  ) {}

  get exists() {
    return this.value !== undefined;
  }

  get id() {
    return this.ref.id;
  }

  data() {
    return this.value ? { ...this.value } : undefined;
  }
}

class QuerySnapshot {
  constructor(readonly docs: DocSnapshot[]) {}

  get empty() {
    return this.docs.length === 0;
  }

  get size() {
    return this.docs.length;
  }
}

class DocRef {
  constructor(
    readonly firestore: FakeFirestore,
    readonly path: string,
  ) {}

  get id() {
    return this.path.split('/').at(-1)!;
  }

  collection(name: string) {
    return new CollectionRef(this.firestore, `${this.path}/${name}`);
  }

  async get() {
    return new DocSnapshot(this, this.firestore.read(this.path));
  }

  async set(data: DocData) {
    this.firestore.set(this.path, data);
  }
}

class QueryRef {
  constructor(
    readonly collectionRef: CollectionRef,
    readonly filters: Array<{ field: string; op: string; value: unknown }> = [],
    readonly max?: number,
  ) {}

  where(field: string, op: string, value: unknown) {
    return new QueryRef(this.collectionRef, [...this.filters, { field, op, value }], this.max);
  }

  limit(max: number) {
    return new QueryRef(this.collectionRef, this.filters, max);
  }

  async get() {
    return this.collectionRef.firestore.query(this);
  }
}

class CollectionRef {
  constructor(
    readonly firestore: FakeFirestore,
    readonly path: string,
  ) {}

  doc(id = this.firestore.nextId(this.path)) {
    return new DocRef(this.firestore, `${this.path}/${id}`);
  }

  where(field: string, op: string, value: unknown) {
    return new QueryRef(this).where(field, op, value);
  }

  async get() {
    return this.firestore.query(new QueryRef(this));
  }
}

class FakeTransaction {
  private readonly writes: Array<() => void> = [];

  constructor(private readonly firestore: FakeFirestore) {}

  async get(ref: DocRef | QueryRef) {
    return ref instanceof DocRef ? ref.get() : ref.get();
  }

  set(ref: DocRef, data: DocData) {
    this.writes.push(() => this.firestore.set(ref.path, data));
  }

  update(ref: DocRef, patch: DocData) {
    this.writes.push(() => this.firestore.update(ref.path, patch));
  }

  commit() {
    this.writes.forEach((write) => write());
  }
}

class FakeFirestore {
  private readonly docs = new Map<string, DocData>();
  private ids = 0;

  reset(seed: Record<string, DocData> = {}) {
    this.docs.clear();
    this.ids = 0;
    Object.entries(seed).forEach(([path, data]) => this.set(path, data));
  }

  collection(path: string) {
    return new CollectionRef(this, path);
  }

  async runTransaction<T>(callback: (transaction: FakeTransaction) => Promise<T>) {
    const transaction = new FakeTransaction(this);
    const result = await callback(transaction);
    transaction.commit();
    return result;
  }

  read(path: string) {
    const data = this.docs.get(path);
    return data ? { ...data } : undefined;
  }

  set(path: string, data: DocData) {
    this.docs.set(path, { ...data });
  }

  update(path: string, patch: DocData) {
    const current = this.docs.get(path);
    if (!current) throw new Error(`Missing document: ${path}`);
    this.docs.set(path, { ...current, ...patch });
  }

  nextId(path: string) {
    this.ids += 1;
    return `${path.replaceAll('/', '_')}_${this.ids}`;
  }

  async query(queryRef: QueryRef) {
    const prefix = `${queryRef.collectionRef.path}/`;
    let docs = [...this.docs.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, data]) => new DocSnapshot(new DocRef(this, path), data));

    for (const filter of queryRef.filters) {
      docs = docs.filter((snapshot) => {
        const value = snapshot.data()?.[filter.field];
        if (filter.op === '==') return value === filter.value;
        if (filter.op === '>=') return String(value) >= String(filter.value);
        throw new Error(`Unsupported query operator: ${filter.op}`);
      });
    }

    return new QuerySnapshot(typeof queryRef.max === 'number' ? docs.slice(0, queryRef.max) : docs);
  }

  findCollection(path: string) {
    const prefix = `${path}/`;
    return [...this.docs.entries()]
      .filter(([docPath]) => docPath.startsWith(prefix) && !docPath.slice(prefix.length).includes('/'))
      .map(([docPath, data]) => ({ id: docPath.slice(prefix.length), data }));
  }
}

const firestore = new FakeFirestore();

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => firestore,
}));

type CallableLike<T> = {
  run: (request: CallableRequest<DocData>) => Promise<T>;
};

const call = async <T>(fn: CallableLike<T>, uid: string | null, data: DocData) =>
  fn.run({ auth: uid ? { uid } : undefined, data } as CallableRequest<DocData>);

describe('callable integration coverage with Firestore test double', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    firestore.reset();
  });

  it('creates a contact-gated review and recalculates provider rating in one transaction', async () => {
    const { createReview } = await import('../src/reviews.js');
    firestore.reset({
      'users/customer-1': { role: 'customer', status: 'active', displayName: 'Customer One' },
      'providers/provider-1': { status: 'approved', avgRating: 0, reviewCount: 0 },
      'contacts/contact-1': {
        customerId: 'customer-1',
        providerId: 'provider-1',
        hasReview: false,
      },
    });

    const review = await call(createReview, 'customer-1', {
      providerId: 'provider-1',
      rating: 5,
      comment: 'Excellent work',
    });

    expect(review).toMatchObject({
      providerId: 'provider-1',
      customerId: 'customer-1',
      rating: 5,
      status: 'visible',
    });
    expect(firestore.read('contacts/contact-1')?.hasReview).toBe(true);
    expect(firestore.read('providers/provider-1')).toMatchObject({ avgRating: 5, reviewCount: 1 });
    expect(firestore.findCollection('analyticsEvents')[0].data).toMatchObject({
      type: 'review_created',
      actorId: 'customer-1',
      targetType: 'provider',
      targetId: 'provider-1',
    });
  });

  it('hides a review, closes its report, writes audit evidence, and excludes it from rating', async () => {
    const { hideReview } = await import('../src/reviews.js');
    firestore.reset({
      'users/admin-1': { role: 'admin', status: 'active' },
      'providers/provider-1': { status: 'approved', avgRating: 4.5, reviewCount: 2 },
      'reviews/review-1': { providerId: 'provider-1', rating: 5, status: 'visible' },
      'reviews/review-2': { providerId: 'provider-1', rating: 3, status: 'visible' },
      'reports/report-1': { status: 'open' },
    });

    await call(hideReview, 'admin-1', {
      reviewId: 'review-1',
      reportId: 'report-1',
      reason: 'Policy violation',
    });

    expect(firestore.read('reviews/review-1')?.status).toBe('removed');
    expect(firestore.read('reports/report-1')).toMatchObject({
      status: 'closed',
      resolvedBy: 'admin-1',
      resolutionReason: 'Policy violation',
    });
    expect(firestore.read('providers/provider-1')).toMatchObject({ avgRating: 3, reviewCount: 1 });
    expect(firestore.findCollection('adminActions')[0].data).toMatchObject({
      adminId: 'admin-1',
      targetType: 'review',
      targetId: 'review-1',
      action: 'hide_review',
    });
  });

  it('creates provider, review, and message reports and enforces report rate limits', async () => {
    const { reportMessage, reportProvider, reportReview } = await import('../src/engagement.js');
    firestore.reset({
      'users/customer-1': { role: 'customer', status: 'active', displayName: 'Customer One' },
      'providers/provider-1': { displayName: 'Provider One', status: 'approved' },
      'reviews/review-1': { comment: 'Bad behavior', status: 'visible' },
      'conversations/conversation-1': { participants: ['customer-1', 'provider-user-1'] },
      'conversations/conversation-1/messages/message-1': { text: 'Unsafe message' },
    });

    await call(reportProvider, 'customer-1', { providerId: 'provider-1', reason: 'Spam' });
    await call(reportReview, 'customer-1', { reviewId: 'review-1', reason: 'Abuse' });
    await call(reportMessage, 'customer-1', {
      conversationId: 'conversation-1',
      messageId: 'message-1',
      reason: 'Harassment',
    });

    expect(firestore.findCollection('reports').map((item) => item.data.targetType)).toEqual([
      'provider',
      'review',
      'message',
    ]);

    firestore.reset({
      'users/customer-1': { role: 'customer', status: 'active' },
      'providers/provider-1': { displayName: 'Provider One', status: 'approved' },
      ...Object.fromEntries(
        Array.from({ length: 10 }, (_, index) => [
          `reports/existing-${index}`,
          {
            reporterId: 'customer-1',
            createdAt: '2026-06-24T00:00:00.000Z',
          },
        ]),
      ),
    });

    await expect(
      call(reportProvider, 'customer-1', { providerId: 'provider-1', reason: 'Spam' }),
    ).rejects.toMatchObject({ code: 'resource-exhausted' });
  });

  it('runs engagement callables for WhatsApp reveal, chat start, profile view, and guards unavailable providers', async () => {
    const { trackProfileView } = await import('../src/analytics.js');
    const { revealWhatsApp, startConversation } = await import('../src/engagement.js');
    firestore.reset({
      'users/customer-1': { role: 'customer', status: 'active' },
      'users/provider-user-1': { role: 'provider', status: 'active' },
      'users/provider-user-2': { role: 'provider', status: 'active' },
      'providers/provider-1': {
        userId: 'provider-user-1',
        status: 'approved',
        whatsappVisible: true,
        whatsappNumber: '+20 100 000 0000',
        profileViews: 0,
      },
      'providers/provider-2': {
        userId: 'provider-user-2',
        status: 'suspended',
        whatsappVisible: true,
        whatsappNumber: '+20 100 000 0001',
        profileViews: 0,
      },
    });

    const reveal = await call(revealWhatsApp, 'customer-1', { providerId: 'provider-1' });
    const conversation = await call(startConversation, 'customer-1', {
      providerId: 'provider-1',
      text: 'Hello',
    });
    await call(trackProfileView, 'customer-1', {
      providerId: 'provider-1',
      dedupeKey: 'view-1',
    });
    await call(trackProfileView, 'customer-1', {
      providerId: 'provider-1',
      dedupeKey: 'view-1',
    });

    expect(reveal.whatsappUrl).toBe('https://wa.me/201000000000');
    expect(conversation).toMatchObject({
      id: 'customer-1_provider-1',
      providerId: 'provider-1',
      customerId: 'customer-1',
      lastMessage: 'Hello',
    });
    expect(firestore.read('providers/provider-1')?.profileViews).toBe(1);
    expect(firestore.findCollection('contacts').map((item) => item.data.type).sort()).toEqual([
      'platform_message',
      'whatsapp_reveal',
    ]);
    await expect(call(revealWhatsApp, 'customer-1', { providerId: 'provider-2' })).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('covers admin callable authorization and state-transition matrices', async () => {
    const { approveProvider, rejectProvider, suspendProvider } = await import('../src/providers.js');
    const { approveVisibilityRequest, rejectVisibilityRequest } = await import('../src/visibility.js');
    firestore.reset({
      'users/admin-1': { role: 'admin', status: 'active' },
      'users/banned-admin': { role: 'admin', status: 'banned' },
      'users/customer-1': { role: 'customer', status: 'active' },
      'providers/provider-pending': { status: 'pending', nationalIdVerified: false, approvedAt: null },
      'providers/provider-approved': {
        status: 'approved',
        nationalIdVerified: true,
        approvedAt: '2026-01-01T00:00:00.000Z',
        serviceAreaKeys: ['new-cairo'],
        serviceAreas: [{ neighborhood: 'new-cairo', city: 'cairo' }],
        reviewCount: 40,
      },
      'providers/provider-area': {
        status: 'approved',
        serviceAreaKeys: ['new-cairo'],
        serviceAreas: [{ neighborhood: 'new-cairo', city: 'cairo' }],
        reviewCount: 40,
      },
      'providerIdentityDocuments/provider-pending': { uploadedAt: '2026-01-01T00:00:00.000Z' },
      'visibilityRequests/boost-1': {
        providerId: 'provider-approved',
        type: 'boost',
        serviceArea: 'new-cairo',
        status: 'pending',
        notes: 'paid',
        productSnapshot: { productId: 'boost-30', productVersion: 1, durationDays: 30 },
      },
      'visibilityRequests/area-1': {
        providerId: 'provider-area',
        type: 'area_expansion',
        serviceArea: 'heliopolis',
        status: 'pending',
        notes: 'paid',
      },
      'visibilityRequests/reject-1': {
        providerId: 'provider-approved',
        type: 'boost',
        serviceArea: 'new-cairo',
        status: 'pending',
      },
    });

    await expect(
      call(approveProvider, 'customer-1', { providerId: 'provider-pending' }),
    ).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(
      call(rejectProvider, 'banned-admin', { providerId: 'provider-pending', reason: 'bad' }),
    ).rejects.toMatchObject({ code: 'permission-denied' });

    await call(approveProvider, 'admin-1', { providerId: 'provider-pending' });
    await call(rejectProvider, 'admin-1', { providerId: 'provider-approved', reason: 'bad' }).catch(
      (error) => expect(error).toMatchObject({ code: 'failed-precondition' }),
    );
    await call(approveVisibilityRequest, 'admin-1', {
      requestId: 'boost-1',
      notes: 'confirmed',
    });
    await call(approveVisibilityRequest, 'admin-1', {
      requestId: 'area-1',
      notes: 'confirmed',
    });
    await call(rejectVisibilityRequest, 'admin-1', {
      requestId: 'reject-1',
      reason: 'payment mismatch',
    });
    await call(suspendProvider, 'admin-1', {
      providerId: 'provider-approved',
      reason: 'Policy violation',
    });

    expect(firestore.read('providers/provider-pending')).toMatchObject({
      status: 'approved',
      nationalIdVerified: true,
    });
    expect(firestore.read('providers/provider-approved')).toMatchObject({
      visibilityTier: 'paid',
      activeVisibilityRequestId: 'boost-1',
      suspensionReason: 'Policy violation',
    });
    expect(firestore.read('providers/provider-area')?.serviceAreaKeys).toContain('heliopolis');
    expect(firestore.read('visibilityRequests/reject-1')).toMatchObject({
      status: 'rejected',
      paymentStatus: 'rejected',
    });
    expect(firestore.findCollection('adminActions').map((item) => item.data.action)).toContain(
      'approve_provider',
    );
  });

  it('keeps provider ownerStatus in sync when admins ban and unban provider users', async () => {
    const { setUserBanned } = await import('../src/admin.js');
    firestore.reset({
      'users/admin-1': { role: 'admin', status: 'active' },
      'users/provider-1': { role: 'provider', status: 'active' },
      'providers/provider-1-a': { userId: 'provider-1', ownerStatus: 'active' },
      'providers/provider-1-b': { userId: 'provider-1', ownerStatus: 'active' },
      'providers/provider-other': { userId: 'provider-other', ownerStatus: 'active' },
    });

    await call(setUserBanned, 'admin-1', {
      userId: 'provider-1',
      banned: true,
      reason: 'admin.reason.manualBan',
    });

    expect(firestore.read('users/provider-1')).toMatchObject({
      status: 'banned',
      banReason: 'admin.reason.manualBan',
      bannedBy: 'admin-1',
    });
    expect(firestore.read('providers/provider-1-a')).toMatchObject({ ownerStatus: 'banned' });
    expect(firestore.read('providers/provider-1-b')).toMatchObject({ ownerStatus: 'banned' });
    expect(firestore.read('providers/provider-other')).toMatchObject({ ownerStatus: 'active' });

    await call(setUserBanned, 'admin-1', {
      userId: 'provider-1',
      banned: false,
      reason: 'admin.reason.manualUnban',
    });

    expect(firestore.read('users/provider-1')).toMatchObject({
      status: 'active',
      banReason: null,
      bannedAt: null,
      bannedBy: null,
    });
    expect(firestore.read('providers/provider-1-a')).toMatchObject({ ownerStatus: 'active' });
    expect(firestore.read('providers/provider-1-b')).toMatchObject({ ownerStatus: 'active' });
    expect(firestore.findCollection('adminActions').map((item) => item.data.action)).toEqual([
      'ban_user',
      'unban_user',
    ]);
  });
});
