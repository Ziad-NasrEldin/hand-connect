import { professions } from '../../config/professions';
import type { AdminAction, AbuseReport } from '../../types/admin';
import type { Contact } from '../../types/contact';
import type { Conversation, Message } from '../../types/messaging';
import type { Profession, ProviderIdentityDocument, ProviderProfile } from '../../types/provider';
import type { Review } from '../../types/review';
import type { AppUser } from '../../types/user';
import type { VisibilityRequest } from '../../types/visibility';

export const demoSeedVersion = '2026-05-09-cairo-dense-demo-seed-v7';

const baseDate = '2026-05-04T08:00:00.000Z';
const paidUntil = '2026-06-03T08:00:00.000Z';

export interface DemoSeedData {
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

export function createDemoSeedData(): DemoSeedData {
  const users: AppUser[] = [
    user('customer-demo', 'customer@hand.test', 'customer', 'مريم حسن', '+201001112222'),
    user('customer-nour', 'nour.elsayed@hand.test', 'customer', 'نور السيد', '+201001118888'),
    user('customer-omar', 'omar.mahmoud@hand.test', 'customer', 'عمر محمود', '+201201119999'),
    user('customer-salma', 'salma.ali@hand.test', 'customer', 'سلمى علي', '+201001117070'),
    user('customer-youssef', 'youssef.adel@hand.test', 'customer', 'يوسف عادل', '+201221117171'),
    user('provider-demo', 'provider@hand.test', 'provider', 'أحمد السبّاك', '+201011113333'),
    user('provider-plumbing-fifth', 'tarek.plumbing@hand.test', 'provider', 'طارق سباكة', '+201001113030'),
    user('provider-plumbing-settlement', 'mostafa.plumbing@hand.test', 'provider', 'مصطفى للتسليك', '+201001114040'),
    user('provider-plumbing-nasr', 'ali.plumbing@hand.test', 'provider', 'علي صيانة مياه', '+201001115050'),
    user('provider-electric-new-cairo', 'ramy.electric@hand.test', 'provider', 'رامي كهرباء', '+201211115151'),
    user('provider-carpenter-new-cairo', 'magdy.carpentry@hand.test', 'provider', 'مجدي نجارة', '+201011116161'),
    user('provider-cleaning-maadi', 'dina.cleaning@hand.test', 'provider', 'دينا كلين', '+201551116262'),
    user('provider-electric', 'karim.electric@hand.test', 'provider', 'كريم الكهربائي', '+201211117777'),
    user('provider-carpenter', 'hassan.carpentry@hand.test', 'provider', 'حسن النجار', '+201011116666'),
    user('provider-cleaning', 'sara.cleaning@hand.test', 'provider', 'سارة للتنظيف', '+201511112345'),
    user('provider-maadi-plumbing', 'mahmoud.plumbing@hand.test', 'provider', 'محمود صيانة', '+201001114321'),
    user('provider-heliopolis-electric', 'mina.electric@hand.test', 'provider', 'مينا كهرباء', '+201221114444'),
    user('provider-nasr-cleaning', 'hala.cleaning@hand.test', 'provider', 'هالة كلين', '+201551112222'),
    user('provider-pending', 'pending@hand.test', 'provider', 'سعيد الكهربائي', '+201211114444'),
    user('provider-suspended', 'suspended@hand.test', 'provider', 'ورشة تحت المراجعة', '+201001110000'),
    user('provider-rejected', 'rejected@hand.test', 'provider', 'طلب مرفوض', '+201001112020'),
    user('admin-demo', 'admin@hand.test', 'admin', 'مدير Herafy', '+201511115555'),
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
      id: 'provider-plumbing-fifth',
      displayName: 'طارق سباكة',
      phone: '+201001113030',
      profession: 'plumbing',
      bio: 'سباك في التجمع الخامس والرحاب لصيانة التسريبات، تغيير الخلاطات، تركيب سخانات وفلاتر، ومعاينات سريعة للشقق الجديدة.',
      areas: ['new-cairo', 'shorouk'],
      whatsappNumber: '+201001113030',
      tier: 'organic',
      views: 38,
      rating: 4.6,
      reviews: 14,
      activity: 86,
      photo: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-plumbing-settlement',
      displayName: 'مصطفى للتسليك',
      phone: '+201001114040',
      profession: 'plumbing',
      bio: 'متخصص تسليك صرف وصيانة مطابخ وحمامات في القاهرة الجديدة ومدينة نصر. يوضح التكلفة قبل الزيارة قدر الإمكان.',
      areas: ['new-cairo', 'nasr-city'],
      whatsappNumber: '+201001114040',
      tier: 'organic',
      views: 22,
      rating: 4.5,
      reviews: 9,
      activity: 79,
      photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-plumbing-nasr',
      displayName: 'علي صيانة مياه',
      phone: '+201001115050',
      profession: 'plumbing',
      bio: 'فني سباكة يغطي مدينة نصر والقاهرة الجديدة لأعمال المحابس، كشف التسريب الظاهر، وتركيب أطقم الحمام.',
      areas: ['nasr-city', 'new-cairo'],
      whatsappNumber: '+201001115050',
      tier: 'paid',
      views: 57,
      rating: 4.7,
      reviews: 16,
      activity: 89,
      photo: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-electric-new-cairo',
      displayName: 'رامي كهرباء',
      phone: '+201211115151',
      profession: 'electrical',
      bio: 'كهربائي في التجمع والرحاب لتركيب الإضاءة، صيانة القواطع، مراجعة الأحمال، وأعطال الشقق الطارئة.',
      areas: ['new-cairo', 'shorouk'],
      whatsappNumber: '+201211115151',
      tier: 'organic',
      views: 41,
      rating: 4.6,
      reviews: 12,
      activity: 83,
      photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-carpenter-new-cairo',
      displayName: 'مجدي نجارة',
      phone: '+201011116161',
      profession: 'carpentry',
      bio: 'نجار في القاهرة الجديدة لتركيب رفوف، إصلاح أبواب، ضبط مفصلات، وتجميع أثاث جاهز في نفس اليوم عند الإمكان.',
      areas: ['new-cairo', 'nasr-city'],
      whatsappNumber: '+201011116161',
      tier: 'organic',
      views: 34,
      rating: 4.4,
      reviews: 7,
      activity: 74,
      photo: 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-cleaning-maadi',
      displayName: 'دينا كلين',
      phone: '+201551116262',
      profession: 'cleaning',
      bio: 'تنظيف عميق وتنظيف قبل الانتقال في المعادي والدقي، مع فرق صغيرة للحجوزات السريعة وتنظيف المطابخ والحمامات.',
      areas: ['maadi', 'dokki', 'new-cairo'],
      whatsappNumber: '+201551116262',
      tier: 'organic',
      views: 29,
      rating: 4.5,
      reviews: 10,
      activity: 78,
      photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
    }),
    provider({
      id: 'provider-electric',
      displayName: 'كريم الكهربائي',
      phone: '+201211117777',
      profession: 'electrical',
      bio: 'كهربائي من المعادي لأعطال الشقق، لوحات التوزيع، مفاتيح الكهرباء، وتركيب الإضاءة. يفضل المعاينة السريعة قبل الاتفاق النهائي.',
      areas: ['maadi', 'dokki', 'new-cairo'],
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
      areas: ['nasr-city', 'heliopolis', 'new-cairo'],
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
      areas: ['heliopolis', 'shorouk', 'new-cairo'],
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
      areas: ['nasr-city', 'heliopolis', 'new-cairo'],
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
    provider({
      id: 'provider-rejected',
      displayName: 'طلب مرفوض',
      phone: '+201001112020',
      profession: 'cleaning',
      bio: 'طلب مقدم ببيانات ناقصة وتم رفضه حتى يعيد صاحب الحساب رفع مستند هوية أوضح.',
      areas: ['dokki'],
      whatsappNumber: '+201001112020',
      status: 'rejected',
      verified: false,
      tier: 'organic',
      views: 0,
      rating: 0,
      reviews: 0,
      activity: 0,
      rejectionReason: 'admin.reason.identityDocumentUnreadable',
    }),
  ];

  const contacts: Contact[] = [
    contact('contact-seed', 'customer-demo', 'provider-demo', 'platform_message', true),
    contact('contact-nour-cleaning', 'customer-nour', 'provider-cleaning', 'whatsapp_reveal', false),
    contact('contact-omar-electric', 'customer-omar', 'provider-electric', 'platform_message', true),
    contact('contact-nour-carpenter', 'customer-nour', 'provider-carpenter', 'platform_message', true),
    contact('contact-salma-maadi-plumbing', 'customer-salma', 'provider-maadi-plumbing', 'whatsapp_reveal', true),
    contact('contact-youssef-heliopolis-electric', 'customer-youssef', 'provider-heliopolis-electric', 'platform_message', false),
    contact('contact-salma-suspended', 'customer-salma', 'provider-suspended', 'platform_message', true),
    contact('contact-omar-suspended', 'customer-omar', 'provider-suspended', 'platform_message', true),
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
    conversation('customer-youssef_provider-heliopolis-electric', 'customer-youssef', 'provider-heliopolis-electric', 'هراجع لوحة الكهرباء وأبعتلك التكلفة قبل الشغل.', {
      'customer-youssef': 1,
      'provider-heliopolis-electric': 0,
    }),
    conversation('customer-salma_provider-suspended', 'customer-salma', 'provider-suspended', 'تم تحويل المحادثة للمراجعة بسبب البلاغ.', {
      'customer-salma': 0,
      'provider-suspended': 0,
    }),
  ];

  const messages: Message[] = [
    message('message-1', 'customer-demo_provider-demo', 'customer-demo', 'عندي تسريب تحت الحوض في التجمع وعايز معاينة قريبة.'),
    message('message-2', 'customer-demo_provider-demo', 'provider-demo', 'وعليكم السلام، ابعت صورة للحوض والمكان وأنا أقولك التقدير المبدئي.'),
    message('message-3', 'customer-demo_provider-demo', 'customer-demo', 'وصل بسرعة وكان واضح في السعر قبل بدء الشغل.'),
    message('message-4', 'customer-omar_provider-electric', 'customer-omar', 'محتاج تركيب نجفة ومراجعة مفتاحين في المعادي.'),
    message('message-5', 'customer-omar_provider-electric', 'provider-electric', 'تمام، أقدر أعدي بكرة بعد العصر.'),
    message('message-6', 'customer-youssef_provider-heliopolis-electric', 'customer-youssef', 'القاطع الرئيسي بيفصل لما أشغل السخان.'),
    message('message-7', 'customer-youssef_provider-heliopolis-electric', 'provider-heliopolis-electric', 'هراجع لوحة الكهرباء وأبعتلك التكلفة قبل الشغل.'),
    message('message-8', 'customer-salma_provider-suspended', 'customer-salma', 'المعاد اتأجل مرتين بعد ما اتفقنا.'),
    message('message-9', 'customer-salma_provider-suspended', 'provider-suspended', 'تم تحويل المحادثة للمراجعة بسبب البلاغ.'),
  ];

  const reviews: Review[] = [
    review('review-1', 'provider-demo', 'customer-demo', 'مريم حسن', 'contact-seed', 5, 'وصل بسرعة وكان واضح في السعر قبل بدء الشغل.'),
    review('review-2', 'provider-electric', 'customer-omar', 'عمر محمود', 'contact-omar-electric', 4, 'حل العطل في نفس اليوم، وكان محتاج متابعة بسيطة بعدها.'),
    review('review-3', 'provider-carpenter', 'customer-nour', 'نور السيد', 'contact-nour-carpenter', 5, 'ضبط أبواب المطبخ وركب الرفوف بشكل نظيف.'),
    review('review-4', 'provider-cleaning', 'customer-nour', 'نور السيد', 'contact-nour-cleaning', 5, 'الفريق كان ملتزم بالميعاد والتنظيف العميق ممتاز.'),
    review('review-5', 'provider-maadi-plumbing', 'customer-salma', 'سلمى علي', 'contact-salma-maadi-plumbing', 4, 'التواصل كان سريع والسعر مناسب بعد المعاينة.'),
    review('review-6', 'provider-suspended', 'customer-salma', 'سلمى علي', 'contact-salma-suspended', 2, 'تأجيلات كثيرة بعد الاتفاق الأول.', 'under_review'),
    review('review-7', 'provider-suspended', 'customer-omar', 'عمر محمود', 'contact-omar-suspended', 1, 'تعليق مخالف تمت إزالته من العرض العام.', 'removed'),
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
      notes: 'visibility.note.manualCashPaymentConfirmed',
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
      notes: 'visibility.note.walletTransferPending',
      requestedAt: '2026-05-04T07:20:00.000Z',
      processedAt: null,
    },
    {
      id: 'visibility-electric-shorouk-rejected',
      providerId: 'provider-heliopolis-electric',
      tier: 'paid',
      serviceArea: 'shorouk',
      status: 'rejected',
      paymentConfirmedBy: 'admin-demo',
      paymentMethod: 'manual_wallet',
      notes: 'visibility.note.walletTransferMismatch',
      requestedAt: '2026-05-02T10:10:00.000Z',
      processedAt: '2026-05-02T14:00:00.000Z',
      rejectionReason: 'admin.reason.paymentCouldNotBeMatched',
    },
  ];

  const adminActions: AdminAction[] = [
    adminAction('admin-action-1', 'provider', 'provider-demo', 'approve_provider', 'admin.reason.identityReviewed'),
    adminAction('admin-action-2', 'visibilityRequest', 'visibility-cleaning-new-cairo', 'approve_visibility', 'admin.reason.paymentConfirmed'),
    adminAction('admin-action-3', 'provider', 'provider-suspended', 'suspend_provider', 'admin.reason.repeatedReportPendingManualReview'),
    adminAction('admin-action-4', 'provider', 'provider-rejected', 'reject_provider', 'admin.reason.identityDocumentUnreadable'),
    adminAction('admin-action-5', 'review', 'review-6', 'flag_review', 'admin.reason.customerComplaintNeedsReview'),
    adminAction('admin-action-6', 'visibilityRequest', 'visibility-electric-shorouk-rejected', 'reject_visibility', 'admin.reason.paymentCouldNotBeMatched'),
  ];

  const reports: AbuseReport[] = [
    {
      id: 'report-1',
      targetType: 'provider',
      targetId: 'provider-suspended',
      reporterId: 'customer-omar',
      reason: 'report.reason.repeatedReschedulingAfterContact',
      status: 'open',
      createdAt: '2026-05-03T18:00:00.000Z',
    },
    {
      id: 'report-2',
      targetType: 'review',
      targetId: 'review-7',
      reporterId: 'provider-suspended',
      reason: 'report.reason.reviewContainsPersonalAttack',
      status: 'closed',
      createdAt: '2026-05-02T12:30:00.000Z',
    },
    {
      id: 'report-3',
      targetType: 'message',
      targetId: 'message-8',
      reporterId: 'provider-suspended',
      reason: 'report.reason.disputeNeedsAdminContext',
      status: 'open',
      createdAt: '2026-05-04T09:15:00.000Z',
    },
  ];

  return {
    users,
    professions,
    providers,
    identityDocuments: providers.map((item) =>
      identityDocumentFor(item.id, item.displayName),
    ),
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
  return { uid, email, role, status: 'active', banReason: null, bannedAt: null, bannedBy: null, displayName, phone, language: 'ar', createdAt: baseDate };
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
  rejectionReason?: string;
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
    rejectionReason: input.rejectionReason,
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

function identityDocumentFor(
  providerId: string,
  displayName: string,
): ProviderIdentityDocument {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="440" viewBox="0 0 720 440">',
    '<rect width="720" height="440" rx="28" fill="#fff6ed"/>',
    '<rect x="36" y="36" width="648" height="368" rx="22" fill="#ffffff" stroke="#e9b389" stroke-width="4"/>',
    '<rect x="66" y="84" width="160" height="188" rx="16" fill="#493726"/>',
    '<circle cx="146" cy="150" r="42" fill="#ff5a00"/>',
    '<rect x="96" y="214" width="100" height="32" rx="16" fill="#ff5a00"/>',
    '<text x="260" y="118" font-family="Arial" font-size="28" font-weight="700" fill="#1b1f1b">Herafy Identity Review</text>',
    `<text x="260" y="168" font-family="Arial" font-size="24" fill="#493726">${displayName}</text>`,
    `<text x="260" y="214" font-family="Arial" font-size="20" fill="#493726">Application: ${providerId}</text>`,
    '<text x="260" y="258" font-family="Arial" font-size="18" fill="#6f6257">Demo document for manual admin verification.</text>',
    '<text x="260" y="300" font-family="Arial" font-size="18" fill="#6f6257">Not a real national ID.</text>',
    '<rect x="260" y="330" width="300" height="22" rx="11" fill="#ff5a00"/>',
    '</svg>',
  ].join('');

  return {
    providerId,
    fileName: `${providerId}-identity-demo.svg`,
    fileType: 'image/svg+xml',
    fileSize: svg.length,
    uploadedAt: baseDate,
    previewDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
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
  status: Review['status'] = 'visible',
): Review {
  return { id, providerId, customerId, customerName, contactId, rating, comment, status, createdAt: baseDate };
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
