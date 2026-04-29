# Hand Connect — Product Design Spec
**Date:** 2026-04-29  
**Status:** Approved  
**Stack:** Vite + React + Firebase + Capacitor (web-first)

---

## 1. Product Overview

Hand Connect is a directory-first home services platform launching in Cairo. It is a **connection layer, not an operator** — customers find and contact verified service professionals directly. The platform does not process payments, assign jobs, negotiate prices, or guarantee outcomes.

**Launch scope:**
- Geography: Cairo (neighborhood-by-neighborhood rollout)
- Initial professions: Plumbing (سباك), Electrical (كهربائي), Carpentry (نجار), Cleaning (تنظيف)
- Two-sided: customers (free) + service providers (paid visibility)

**What it is not:** a marketplace, an employer, a pricing authority, or a service guarantor.

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS (RTL variants enabled) + shadcn/ui |
| State (client) | Zustand |
| State (server) | React Query (TanStack Query v5) |
| Backend | Firebase (Firestore + Auth + Storage + Cloud Functions) |
| Auth | Firebase Auth — email/password + phone OTP |
| Real-time | Firestore `onSnapshot` |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Charts | Recharts |
| i18n | i18next + react-i18next |
| Fonts | Cairo (Arabic) + Inter (Latin) via @fontsource |
| Mobile | Capacitor (web-first; mobile wrap in later phase) |

---

## 3. Project Structure

```
hand-connect/
├── src/
│   ├── firebase/          # Firebase init, config, SDK exports
│   ├── services/          # All Firebase calls (never called from components)
│   │   ├── auth.service.ts
│   │   ├── providers.service.ts
│   │   ├── search.service.ts
│   │   ├── messaging.service.ts
│   │   ├── reviews.service.ts
│   │   ├── visibility.service.ts
│   │   └── admin.service.ts
│   ├── hooks/             # Custom hooks that call services
│   ├── features/          # UI grouped by domain
│   │   ├── auth/
│   │   ├── search/
│   │   ├── providers/
│   │   ├── messaging/
│   │   ├── dashboard/
│   │   ├── reviews/
│   │   └── admin/
│   ├── components/        # Shared UI (Button, Card, Avatar, etc.)
│   ├── layouts/           # AppLayout, AdminLayout, AuthLayout
│   ├── i18n/              # ar.json + en.json translation files
│   ├── store/             # Zustand stores
│   └── router/            # React Router v6 with role guards
```

**Layering rule:** Components → Hooks → Services → Firebase. No layer skips.

---

## 4. Firebase Data Model

### `/users/{userId}`
```
uid, email, role: 'customer' | 'provider' | 'admin'
displayName, phone, createdAt, language: 'ar' | 'en'
```

### `/providers/{providerId}`
```
userId, profession, bio, nationalIdVerified: boolean
status: 'pending' | 'approved' | 'suspended' | 'rejected'
serviceAreas: [{ neighborhood, city }]
whatsappNumber, whatsappVisible: boolean
visibilityTier: 'organic' | 'paid'
visibilityPaidUntil: timestamp | null
profileViews: number
avgRating: number, reviewCount: number
activityScore: number
createdAt, approvedAt
```

### `/professions/{professionId}`
```
nameAr, nameEn, slug, icon, active: boolean, sortOrder: number
```

### `/reviews/{reviewId}`
```
providerId, customerId, contactId
rating: 1-5, comment
status: 'visible' | 'under_review' | 'removed'
createdAt
```

### `/contacts/{contactId}`
```
customerId, providerId
type: 'whatsapp_reveal' | 'platform_message'
createdAt, hasReview: boolean
```

### `/conversations/{conversationId}`
```
participants: [customerId, providerId]
providerId, customerId
lastMessage, lastMessageAt
unreadCount: { [userId]: number }
```

### `/conversations/{conversationId}/messages/{messageId}`
```
senderId, text, createdAt, read: boolean
```

### `/visibilityRequests/{requestId}`
```
providerId, tier, serviceArea
status: 'pending' | 'approved' | 'rejected'
paymentConfirmedBy (adminId), paymentMethod, notes
requestedAt, processedAt
```

### `/adminActions/{actionId}`
```
adminId, targetType, targetId, action, reason, createdAt
```

**Firebase Storage:**
- Provider profile photos (public read)
- National ID uploads (private — admin-read only)

**Firestore Security Rules:** role-based — customers cannot read identity docs; providers cannot read other providers' contacts or leads.

---

## 5. Routing & Role-Based Access

### Public Routes
```
/                        Landing page
/search                  Search by profession + neighborhood
/providers/:id           Provider public profile
/login                   Auth screen
/register                Customer or provider registration
```

### Customer Routes (auth required)
```
/messages                Conversations list
/messages/:id            Chat thread
/reviews/new/:providerId Leave review (contact must exist)
```

### Provider Routes (auth required, status: approved)
```
/dashboard               Insights dashboard
/profile/edit            Edit profile, photos, service areas
/messages                Messaging (provider perspective)
/visibility              Request paid visibility upgrade
/pending                 Waiting screen for unapproved providers
```

### Admin Routes (auth required, role: admin)
```
/admin                   Overview
/admin/applications      Pending provider approvals
/admin/providers         All providers — search, filter, suspend
/admin/professions       Manage profession categories
/admin/visibility        Pending visibility payment requests
/admin/reports           Abuse and dispute reports
/admin/actions           Full audit log
```

### Route Guards
- `<PublicRoute>` — redirects authenticated users to role dashboard
- `<ProtectedRoute role="customer">` — redirects to `/login` if unauthenticated
- `<ProtectedRoute role="provider">` — checks auth + `status === 'approved'`; pending providers → `/pending`
- `<ProtectedRoute role="admin">` — hard redirects to `/` if not admin

---

## 6. Key Feature Flows

### Search & Discovery
Customer searches by profession + neighborhood. Firestore composite index on `profession + serviceArea + status`. Results ranked by weighted score: proximity → reputation → activity → paid visibility (capped, labeled "مميز"). Infinite scroll via React Query `useInfiniteQuery`.

### Provider Verification
Provider registers → uploads national ID to Firebase Storage (private) → Firestore `providers` doc created with `status: pending` → admin reviews in `/admin/applications` → approves/rejects with reason → provider notified → access unlocked.

### Real-Time Messaging
First customer contact creates a `contacts` doc + `conversations` doc. Messages subcollection uses `onSnapshot` for live updates. Unread counts via Firestore transactions. Same UI component for both roles, mirrored sender/receiver logic.

### WhatsApp Reveal
Customer taps واتساب → must be logged in → `contacts` doc created (`type: whatsapp_reveal`) → number revealed → `wa.me/{number}` deep link opened. Counts as a lead.

### Review Submission
Gated by `useContactCheck(providerId)` — only customers with a `contacts` doc linking them to the provider can review. On submit: `reviews` doc created → `avgRating` + `reviewCount` updated via Cloud Function.

### Paid Visibility Request
Provider submits form (tier, service area) → `visibilityRequests` doc created (`status: pending`) → admin confirms payment manually → doc updated → `providers` doc `visibilityTier` + `visibilityPaidUntil` updated.

### Provider Insights Dashboard
Real-time Firestore listeners on the provider's own doc. Displays profile views, contacts received, response behavior, reviews. Recharts for data visualization. Read-only — no implied outcomes.

---

## 7. State Management

### Zustand Stores
- `authStore` — current user, role, provider status, loading state
- `uiStore` — language preference, RTL toggle, active modals

### React Query
All async data: search results, provider profiles, messages, reviews, dashboard stats. Cache keys scoped per feature.

---

## 8. Internationalisation & RTL

- **Default locale:** Arabic (`ar`)
- **i18next** with `ar.json` + `en.json` locale files
- Language persisted in `localStorage` + synced to user's Firestore doc
- `dir="rtl"` on `<html>` when Arabic (default)
- Tailwind `rtl:` variant for layout mirroring
- Directional icons flip via `rtl:rotate-180`
- **Fonts:** Cairo (Arabic) + Inter (Latin) via `@fontsource`
- All UI strings via `t('key')` — zero hardcoded text in components

---

## 9. Monetisation (Current Implementation Scope)

- Providers pay for visibility upgrades — **manual payment confirmation by admin**
- No payment gateway integrated in this phase
- Admin confirms payment in `/admin/visibility`, unlocks tier manually
- Revenue tracking is informational only (notes field on `visibilityRequests`)

---

## 10. Mobile (Capacitor)

- Web app built and polished first
- Capacitor added in a dedicated later phase
- Target: Android primary (Cairo market), iOS secondary
- No Capacitor-specific APIs needed in the web phase — all features work in browser

---

## 11. Key Constraints

The platform explicitly does NOT:
- Process payments in-app
- Negotiate prices or assign jobs
- Guarantee service outcomes
- Allow providers to respond publicly to reviews
- Allow providers to create new profession categories

---

## 12. Success Metric

> "When someone needs help at home, they should be able to find it in minutes, not hours."
