import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const firebaseToolsAuth = require('firebase-tools/lib/auth');
const { requireAuth } = require('firebase-tools/lib/requireAuth');
const apiv2 = require('firebase-tools/lib/apiv2');

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'hand-connect-cairo';
const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@hand.test';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'password';
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME ?? 'مدير Herafy';
const adminPhone = process.env.ADMIN_PHONE ?? '+201511115555';
const adminLanguage = process.env.ADMIN_LANGUAGE ?? 'ar';
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
      body: JSON.stringify({ email: [adminEmail] }),
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
        email: adminEmail,
        password: adminPassword,
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();

  if (!response.ok && data.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(data.error?.message ?? 'Firebase Auth admin creation failed.');
  }

  const created = await lookupAuthUser(accessToken);
  if (!created) throw new Error('Firebase Auth admin user was not created.');
  return created;
}

async function writeAdminUserDocument(uid: string, accessToken: string) {
  const fields = {
    uid: { stringValue: uid },
    email: { stringValue: adminEmail },
    role: { stringValue: 'admin' },
    status: { stringValue: 'active' },
    banReason: { nullValue: null },
    bannedAt: { nullValue: null },
    bannedBy: { nullValue: null },
    displayName: { stringValue: adminDisplayName },
    phone: { stringValue: adminPhone },
    language: { stringValue: adminLanguage },
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
    throw new Error(data.error?.message ?? 'Firestore admin document write failed.');
  }
}

async function main() {
  const accessToken = await getFirebaseCliAccessToken();
  const apiKey = await getProductionFirebaseApiKey();
  const authUser = await ensureAuthUser(apiKey, accessToken);
  await writeAdminUserDocument(authUser.localId, accessToken);

  console.log(`Admin ready: ${adminEmail}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
