import { professions } from '../config/professions';
import type { AdminAction, AbuseReport } from '../types/admin';
import type { Contact } from '../types/contact';
import type { Conversation, Message } from '../types/messaging';
import type { ProviderProfile } from '../types/provider';
import type { Review } from '../types/review';
import type { AppUser } from '../types/user';
import type { VisibilityRequest } from '../types/visibility';

export const demoSeedVersion = '2026-05-04-cairo-realistic-seed-v2';

const baseDate = '2026-05-04T08:00:00.000Z';
const paidUntil = '2026-06-03T08:00:00.000Z';

export interface DemoSeedData {
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

export function createDemoSeedData(): DemoSeedData {
  const users: AppUser[] = [
    user('customer-demo', 'customer@hand.test', 'customer', 'مريم حسن', '+201001112222'),
    user('customer-nour', 'nour.elsayed@hand.test', 'customer', 'نور السيد', '+201001118888'),
    user('customer-omar', 'omar.mahmoud@hand.test', 'customer', 'عمر محمود', '+201201119999'),
    user('provider-demo', 'provider@hand.test', 'provider', 'أحمد السبّاك', '+201011113333'),
    user('provider-electric', 'karim.electric@hand.test', 'provider', 'كريم الكهربائي', '+201211117777'),
    user('provider-carpenter', 'hassan.carpentry@hand.test', 'provider', 'حسن النجار', '+201011116666'),
    user('provider-cleaning', 'sara.cleaning@hand.test', 'provider', 'سارة للتنظيف', '+201511112345'),
    user('provider-maadi-plumbing', 'mahmoud.plumbing@hand.test', 'provider', 'محمود صيانة', '+201001114321'),
    user('provider-heliopolis-electric', 'mina.electric@hand.test', 'provider', 'مينا كهرباء', '+201221114444'),
    user('provider-nasr-cleaning', 'hala.cleaning@hand.test', 'provider', 'هالة كلين', '+201551112222'),
    user('provider-pending', 'pending@hand.test', 'provider', 'سعيد الكهربائي', '+201211114444'),
    user('provider-suspended', 'suspended@hand.test', 'provider', 'ورشة تحت المراجعة', '+201001110000'),
    user('admin-demo', 'admin@hand.test', 'admin', 'مدير Hand Connect', '+201511115555'),
  ];

  const providers: ProviderProfile[] = [
    provider({
      id: 'provider-demo',
      displayName: 'أحمد السبّاك',
      phone: '+201011113333',
      profession: 'plumbing',
      bio: 'سباك من القاهرة الجديدة متخصص في تسريب المياه، تركيب الخلاطات، صيانة السخانات، وتأسيس الحمامات الصغيرة. معروف بسرعة الرد وشرح التكلفة قبل بدء الشغل.',
      areas: ['new-cairo', 'nasr-city'],
      whatsappNumber: '+201011113333',
      tier: 'paid',
      views: 146,
      rating: 4.8,
      reviews: 24,
      activity: 94,
      photo: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-electric',
      displayName: 'كريم الكهربائي',
      phone: '+201211117777',
      profession: 'electrical',
      bio: 'كهربائي من المعادي لأعطال الشقق، لوحات التوزيع، مفاتيح الكهرباء، وتركيب الإضاءة. يفضل المعاينة السريعة قبل الاتفاق النهائي.',
      areas: ['maadi', 'dokki'],
      whatsappNumber: '+201211117777',
      tier: 'organic',
      views: 83,
      rating: 4.6,
      reviews: 17,
      activity: 82,
      photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-carpenter',
      displayName: 'حسن النجار',
      phone: '+201011116666',
      profession: 'carpentry',
      bio: 'نجار موبيليا وأبواب في مدينة نصر ومصر الجديدة. إصلاح مفصلات، تركيب رفوف، ضبط أبواب، وتجميع أثاث جاهز.',
      areas: ['nasr-city', 'heliopolis'],
      whatsappNumber: '+201011116666',
      tier: 'organic',
      views: 61,
      rating: 4.7,
      reviews: 11,
      activity: 76,
      photo: 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-cleaning',
      displayName: 'سارة للتنظيف',
      phone: '+201511112345',
      profession: 'cleaning',
      bio: 'فريق تنظيف شقق بعد التشطيب وتنظيف عميق للمطابخ والحمامات في التجمع والزمالك. الحجز يتم مباشرة مع الفريق عبر واتساب.',
      areas: ['new-cairo', 'zamalek'],
      whatsappNumber: '+201511112345',
      tier: 'paid',
      views: 118,
      rating: 4.9,
      reviews: 19,
      activity: 91,
      photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-maadi-plumbing',
      displayName: 'محمود صيانة',
      phone: '+201001114321',
      profession: 'plumbing',
      bio: 'صيانة سباكة في المعادي والدقي: تسليك صرف، تغيير محابس، كشف تسريب ظاهر، وتركيب فلاتر مياه منزلية.',
      areas: ['maadi', 'dokki'],
      whatsappNumber: '+201001114321',
      tier: 'organic',
      views: 44,
      rating: 4.4,
      reviews: 8,
      activity: 69,
      photo: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-heliopolis-electric',
      displayName: 'مينا كهرباء',
      phone: '+201221114444',
      profession: 'electrical',
      bio: 'كهربائي مصر الجديدة والشروق. أعطال مفاجئة، مفاتيح وبرايز، تركيب نجف، ومراجعة أحمال الأجهزة الكبيرة.',
      areas: ['heliopolis', 'shorouk'],
      whatsappNumber: '+201221114444',
      tier: 'paid',
      views: 92,
      rating: 4.5,
      reviews: 13,
      activity: 88,
      photo: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-nasr-cleaning',
      displayName: 'هالة كلين',
      phone: '+201551112222',
      profession: 'cleaning',
      bio: 'تنظيف أسبوعي وتنظيف قبل الانتقال في مدينة نصر ومصر الجديدة. تسعير مباشر حسب المساحة وعدد الغرف.',
      areas: ['nasr-city', 'heliopolis'],
      whatsappNumber: '+201551112222',
      tier: 'organic',
      views: 37,
      rating: 4.3,
      reviews: 6,
      activity: 73,
      photo: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-pending',
      displayName: 'سعيد الكهربائي',
      phone: '+201211114444',
      profession: 'electrical',
      bio: 'طلب جديد قيد مراجعة الهوية اليدوية. لا يظهر في البحث العام قبل موافقة الإدارة.',
      areas: ['heliopolis'],
      whatsappNumber: '+201211114444',
      status: 'pending',
      verified: false,
      tier: 'organic',
      views: 0,
      rating: 0,
      reviews: 0,
      activity: 0,
    }),
    provider({
      id: 'provider-suspended',
      displayName: 'ورشة تحت المراجعة',
      phone: '+201001110000',
      profession: 'carpentry',
      bio: 'حساب موقوف مؤقتاً بسبب بلاغ إداري. لا يظهر في البحث العام.',
      areas: ['mohandessin'],
      whatsappNumber: '+201001110000',
      status: 'suspended',
      tier: 'organic',
      views: 12,
      rating: 3.1,
      reviews: 3,
      activity: 12,
    }),
  ];

  const contacts: Contact[] = [
    contact('contact-seed', 'customer-demo', 'provider-demo', 'platform_message', true),
    contact('contact-nour-cleaning', 'customer-nour', 'provider-cleaning', 'whatsapp_reveal', false),
    contact('contact-omar-electric', 'customer-omar', 'provider-electric', 'platform_message', true),
    contact('contact-nour-carpenter', 'customer-nour', 'provider-carpenter', 'platform_message', true),
  ];

  const conversations: Conversation[] = [
    conversation('customer-demo_provider-demo', 'customer-demo', 'provider-demo', 'وصل بسرعة وكان واضح في السعر قبل بدء الشغل.', {
      'customer-demo': 0,
      'provider-demo': 0,
    }),
    conversation('customer-omar_provider-electric', 'customer-omar', 'provider-electric', 'تمام، أقدر أعدي بكرة بعد العصر.', {
      'customer-omar': 0,
      'provider-electric': 1,
    }),
  ];

  const messages: Message[] = [
    message('message-1', 'customer-demo_provider-demo', 'customer-demo', 'عندي تسريب تحت الحوض في التجمع وعايز معاينة قريبة.'),
    message('message-2', 'customer-demo_provider-demo', 'provider-demo', 'وعليكم السلام، ابعت صورة للحوض والمكان وأنا أقولك التقدير المبدئي.'),
    message('message-3', 'customer-demo_provider-demo', 'customer-demo', 'وصل بسرعة وكان واضح في السعر قبل بدء الشغل.'),
    message('message-4', 'customer-omar_provider-electric', 'customer-omar', 'محتاج تركيب نجفة ومراجعة مفتاحين في المعادي.'),
    message('message-5', 'customer-omar_provider-electric', 'provider-electric', 'تمام، أقدر أعدي بكرة بعد العصر.'),
  ];

  const reviews: Review[] = [
    review('review-1', 'provider-demo', 'customer-demo', 'مريم حسن', 'contact-seed', 5, 'وصل بسرعة وكان واضح في السعر قبل بدء الشغل.'),
    review('review-2', 'provider-electric', 'customer-omar', 'عمر محمود', 'contact-omar-electric', 4, 'حل العطل في نفس اليوم، وكان محتاج متابعة بسيطة بعدها.'),
    review('review-3', 'provider-carpenter', 'customer-nour', 'نور السيد', 'contact-nour-carpenter', 5, 'ضبط أبواب المطبخ وركب الرفوف بشكل نظيف.'),
    review('review-4', 'provider-cleaning', 'customer-nour', 'نور السيد', 'contact-nour-cleaning', 5, 'الفريق كان ملتزم بالميعاد والتنظيف العميق ممتاز.'),
  ];

  const visibilityRequests: VisibilityRequest[] = [
    {
      id: 'visibility-cleaning-new-cairo',
      providerId: 'provider-cleaning',
      tier: 'paid',
      serviceArea: 'new-cairo',
      status: 'approved',
      paymentConfirmedBy: 'admin-demo',
      paymentMethod: 'manual_cash',
      notes: 'Manual cash payment confirmed for featured New Cairo exposure.',
      requestedAt: '2026-05-01T11:00:00.000Z',
      processedAt: '2026-05-01T16:30:00.000Z',
    },
    {
      id: 'visibility-carpenter-heliopolis',
      providerId: 'provider-carpenter',
      tier: 'paid',
      serviceArea: 'heliopolis',
      status: 'pending',
      paymentConfirmedBy: null,
      paymentMethod: 'manual_wallet',
      notes: 'Provider says wallet transfer will be sent today.',
      requestedAt: '2026-05-04T07:20:00.000Z',
      processedAt: null,
    },
  ];

  const adminActions: AdminAction[] = [
    adminAction('admin-action-1', 'provider', 'provider-demo', 'approve_provider', 'Identity reviewed manually.'),
    adminAction('admin-action-2', 'visibilityRequest', 'visibility-cleaning-new-cairo', 'approve_visibility', 'Manual payment confirmed.'),
    adminAction('admin-action-3', 'provider', 'provider-suspended', 'suspend_provider', 'Repeated report pending manual review.'),
  ];

  const reports: AbuseReport[] = [
    {
      id: 'report-1',
      targetType: 'provider',
      targetId: 'provider-suspended',
      reporterId: 'customer-omar',
      reason: 'Customer reported repeated rescheduling after contact.',
      status: 'open',
      createdAt: '2026-05-03T18:00:00.000Z',
    },
  ];

  return {
    users,
    providers,
    contacts,
    conversations,
    messages,
    reviews,
    visibilityRequests,
    adminActions,
    reports,
  };
}

export function activeSeedProfessions() {
  return professions.filter((profession) => profession.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

function user(uid: string, email: string, role: AppUser['role'], displayName: string, phone: string): AppUser {
  return { uid, email, role, displayName, phone, language: 'ar', createdAt: baseDate };
}

function provider(input: {
  id: string;
  displayName: string;
  phone: string;
  profession: string;
  bio: string;
  areas: string[];
  whatsappNumber: string;
  status?: ProviderProfile['status'];
  verified?: boolean;
  tier: ProviderProfile['visibilityTier'];
  views: number;
  rating: number;
  reviews: number;
  activity: number;
  photo?: string;
}): ProviderProfile {
  return {
    id: input.id,
    userId: input.id,
    displayName: input.displayName,
    phone: input.phone,
    profession: input.profession,
    bio: input.bio,
    nationalIdVerified: input.verified ?? true,
    status: input.status ?? 'approved',
    serviceAreas: input.areas.map((neighborhood) => ({ neighborhood, city: 'cairo' })),
    serviceAreaKeys: input.areas,
    whatsappNumber: input.whatsappNumber,
    whatsappVisible: true,
    visibilityTier: input.tier,
    visibilityPaidUntil: input.tier === 'paid' ? paidUntil : null,
    profileViews: input.views,
    avgRating: input.rating,
    reviewCount: input.reviews,
    activityScore: input.activity,
    photos: input.photo ? [{ id: `${input.id}-photo-1`, url: input.photo, alt: `${input.displayName} work sample` }] : [],
    createdAt: baseDate,
    approvedAt: input.status && input.status !== 'approved' ? null : baseDate,
  };
}

function contact(id: string, customerId: string, providerId: string, type: Contact['type'], hasReview: boolean): Contact {
  return { id, customerId, providerId, type, createdAt: baseDate, hasReview };
}

function conversation(
  id: string,
  customerId: string,
  providerId: string,
  lastMessage: string,
  unreadCount: Record<string, number>,
): Conversation {
  return {
    id,
    participants: [customerId, providerId],
    customerId,
    providerId,
    lastMessage,
    lastMessageAt: baseDate,
    unreadCount,
  };
}

function message(id: string, conversationId: string, senderId: string, text: string): Message {
  return { id, conversationId, senderId, text, createdAt: baseDate, read: true };
}

function review(
  id: string,
  providerId: string,
  customerId: string,
  customerName: string,
  contactId: string,
  rating: Review['rating'],
  comment: string,
): Review {
  return { id, providerId, customerId, customerName, contactId, rating, comment, status: 'visible', createdAt: baseDate };
}

function adminAction(
  id: string,
  targetType: AdminAction['targetType'],
  targetId: string,
  action: string,
  reason: string,
): AdminAction {
  return { id, adminId: 'admin-demo', targetType, targetId, action, reason, createdAt: baseDate };
}
