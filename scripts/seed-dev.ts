import { createRequire } from 'node:module';
import { createDemoSeedData, demoSeedVersion } from '../src/services/demo/seed-data';

const require = createRequire(import.meta.url);
const firebaseToolsAuth = require('firebase-tools/lib/auth');
const { requireAuth } = require('firebase-tools/lib/requireAuth');
const apiv2 = require('firebase-tools/lib/apiv2');

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'hand-connect-cairo';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface SeedWrite {
  collection: string;
  id: string;
  data: Record<string, JsonValue>;
  overwrite?: boolean;
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

async function documentExists(write: SeedWrite, accessToken: string) {
  const response = await fetch(documentUrl(write), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message ?? `Failed to read ${write.collection}/${write.id}`);
  }
  return true;
}

function documentUrl(write: Pick<SeedWrite, 'collection' | 'id'>) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${write.collection}/${encodeURIComponent(write.id)}`;
}

async function writeDocument(write: SeedWrite, accessToken: string) {
  if (!write.overwrite && (await documentExists(write, accessToken))) {
    return 'skipped';
  }

  const response = await fetch(documentUrl(write), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: toFirestoreFields(write.data) }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Failed to write ${write.collection}/${write.id}`);
  }

  return 'written';
}

function seedWrites(): SeedWrite[] {
  const seed = createDemoSeedData();
  return [
    ...seed.users.map((user) => ({
      collection: 'users',
      id: user.uid,
      data: user as unknown as Record<string, JsonValue>,
      overwrite: false,
    })),
    ...seed.professions.map((profession) => ({
      collection: 'professions',
      id: profession.id,
      data: profession as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.providers.map((provider) => ({
      collection: 'providers',
      id: provider.id,
      data: provider as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.identityDocuments.map((document) => ({
      collection: 'providerIdentityDocuments',
      id: document.providerId,
      data: document as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.contacts.map((contact) => ({
      collection: 'contacts',
      id: contact.id,
      data: contact as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.conversations.map((conversation) => ({
      collection: 'conversations',
      id: conversation.id,
      data: conversation as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.messages.map((message) => ({
      collection: 'messages',
      id: message.id,
      data: message as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.reviews.map((review) => ({
      collection: 'reviews',
      id: review.id,
      data: review as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.visibilityRequests.map((request) => ({
      collection: 'visibilityRequests',
      id: request.id,
      data: request as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.adminActions.map((action) => ({
      collection: 'adminActions',
      id: action.id,
      data: action as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
    ...seed.reports.map((report) => ({
      collection: 'reports',
      id: report.id,
      data: report as unknown as Record<string, JsonValue>,
      overwrite: true,
    })),
  ];
}

async function main() {
  const accessToken = await getFirebaseCliAccessToken();
  const summary = new Map<string, { written: number; skipped: number }>();

  for (const write of seedWrites()) {
    const result = await writeDocument(write, accessToken);
    const current = summary.get(write.collection) ?? { written: 0, skipped: 0 };
    current[result] += 1;
    summary.set(write.collection, current);
  }

  console.log(`Herafy demo seed ${demoSeedVersion}`);
  for (const [collection, result] of summary) {
    console.log(`${collection}: ${result.written} written, ${result.skipped} skipped`);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
