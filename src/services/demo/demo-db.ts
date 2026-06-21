import type { AdminAction, AbuseReport } from '@/types/admin';
import type { Contact } from '@/types/contact';
import type { Conversation, Message } from '@/types/messaging';
import type { Profession, ProviderIdentityDocument, ProviderProfile } from '@/types/provider';
import type { Review } from '@/types/review';
import type { AppUser } from '@/types/user';
import type { VisibilityRequest } from '@/types/visibility';
import { createDemoSeedData, demoSeedVersion } from './seed-data';

export interface DemoDb {
  users: AppUser[];
  professions: Profession[];
  providers: ProviderProfile[];
  identityDocuments: ProviderIdentityDocument[];
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  reviews: Review[];
  visibilityRequests: VisibilityRequest[];
  adminActions: AdminAction[];
  reports: AbuseReport[];
}

const dbKey = 'herafy-demo-db';
const sessionKey = 'herafy-session-id';
const seedVersionKey = 'herafy-demo-seed-version';
const memoryStorage = new Map<string, string>();

function storage() {
  return globalThis.localStorage ?? {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => memoryStorage.set(key, value),
    removeItem: (key: string) => memoryStorage.delete(key),
  };
}

export function createSeedDb(): DemoDb {
  return createDemoSeedData();
}

export function readDb(): DemoDb {
  const store = storage();
  const raw = store.getItem(dbKey);
  const currentSeedVersion = store.getItem(seedVersionKey);
  if (!raw || currentSeedVersion !== demoSeedVersion) {
    const db = createSeedDb();
    writeDb(db);
    store.setItem(seedVersionKey, demoSeedVersion);
    return db;
  }
  return JSON.parse(raw) as DemoDb;
}

export function writeDb(db: DemoDb) {
  storage().setItem(dbKey, JSON.stringify(db));
}

export function resetDemoDb() {
  const db = createSeedDb();
  writeDb(db);
  const store = storage();
  store.setItem(seedVersionKey, demoSeedVersion);
  store.removeItem(sessionKey);
  return db;
}

export function getSessionUserId() {
  return storage().getItem(sessionKey);
}

export function setSessionUserId(uid: string | null) {
  const store = storage();
  if (uid) store.setItem(sessionKey, uid);
  else store.removeItem(sessionKey);
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export function activeProfessions() {
  return readDb().professions.filter((profession) => profession.active).sort((a, b) => a.sortOrder - b.sortOrder);
}
