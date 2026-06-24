import type { AppUser, UserRole } from '@/types/user';
import type { ProviderIdentityDocument, ProviderProfile } from '@/types/provider';
import { createId, getSessionUserId, readDb, setSessionUserId, writeDb } from './demo-db';
import { demoSeedCredentials } from './seed-data';
import { nowIso } from '@/lib/dates';
import { normalizeEgyptPhone } from '@/lib/phone';
import { computeCoverageAreaKeys, getPlatformCoverageRadiusKm } from '@/lib/provider-coverage';

export interface RegisterCustomerInput {
  displayName: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterProviderInput extends RegisterCustomerInput {
  profession: string;
  serviceArea: string;
  whatsappNumber: string;
  identityDocument: Omit<ProviderIdentityDocument, 'providerId'>;
}

export async function getCurrentSession() {
  const uid = getSessionUserId();
  if (!uid) return { user: null, providerStatus: undefined };
  const db = readDb();
  const user = db.users.find((item) => item.uid === uid) ?? null;
  if (user?.status === 'banned') {
    setSessionUserId(null);
    return { user: null, providerStatus: undefined };
  }
  const provider = db.providers.find((item) => item.userId === uid);
  return { user, providerStatus: provider?.status };
}

export function subscribeToSession(onSession: (session: Awaited<ReturnType<typeof getCurrentSession>>) => void) {
  void getCurrentSession().then(onSession);
  return () => undefined;
}

export async function login(identifier: string, password: string) {
  if (!password) throw new Error('error.auth.passwordRequired');
  const db = readDb();
  const normalizedIdentifier = normalizeEgyptPhone(identifier);
  const user = db.users.find((item) =>
    item.email.toLowerCase() === identifier.toLowerCase() ||
    normalizeEgyptPhone(item.phone) === normalizedIdentifier,
  );
  if (!user) throw new Error('error.auth.invalidCredentials');
  const seededPassword = demoSeedCredentials[user.email.toLowerCase()];
  if (seededPassword && seededPassword !== password) {
    throw new Error('error.auth.invalidCredentials');
  }
  if (user.status === 'banned') throw new Error('error.auth.accountBanned');
  setSessionUserId(user.uid);
  return getCurrentSession();
}

export async function loginWithGoogle() {
  const db = readDb();
  const existing = db.users.find((item) => item.email === 'google.customer@hand.test');
  if (existing) {
    setSessionUserId(existing.uid);
    return getCurrentSession();
  }
  await createUser(
    {
      displayName: 'Google Customer',
      email: 'google.customer@hand.test',
      password: 'oauth',
      phone: '',
    },
    'customer',
  );
  return getCurrentSession();
}

export async function logout() {
  setSessionUserId(null);
}

export async function registerCustomer(input: RegisterCustomerInput) {
  await createUser(input, 'customer');
  return getCurrentSession();
}

export async function registerProvider(input: RegisterProviderInput) {
  const user = await createUser(input, 'provider');
  const db = readDb();
  const coverageRadiusKm = getPlatformCoverageRadiusKm({
    city: 'cairo',
    profession: input.profession,
    serviceAreaKey: input.serviceArea,
  });
  const provider: ProviderProfile = {
    id: user.uid,
    userId: user.uid,
    displayName: input.displayName,
    phone: input.phone,
    profession: input.profession,
    bio: '',
    nationalIdVerified: false,
    status: 'pending',
    serviceAreas: [{ neighborhood: input.serviceArea, city: 'cairo' }],
    serviceAreaKeys: [input.serviceArea],
    initialServiceAreaKey: input.serviceArea,
    coverageRadiusKm,
    coverageAreaKeys: computeCoverageAreaKeys([input.serviceArea], coverageRadiusKm),
    whatsappNumber: input.whatsappNumber,
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
    paidVisibilityStartedAt: null,
    activeVisibilityRequestId: null,
    activeVisibilityProductId: null,
    activeVisibilityProductVersion: null,
    paidVisibilityHoldUntil: null,
    rankingPenalty: 0,
    rankingPenaltyUntil: null,
    verificationStatus: 'submitted',
    verificationReviewedAt: null,
    verificationReviewedBy: null,
    verificationNotes: null,
    profileViews: 0,
    avgRating: 0,
    reviewCount: 0,
    activityScore: 0,
    photos: [],
    createdAt: nowIso(),
    approvedAt: null,
  };
  db.providers.push(provider);
  db.identityDocuments.push({ ...input.identityDocument, providerId: provider.id });
  writeDb(db);
  return getCurrentSession();
}

async function createUser(input: RegisterCustomerInput, role: UserRole): Promise<AppUser> {
  const db = readDb();
  if (db.users.some((item) => item.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error('error.auth.emailExists');
  }
  const user: AppUser = {
    uid: createId(role),
    email: input.email,
    role,
    status: 'active',
    banReason: null,
    bannedAt: null,
    bannedBy: null,
    displayName: input.displayName,
    phone: input.phone,
    language: 'ar',
    createdAt: nowIso(),
  };
  db.users.push(user);
  writeDb(db);
  setSessionUserId(user.uid);
  return user;
}
