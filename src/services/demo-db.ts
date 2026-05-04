import { professions } from '@/config/professions';
import type { AdminAction, AbuseReport } from '@/types/admin';
import type { Contact } from '@/types/contact';
import type { Conversation, Message } from '@/types/messaging';
import type { ProviderProfile } from '@/types/provider';
import type { Review } from '@/types/review';
import type { AppUser } from '@/types/user';
import type { VisibilityRequest } from '@/types/visibility';
import { nowIso } from '@/lib/dates';

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

const seedUsers: AppUser[] = [
  {
    uid: 'customer-demo',
    email: 'customer@hand.test',
    role: 'customer',
    displayName: 'مريم حسن',
    phone: '+201001112222',
    language: 'ar',
    createdAt: nowIso(),
  },
  {
    uid: 'provider-demo',
    email: 'provider@hand.test',
    role: 'provider',
    displayName: 'أحمد السبّاك',
    phone: '+201011113333',
    language: 'ar',
    createdAt: nowIso(),
  },
  {
    uid: 'provider-pending',
    email: 'pending@hand.test',
    role: 'provider',
    displayName: 'سعيد الكهربائي',
    phone: '+201211114444',
    language: 'ar',
    createdAt: nowIso(),
  },
  {
    uid: 'admin-demo',
    email: 'admin@hand.test',
    role: 'admin',
    displayName: 'مدير Hand Connect',
    phone: '+201511115555',
    language: 'ar',
    createdAt: nowIso(),
  },
];

const seedProviders: ProviderProfile[] = [
  {
    id: 'provider-demo',
    userId: 'provider-demo',
    displayName: 'أحمد السبّاك',
    phone: '+201011113333',
    profession: 'plumbing',
    bio: 'خبرة ١٢ سنة في السباكة المنزلية، إصلاح التسريبات وتركيب الخلاطات والسخانات.',
    nationalIdVerified: true,
    status: 'approved',
    serviceAreas: [
      { neighborhood: 'new-cairo', city: 'cairo' },
      { neighborhood: 'nasr-city', city: 'cairo' },
    ],
    serviceAreaKeys: ['new-cairo', 'nasr-city'],
    whatsappNumber: '+201011113333',
    whatsappVisible: true,
    visibilityTier: 'paid',
    visibilityPaidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    profileViews: 18,
    avgRating: 4.8,
    reviewCount: 12,
    activityScore: 94,
    photos: [
      {
        id: 'p1',
        url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80',
        alt: 'Plumbing work sample',
      },
    ],
    createdAt: nowIso(),
    approvedAt: nowIso(),
  },
  {
    id: 'provider-electric',
    userId: 'provider-electric',
    displayName: 'كريم الكهربائي',
    phone: '+201211117777',
    profession: 'electrical',
    bio: 'أعمال كهرباء منزلية، لوحات توزيع، صيانة أعطال، وتركيب إضاءة.',
    nationalIdVerified: true,
    status: 'approved',
    serviceAreas: [{ neighborhood: 'maadi', city: 'cairo' }],
    serviceAreaKeys: ['maadi'],
    whatsappNumber: '+201211117777',
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
    profileViews: 8,
    avgRating: 4.6,
    reviewCount: 7,
    activityScore: 82,
    photos: [],
    createdAt: nowIso(),
    approvedAt: nowIso(),
  },
  {
    id: 'provider-pending',
    userId: 'provider-pending',
    displayName: 'سعيد الكهربائي',
    phone: '+201211114444',
    profession: 'electrical',
    bio: 'طلب جديد قيد مراجعة الهوية.',
    nationalIdVerified: false,
    status: 'pending',
    serviceAreas: [{ neighborhood: 'heliopolis', city: 'cairo' }],
    serviceAreaKeys: ['heliopolis'],
    whatsappNumber: '+201211114444',
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
  },
];

const seedReviews: Review[] = [
  {
    id: 'review-1',
    providerId: 'provider-demo',
    customerId: 'customer-demo',
    customerName: 'مريم حسن',
    contactId: 'contact-seed',
    rating: 5,
    comment: 'وصل بسرعة وكان واضح في السعر قبل بدء الشغل.',
    status: 'visible',
    createdAt: nowIso(),
  },
];

export function createSeedDb(): DemoDb {
  return {
    users: [...seedUsers],
    providers: [...seedProviders],
    contacts: [
      {
        id: 'contact-seed',
        customerId: 'customer-demo',
        providerId: 'provider-demo',
        type: 'platform_message',
        createdAt: nowIso(),
        hasReview: true,
      },
    ],
    conversations: [],
    messages: [],
    reviews: [...seedReviews],
    visibilityRequests: [],
    adminActions: [],
    reports: [],
  };
}

export function readDb(): DemoDb {
  const raw = localStorage.getItem(dbKey);
  if (!raw) {
    const db = createSeedDb();
    writeDb(db);
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
  return professions.filter((profession) => profession.active).sort((a, b) => a.sortOrder - b.sortOrder);
}
