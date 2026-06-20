import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

const hasRequiredEmulators = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST,
);
const rulesDescribe = hasRequiredEmulators ? describe : describe.skip;
const projectId = 'hand-connect-cairo';
const bucket = 'hand-connect-cairo';
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199';

let testEnv: RulesTestEnvironment;

rulesDescribe('storage security rules: identity documents and provider photos', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
      storage: {
        rules: readFileSync('storage.rules', 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/admin'), userDoc('admin', 'admin'));
      await setDoc(doc(db, 'users/provider-a'), userDoc('provider-a', 'provider'));
      await setDoc(doc(db, 'users/provider-b'), userDoc('provider-b', 'provider'));
    });
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  it('keeps identity documents private to owner and admin', async () => {
    const path = 'identityDocuments/provider-a/new.txt';

    await expectStatus(uploadObject(path, 'new-private-id', tokenFor('provider-a')), 200);
    await expectStatus(getObject(path, tokenFor('provider-a')), 200);
    await expectStatus(getObject(path, tokenFor('admin')), 200);
    await expectStatus(getObject(path, tokenFor('provider-b')), 403);
    await expectStatus(getObject(path), 403);

    await expectStatus(uploadObject('identityDocuments/provider-a/other.txt', 'stolen-id', tokenFor('provider-b')), 403);
    await expectStatus(uploadObject('identityDocuments/provider-a/anon.txt', 'anon-id'), 403);
  });

  it('allows public provider photo reads but only owner photo writes', async () => {
    const path = 'providerPhotos/provider-a/new-photo.txt';

    await expectStatus(uploadObject(path, 'new-photo', tokenFor('provider-a')), 200);
    await expectStatus(getObject(path), 200);
    await expectStatus(getObject(path, tokenFor('provider-b')), 200);

    await expectStatus(uploadObject('providerPhotos/provider-a/bad-photo.txt', 'bad-photo', tokenFor('provider-b')), 403);
    await expectStatus(uploadObject('providerPhotos/provider-a/anon-photo.txt', 'anon-photo'), 403);
  });

  it('blocks unknown storage paths', async () => {
    await expectStatus(uploadObject('misc/provider-a/file.txt', 'misc', tokenFor('provider-a')), 403);
    await expectStatus(getObject('misc/provider-a/file.txt'), 403);
  });
});

function userDoc(uid: string, role: 'admin' | 'customer' | 'provider') {
  return {
    uid,
    role,
    email: `${uid}@example.test`,
    displayName: uid,
    phone: '+201****0000',
    language: 'ar',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function objectUrl(path: string) {
  return `http://${storageHost}/v0/b/${bucket}/o/${encodeURIComponent(path)}`;
}

async function uploadObject(path: string, value: string, token?: string) {
  return fetch(`${objectUrl(path)}?uploadType=media&name=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: requestHeaders(token),
    body: value,
  });
}

async function getObject(path: string, token?: string) {
  return fetch(objectUrl(path), {
    method: 'GET',
    headers: requestHeaders(token),
  });
}

function requestHeaders(token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'text/plain' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function expectStatus(responsePromise: Promise<Response>, status: number) {
  const response = await responsePromise;
  expect(response.status).toBe(status);
}

function tokenFor(uid: string) {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({
      iss: `https://securetoken.google.com/${projectId}`,
      aud: projectId,
      auth_time: now,
      user_id: uid,
      sub: uid,
      iat: now,
      exp: now + 3600,
      firebase: { sign_in_provider: 'custom' },
    }),
    '',
  ].join('.');
}

function base64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64url');
}
