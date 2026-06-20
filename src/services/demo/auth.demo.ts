import type { AppUser, UserRole } from '@/types/user';
import type { ProviderIdentityDocument, ProviderProfile } from '@/types/provider';
import { createId, getSessionUserId, readDb, setSessionUserId, writeDb } from './demo-db';
import { nowIso } from '@/lib/dates';

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
  const provider = db.providers.find((item) => item.userId === uid);
  return { user, providerStatus: provider?.status };
}

export function subscribeToSession(onSession: (session: Awaited<ReturnType<typeof getCurrentSession>>) => void) {
  void getCurrentSession().then(onSession);
  return () => undefined;
}

export async function login(email: string, password: string) {
  if (!password) throw new Error('error.auth.passwordRequired');
  const db = readDb();
  const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('error.auth.invalidCredentials');
  setSessionUserId(user.uid);
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
    whatsappNumber: input.whatsappNumber,
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
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
