import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeCoverageAreaKeys, getPlatformCoverageRadiusKm } from '../src/lib/provider-coverage';
import type { Contact } from '../src/types/contact';
import type { ProviderIdentityDocument, ProviderProfile } from '../src/types/provider';
import type { Review } from '../src/types/review';
import type { AppUser } from '../src/types/user';

const require = createRequire(import.meta.url);
const firebaseToolsAuth = require('firebase-tools/lib/auth');
const { requireAuth } = require('firebase-tools/lib/requireAuth');
const apiv2 = require('firebase-tools/lib/apiv2');

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'hand-connect-cairo';
const providerEmail = process.env.REVIEW_PROVIDER_EMAIL ?? 'provider35@hand.test';
const providerPassword = process.env.REVIEW_PROVIDER_PASSWORD ?? 'provider35pass';
const providerDisplayName = process.env.REVIEW_PROVIDER_DISPLAY_NAME ?? 'يوسف صيانة';
const providerPhone = process.env.REVIEW_PROVIDER_PHONE ?? '+201001113535';
const productionUrl = process.env.PRODUCTION_URL ?? 'https://h3rafy.com';
const baseDate = '2026-05-04T08:00:00.000Z';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface IdentityToolkitUser {
  localId: string;
}

interface SeedWrite {
  collection: string;
  id: string;
  data: Record<string, JsonValue>;
}

async function getFirebaseCliAccessToken() {
  const account =
    firebaseToolsAuth.getProjectDefaultAccount(process.cwd()) ??
    firebaseToolsAuth.getGlobalDefaultAccount();

  if (!account) {
    throw new Error('No Firebase CLI account found. Run firebase login first.');
  }

  await requireAuth({
    project: projectId,
    projectRoot: process.cwd(),
    user: account.user,
    tokens: account.tokens,
  });

  return apiv2.getAccessToken() as Promise<string>;
}

async function getProductionFirebaseApiKey() {
  if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;

  const envFileApiKey = readEnvFileValue(
    join(process.cwd(), '.vercel', '.env.production.local'),
    'VITE_FIREBASE_API_KEY',
  );
  if (envFileApiKey) return envFileApiKey;

  const html = await fetch(productionUrl).then((response) => response.text());
  const scriptMatches = html.matchAll(/<script[^>]+src="([^"]+)"/g);

  for (const match of scriptMatches) {
    const scriptUrl = new URL(match[1], productionUrl).href;
    const script = await fetch(scriptUrl).then((response) => response.text());
    const apiKeyMatch = script.match(/apiKey:\s*"([^"]+)"/);
    if (apiKeyMatch?.[1]) return apiKeyMatch[1];
  }

  throw new Error('Could not find VITE_FIREBASE_API_KEY. Set it in the environment and retry.');
}

function readEnvFileValue(path: string, key: string) {
  try {
    const line = readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .find((item) => item.startsWith(`${key}=`));
    if (!line) return '';
    return line.slice(key.length + 1).replace(/^["']|["']$/g, '').trim();
  } catch {
    return '';
  }
}

async function lookupAuthUser(accessToken: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: [providerEmail] }),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Firebase Auth lookup failed.');
  }

  return (data.users?.[0] ?? null) as IdentityToolkitUser | null;
}

async function ensureAuthUser(apiKey: string, accessToken: string) {
  const existing = await lookupAuthUser(accessToken);
  if (existing) return existing;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: providerEmail,
        password: providerPassword,
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();

  if (!response.ok && data.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(data.error?.message ?? 'Firebase Auth provider creation failed.');
  }

  const created = await lookupAuthUser(accessToken);
  if (!created) throw new Error('Firebase Auth provider user was not created.');
  return created;
}

async function resetAuthPassword(uid: string, accessToken: string) {
  const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:update', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetProjectId: projectId,
      localId: uid,
      password: providerPassword,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Firebase Auth password reset failed.');
  }
}

function seedWrites(uid: string): SeedWrite[] {
  const user: AppUser = {
    uid,
    email: providerEmail,
    role: 'provider',
    status: 'active',
    banReason: null,
    bannedAt: null,
    bannedBy: null,
    displayName: providerDisplayName,
    phone: providerPhone,
    language: 'ar',
    createdAt: baseDate,
  };

  const profession = 'plumbing';
  const serviceAreas = ['new-cairo', 'nasr-city'];
  const coverageRadiusKm = getPlatformCoverageRadiusKm({
    city: 'cairo',
    profession,
    serviceAreaKey: serviceAreas[0],
  });
  const provider: ProviderProfile = {
    id: uid,
    userId: uid,
    ownerStatus: 'active',
    displayName: providerDisplayName,
    phone: providerPhone,
    profession,
    bio: 'فني صيانة وسباكة في القاهرة الجديدة ومدينة نصر، متخصص في التسريبات وتركيب الخلاطات وصيانة السخانات مع توضيح التكلفة قبل بدء الشغل.',
    nationalIdVerified: true,
    status: 'approved',
    serviceAreas: serviceAreas.map((neighborhood) => ({ neighborhood, city: 'cairo' })),
    serviceAreaKeys: serviceAreas,
    initialServiceAreaKey: serviceAreas[0],
    coverageRadiusKm,
    coverageAreaKeys: computeCoverageAreaKeys(serviceAreas, coverageRadiusKm),
    whatsappNumber: providerPhone,
    whatsappVisible: true,
    visibilityTier: 'paid',
    visibilityPaidUntil: '2026-07-24T08:00:00.000Z',
    paidVisibilityStartedAt: baseDate,
    activeVisibilityRequestId: null,
    activeVisibilityProductId: 'visibility_boost_30_manual',
    activeVisibilityProductVersion: 1,
    paidVisibilityHoldUntil: null,
    rankingPenalty: 0,
    rankingPenaltyUntil: null,
    verificationStatus: 'verified',
    verificationReviewedAt: baseDate,
    verificationReviewedBy: 'admin-demo',
    verificationNotes: null,
    profileViews: 212,
    avgRating: 4.9,
    reviewCount: 35,
    activityScore: 96,
    photos: [
      {
        id: `${uid}-photo-1`,
        url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80',
        alt: `${providerDisplayName} work sample`,
      },
    ],
    createdAt: baseDate,
    approvedAt: baseDate,
  };

  return [
    { collection: 'users', id: uid, data: user as unknown as Record<string, JsonValue> },
    { collection: 'providers', id: uid, data: provider as unknown as Record<string, JsonValue> },
    {
      collection: 'providerIdentityDocuments',
      id: uid,
      data: identityDocumentFor(uid) as unknown as Record<string, JsonValue>,
    },
    ...reviewsFor(uid).flatMap((item) => [
      {
        collection: 'contacts',
        id: item.contact.id,
        data: item.contact as unknown as Record<string, JsonValue>,
      },
      {
        collection: 'reviews',
        id: item.review.id,
        data: item.review as unknown as Record<string, JsonValue>,
      },
    ]),
  ];
}

function reviewsFor(providerId: string) {
  const names = [
    'مريم حسن',
    'نور السيد',
    'عمر محمود',
    'سلمى علي',
    'يوسف عادل',
    'هبة مصطفى',
    'كريم سامي',
    'دينا خالد',
    'أحمد عادل',
    'منى إبراهيم',
  ];
  const comments = [
    'وصل في المعاد وشرح التكلفة قبل ما يبدأ.',
    'الشغل كان نظيف والتواصل واضح من أول مكالمة.',
    'حل المشكلة بسرعة وساب المكان مرتب.',
    'السعر كان مناسب مقارنة بجودة الشغل.',
    'تابع معايا بعد الزيارة للتأكد إن العطل متحل.',
  ];

  return Array.from({ length: 35 }, (_, index) => {
    const number = index + 1;
    const customerId = `review-provider35-customer-${String(number).padStart(2, '0')}`;
    const contactId = `review-provider35-contact-${String(number).padStart(2, '0')}`;
    const createdAt = new Date(Date.UTC(2026, 4, number, 8, 0, 0)).toISOString();
    const contact: Contact = {
      id: contactId,
      customerId,
      providerId,
      type: number % 3 === 0 ? 'whatsapp_reveal' : 'platform_message',
      createdAt,
      hasReview: true,
    };
    const review: Review = {
      id: `review-provider35-${String(number).padStart(2, '0')}`,
      providerId,
      customerId,
      customerName: names[index % names.length],
      contactId,
      rating: number % 7 === 0 ? 4 : 5,
      comment: comments[index % comments.length],
      status: 'visible',
      createdAt,
    };
    return { contact, review };
  });
}

function identityDocumentFor(providerId: string): ProviderIdentityDocument {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="440" viewBox="0 0 720 440">',
    '<rect width="720" height="440" rx="28" fill="#fff6ed"/>',
    '<rect x="36" y="36" width="648" height="368" rx="22" fill="#ffffff" stroke="#e9b389" stroke-width="4"/>',
    '<text x="72" y="130" font-family="Arial" font-size="30" font-weight="700" fill="#1b1f1b">Herafy Identity Review</text>',
    `<text x="72" y="190" font-family="Arial" font-size="24" fill="#493726">${providerDisplayName}</text>`,
    `<text x="72" y="238" font-family="Arial" font-size="20" fill="#493726">Application: ${providerId}</text>`,
    '<text x="72" y="290" font-family="Arial" font-size="18" fill="#6f6257">Demo document for manual admin verification.</text>',
    '<text x="72" y="330" font-family="Arial" font-size="18" fill="#6f6257">Not a real national ID.</text>',
    '</svg>',
  ].join('');

  return {
    providerId,
    fileName: `${providerId}-identity-demo.svg`,
    fileType: 'image/svg+xml',
    fileSize: svg.length,
    uploadedAt: baseDate,
    previewDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

function toFirestoreValue(value: JsonValue): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }
  return {
    mapValue: {
      fields: toFirestoreFields(value),
    },
  };
}

function toFirestoreFields(data: Record<string, JsonValue>) {
  return Object.fromEntries(
    Object.entries(data)
      .filter((entry): entry is [string, JsonValue] => entry[1] !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

async function writeDocument(write: SeedWrite, accessToken: string) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${write.collection}/${encodeURIComponent(write.id)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: toFirestoreFields(write.data) }),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Failed to write ${write.collection}/${write.id}`);
  }
}

async function main() {
  const accessToken = await getFirebaseCliAccessToken();
  const apiKey = await getProductionFirebaseApiKey();
  const authUser = await ensureAuthUser(apiKey, accessToken);
  await resetAuthPassword(authUser.localId, accessToken);

  for (const write of seedWrites(authUser.localId)) {
    await writeDocument(write, accessToken);
  }

  console.log(`Provider ready: ${providerEmail}`);
  console.log('Review count: 35');
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
