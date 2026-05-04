import type { AdminAction, AbuseReport } from '@/types/admin';
import type { Contact } from '@/types/contact';
import type { Conversation, Message } from '@/types/messaging';
import type { ProviderProfile } from '@/types/provider';
import type { Review } from '@/types/review';
import type { AppUser } from '@/types/user';
import type { VisibilityRequest } from '@/types/visibility';
import { activeSeedProfessions, createDemoSeedData, demoSeedVersion } from './seed-data';

export interface DemoDb {
  users: AppUser[];
  providers: ProviderProfile[];
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  reviews: Review[];
  visibilityRequests: VisibilityRequest[];
  adminActions: AdminAction[];
  reports: AbuseReport[];
}

const dbKey = 'hand-connect-demo-db';
const sessionKey = 'hand-connect-session-id';
const seedVersionKey = 'hand-connect-demo-seed-version';

export function createSeedDb(): DemoDb {
  return createDemoSeedData();
}

export function readDb(): DemoDb {
  const raw = localStorage.getItem(dbKey);
  const currentSeedVersion = localStorage.getItem(seedVersionKey);
  if (!raw || currentSeedVersion !== demoSeedVersion) {
    const db = createSeedDb();
    writeDb(db);
    localStorage.setItem(seedVersionKey, demoSeedVersion);
    return db;
  }
  return JSON.parse(raw) as DemoDb;
}

export function writeDb(db: DemoDb) {
  localStorage.setItem(dbKey, JSON.stringify(db));
}

export function resetDemoDb() {
  const db = createSeedDb();
  writeDb(db);
  localStorage.setItem(seedVersionKey, demoSeedVersion);
  localStorage.removeItem(sessionKey);
  return db;
}

export function getSessionUserId() {
  return localStorage.getItem(sessionKey);
}

export function setSessionUserId(uid: string | null) {
  if (uid) localStorage.setItem(sessionKey, uid);
  else localStorage.removeItem(sessionKey);
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export function activeProfessions() {
  return activeSeedProfessions();
}
