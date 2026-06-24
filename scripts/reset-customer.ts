import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const firebaseToolsAuth = require('firebase-tools/lib/auth');
const { requireAuth } = require('firebase-tools/lib/requireAuth');
const apiv2 = require('firebase-tools/lib/apiv2');

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'hand-connect-cairo';
const customerEmail = process.env.CUSTOMER_EMAIL ?? 'customer@hand.test';
const customerPassword = process.env.CUSTOMER_PASSWORD ?? 'pass1234';
const customerDisplayName = process.env.CUSTOMER_DISPLAY_NAME ?? 'مريم حسن';
const customerPhone = process.env.CUSTOMER_PHONE ?? '+201001112222';
const customerLanguage = process.env.CUSTOMER_LANGUAGE ?? 'ar';
const productionUrl = process.env.PRODUCTION_URL ?? 'https://h3rafy.com';

interface IdentityToolkitUser {
  localId: string;
  email?: string;
  disabled?: boolean;
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

  throw new Error(
    'Could not find VITE_FIREBASE_API_KEY. Set it in the environment and retry.',
  );
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
      body: JSON.stringify({ email: [customerEmail] }),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Firebase Auth lookup failed.');
  }

  return (data.users?.[0] ?? null) as IdentityToolkitUser | null;
}

async function createAuthUser(apiKey: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        password: customerPassword,
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();

  if (!response.ok && data.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(data.error?.message ?? 'Firebase Auth customer creation failed.');
  }
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
      password: customerPassword,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Firebase Auth password reset failed.');
  }
}

async function writeCustomerUserDocument(uid: string, accessToken: string) {
  const fields = {
    uid: { stringValue: uid },
    email: { stringValue: customerEmail },
    role: { stringValue: 'customer' },
    status: { stringValue: 'active' },
    banReason: { nullValue: null },
    bannedAt: { nullValue: null },
    bannedBy: { nullValue: null },
    displayName: { stringValue: customerDisplayName },
    phone: { stringValue: customerPhone },
    language: { stringValue: customerLanguage },
    createdAt: { timestampValue: new Date().toISOString() },
  };

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Firestore customer document write failed.');
  }
}

async function main() {
  const accessToken = await getFirebaseCliAccessToken();
  const apiKey = await getProductionFirebaseApiKey();
  let authUser = await lookupAuthUser(accessToken);

  if (!authUser) {
    await createAuthUser(apiKey);
    authUser = await lookupAuthUser(accessToken);
  }
  if (!authUser) throw new Error('Firebase Auth customer user was not created.');

  await resetAuthPassword(authUser.localId, accessToken);
  await writeCustomerUserDocument(authUser.localId, accessToken);

  console.log(`Customer ready: ${customerEmail}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
