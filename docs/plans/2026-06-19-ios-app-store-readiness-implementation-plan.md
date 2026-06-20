# Herafy iOS App Store Readiness Specification and Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to implement this plan task-by-task. Do not claim App Store readiness until real iOS/TestFlight, Firebase, E2E, and store-metadata verification passes.

**Goal:** Convert Herafy from its current Vite/React demo-style web app into a production-ready iOS app that can be built, signed, uploaded to App Store Connect/TestFlight, reviewed by Apple, and eventually released.

**Architecture:** Keep the existing React/Vite frontend as the shared product UI, replace the demo `localStorage` data layer with real Firebase Auth/Firestore/Storage/Functions, then wrap the production web build with Capacitor iOS. The iOS app should be a thin native shell over a real production backend, with native configuration limited to identity, signing, app icons/splash, permissions, deep links if needed, and store-compliance requirements.

**Tech Stack:** Vite, React, TypeScript, React Router, Firebase Auth, Firestore, Firebase Storage, Firebase Cloud Functions, Firebase Hosting optional, Capacitor, Xcode, App Store Connect, Playwright, Vitest, ESLint.

---

## 0. Current Repo Inventory

**Repo path:** `/Users/ziadnasreldin/Documents/GitHub/herafy`

**Git remote:** `https://github.com/Ziad-NasrEldin/herafy.git`

**Current package:** `herafy@0.1.0`

**Current frontend scripts:**

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "test": "vitest run",
  "e2e": "playwright test",
  "firebase:emulators": "firebase emulators:start --import=.firebase-emulator-data --export-on-exit",
  "seed:dev": "tsx scripts/seed-dev.ts",
  "admin:create": "tsx scripts/create-admin.ts"
}
```

**Observed verification on 2026-06-19:**

```bash
npm ci
npm run build
npm test
npm run lint
```

Results:

- `npm run build` passed.
- `npm test` passed: 8 test files, 10 tests.
- `npm run lint` passed.
- `npm run e2e` failed: 2 failures, 9 passes, 1 skipped.
- `cd functions && npm run build` failed due missing `.js` extensions in ESM imports.

**Current untracked files:**

```txt
?? .DS_Store
?? api/.DS_Store
?? docs/.DS_Store
?? docs/superpowers/.DS_Store
?? functions/.DS_Store
```

These should be deleted and `.gitignore` should prevent future `.DS_Store` noise.

---

## 1. Product Definition for Apple Review

### 1.1 What Herafy Is

Herafy is a Cairo-focused directory and connection layer for finding home-service professionals. It helps customers find verified providers, view profiles, start contact, send messages, and leave reviews after contact.

### 1.2 What Herafy Must Not Claim

Apple reviewers will inspect copy, screenshots, onboarding, profile labels, and review notes. The app must avoid implying claims that the product cannot operationally prove.

Herafy must **not** claim that it is:

- a marketplace operator;
- an employer of providers;
- a payment processor unless payments are fully implemented;
- a pricing authority;
- a service guarantor;
- a skill certifier;
- an emergency service dispatch app;
- a government identity-verification authority.

Provider verification should be described as identity/profile review only unless real professional credential verification exists.

### 1.3 Launch Scope

Recommended v1 App Store scope:

- Cairo only.
- Arabic default, English secondary.
- Customers can search providers.
- Customers can view approved providers.
- Customers can create accounts.
- Providers can apply and wait for admin approval.
- Admin can approve/reject/suspend providers.
- Customers and providers can message.
- Customers can review after contact.
- Users can report abuse/content.
- Provider identity documents are private and only visible to the provider/admin.

### 1.4 Recommended App Store Category

Primary category: **Lifestyle** or **Utilities**.

Secondary category: **Business** if provider-side usage is emphasized.

Avoid categories implying regulated emergency or professional services unless the product and terms support that.

---

## 2. Release-Readiness Definition

Herafy is iOS-ready only when all of the following are true:

1. The production app no longer relies on demo `localStorage` data for product-critical flows.
2. Firebase Auth, Firestore, Storage, and Functions are wired into the frontend service layer.
3. Firestore and Storage security rules are tested and deployed.
4. Firebase Functions build, test, and deploy successfully.
5. Root app build/test/lint/e2e passes.
6. iOS Capacitor project exists under `ios/`.
7. Bundle ID is final and registered in Apple Developer portal.
8. Xcode archive builds successfully.
9. TestFlight upload succeeds.
10. Real iPhone/TestFlight smoke verifies core user flows.
11. App Store privacy answers match actual data collection.
12. Review credentials and review notes are prepared.
13. Store screenshots are captured from the real iOS build.
14. Terms/privacy/support URLs are live.
15. Abuse reporting/moderation paths work.

---

## 3. Major Current Blockers

### 3.1 No iOS App Exists Yet

There is currently no:

- `ios/` native project;
- `capacitor.config.ts`;
- `@capacitor/core` dependency;
- `@capacitor/ios` dependency;
- Xcode signing setup;
- iOS icon/splash assets;
- App Store Connect app record.

### 3.2 Frontend Uses Demo Database

The current frontend services import and use `src/services/demo-db.ts`, which stores app state in browser `localStorage`.

Examples:

- `src/services/auth.service.ts`
- `src/services/providers.service.ts`
- `src/services/search.service.ts`
- `src/services/messaging.service.ts`
- `src/services/reviews.service.ts`
- `src/services/admin.service.ts`
- `src/services/visibility.service.ts`

This is not production-ready and will fail real multi-user use.

### 3.3 Firebase Functions Build Fails

Current failure:

```txt
src/index.ts(1,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './reviews.js'?
src/index.ts(2,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './visibility.js'?
test/reviews.test.ts(2,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../src/reviews.js'?
test/visibility.test.ts(2,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../src/visibility.js'?
```

### 3.4 E2E Fails

Current failure:

```txt
getByRole('link', { name: 'عرض الملف' }) resolved to 4 elements
```

File:

```txt
tests/e2e/app.spec.ts:47
```

Likely fix: scope the locator to the expected provider card or use `.first()` only if the first result is intentionally the expected profile.

### 3.5 Security Audit Findings

Root app production audit currently reports:

```txt
5 vulnerabilities: 1 low, 4 high
```

Functions audit currently reports:

```txt
6 vulnerabilities: 2 moderate, 4 high
```

Before launch, run `npm audit fix`, review lockfile diffs, rerun all tests/builds, and ensure no breaking dependency upgrade changes runtime behavior.

---

## 4. Target Architecture

### 4.1 Layers

```txt
App Store iOS app
  └─ Capacitor iOS shell
      └─ Vite production web bundle from dist/
          └─ React app
              └─ Service layer
                  ├─ Firebase Auth
                  ├─ Firestore
                  ├─ Firebase Storage
                  └─ Firebase Functions HTTPS/callable endpoints
```

### 4.2 Native Shell Responsibilities

The Capacitor iOS layer should own only:

- bundle ID;
- display name;
- version/build number;
- app icon;
- launch screen/splash;
- iOS permissions strings;
- optional universal links/deep links;
- App Transport Security if absolutely needed;
- signing/provisioning;
- TestFlight/App Store upload.

The iOS shell should **not** duplicate product logic.

### 4.3 Web App Responsibilities

The React app owns:

- routing;
- Arabic/English i18n;
- auth UI;
- customer search;
- provider profiles;
- provider onboarding;
- messaging UI;
- reviews UI;
- admin console;
- moderation UI;
- Firebase service calls.

### 4.4 Backend Responsibilities

Firebase owns:

- durable user accounts;
- role model;
- provider records;
- identity documents;
- conversations/messages;
- reviews;
- abuse reports;
- admin actions/audit log;
- security rules;
- aggregate recalculation;
- privileged mutations.

---

## 5. Data Model Specification

The existing docs already imply these collections. Implementation should formalize them in TypeScript converters, Firestore rules, seed scripts, and tests.

### 5.1 `users/{uid}`

Purpose: user profile and role.

Required fields:

```ts
interface UserDoc {
  uid: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  displayName: string;
  phone: string;
  language: 'ar' | 'en';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  disabled?: boolean;
}
```

Rules:

- User can read own user doc.
- Admin can read all user docs.
- User can create only own doc with `customer` or `provider` role.
- User cannot assign self `admin`.
- User cannot change own `role`, `uid`, or privilege fields.
- Admin role assignment must happen via protected admin script/function only.

### 5.2 `providers/{providerId}`

Purpose: public/owner/admin provider profile.

Required fields:

```ts
interface ProviderDoc {
  id: string;
  userId: string;
  displayName: string;
  phone: string;
  profession: string;
  bio: string;
  nationalIdVerified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  serviceAreas: Array<{ city: string; neighborhood: string }>;
  serviceAreaKeys: string[];
  whatsappNumber: string;
  whatsappVisible: boolean;
  visibilityTier: 'organic' | 'paid';
  visibilityPaidUntil: Timestamp | null;
  profileViews: number;
  avgRating: number;
  reviewCount: number;
  activityScore: number;
  photos: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt: Timestamp | null;
  rejectedAt?: Timestamp | null;
  suspensionReason?: string | null;
}
```

Rules:

- Public can read approved providers only.
- Provider owner can read own profile regardless of status.
- Admin can read all.
- Provider can create own pending profile.
- Provider can edit safe fields only: bio, service areas, WhatsApp visibility, photos, etc.
- Provider cannot approve self, verify ID, set paid visibility, or change status.
- Admin or Cloud Function owns approval/rejection/suspension.

### 5.3 `providerIdentityDocuments/{providerId}`

Purpose: metadata for provider identity files in Storage.

Required fields:

```ts
interface ProviderIdentityDocumentDoc {
  providerId: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  uploadedAt: Timestamp;
  reviewStatus: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
}
```

Rules:

- Provider can create/read own identity doc metadata.
- Admin can read/update review status.
- Public cannot read.
- Delete should be blocked or admin-only with audit.

### 5.4 `contacts/{contactId}`

Purpose: record that customer contacted provider, enabling review eligibility.

Required fields:

```ts
interface ContactDoc {
  id: string;
  customerId: string;
  providerId: string;
  channel: 'whatsapp' | 'message';
  createdAt: Timestamp;
  hasReview: boolean;
}
```

Rules:

- Customer can create own contact.
- Customer/provider/admin can read if participant.
- `hasReview` should be updated by Cloud Function or transaction when review is created.

### 5.5 `conversations/{conversationId}` and `messages/{messageId}`

Purpose: in-app messaging.

Conversation fields:

```ts
interface ConversationDoc {
  id: string;
  participants: string[];
  customerId: string;
  providerId: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadBy: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Message fields:

```ts
interface MessageDoc {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  status: 'sent' | 'read';
}
```

Rules:

- Only participants can read conversation/messages.
- Only participants can create messages.
- Text length must be bounded.
- Server should set or validate timestamps.
- Abuse reporting must be possible from message context.

### 5.6 `reviews/{reviewId}`

Purpose: customer reviews after contact.

Required fields:

```ts
interface ReviewDoc {
  id: string;
  customerId: string;
  providerId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  status: 'visible' | 'hidden' | 'pending';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Rules:

- Customer can create review only if an eligible contact exists.
- Review creation should be transaction/function guarded.
- Public can read visible reviews.
- Admin can hide/moderate.
- Provider cannot edit reviews.

### 5.7 `visibilityRequests/{requestId}`

Purpose: provider request for paid visibility or manual promotion.

Required fields:

```ts
interface VisibilityRequestDoc {
  id: string;
  providerId: string;
  serviceArea: string;
  paymentMethod: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  adminNotes?: string;
}
```

Rules:

- Provider can create/read own requests.
- Admin can read/update.
- Approval should update provider `visibilityTier` and `visibilityPaidUntil` through server-owned function.

### 5.8 `reports/{reportId}`

Purpose: abuse reporting and App Store compliance.

Required fields:

```ts
interface AbuseReportDoc {
  id: string;
  reporterId: string;
  targetType: 'provider' | 'review' | 'message' | 'conversation';
  targetId: string;
  reason: string;
  details?: string;
  status: 'open' | 'reviewed' | 'actioned' | 'dismissed';
  createdAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
}
```

Rules:

- Signed-in users can create reports.
- Admin can read/update reports.
- Reporter may read own report status if desired.

### 5.9 `adminActions/{actionId}`

Purpose: audit trail for privileged decisions.

Required fields:

```ts
interface AdminActionDoc {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reason?: string;
  createdAt: Timestamp;
}
```

Rules:

- Admin can read.
- Client cannot create/update/delete directly.
- Cloud Functions or trusted admin scripts create actions.

---

## 6. Firebase Service-Layer Migration Specification

### 6.1 Keep Demo Mode Only for Tests/Local Dev

The current `src/services/demo-db.ts` can remain as a test/demo adapter, but production code must not silently fall back to it.

Create an explicit data adapter boundary:

```txt
src/services/data-source.ts
src/services/firebase/*.ts
src/services/demo/*.ts
```

Recommended policy:

- Production build requires Firebase config.
- If Firebase config is missing in production, show fatal configuration error.
- Tests may import demo adapter directly.
- Local development may opt into demo mode with explicit `VITE_DATA_SOURCE=demo`.

### 6.2 Environment Variables

Update `.env.example`:

```env
VITE_DATA_SOURCE=firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATORS=false
VITE_FIREBASE_EMULATOR_HOST=localhost
```

Production value:

```env
VITE_DATA_SOURCE=firebase
VITE_USE_FIREBASE_EMULATORS=false
```

Local emulator value:

```env
VITE_DATA_SOURCE=firebase
VITE_USE_FIREBASE_EMULATORS=true
```

Demo-only local value:

```env
VITE_DATA_SOURCE=demo
```

### 6.3 Firebase Initialization

Current file:

```txt
src/firebase/app.ts
```

Required changes:

- Validate all required env vars.
- Initialize app once.
- Connect emulators only once.
- Add Auth, Firestore, Storage exports.

Recommended files:

```txt
src/firebase/app.ts
src/firebase/auth.ts
src/firebase/db.ts
src/firebase/storage.ts
src/firebase/emulators.ts
```

### 6.4 Auth Migration

Replace `src/services/auth.service.ts` localStorage logic with Firebase Auth.

Required functions:

```ts
getCurrentSession()
login(email, password)
logout()
registerCustomer(input)
registerProvider(input)
```

Implementation requirements:

- Use `createUserWithEmailAndPassword` for new users.
- Use `signInWithEmailAndPassword` for login.
- Use `onAuthStateChanged` in store initialization.
- Create `users/{uid}` after auth user creation.
- Create provider profile and identity doc metadata in a transaction/batch after provider registration.
- Upload identity document to Firebase Storage before/while creating provider application.
- Prevent partial registration states where Auth user exists but Firestore profile is missing; handle recovery if it happens.

### 6.5 Search Migration

Replace `src/services/search.service.ts` with Firestore queries.

Requirements:

- Query only `status == 'approved'` providers.
- Filter by profession and service area.
- Use Firestore composite indexes.
- Keep ranking deterministic.
- Cap paid visibility effect and label it clearly.
- Support pagination later; v1 can limit results if launch data is small.

### 6.6 Provider Profile Migration

Replace `src/services/providers.service.ts` with Firestore/Storage.

Requirements:

- Public approved profile read.
- Owner profile read.
- Safe provider profile updates.
- Profile photo uploads to Storage path `providerPhotos/{providerId}/{fileName}`.
- Profile view increments should not be abusable; use a Function or transaction with basic throttling later.
- WhatsApp reveal should create/update a `contacts` record.

### 6.7 Messaging Migration

Replace `src/services/messaging.service.ts`.

Requirements:

- Create deterministic conversation ID: `${customerId}_${providerId}` or a hash.
- Use Firestore transaction when starting conversation.
- Store messages in subcollection `conversations/{conversationId}/messages`.
- Use `onSnapshot` or React Query invalidation for live updates.
- Track unread state.
- Bound message length.
- Escape/sanitize display; React text rendering handles escaping but do not render user message HTML.

### 6.8 Reviews Migration

Replace `src/services/reviews.service.ts`.

Requirements:

- Customer can review only after contact.
- Review creation should be transactional.
- Update contact `hasReview`.
- Recalculate provider `avgRating` and `reviewCount`.
- Prefer Cloud Function for aggregate correctness.
- Admin can hide/moderate reviews.

### 6.9 Admin Migration

Replace `src/services/admin.service.ts`.

Requirements:

- Admin list provider applications.
- Admin approve provider.
- Admin reject provider with reason.
- Admin suspend provider with reason.
- Admin approve/reject visibility request.
- Admin list reports.
- Admin action log.
- Privileged mutations should be Cloud Functions or protected callable HTTPS endpoints, not ordinary client writes unless rules fully enforce safety.

---

## 7. Cloud Functions Specification

### 7.1 Fix Existing Build

Current files needing ESM import fixes:

```txt
functions/src/index.ts
functions/test/reviews.test.ts
functions/test/visibility.test.ts
```

Required import style under NodeNext:

```ts
export { recalculateRating } from './reviews.js';
export { approveVisibility } from './visibility.js';
```

Tests should import:

```ts
import { recalculateRating } from '../src/reviews.js';
```

### 7.2 Required Functions

Minimum launch-grade functions:

1. `recalculateRating`
   - Triggered by review create/update/delete or callable by admin.
   - Recomputes provider `avgRating` and `reviewCount` from visible reviews.

2. `approveVisibility`
   - Admin-only.
   - Validates request exists.
   - Updates request status.
   - Updates provider visibility tier/expiry.
   - Writes admin action.

3. `approveProvider`
   - Admin-only.
   - Validates provider pending.
   - Sets `status: approved`, `nationalIdVerified: true`, `approvedAt`.
   - Updates identity doc review status.
   - Writes admin action.

4. `rejectProvider`
   - Admin-only.
   - Requires reason.
   - Sets `status: rejected`.
   - Writes admin action.

5. `suspendProvider`
   - Admin-only.
   - Requires reason.
   - Sets `status: suspended`.
   - Writes admin action.

6. `createReviewAfterContact`
   - Signed-in customer.
   - Verifies contact exists and no existing review.
   - Creates review.
   - Marks contact reviewed.
   - Recalculates rating or triggers rating function.

7. `moderateReport`
   - Admin-only.
   - Updates report status.
   - Optionally hides target review/provider/message.
   - Writes admin action.

### 7.3 Function Auth Pattern

Every callable/HTTP function must validate:

- request has auth;
- caller user doc exists;
- caller role is allowed;
- target doc exists;
- mutation is valid for current state;
- required reason is present for destructive/moderation actions.

Never trust role from client request body.

### 7.4 Function Tests

Add tests for:

- admin-only access;
- missing reason rejection;
- invalid target rejection;
- successful provider approval;
- successful provider rejection;
- successful suspension;
- review eligibility;
- duplicate review prevention;
- rating recalculation;
- visibility approval.

---

## 8. Security Rules Specification

### 8.1 Firestore Rules Must Enforce

Current `firestore.rules` is a good starting point, but rules must be tested against the final service layer.

Required coverage:

- Anonymous can read approved providers and visible reviews only.
- Anonymous cannot read users, contacts, conversations, messages, identity docs, reports, admin actions.
- Customer can create own user doc.
- Customer cannot self-assign admin.
- Provider can create own pending profile.
- Provider cannot approve self.
- Provider cannot read other provider identity docs.
- Customer/provider can only read own conversations.
- Message sender must be conversation participant.
- Customer can create report.
- Admin can read reports/applications/admin actions.
- Client cannot create admin action directly.

### 8.2 Storage Rules Must Enforce

Current `storage.rules` defines:

```txt
providerPhotos/{providerId}/{fileName}
identityDocuments/{providerId}/{fileName}
```

Required additions/checks:

- File size limit.
- Content type allowlist.
- Provider photos public read, owner write.
- Identity documents private read: owner/admin only.
- Identity document writes: owner only.
- No public wildcard reads.

Recommended content checks:

```txt
request.resource.size < 5 * 1024 * 1024
request.resource.contentType.matches('image/.*|application/pdf')
```

Exact Firebase rules syntax should be validated with emulator tests.

---

## 9. iOS / Capacitor Specification

### 9.1 Why Capacitor

Capacitor is the lowest-risk path because the product is already a React/Vite app and does not currently need native-only features. It lets the existing web UI run inside a real iOS app shell while keeping product logic shared.

### 9.2 Required Dependencies

Install:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
```

Optional later:

```bash
npm install @capacitor/app @capacitor/browser @capacitor/filesystem @capacitor/camera
```

Only install plugins when the app actually uses them.

### 9.3 Capacitor Config

Create:

```txt
capacitor.config.ts
```

Recommended initial content:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mavoid.herafy',
  appName: 'Herafy',
  webDir: 'dist',
  server: {
    iosScheme: 'https',
  },
};

export default config;
```

Before implementation, confirm final bundle ID. Once uploaded to App Store Connect, changing bundle ID means creating a different app record.

### 9.4 Package Scripts

Add scripts to `package.json`:

```json
{
  "cap:add:ios": "cap add ios",
  "cap:sync:ios": "npm run build && cap sync ios",
  "cap:open:ios": "cap open ios",
  "ios:build:web": "npm run build && cap copy ios",
  "release:check": "npm run lint && npm test && npm run build && npm run e2e"
}
```

### 9.5 iOS Project Creation

Commands:

```bash
npm run build
npx cap add ios
npx cap sync ios
```

Expected output:

- `ios/App/App.xcworkspace` exists.
- `ios/App/App/Info.plist` exists.
- `ios/App/App/Assets.xcassets` exists.
- `ios/App/Podfile` exists.

### 9.6 iOS Signing

Required:

- Apple Developer Program membership.
- Apple Team selected in Xcode.
- Bundle ID registered: recommended `com.mavoid.herafy` unless another company namespace is chosen.
- Automatic signing enabled for v1 unless there is a reason for manual provisioning.
- App Store Connect app record uses same bundle ID.

### 9.7 Versioning

Source of truth should be documented.

Recommended:

- `package.json` version maps to iOS marketing version.
- iOS build number increments every TestFlight upload.

Example:

```txt
MARKETING_VERSION = 1.0.0
CURRENT_PROJECT_VERSION = 1
```

Every upload requires a new build number.

### 9.8 iOS Permissions

If provider identity upload uses file picker/photos/camera, add clear `Info.plist` strings:

- `NSPhotoLibraryUsageDescription`
- `NSCameraUsageDescription` if camera capture is enabled.

Suggested copy:

```txt
Herafy lets providers upload profile or identity verification images during onboarding.
```

Do not request permissions until user action needs them.

### 9.9 App Transport Security

All production endpoints must use HTTPS.

Do not add broad ATS exceptions like `NSAllowsArbitraryLoads=true` unless absolutely necessary. Apple may reject apps with weak network security.

### 9.10 Deep Links / Universal Links

Not required for v1 unless product needs links like provider profiles opening in-app.

If needed later:

- configure associated domains in Apple Developer portal;
- host `apple-app-site-association` on production domain;
- add Capacitor App plugin event handling;
- test cold-start and warm-start link handling.

---

## 10. App Store Connect Specification

### 10.1 Required App Record

Create app in App Store Connect with:

- Platform: iOS
- Name: Herafy
- Primary language: Arabic or English; recommended English if listing metadata is bilingual, Arabic if launch market is Cairo-first.
- Bundle ID: final registered ID.
- SKU: `herafy-ios` or similar.
- User Access: full access for your account/team.

### 10.2 Store Listing Metadata

Required:

- App name
- Subtitle
- Promotional text
- Description
- Keywords
- Support URL
- Marketing URL optional
- Privacy Policy URL
- App category
- Copyright
- Contact info

Recommended description structure:

1. One-sentence value proposition.
2. Customer capabilities.
3. Provider capabilities.
4. Safety/moderation note.
5. Availability: Cairo-focused.
6. Clear non-guarantee language.

### 10.3 Screenshots

Required screenshot sizes depend on App Store Connect current rules. At minimum prepare:

- 6.7-inch iPhone screenshots.
- 6.5-inch or 5.5-inch if App Store Connect asks.

Recommended screenshot set:

1. Arabic landing/search.
2. Provider results.
3. Provider profile.
4. Messaging/contact flow.
5. Provider onboarding.
6. Provider dashboard.
7. Admin/moderation screen only if suitable; avoid exposing private data.

Screenshots must come from real app UI, not Figma-only mockups, unless used as App Store marketing screenshots with exact match to app behavior.

### 10.4 App Privacy Answers

Likely collected data categories:

- Contact Info: email, phone, name.
- User Content: messages, reviews, uploaded identity documents, profile photos.
- Identifiers: user ID.
- Usage Data: profile views/contact events if tracked.
- Diagnostics: if analytics/crash reporting added.

Likely purposes:

- App Functionality.
- Account Management.
- Safety/Moderation.
- Developer analytics if analytics are added.

Do not claim data is not collected if Firestore stores it.

### 10.5 Review Credentials

Apple needs a fully working path.

Prepare:

- Customer test account.
- Approved provider test account.
- Pending provider test account if onboarding review is important.
- Admin test account only if Apple needs to inspect moderation/admin; do not expose production admin to broad review if avoidable. If provided, limit permissions or use staging environment.

Reviewer notes should explain:

- Cairo/local-service context.
- Provider verification is identity/profile review, not skill certification.
- How to log in.
- How to search.
- How to message/contact.
- How to report content.
- How to access admin review if necessary.

### 10.6 UGC / Moderation Compliance

Because the app has messaging, reviews, and profiles, treat it as user-generated content.

Required:

- Report abuse button for providers/reviews/messages.
- Admin report review queue.
- Ability to hide reviews or suspend providers.
- Blocking/muting is recommended for messaging; if not in v1, explain moderation path clearly and consider adding minimum block functionality.
- Terms of use banning abusive content.
- Privacy policy.

---

## 11. Testing and Verification Matrix

### 11.1 Local Commands

Root app:

```bash
npm ci
npm run lint
npm test
npm run build
npm run e2e
```

Functions:

```bash
cd functions
npm ci
npm run build
npm test
```

Firebase emulator:

```bash
npm run firebase:emulators
```

Capacitor sync:

```bash
npm run build
npx cap sync ios
```

Xcode build CLI, after iOS project exists:

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build
```

Archive, once signing is configured:

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -archivePath build/HandConnect.xcarchive archive
```

### 11.2 E2E Flows Required

Browser/local E2E:

1. Arabic RTL landing loads.
2. Search by profession/neighborhood.
3. Provider profile opens.
4. Customer registers.
5. Customer logs in.
6. Provider registers with identity upload.
7. Pending provider sees pending screen.
8. Admin approves provider.
9. Approved provider can access dashboard.
10. Customer reveals WhatsApp/contact.
11. Customer starts message conversation.
12. Provider receives/responds.
13. Customer creates review after contact.
14. Report abuse created.
15. Admin reviews report.
16. English language toggle works.
17. Mobile viewport remains readable and tappable.

Real iOS/TestFlight smoke:

1. Install TestFlight build.
2. Cold launch.
3. Login.
4. Register customer.
5. Register provider and upload identity document.
6. Search.
7. Open profile.
8. Contact/message.
9. Review.
10. Report abuse.
11. Log out/log back in.
12. Kill app/reopen; session restores correctly.
13. No blank screen on poor network.
14. No local demo data leak.

### 11.3 Security Verification

Use Firebase Rules Unit Testing or emulator tests to prove:

- public read boundaries;
- identity document privacy;
- conversation participant isolation;
- review eligibility;
- admin-only mutations;
- report creation;
- no client admin action writes.

### 11.4 Accessibility / RTL Verification

Required:

- Arabic RTL layout on all primary screens.
- English LTR layout on all primary screens.
- Buttons have accessible names.
- Forms have labels/errors.
- Text contrast passes WCAG AA where possible.
- Touch targets are large enough on iPhone.
- Keyboard/screen reader navigation works for auth/search/forms.

### 11.5 Performance Verification

Before launch:

- Initial JS bundle should be reviewed; current production bundle warning shows large chunk around `827 kB` JS.
- Route-level code splitting should be considered for admin/provider-heavy routes.
- Firebase listeners should be scoped and unsubscribed.
- Profile/search pages should avoid loading admin-only data.
- iOS cold launch should not show long blank screen.

---

## 12. Detailed Implementation Plan

## Phase 1: Repo Hygiene and Baseline Gates

### Task 1.1: Remove macOS `.DS_Store` noise

**Objective:** Clean untracked Finder metadata and prevent it from recurring.

**Files:**

- Modify: `.gitignore`
- Delete: `.DS_Store`, `api/.DS_Store`, `docs/.DS_Store`, `docs/superpowers/.DS_Store`, `functions/.DS_Store`

**Steps:**

1. Delete current `.DS_Store` files.
2. Add `.DS_Store` to `.gitignore` if missing.
3. Run:

```bash
git status --short
```

Expected: `.DS_Store` files no longer appear.

**Verification:**

```bash
git status --short --untracked-files=all
```

### Task 1.2: Preserve current failing baseline in notes

**Objective:** Record known failures before changing code.

**Files:**

- Modify or create: `docs/ios-readiness/baseline-2026-06-19.md`

**Content:**

- root build/test/lint pass;
- root e2e failure details;
- functions build failure details;
- audit findings summary;
- no iOS/Capacitor status.

**Verification:**

```bash
cat docs/ios-readiness/baseline-2026-06-19.md
```

Expected: baseline exists and matches observed failures.

### Task 1.3: Add release-check script

**Objective:** Add a single script that runs root release gates.

**Files:**

- Modify: `package.json`

**Add script:**

```json
"release:check": "npm run lint && npm test && npm run build && npm run e2e"
```

**Verification:**

```bash
npm run release:check
```

Expected initially: fails at E2E until Task 2.1 fixes the selector.

---

## Phase 2: Fix Existing Quality Gates

### Task 2.1: Fix ambiguous Arabic E2E selector

**Objective:** Make the failing Arabic RTL landing/search test target the intended provider profile link.

**Files:**

- Modify: `tests/e2e/app.spec.ts`

**Current failure:**

```ts
await page.getByRole('link', { name: 'عرض الملف' }).click();
```

**Recommended approach:** Scope to the provider card containing `أحمد السبّاك`, or choose the first result only if the test intentionally expects the first result.

Example safer pattern:

```ts
const providerCard = page.getByText('أحمد السبّاك').locator('..').locator('..');
await providerCard.getByRole('link', { name: 'عرض الملف' }).click();
```

If DOM structure makes parent traversal brittle, add stable test IDs in provider cards:

```tsx
<article data-testid={`provider-card-${provider.id}`}>
```

Then test:

```ts
await page
  .getByTestId('provider-card-provider-demo')
  .getByRole('link', { name: 'عرض الملف' })
  .click();
```

**Verification:**

```bash
npm run e2e
```

Expected: all E2E tests pass or any new failure is unrelated and investigated.

### Task 2.2: Fix Firebase Functions ESM imports

**Objective:** Make `functions` TypeScript build pass under NodeNext/ESM.

**Files:**

- Modify: `functions/src/index.ts`
- Modify: `functions/test/reviews.test.ts`
- Modify: `functions/test/visibility.test.ts`

**Implementation:**

Change extensionless relative imports to `.js` imports.

```ts
export { recalculateRating } from './reviews.js';
export { approveVisibility } from './visibility.js';
```

**Verification:**

```bash
cd functions
npm run build
npm test
```

Expected: build and tests pass.

### Task 2.3: Resolve root production audit findings

**Objective:** Update vulnerable dependencies without breaking app behavior.

**Files:**

- Modify: `package.json` if dependency ranges change
- Modify: `package-lock.json`

**Steps:**

1. Run:

```bash
npm audit fix
```

2. Inspect diff:

```bash
git diff package.json package-lock.json
```

3. Run:

```bash
npm run lint
npm test
npm run build
npm run e2e
npm audit --omit=dev --audit-level=moderate
```

Expected: gates pass and production audit is clean or documented with non-launch-blocking rationale.

### Task 2.4: Resolve functions production audit findings

**Objective:** Update vulnerable functions dependencies without breaking functions.

**Files:**

- Modify: `functions/package.json` if dependency ranges change
- Modify: `functions/package-lock.json`

**Steps:**

```bash
cd functions
npm audit fix
npm run build
npm test
npm audit --omit=dev --audit-level=moderate
```

Expected: gates pass and production audit is clean or documented.

---

## Phase 3: Data Adapter Boundary

### Task 3.1: Create explicit data-source config

**Objective:** Stop implicit production fallback to demo/localStorage.

**Files:**

- Create: `src/services/data-source.ts`
- Modify: `.env.example`
- Modify: tests if needed

**Implementation:**

```ts
export type DataSource = 'firebase' | 'demo';

export function getDataSource(): DataSource {
  const value = import.meta.env.VITE_DATA_SOURCE;
  if (value === 'demo' || value === 'firebase') return value;
  return import.meta.env.DEV ? 'demo' : 'firebase';
}

export function assertProductionFirebaseConfig() {
  if (import.meta.env.PROD && getDataSource() !== 'firebase') {
    throw new Error('Production builds must use Firebase data source.');
  }
}
```

**Verification:**

```bash
npm test
npm run build
```

### Task 3.2: Split demo services into demo namespace

**Objective:** Make demo implementation explicit and isolated.

**Files:**

- Create directory: `src/services/demo/`
- Move or copy demo data helpers from `src/services/demo-db.ts`
- Update imports in demo service modules

**Target shape:**

```txt
src/services/demo/demo-db.ts
src/services/demo/auth.demo.ts
src/services/demo/providers.demo.ts
src/services/demo/search.demo.ts
src/services/demo/messaging.demo.ts
src/services/demo/reviews.demo.ts
src/services/demo/admin.demo.ts
src/services/demo/visibility.demo.ts
```

**Verification:**

```bash
npm test
npm run build
```

Expected: no behavior change yet.

### Task 3.3: Create service interfaces

**Objective:** Define stable interfaces for auth/providers/search/messaging/reviews/admin/visibility.

**Files:**

- Create: `src/services/contracts/auth.contract.ts`
- Create: `src/services/contracts/providers.contract.ts`
- Create: `src/services/contracts/search.contract.ts`
- Create: `src/services/contracts/messaging.contract.ts`
- Create: `src/services/contracts/reviews.contract.ts`
- Create: `src/services/contracts/admin.contract.ts`
- Create: `src/services/contracts/visibility.contract.ts`

**Verification:**

```bash
npm run build
```

Expected: TypeScript passes.

### Task 3.4: Route services through adapter selectors

**Objective:** Make existing imports resolve to either demo or Firebase implementation.

**Files:**

- Modify: `src/services/auth.service.ts`
- Modify: `src/services/providers.service.ts`
- Modify: `src/services/search.service.ts`
- Modify: `src/services/messaging.service.ts`
- Modify: `src/services/reviews.service.ts`
- Modify: `src/services/admin.service.ts`
- Modify: `src/services/visibility.service.ts`

**Pattern:**

```ts
import { getDataSource } from './data-source';
import * as demo from './demo/auth.demo';
import * as firebase from './firebase/auth.firebase';

const impl = getDataSource() === 'firebase' ? firebase : demo;

export const getCurrentSession = impl.getCurrentSession;
export const login = impl.login;
export const logout = impl.logout;
export const registerCustomer = impl.registerCustomer;
export const registerProvider = impl.registerProvider;
```

**Verification:**

```bash
VITE_DATA_SOURCE=demo npm run build
npm test
npm run e2e
```

Expected: current demo behavior still passes after E2E selector fix.

---

## Phase 4: Firebase Client Foundation

### Task 4.1: Harden Firebase initialization

**Objective:** Provide reliable Firebase app/auth/db/storage exports.

**Files:**

- Modify: `src/firebase/app.ts`
- Modify: `src/firebase/auth.ts`
- Modify: `src/firebase/db.ts`
- Modify: `src/firebase/storage.ts`
- Create: `src/firebase/emulators.ts`

**Requirements:**

- Throw clear configuration error when `VITE_DATA_SOURCE=firebase` and required env vars are missing.
- Avoid connecting emulators multiple times.
- Export typed Firebase instances.

**Verification:**

```bash
VITE_DATA_SOURCE=firebase npm run build
```

Expected: build passes; runtime config validation happens only at execution or is testable without crashing build.

### Task 4.2: Add Firestore timestamp conversion helpers

**Objective:** Normalize app date handling between Firestore and UI types.

**Files:**

- Create: `src/firebase/timestamps.ts`

**Functions:**

```ts
fromTimestamp(value: Timestamp | null | undefined): string | null
toTimestamp(value: string | Date): Timestamp
serverTimestampField(): FieldValue
```

**Verification:**

Add unit tests and run:

```bash
npm test -- src/firebase/timestamps.test.ts
```

### Task 4.3: Add Firestore converters

**Objective:** Keep Firestore reads/writes typed.

**Files:**

- Modify or create: `src/firebase/converters.ts`

**Converters needed:**

- user converter;
- provider converter;
- identity document converter;
- contact converter;
- conversation converter;
- message converter;
- review converter;
- visibility request converter;
- report converter;
- admin action converter.

**Verification:**

```bash
npm run build
```

---

## Phase 5: Firebase Auth and Registration

### Task 5.1: Implement Firebase session listener

**Objective:** Replace demo session state with real Firebase Auth state when data source is Firebase.

**Files:**

- Create: `src/services/firebase/auth.firebase.ts`
- Modify: `src/store/auth.store.ts` if store expects polling style

**Requirements:**

- `getCurrentSession()` reads `auth.currentUser` and `users/{uid}`.
- Store initialization subscribes to auth changes or calls a service that does.
- Loading state remains honest.

**Verification:**

- Unit test with mocked Firebase or emulator.
- Manual emulator test.

### Task 5.2: Implement customer registration

**Objective:** Create Firebase Auth user and Firestore user doc.

**Files:**

- Modify: `src/services/firebase/auth.firebase.ts`

**Requirements:**

- Validate input.
- Create auth user.
- Create `users/{uid}` with role `customer`.
- Set displayName if useful.
- Handle rollback/recovery if Firestore write fails.

**Verification:**

Emulator test:

```bash
npm run firebase:emulators
```

Then register a customer in app and inspect emulator UI.

### Task 5.3: Implement provider registration with identity upload

**Objective:** Create pending provider application with private identity document.

**Files:**

- Modify: `src/services/firebase/auth.firebase.ts`
- Modify: `src/features/auth/pages/register-page.tsx` if identity upload currently stores demo metadata only

**Requirements:**

- Create auth user.
- Create `users/{uid}` with role `provider`.
- Upload identity doc to `identityDocuments/{uid}/{fileName}`.
- Create `providers/{uid}` with `status: pending`.
- Create `providerIdentityDocuments/{uid}` metadata.
- Use batch/transaction where possible.
- Show pending screen after success.

**Verification:**

- Register provider in emulator.
- Confirm Storage file path exists.
- Confirm Firestore provider status is pending.
- Confirm public search does not show pending provider.

### Task 5.4: Implement login/logout

**Objective:** Use Firebase Auth for login/logout.

**Files:**

- Modify: `src/services/firebase/auth.firebase.ts`

**Verification:**

- Login with customer.
- Logout.
- Refresh app.
- Login persists after app restart.
- Invalid credentials show safe localized error.

---

## Phase 6: Firebase Provider Search/Profile

### Task 6.1: Implement profession list source

**Objective:** Load professions from Firestore or seed config consistently.

**Files:**

- Modify: `src/services/firebase/search.firebase.ts`
- Modify: `scripts/seed-dev.ts`

**Decision:** For v1, either:

- keep professions as static config; or
- store in Firestore `professions` collection.

Recommended: Firestore `professions` for admin manageability, with static fallback only in demo mode.

### Task 6.2: Implement approved provider search query

**Objective:** Query real providers from Firestore.

**Files:**

- Create: `src/services/firebase/search.firebase.ts`
- Modify: `firestore.indexes.json`

**Requirements:**

- `status == 'approved'`.
- profession filter.
- service area filter.
- deterministic ranking.
- paid visibility capped and labeled.

**Verification:**

- Seed approved and pending providers.
- Search shows approved only.
- Pending/rejected/suspended do not appear.

### Task 6.3: Implement provider profile reads

**Objective:** Load approved provider profiles and owner profiles from Firestore.

**Files:**

- Create: `src/services/firebase/providers.firebase.ts`

**Verification:**

- Anonymous can open approved profile.
- Anonymous cannot open pending profile.
- Provider owner can view own pending profile if route allows.

### Task 6.4: Implement provider profile updates/photos

**Objective:** Let approved providers update safe fields and photos.

**Files:**

- Modify: `src/services/firebase/providers.firebase.ts`
- Modify: `src/features/providers/pages/edit-provider-profile-page.tsx`

**Requirements:**

- Upload photo to Storage.
- Save URL/path in provider doc.
- Restrict fields to safe editable fields.

**Verification:**

- Provider uploads profile photo.
- Public can view profile photo.
- Other provider cannot overwrite it.

---

## Phase 7: Firebase Messaging and Contact

### Task 7.1: Implement contact creation on WhatsApp reveal

**Objective:** Record customer-provider contact in Firestore.

**Files:**

- Modify: `src/services/firebase/providers.firebase.ts`

**Requirements:**

- Signed-in customer only.
- Create or reuse contact doc.
- Do not create duplicate contacts for repeated reveals.

**Verification:**

- Customer reveals WhatsApp.
- `contacts` doc exists.
- Review eligibility is created.

### Task 7.2: Implement conversation creation

**Objective:** Start a conversation transactionally.

**Files:**

- Create: `src/services/firebase/messaging.firebase.ts`

**Requirements:**

- Deterministic conversation ID.
- Ensure both participants are correct.
- Create initial message.
- Update contact record if needed.

**Verification:**

- Customer starts message.
- Provider sees conversation.
- Non-participant cannot read it.

### Task 7.3: Implement real-time messages

**Objective:** Subscribe to conversation messages.

**Files:**

- Modify: `src/hooks/use-conversation.ts`
- Modify: `src/services/firebase/messaging.firebase.ts`

**Requirements:**

- Subscribe with `onSnapshot`.
- Cleanup subscription on unmount.
- Order by `createdAt`.
- Handle offline/loading/error states.

**Verification:**

- Send message as customer.
- Login as provider, message visible.
- Send provider reply, customer sees reply.

### Task 7.4: Add message abuse reporting entry point

**Objective:** Provide App Store UGC moderation path.

**Files:**

- Modify: `src/features/messaging/pages/conversation-page.tsx`
- Create or modify report UI component.
- Create: `src/services/firebase/reports.firebase.ts`

**Verification:**

- User can report conversation/message.
- Admin sees report.

---

## Phase 8: Firebase Reviews

### Task 8.1: Implement review eligibility check

**Objective:** Check contact existence before showing review form.

**Files:**

- Create: `src/services/firebase/reviews.firebase.ts`

**Verification:**

- No contact = cannot review.
- Contact = can review.
- Existing review = cannot review again.

### Task 8.2: Implement server-owned review creation

**Objective:** Prevent duplicate/fake reviews.

**Files:**

- Modify: `functions/src/reviews.ts`
- Modify: `src/services/firebase/reviews.firebase.ts`

**Requirements:**

- Callable/HTTPS function verifies auth and contact.
- Creates review.
- Marks contact reviewed.
- Recalculates rating.

**Verification:**

- Valid review succeeds.
- Duplicate review fails.
- Provider rating updates.

### Task 8.3: Implement review moderation

**Objective:** Admin can hide abusive reviews.

**Files:**

- Modify: `functions/src/reviews.ts`
- Modify: `src/services/firebase/admin.firebase.ts`
- Modify: admin reports/reviews UI if needed

**Verification:**

- Admin hides review.
- Public no longer sees it.
- Provider aggregate updates if hidden reviews are excluded.

---

## Phase 9: Admin and Moderation

### Task 9.1: Implement admin provider application list

**Objective:** Admin sees pending provider applications from Firestore.

**Files:**

- Create: `src/services/firebase/admin.firebase.ts`
- Modify: `src/features/admin/pages/applications-page.tsx` only if UI assumes demo shapes

**Verification:**

- Admin sees pending provider.
- Non-admin cannot access data.

### Task 9.2: Implement provider approval function

**Objective:** Server-owned provider approval.

**Files:**

- Create or modify: `functions/src/providers.ts`
- Modify: `functions/src/index.ts`
- Modify: `src/services/firebase/admin.firebase.ts`

**Verification:**

- Admin approves provider.
- Provider status becomes approved.
- Public search shows provider.
- Admin action log created.

### Task 9.3: Implement provider rejection function

**Objective:** Server-owned rejection with reason.

**Files:**

- Modify: `functions/src/providers.ts`
- Modify: `src/services/firebase/admin.firebase.ts`

**Verification:**

- Reject without reason fails.
- Reject with reason succeeds.
- Provider sees rejected/pending-state copy.
- Provider does not appear in search.

### Task 9.4: Implement provider suspension function

**Objective:** Server-owned suspension with audit trail.

**Files:**

- Modify: `functions/src/providers.ts`
- Modify: `src/services/firebase/admin.firebase.ts`

**Verification:**

- Suspended provider removed from public search.
- Provider dashboard shows suspended state.
- Admin action created.

### Task 9.5: Implement abuse report queue

**Objective:** Give Apple-review-safe moderation workflow.

**Files:**

- Modify: `src/features/admin/pages/reports-page.tsx`
- Modify: `src/services/firebase/admin.firebase.ts`
- Modify: `functions/src/abuse.ts`

**Verification:**

- User reports content.
- Admin sees report.
- Admin marks report reviewed/actioned/dismissed.

---

## Phase 10: Firebase Rules and Emulator Tests

### Task 10.1: Add Firestore rules tests

**Objective:** Prove security rules, not just app UI.

**Files:**

- Create: `tests/firebase/firestore.rules.test.ts`
- Configure test setup if missing

**Test cases:**

- anonymous approved provider read allowed;
- anonymous pending provider read denied;
- provider own identity read allowed;
- other provider identity read denied;
- customer/provider conversation isolation;
- admin application read allowed;
- customer admin action create denied.

**Verification:**

```bash
npm test -- tests/firebase/firestore.rules.test.ts
```

### Task 10.2: Add Storage rules tests

**Objective:** Prove identity documents are private.

**Files:**

- Create: `tests/firebase/storage.rules.test.ts`

**Test cases:**

- provider photo public read allowed;
- provider photo owner write allowed;
- provider photo other user write denied;
- identity document owner read allowed;
- identity document admin read allowed;
- identity document anonymous read denied.

**Verification:**

```bash
npm test -- tests/firebase/storage.rules.test.ts
```

### Task 10.3: Deploy staging Firebase

**Objective:** Validate deploy path.

**Files:**

- Review: `.firebaserc`
- Review: `firebase.json`

**Current `.firebaserc`:**

```json
{
  "projects": {
    "default": "hand-connect-cairo",
    "staging": "hand-connect-cairo",
    "production": "hand-connect-cairo"
  }
}
```

**Decision needed:** Use one Firebase project for staging/production or separate them. Recommended: separate staging and production before App Store submission.

**Verification:**

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,functions --project staging
```

Expected: deploy succeeds.

---

## Phase 11: iOS Capacitor Setup

### Task 11.1: Confirm final bundle ID

**Objective:** Avoid irreversible App Store identity mistakes.

**Decision required from owner:** choose final Bundle ID.

Recommended options:

- `com.mavoid.herafy`
- `com.herafy-eg.app`
- another Apple-team-owned namespace

Do not upload TestFlight until this is confirmed.

### Task 11.2: Install Capacitor dependencies

**Objective:** Add native-wrapper tooling.

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

**Command:**

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

**Verification:**

```bash
npx cap --version
npm run build
```

### Task 11.3: Add Capacitor config

**Objective:** Configure app ID/name/webDir.

**Files:**

- Create: `capacitor.config.ts`

**Content:**

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mavoid.herafy',
  appName: 'Herafy',
  webDir: 'dist',
  server: {
    iosScheme: 'https',
  },
};

export default config;
```

Replace `appId` with final confirmed ID.

**Verification:**

```bash
npm run build
npx cap doctor
```

### Task 11.4: Add package scripts

**Objective:** Make iOS sync/build repeatable.

**Files:**

- Modify: `package.json`

**Scripts:**

```json
{
  "cap:sync:ios": "npm run build && cap sync ios",
  "cap:open:ios": "cap open ios",
  "ios:build:web": "npm run build && cap copy ios"
}
```

**Verification:**

```bash
npm run cap:sync:ios
```

Expected initially fails until `ios` is added, or succeeds after Task 11.5.

### Task 11.5: Generate iOS project

**Objective:** Create `ios/` native project.

**Command:**

```bash
npm run build
npx cap add ios
npx cap sync ios
```

**Files generated:**

```txt
ios/App/App.xcworkspace
ios/App/App/Info.plist
ios/App/App/Assets.xcassets
ios/App/Podfile
```

**Verification:**

```bash
test -f ios/App/App.xcworkspace/contents.xcworkspacedata && echo ok
```

### Task 11.6: Configure iOS app display name and permissions

**Objective:** Prepare native metadata.

**Files:**

- Modify: `ios/App/App/Info.plist`
- Modify: iOS asset catalogs as needed

**Add only if needed:**

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Herafy lets providers upload profile or identity verification images during onboarding.</string>
<key>NSCameraUsageDescription</key>
<string>Herafy lets providers capture profile or identity verification images during onboarding.</string>
```

**Verification:**

```bash
plutil -lint ios/App/App/Info.plist
```

### Task 11.7: Configure app icon and launch screen

**Objective:** Replace default Capacitor branding.

**Files:**

- Modify: `ios/App/App/Assets.xcassets/AppIcon.appiconset/*`
- Modify: `ios/App/App/Base.lproj/LaunchScreen.storyboard` or Capacitor splash config

**Requirements:**

- No default Capacitor icon remains.
- Icon meets Apple sizes.
- Launch screen is simple and brand-safe.

**Verification:**

- Build and inspect simulator launch.
- Check Xcode asset warnings.

---

## Phase 12: iOS Build, Signing, and TestFlight

### Task 12.1: Build on iOS simulator

**Objective:** Prove native wrapper compiles.

**Command:**

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build
```

**Verification:**

Expected: `** BUILD SUCCEEDED **`.

### Task 12.2: Run app in simulator and smoke test

**Objective:** Catch WebView/runtime issues.

**Steps:**

1. Open workspace:

```bash
npx cap open ios
```

2. Run on simulator.
3. Test launch, login, search, provider profile, register screens.

**Verification:**

- No blank screen.
- Console has no fatal JS errors.
- Network requests hit correct Firebase project.

### Task 12.3: Configure signing

**Objective:** Prepare App Store distribution.

**Requires:**

- Apple Developer account.
- Xcode signed into Apple ID.
- Bundle ID registered.
- Team selected.

**Verification:**

Xcode Signing & Capabilities shows no red errors.

### Task 12.4: Archive release build

**Objective:** Produce App Store archive.

**Command:**

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -archivePath build/HandConnect.xcarchive archive
```

**Verification:**

Expected: archive succeeds and appears in Xcode Organizer.

### Task 12.5: Upload to TestFlight

**Objective:** Get Apple processing build.

Options:

- Xcode Organizer upload.
- `xcrun altool` / `notarytool` equivalents as supported.
- Fastlane later if desired.

**Verification:**

- Build appears in App Store Connect.
- Processing completes.
- Internal TestFlight testing available.

### Task 12.6: Real iPhone TestFlight smoke

**Objective:** Verify actual iOS behavior.

**Test checklist:**

- Install from TestFlight.
- Cold launch.
- Login/register.
- Provider identity upload.
- Search/profile/contact/message/review/report.
- Arabic/English toggle.
- Logout/session restore.
- App kill/reopen.

**Verification artifact:**

Create:

```txt
docs/ios-readiness/testflight-smoke-YYYY-MM-DD.md
```

Include device model, iOS version, build number, pass/fail notes.

---

## Phase 13: App Store Metadata and Compliance

### Task 13.1: Publish privacy policy and support pages

**Objective:** Provide required public URLs.

**Requirements:**

- Privacy policy URL live.
- Support URL live.
- Terms of use recommended.

**Privacy policy must mention:**

- account data;
- phone/email/name;
- provider identity documents;
- messages;
- reviews;
- abuse reports;
- Firebase/Google as infrastructure provider if appropriate;
- data deletion/contact process.

### Task 13.2: Write App Store listing copy

**Objective:** Create review-safe metadata.

**Files:**

- Create: `docs/app-store/listing.md`

**Include:**

- name;
- subtitle;
- description;
- keywords;
- promotional text;
- support URL;
- privacy URL;
- category recommendation.

### Task 13.3: Prepare reviewer notes

**Objective:** Reduce Apple review confusion.

**Files:**

- Create: `docs/app-store/reviewer-notes.md`

**Include:**

- test credentials;
- explanation of customer/provider/admin roles;
- exact steps to test;
- moderation/reporting path;
- note that verification is profile/identity review, not skill certification;
- Cairo launch scope.

### Task 13.4: Complete App Privacy questionnaire

**Objective:** Ensure App Store privacy answers match implementation.

**Files:**

- Create: `docs/app-store/privacy-questionnaire-draft.md`

**Include data categories:**

- Contact Info;
- User Content;
- Identifiers;
- Usage Data if tracked;
- Diagnostics if crash/analytics SDK added.

**Verification:**

Cross-check every Firestore collection and Storage path against privacy answers.

### Task 13.5: Capture final screenshots

**Objective:** Produce App Store screenshots from real iOS build.

**Requirements:**

- Use real app state.
- Avoid private user data.
- Arabic screenshots recommended for Cairo launch.
- English screenshots optional if listing supports both.

**Verification:**

Upload accepted by App Store Connect screenshot validator.

---

## Phase 14: Production Deployment and Final Release Gate

### Task 14.1: Split staging/production Firebase projects if needed

**Objective:** Avoid testing inside production data.

**Current risk:** `.firebaserc` maps default/staging/production to same project: `hand-connect-cairo`.

**Recommended:**

```json
{
  "projects": {
    "default": "hand-connect-staging",
    "staging": "hand-connect-staging",
    "production": "herafy-prod"
  }
}
```

Only do this after actual Firebase projects are created.

### Task 14.2: Deploy backend production

**Objective:** Publish rules/functions/indexes/storage.

**Command:**

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,functions --project production
```

**Verification:**

- Deploy succeeds.
- Functions visible in Firebase console.
- Rules timestamp updated.

### Task 14.3: Seed production admin and launch data

**Objective:** Ensure admin and initial professions exist.

**Commands:**

```bash
npm run seed:dev # rename/create production-safe seed before running in prod
npm run admin:create
```

**Important:** Do not run demo seed blindly in production. Create a production-safe seed script first.

### Task 14.4: Production smoke test

**Objective:** Prove real backend, real build, real app.

**Checklist:**

- Customer signup.
- Provider signup.
- Identity upload.
- Admin approval.
- Search approved provider.
- Message/contact.
- Review.
- Report abuse.
- Admin report review.
- Logout/session restore.

**Verification artifact:**

Create:

```txt
docs/ios-readiness/production-smoke-YYYY-MM-DD.md
```

### Task 14.5: Submit for App Review

**Objective:** Submit only after all gates pass.

**Pre-submit checklist:**

- TestFlight build verified.
- App privacy complete.
- Screenshots uploaded.
- Metadata complete.
- Review notes complete.
- Support/privacy URLs live.
- No placeholder/demo data in production UI.
- No default Capacitor branding.
- No debug console/log UI.
- No hidden admin-only route exposed without auth.

---

## 13. Acceptance Criteria

### 13.1 Engineering Acceptance

- `npm run release:check` passes.
- `cd functions && npm run build && npm test` passes.
- Production audit is clean or documented with accepted risk.
- Firebase rules tests pass.
- Capacitor iOS project builds in simulator.
- Xcode archive succeeds.
- TestFlight upload succeeds.

### 13.2 Product Acceptance

- Customers can complete search/contact/review flow.
- Providers can apply and manage approved profile.
- Admin can approve/reject/suspend providers.
- Abuse reports can be submitted and reviewed.
- Arabic RTL and English LTR are both usable.
- No demo/localStorage data in production mode.

### 13.3 Apple Review Acceptance

- Privacy policy URL is live.
- Support URL is live.
- Store privacy answers match actual data collection.
- Reviewer credentials work.
- App does not make unsupported service-guarantee claims.
- UGC moderation exists.
- Identity document handling is private.
- App launches reliably on real iPhone/TestFlight.

---

## 14. Open Decisions Required Before Implementation

1. Final Apple bundle ID.
2. Apple Developer Team/account to use.
3. Whether Firebase staging and production should be separate projects.
4. Whether v1 App Store listing primary language is Arabic or English.
5. Whether provider identity upload uses camera, photo library, file picker, or all three.
6. Whether in-app messaging needs blocking/mute in v1 or report-only moderation is acceptable.
7. Whether paid visibility/manual payment is in App Store v1 or deferred/hidden.
8. Final privacy policy/support URL domain.
9. Whether admin console should be accessible from iOS app or web-only for launch.
10. Whether App Store build should point at production Firebase immediately or staged/TestFlight Firebase until approval.

Recommended defaults:

- Bundle ID: `com.mavoid.herafy`.
- Separate staging/prod Firebase projects.
- Arabic primary listing, English secondary copy.
- Use photo library/file picker first; camera optional later.
- Include report abuse in v1; add blocking if messaging abuse risk is high.
- Keep admin console web-only if Apple review does not need it inside consumer app, but keep moderation operational.

---

## 15. Suggested Execution Order

1. Clean repo noise.
2. Fix E2E selector.
3. Fix Functions ESM build.
4. Resolve audits.
5. Add data-source adapter boundary.
6. Implement Firebase Auth.
7. Implement provider/search/profile Firebase services.
8. Implement messaging/contact Firebase services.
9. Implement reviews and Cloud Functions.
10. Implement admin/moderation Cloud Functions.
11. Add rules tests.
12. Deploy staging Firebase.
13. Run staging browser E2E.
14. Add Capacitor iOS.
15. Configure iOS assets/permissions/signing.
16. Build simulator.
17. Upload TestFlight.
18. Run real iPhone smoke.
19. Prepare App Store metadata/privacy/screenshots.
20. Production deploy.
21. Final production iOS smoke.
22. Submit for review.

---

## 16. Non-Negotiable Stop Rules

Do not claim “ready for App Store” if any of these are true:

- app still relies on demo/localStorage data in production;
- Firebase Functions do not build;
- root E2E is failing;
- no real iOS archive/TestFlight build exists;
- privacy policy/support URL is missing;
- user-generated content cannot be reported/moderated;
- identity documents are publicly readable;
- reviewer credentials do not work;
- production smoke has not been run against the same backend the iOS build uses.

---

## 17. Final Handoff Template

When implementation is complete, final handoff must include:

```txt
Repo:
Branch:
Commit:
Bundle ID:
iOS version/build:
Firebase project:
TestFlight build number:

Verification:
- npm run lint: PASS
- npm test: PASS
- npm run build: PASS
- npm run e2e: PASS
- functions build/test: PASS
- Firebase rules tests: PASS
- xcodebuild simulator: PASS
- Xcode archive: PASS
- TestFlight upload: PASS
- Real iPhone smoke: PASS

Store materials:
- Privacy URL:
- Support URL:
- Reviewer account:
- Screenshots uploaded: yes/no
- App privacy completed: yes/no

Known caveats:
- ...
```

Only after that handoff should the app be considered ready for human App Store submission.
