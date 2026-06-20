# Herafy Full Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Herafy web product as a Vite + React + Firebase directory-first home services platform for Cairo, with Arabic-first RTL UX, customer discovery, provider onboarding, real-time messaging, reviews, paid visibility requests, and an admin panel.

**Architecture:** Use a single Vite React app with strict layering: UI components call hooks, hooks call services, services call Firebase. Keep customer, provider, and admin experiences in one codebase behind role-aware routes and Firebase Security Rules. Build web-first; Capacitor comes after the browser product is stable.

**Tech Stack:** Vite, React, TypeScript, React Router, Firebase Auth, Firestore, Firebase Storage, Cloud Functions, Firebase Hosting, TanStack Query, Zustand, Tailwind CSS, shadcn/ui, i18next, React Hook Form, Zod, Vitest, Testing Library, Playwright, Recharts.

---

## Master References

- Product design spec: `docs/superpowers/specs/2026-04-29-herafy-design.md`
- Product positioning: directory-first connection layer, not an operator, marketplace, employer, payment processor, pricing authority, or service guarantor.
- Launch scope: Cairo, neighborhood-by-neighborhood rollout, initial professions are plumbing, electrical work, carpentry, and cleaning.
- Product defaults: Arabic-first, RTL default, English fallback, web-first, Firebase backend, manual admin payment confirmation.

## Implementation Principles

- Keep Firebase SDK usage inside `src/firebase/`, `src/services/`, and Firebase test/util files only.
- Keep components presentation-focused. Components may call hooks but must not import Firestore, Auth, Storage, or Functions SDKs directly.
- Treat identity verification as identity confirmation only. Do not imply skill certification.
- Treat paid visibility as capped exposure only. Do not guarantee jobs, leads, ranking, response, or service quality.
- Build and test each phase independently before moving to the next.
- Commit after each task or cohesive subtask once tests pass.

## Phase Overview

1. Project foundation and tooling
2. Design system, RTL, i18n, and app shell
3. Firebase foundation, data contracts, emulators, and rules baseline
4. Authentication, registration, role guards, and provider onboarding
5. Public directory, search, ranking, provider profiles, and WhatsApp reveal
6. Real-time messaging and lead tracking
7. Reviews and reputation aggregation
8. Provider dashboard, profile management, photos, service areas, and visibility requests
9. Admin console, verification workflow, moderation, professions, and manual payments
10. Security Rules, Cloud Functions integrity, abuse controls, and auditability
11. End-to-end QA, accessibility, performance, and release hardening
12. Firebase deployment, production configuration, and web launch
13. Capacitor preparation phase after web launch

---

## Target File Structure

Create or evolve toward this structure:

```text
herafy/
├── .env.example
├── .firebaserc
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── storage.rules
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.setup.ts
├── playwright.config.ts
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── reviews.ts
│   │   ├── visibility.ts
│   │   ├── audit.ts
│   │   └── abuse.ts
│   └── test/
│       ├── reviews.test.ts
│       └── visibility.test.ts
├── scripts/
│   ├── seed-dev.ts
│   ├── create-admin.ts
│   └── verify-indexes.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── app/
│   │   ├── empty-state.tsx
│   │   ├── error-boundary.tsx
│   │   └── loading-state.tsx
│   ├── config/
│   │   ├── neighborhoods.ts
│   │   ├── professions.ts
│   │   └── routes.ts
│   ├── firebase/
│   │   ├── app.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── storage.ts
│   │   ├── converters.ts
│   │   └── errors.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── providers.service.ts
│   │   ├── search.service.ts
│   │   ├── messaging.service.ts
│   │   ├── reviews.service.ts
│   │   ├── visibility.service.ts
│   │   ├── admin.service.ts
│   │   └── analytics.service.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-provider-profile.ts
│   │   ├── use-search-providers.ts
│   │   ├── use-conversation.ts
│   │   ├── use-contact-check.ts
│   │   └── use-admin-actions.ts
│   ├── store/
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   ├── router/
│   │   ├── app-router.tsx
│   │   ├── route-guards.tsx
│   │   └── redirects.ts
│   ├── layouts/
│   │   ├── app-layout.tsx
│   │   ├── auth-layout.tsx
│   │   ├── provider-layout.tsx
│   │   └── admin-layout.tsx
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── locales/ar.json
│   │   └── locales/en.json
│   ├── lib/
│   │   ├── cn.ts
│   │   ├── dates.ts
│   │   ├── phone.ts
│   │   ├── ranking.ts
│   │   ├── validation.ts
│   │   └── firebase-test-utils.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── provider.ts
│   │   ├── contact.ts
│   │   ├── messaging.ts
│   │   ├── review.ts
│   │   ├── visibility.ts
│   │   └── admin.ts
│   └── features/
│       ├── landing/
│       ├── auth/
│       ├── search/
│       ├── providers/
│       ├── messaging/
│       ├── reviews/
│       ├── dashboard/
│       └── admin/
└── tests/
    ├── e2e/
    └── rules/
```

---

## Phase 1: Project Foundation And Tooling

**Objective:** Turn the documentation-only repository into a working Vite + React + TypeScript application with quality gates.

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vitest.setup.ts`
- Create: `eslint.config.js`
- Create: `prettier.config.js`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/globals.css`

### Task 1.1: Create The Root App Package

- [ ] Create `package.json` with scripts:

```json
{
  "name": "herafy",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "e2e": "playwright test",
    "firebase:emulators": "firebase emulators:start --import=.firebase-emulator-data --export-on-exit",
    "seed:dev": "tsx scripts/seed-dev.ts",
    "admin:create": "tsx scripts/create-admin.ts"
  },
  "dependencies": {
    "@fontsource/cairo": "latest",
    "@fontsource/inter": "latest",
    "@hookform/resolvers": "latest",
    "@radix-ui/react-avatar": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-label": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-separator": "latest",
    "@radix-ui/react-slot": "latest",
    "@tanstack/react-query": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "firebase": "latest",
    "i18next": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-hook-form": "latest",
    "react-i18next": "latest",
    "react-router-dom": "latest",
    "recharts": "latest",
    "tailwind-merge": "latest",
    "tailwindcss-animate": "latest",
    "zod": "latest",
    "zustand": "latest"
  },
  "devDependencies": {
    "@eslint/js": "latest",
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "autoprefixer": "latest",
    "eslint": "latest",
    "eslint-plugin-react-hooks": "latest",
    "eslint-plugin-react-refresh": "latest",
    "firebase-tools": "latest",
    "globals": "latest",
    "jsdom": "latest",
    "postcss": "latest",
    "prettier": "latest",
    "tailwindcss": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "typescript-eslint": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

- [ ] Run `npm install`.
- [ ] Expected: `package-lock.json` is created and dependency install exits with code 0.

### Task 1.2: Add TypeScript, Vite, Test, Lint, And HTML Entrypoints

- [ ] Create `index.html`:

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Herafy helps people in Cairo find verified home service professionals quickly."
    />
    <title>Herafy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] Create `vite.config.ts` with React and Vitest config.
- [ ] Create `tsconfig.json` with strict mode, `baseUrl: "."`, and path alias `"@/*": ["src/*"]`.
- [ ] Create `tsconfig.node.json` for Vite config compilation.
- [ ] Create `vitest.setup.ts` importing `@testing-library/jest-dom/vitest`.
- [ ] Create `eslint.config.js` using TypeScript ESLint, React Hooks, and React Refresh.
- [ ] Create `prettier.config.js` with single quotes, trailing commas, and LF line endings.
- [ ] Run `npm run lint`.
- [ ] Expected: lint passes.

### Task 1.3: Add Minimal React Bootstrap

- [ ] Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] Create `src/App.tsx`:

```tsx
export default function App() {
  return <main>Herafy</main>;
}
```

- [ ] Create `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] Run `npm run build`.
- [ ] Expected: TypeScript and Vite build pass.
- [ ] Commit:

```powershell
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json vitest.setup.ts eslint.config.js prettier.config.js src
git commit -m "chore: initialize Vite React app"
```

---

## Phase 2: Design System, RTL, i18n, And App Shell

**Objective:** Establish Arabic-first UI foundations before feature work starts.

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `components.json`
- Create: `src/lib/cn.ts`
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/ar.json`
- Create: `src/i18n/locales/en.json`
- Create: `src/store/ui.store.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/app/language-toggle.tsx`
- Create: `src/layouts/app-layout.tsx`
- Create: `src/layouts/auth-layout.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles/globals.css`

### Task 2.1: Configure Tailwind And Base Theme

- [ ] Create `tailwind.config.ts` with RTL-safe content paths and shadcn-compatible theme tokens.
- [ ] Create `postcss.config.js`.
- [ ] Add Cairo and Inter font imports to `src/styles/globals.css`.
- [ ] Define CSS variables for background, foreground, primary, muted, card, border, destructive, radius.
- [ ] Set `body` font to Cairo by default and add `.font-latin` for Inter.
- [ ] Run `npm run build`.
- [ ] Expected: Tailwind compiles without unknown directive errors.

### Task 2.2: Add Shared UI Primitives

- [ ] Create `src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] Add shadcn-style primitives for button, card, input, label, select, and dialog in `src/components/ui/`.
- [ ] Each primitive must accept `className`, forward refs where appropriate, and use `cn`.
- [ ] Add tests for `Button` and `Card` rendering using Testing Library.
- [ ] Run `npm test`.
- [ ] Expected: UI primitive tests pass.

### Task 2.3: Add Arabic-First i18n

- [ ] Create `src/i18n/locales/ar.json` with keys for navigation, auth, search, provider profile, messaging, reviews, dashboard, admin, validation, and common actions.
- [ ] Create `src/i18n/locales/en.json` with matching keys.
- [ ] Create `src/i18n/index.ts`:

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

export const defaultLanguage = 'ar';
export type AppLanguage = 'ar' | 'en';

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] Import `src/i18n` in `src/main.tsx`.
- [ ] Add a test that all keys in `ar.json` exist in `en.json`.
- [ ] Run `npm test`.
- [ ] Expected: translation key parity test passes.

### Task 2.4: Add UI Store And Direction Sync

- [ ] Create `src/store/ui.store.ts` with `language`, `direction`, `setLanguage`, and `hydrateLanguage`.
- [ ] Persist language to `localStorage` under `herafy-language`.
- [ ] When language is Arabic, set `document.documentElement.lang = 'ar'` and `dir = 'rtl'`.
- [ ] When language is English, set `lang = 'en'` and `dir = 'ltr'`.
- [ ] Create `src/components/app/language-toggle.tsx`.
- [ ] Add unit tests for language persistence and `dir` changes.
- [ ] Run `npm test`.
- [ ] Expected: UI store tests pass.

### Task 2.5: Build App And Auth Layouts

- [ ] Create `src/layouts/app-layout.tsx` with responsive header, content container, language toggle, and Arabic-first navigation.
- [ ] Create `src/layouts/auth-layout.tsx` with centered auth panel and RTL-safe spacing.
- [ ] Keep navigation labels translated through `t(...)`.
- [ ] Replace `src/App.tsx` placeholder with app layout rendering a temporary home panel.
- [ ] Run `npm run build`.
- [ ] Commit:

```powershell
git add tailwind.config.ts postcss.config.js components.json src
git commit -m "feat: add RTL design system and app shell"
```

---

## Phase 3: Firebase Foundation, Contracts, Emulators, And Rules Baseline

**Objective:** Establish typed Firebase access and local emulator workflow before product data flows are built.

**Files:**
- Create: `.env.example`
- Create: `firebase.json`
- Create: `.firebaserc`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`
- Create: `storage.rules`
- Create: `src/firebase/app.ts`
- Create: `src/firebase/auth.ts`
- Create: `src/firebase/db.ts`
- Create: `src/firebase/storage.ts`
- Create: `src/firebase/converters.ts`
- Create: `src/firebase/errors.ts`
- Create: `src/types/user.ts`
- Create: `src/types/provider.ts`
- Create: `src/types/contact.ts`
- Create: `src/types/messaging.ts`
- Create: `src/types/review.ts`
- Create: `src/types/visibility.ts`
- Create: `src/types/admin.ts`
- Create: `scripts/seed-dev.ts`
- Create: `tests/rules/firestore.rules.test.ts`

### Task 3.1: Add Environment Contract

- [ ] Create `.env.example`:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATORS=true
```

- [ ] Add `.env.local` to `.gitignore` if missing.
- [ ] Create `src/firebase/app.ts` that validates required `VITE_FIREBASE_*` variables and initializes Firebase exactly once.
- [ ] Create `src/firebase/auth.ts`, `src/firebase/db.ts`, and `src/firebase/storage.ts`.
- [ ] If `VITE_USE_FIREBASE_EMULATORS === 'true'`, connect Auth, Firestore, and Storage emulators on localhost.
- [ ] Add a unit test proving missing env vars produce a clear configuration error.

### Task 3.2: Add Domain Types

- [ ] Create shared literal types:

```ts
export type UserRole = 'customer' | 'provider' | 'admin';
export type ProviderStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type VisibilityTier = 'organic' | 'paid';
export type ContactType = 'whatsapp_reveal' | 'platform_message';
export type ReviewStatus = 'visible' | 'under_review' | 'removed';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
```

- [ ] Define `AppUser`, `ProviderProfile`, `Profession`, `Contact`, `Conversation`, `Message`, `Review`, `VisibilityRequest`, and `AdminAction`.
- [ ] Use `Timestamp` from Firebase only at service boundaries; UI-facing types may expose `Date` where useful.
- [ ] Run `npm run build`.
- [ ] Expected: no implicit `any` or missing type errors.

### Task 3.3: Add Firestore Converters And Collection References

- [ ] Create `src/firebase/converters.ts` with typed converters for every collection.
- [ ] Export typed collection helpers:

```ts
export const collections = {
  users: 'users',
  providers: 'providers',
  professions: 'professions',
  reviews: 'reviews',
  contacts: 'contacts',
  conversations: 'conversations',
  visibilityRequests: 'visibilityRequests',
  adminActions: 'adminActions',
} as const;
```

- [ ] Add tests that provider converter round-trips a representative provider object.
- [ ] Run `npm test`.

### Task 3.4: Add Emulator Config, Indexes, And Baseline Rules

- [ ] Create `firebase.json` with Firestore, Storage, Functions, Hosting, and Emulator entries.
- [ ] Create `firestore.indexes.json` for:
  - `providers`: `status ASC`, `profession ASC`, `serviceAreaKeys ARRAY_CONTAINS`, `avgRating DESC`
  - `providers`: `status ASC`, `profession ASC`, `visibilityTier ASC`, `activityScore DESC`
  - `contacts`: `customerId ASC`, `providerId ASC`, `createdAt DESC`
  - `conversations`: `participants ARRAY_CONTAINS`, `lastMessageAt DESC`
  - `reviews`: `providerId ASC`, `status ASC`, `createdAt DESC`
  - `visibilityRequests`: `status ASC`, `requestedAt DESC`
- [ ] Create baseline `firestore.rules` with role helper functions.
- [ ] Create baseline `storage.rules` with private identity document access.
- [ ] Create `tests/rules/firestore.rules.test.ts` covering:
  - public can read approved providers
  - public cannot read pending providers
  - provider cannot read another provider's contacts
  - admin can read pending provider applications
- [ ] Run Firebase emulator rules tests.
- [ ] Commit:

```powershell
git add .env.example .gitignore firebase.json .firebaserc firestore.rules firestore.indexes.json storage.rules scripts tests src/firebase src/types
git commit -m "feat: add Firebase foundation and typed data contracts"
```

---

## Phase 4: Authentication, Registration, Role Guards, And Provider Onboarding

**Objective:** Allow customers and providers to register, sign in, create role-specific documents, and enter the correct route flow.

**Files:**
- Create: `src/services/auth.service.ts`
- Create: `src/store/auth.store.ts`
- Create: `src/hooks/use-auth.ts`
- Create: `src/router/app-router.tsx`
- Create: `src/router/route-guards.tsx`
- Create: `src/router/redirects.ts`
- Create: `src/features/auth/pages/login-page.tsx`
- Create: `src/features/auth/pages/register-page.tsx`
- Create: `src/features/auth/pages/pending-provider-page.tsx`
- Create: `src/features/auth/components/customer-register-form.tsx`
- Create: `src/features/auth/components/provider-register-form.tsx`
- Create: `src/features/auth/components/login-form.tsx`
- Create: `src/features/auth/validation.ts`
- Modify: `src/App.tsx`
- Modify: `firestore.rules`
- Modify: `storage.rules`

### Task 4.1: Implement Auth Service

- [ ] Write tests for `registerCustomer`, `registerProvider`, `login`, `logout`, and `subscribeToAuthState`.
- [ ] Implement `src/services/auth.service.ts` with Firebase Auth and Firestore user document creation.
- [ ] `registerCustomer` creates `/users/{uid}` with `role: 'customer'`.
- [ ] `registerProvider` creates `/users/{uid}` with `role: 'provider'` and `/providers/{uid}` with `status: 'pending'`.
- [ ] Provider registration uploads national ID to `identityDocuments/{uid}/national-id`.
- [ ] Return typed service results; normalize Firebase errors in `src/firebase/errors.ts`.
- [ ] Run `npm test`.

### Task 4.2: Implement Auth Store And Hook

- [ ] Create `src/store/auth.store.ts` with `user`, `role`, `providerStatus`, `isLoading`, and `isInitialized`.
- [ ] Create `src/hooks/use-auth.ts` for selector-style access.
- [ ] Subscribe once at app boot and fetch user/provider role metadata from Firestore.
- [ ] Handle provider statuses:
  - `pending`: may access `/pending`
  - `approved`: may access provider routes
  - `rejected`: show rejected status screen with admin reason
  - `suspended`: block provider routes with suspension notice
- [ ] Add tests for redirect state derivation.

### Task 4.3: Implement Router And Guards

- [ ] Create `src/router/app-router.tsx` with public, customer, provider, and admin route branches.
- [ ] Create `PublicRoute`, `ProtectedRoute`, `ProviderRoute`, and `AdminRoute`.
- [ ] Create `src/router/redirects.ts` with `getPostLoginRedirect(userState)`.
- [ ] Replace `App.tsx` with `QueryClientProvider`, router, and auth bootstrap.
- [ ] Test:
  - unauthenticated user visiting `/messages` redirects to `/login`
  - pending provider visiting `/dashboard` redirects to `/pending`
  - non-admin visiting `/admin` redirects to `/`

### Task 4.4: Implement Login And Registration UI

- [ ] Build `login-page.tsx`, `register-page.tsx`, `login-form.tsx`, `customer-register-form.tsx`, and `provider-register-form.tsx`.
- [ ] Use React Hook Form and Zod.
- [ ] Validate Egyptian phone numbers with `src/lib/phone.ts`.
- [ ] Require provider profession, service area, WhatsApp number, and national ID upload.
- [ ] Show Arabic validation errors from i18n.
- [ ] Add tests for form validation and successful submit service calls.

### Task 4.5: Implement Pending Provider Page

- [ ] Create `/pending` page explaining manual verification and no skill certification.
- [ ] Show provider application status, submitted date, and rejection reason if rejected.
- [ ] Avoid promising review time unless it is admin-configured.
- [ ] Run:

```powershell
npm run lint
npm test
npm run build
```

- [ ] Commit:

```powershell
git add src firestore.rules storage.rules
git commit -m "feat: add authentication and provider onboarding"
```

---

## Phase 5: Public Directory, Search, Ranking, Provider Profiles, And WhatsApp Reveal

**Objective:** Build the core customer value: find approved providers quickly by profession and neighborhood, inspect profiles, and initiate contact.

**Files:**
- Create: `src/config/neighborhoods.ts`
- Create: `src/config/professions.ts`
- Create: `src/lib/ranking.ts`
- Create: `src/services/providers.service.ts`
- Create: `src/services/search.service.ts`
- Create: `src/services/analytics.service.ts`
- Create: `src/hooks/use-search-providers.ts`
- Create: `src/hooks/use-provider-profile.ts`
- Create: `src/features/landing/pages/landing-page.tsx`
- Create: `src/features/search/pages/search-page.tsx`
- Create: `src/features/search/components/search-form.tsx`
- Create: `src/features/search/components/provider-result-card.tsx`
- Create: `src/features/search/components/featured-badge.tsx`
- Create: `src/features/providers/pages/provider-profile-page.tsx`
- Create: `src/features/providers/components/provider-contact-panel.tsx`
- Create: `src/features/providers/components/provider-rating-summary.tsx`
- Modify: `src/router/app-router.tsx`
- Modify: `firestore.rules`

### Task 5.1: Add Cairo Neighborhood And Profession Seeds

- [ ] Create `src/config/neighborhoods.ts` with normalized Cairo neighborhood slugs and Arabic/English names.
- [ ] Include launch neighborhoods explicitly, then expand by config only.
- [ ] Create `src/config/professions.ts` with:
  - plumbing: سباك
  - electrical: كهربائي
  - carpentry: نجار
  - cleaning: تنظيف
- [ ] Create `scripts/seed-dev.ts` to seed `/professions` and representative providers in emulator.
- [ ] Run `npm run seed:dev` against emulators.

### Task 5.2: Implement Provider And Search Services

- [ ] Write tests for `searchProviders`, `getProviderById`, `incrementProfileView`, and `revealWhatsApp`.
- [ ] Implement `providers.service.ts`:
  - fetch approved provider by id
  - increment profile view only for non-owner viewers
  - fetch provider reviews summary
- [ ] Implement `search.service.ts`:
  - query approved providers by profession and service area key
  - paginate with Firestore cursors
  - return raw candidates for ranking
- [ ] Implement `src/lib/ranking.ts` weighted score:
  - location relevance is required filter
  - reputation weight
  - activity score weight
  - paid visibility capped bonus
  - geographic fairness tie-breaker
- [ ] Ensure paid providers cannot outrank all organic providers solely because of payment.
- [ ] Run `npm test`.

### Task 5.3: Build Landing And Search Pages

- [ ] Create landing page with clear product framing:
  - find verified home service professionals
  - customers contact directly
  - platform does not set prices or guarantee work
- [ ] Create search page with profession and neighborhood filters.
- [ ] Use `useInfiniteQuery` for results.
- [ ] Render `ProviderResultCard` with rating, profession, areas, activity hint, and featured label.
- [ ] Add empty state when no providers exist in a neighborhood.
- [ ] Add loading skeletons.
- [ ] Test search form state and empty state.

### Task 5.4: Build Provider Public Profile

- [ ] Create profile route `/providers/:id`.
- [ ] Display name, profession, bio, service areas, rating summary, profile photos, and contact panel.
- [ ] Hide pending, suspended, rejected, or deleted providers from public users.
- [ ] Call `incrementProfileView` once per browser session per provider.
- [ ] Add tests for public profile rendering.

### Task 5.5: Implement WhatsApp Reveal Lead Flow

- [ ] In `provider-contact-panel.tsx`, require login before reveal.
- [ ] On reveal:
  - create `/contacts/{contactId}` with `type: 'whatsapp_reveal'`
  - reveal number in UI
  - open `https://wa.me/{egyptNormalizedPhone}`
- [ ] Prevent duplicate contact records for the same customer/provider/type within a short window.
- [ ] Count WhatsApp reveal as a lead.
- [ ] Test:
  - logged-out reveal redirects to login
  - logged-in reveal creates contact
  - duplicate reveal reuses or ignores existing contact safely
- [ ] Run:

```powershell
npm run lint
npm test
npm run build
```

- [ ] Commit:

```powershell
git add src scripts firestore.rules firestore.indexes.json
git commit -m "feat: add public provider discovery and WhatsApp leads"
```

---

## Phase 6: Real-Time Messaging And Lead Tracking

**Objective:** Build full in-platform chat where first message creates a lead and both sides get real-time conversations.

**Files:**
- Create: `src/services/messaging.service.ts`
- Create: `src/hooks/use-conversation.ts`
- Create: `src/features/messaging/pages/conversations-page.tsx`
- Create: `src/features/messaging/pages/conversation-page.tsx`
- Create: `src/features/messaging/components/conversation-list.tsx`
- Create: `src/features/messaging/components/message-thread.tsx`
- Create: `src/features/messaging/components/message-composer.tsx`
- Create: `src/features/messaging/components/unread-badge.tsx`
- Modify: `src/features/providers/components/provider-contact-panel.tsx`
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

### Task 6.1: Implement Messaging Service Contract

- [ ] Write tests for:
  - `startConversation`
  - `sendMessage`
  - `subscribeToConversation`
  - `subscribeToUserConversations`
  - `markConversationRead`
- [ ] Implement `startConversation(customerId, providerId)` using a deterministic conversation id: `${customerId}_${providerId}`.
- [ ] When starting from first platform message, create `/contacts/{contactId}` with `type: 'platform_message'`.
- [ ] Create or update `/conversations/{conversationId}` with participants, last message, last message timestamp, and unread count.
- [ ] Add messages to `/conversations/{conversationId}/messages/{messageId}`.
- [ ] Use Firestore transactions for unread count increments.

### Task 6.2: Build Conversation List

- [ ] Create `/messages` route for customers and providers.
- [ ] Query conversations by `participants array-contains currentUser.uid`, ordered by `lastMessageAt desc`.
- [ ] Render counterpart display name and last message preview.
- [ ] Show unread count per conversation.
- [ ] Add empty state explaining no messages yet.
- [ ] Test list rendering and unread badge behavior.

### Task 6.3: Build Chat Thread

- [ ] Create `/messages/:id` route.
- [ ] Subscribe to messages with `onSnapshot`.
- [ ] Render sender/receiver bubbles mirrored for RTL.
- [ ] Add `MessageComposer` with max length validation and disabled state while sending.
- [ ] Mark conversation read when thread opens and current user is a participant.
- [ ] Test send flow with mocked service.

### Task 6.4: Integrate Provider Contact Panel With Chat

- [ ] Add "Message" action to provider profile.
- [ ] Require login before message.
- [ ] If customer sends first message from profile, call `startConversation` and route to `/messages/:id`.
- [ ] Prevent providers from starting customer conversations from public profile.
- [ ] Ensure platform message contact creates review eligibility.
- [ ] Run:

```powershell
npm run lint
npm test
npm run build
```

- [ ] Commit:

```powershell
git add src firestore.rules firestore.indexes.json
git commit -m "feat: add real-time messaging and lead tracking"
```

---

## Phase 7: Reviews And Reputation Aggregation

**Objective:** Allow only customers who initiated contact to review providers and keep provider aggregate ratings accurate.

**Files:**
- Create: `src/services/reviews.service.ts`
- Create: `src/hooks/use-contact-check.ts`
- Create: `src/features/reviews/pages/new-review-page.tsx`
- Create: `src/features/reviews/components/review-form.tsx`
- Create: `src/features/reviews/components/review-list.tsx`
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/src/index.ts`
- Create: `functions/src/reviews.ts`
- Create: `functions/test/reviews.test.ts`
- Modify: `src/features/providers/pages/provider-profile-page.tsx`
- Modify: `firestore.rules`

### Task 7.1: Implement Contact Eligibility Check

- [ ] Write tests for `canCustomerReviewProvider(customerId, providerId)`.
- [ ] Implement service query against `/contacts` where customer and provider match.
- [ ] Return false when contact does not exist.
- [ ] Return false when contact exists but `hasReview === true`.
- [ ] Return true when contact exists and `hasReview === false`.

### Task 7.2: Implement Review Service

- [ ] Write tests for `createReview`, `getProviderReviews`, and `reportReview`.
- [ ] `createReview` must:
  - verify contact eligibility
  - create `/reviews/{reviewId}` with `status: 'visible'`
  - update contact `hasReview: true`
  - use a Firestore transaction
- [ ] Do not allow provider public replies.
- [ ] Add `under_review` and `removed` statuses for admin moderation.

### Task 7.3: Add Rating Aggregation Cloud Function

- [ ] Create Functions TypeScript project under `functions/`.
- [ ] Implement `onReviewWrite` function in `functions/src/reviews.ts`.
- [ ] On visible review create/update/delete, recalculate provider `avgRating` and `reviewCount`.
- [ ] Ignore reviews with `status !== 'visible'`.
- [ ] Add function tests for:
  - first review sets average
  - second review updates average
  - removed review is excluded
- [ ] Run `npm --prefix functions test`.

### Task 7.4: Build Review UI

- [ ] Create `/reviews/new/:providerId`.
- [ ] Gate route with customer auth and contact eligibility.
- [ ] Render `ReviewForm` with rating 1-5 and comment.
- [ ] Add provider profile review list.
- [ ] Show "Only customers who contacted this provider can review" when not eligible.
- [ ] Run:

```powershell
npm run lint
npm test
npm --prefix functions test
npm run build
```

- [ ] Commit:

```powershell
git add src functions firestore.rules
git commit -m "feat: add gated reviews and reputation aggregation"
```

---

## Phase 8: Provider Dashboard, Profile Management, Photos, Service Areas, And Visibility Requests

**Objective:** Give approved providers tools to manage their public profile, understand activity, and request paid visibility manually.

**Files:**
- Create: `src/layouts/provider-layout.tsx`
- Create: `src/features/dashboard/pages/provider-dashboard-page.tsx`
- Create: `src/features/dashboard/components/metric-card.tsx`
- Create: `src/features/dashboard/components/provider-stats-chart.tsx`
- Create: `src/features/providers/pages/edit-provider-profile-page.tsx`
- Create: `src/features/providers/components/provider-profile-form.tsx`
- Create: `src/features/providers/components/photo-uploader.tsx`
- Create: `src/features/providers/components/service-area-manager.tsx`
- Create: `src/services/visibility.service.ts`
- Create: `src/features/dashboard/pages/visibility-page.tsx`
- Create: `src/features/dashboard/components/visibility-request-form.tsx`
- Modify: `storage.rules`
- Modify: `firestore.rules`

### Task 8.1: Build Provider Layout And Dashboard

- [ ] Create `ProviderLayout` with navigation for dashboard, profile edit, messages, visibility.
- [ ] Create `/dashboard` page.
- [ ] Show profile views, contacts, review count, average rating, and current visibility tier.
- [ ] Use Recharts for simple trend visualization if historical stats exist; otherwise show current aggregate cards.
- [ ] Include copy that metrics are informational and not guaranteed outcomes.
- [ ] Test dashboard renders approved provider data.

### Task 8.2: Build Profile Editing

- [ ] Create provider profile form.
- [ ] Allow editing:
  - display name
  - bio
  - profession from centrally managed list only
  - WhatsApp number
  - WhatsApp visibility
  - service areas within allowed scope
- [ ] Do not allow editing identity verification status.
- [ ] Do not allow providers to create new professions.
- [ ] Validate phone, bio length, and service area count.
- [ ] Test that forbidden fields are not submitted.

### Task 8.3: Build Photo Uploads

- [ ] Create `photo-uploader.tsx`.
- [ ] Upload provider photos to `providerPhotos/{providerId}/{photoId}`.
- [ ] Enforce file type and size client-side.
- [ ] Store public photo URLs or storage paths on provider document.
- [ ] Update Storage Rules:
  - public can read provider photos for approved providers
  - provider can write only their own photos
  - provider cannot write identity documents after initial upload unless admin flow permits it
- [ ] Test upload service with emulator.

### Task 8.4: Build Service Area Management

- [ ] Create `service-area-manager.tsx`.
- [ ] Providers start with one service radius/area from onboarding.
- [ ] Additional service area requests go through visibility/payment request path if monetized.
- [ ] Admin-approved expansions update provider `serviceAreas`.
- [ ] Providers cannot directly add unlimited areas.
- [ ] Test service area validation.

### Task 8.5: Build Visibility Request Flow

- [ ] Implement `visibility.service.ts`.
- [ ] Provider submits visibility request with tier, requested service area, payment method note, and optional receipt note.
- [ ] Create `/visibilityRequests/{requestId}` with `status: 'pending'`.
- [ ] Do not change provider `visibilityTier` until admin approval.
- [ ] Build `/visibility` provider page.
- [ ] Display current tier, paid until date, pending requests, and no-guarantee explanation.
- [ ] Run:

```powershell
npm run lint
npm test
npm run build
```

- [ ] Commit:

```powershell
git add src firestore.rules storage.rules
git commit -m "feat: add provider dashboard and profile management"
```

---

## Phase 9: Admin Console, Verification, Moderation, Professions, And Manual Payments

**Objective:** Give admins operational control over provider approvals, visibility requests, professions, moderation, and audit logs.

**Files:**
- Create: `src/layouts/admin-layout.tsx`
- Create: `src/services/admin.service.ts`
- Create: `src/hooks/use-admin-actions.ts`
- Create: `src/features/admin/pages/admin-dashboard-page.tsx`
- Create: `src/features/admin/pages/applications-page.tsx`
- Create: `src/features/admin/pages/providers-page.tsx`
- Create: `src/features/admin/pages/professions-page.tsx`
- Create: `src/features/admin/pages/visibility-requests-page.tsx`
- Create: `src/features/admin/pages/reports-page.tsx`
- Create: `src/features/admin/pages/audit-log-page.tsx`
- Create: `src/features/admin/components/admin-table.tsx`
- Create: `src/features/admin/components/provider-application-review.tsx`
- Create: `src/features/admin/components/admin-action-dialog.tsx`
- Create: `src/features/admin/components/visibility-request-review.tsx`
- Modify: `src/router/app-router.tsx`
- Modify: `firestore.rules`
- Modify: `storage.rules`

### Task 9.1: Implement Admin Service

- [ ] Write tests for admin service actions:
  - approve provider
  - reject provider
  - suspend provider
  - update profession
  - approve visibility request
  - reject visibility request
  - remove review
  - list audit actions
- [ ] Every admin mutation must create `/adminActions/{actionId}`.
- [ ] Admin actions require reason text where the action negatively affects a provider or review.
- [ ] Implement `admin.service.ts`.

### Task 9.2: Build Admin Layout And Dashboard

- [ ] Create `AdminLayout` with routes:
  - `/admin`
  - `/admin/applications`
  - `/admin/providers`
  - `/admin/professions`
  - `/admin/visibility`
  - `/admin/reports`
  - `/admin/actions`
- [ ] Build admin dashboard with counts:
  - pending applications
  - approved providers
  - suspended providers
  - pending visibility requests
  - reviews under review
- [ ] Test admin guard blocks non-admins.

### Task 9.3: Build Provider Applications Review

- [ ] List pending providers.
- [ ] Show identity document preview only to admins.
- [ ] Show submitted profile data and service area.
- [ ] Approve action sets:
  - `status: 'approved'`
  - `nationalIdVerified: true`
  - `approvedAt`
- [ ] Reject action sets:
  - `status: 'rejected'`
  - `rejectionReason`
- [ ] Add audit entry for both.
- [ ] Do not expose identity document URL outside admin route.
- [ ] Test approval and rejection service calls.

### Task 9.4: Build Provider Management

- [ ] List all providers with filters by status, profession, neighborhood, and visibility tier.
- [ ] Allow suspend and reinstate.
- [ ] Suspension removes provider from public search by Security Rules and query filters.
- [ ] Add audit entry for every status change.
- [ ] Test that suspended provider disappears from search.

### Task 9.5: Build Profession Management

- [ ] List professions.
- [ ] Allow admin to create, update, reorder, activate, and deactivate professions.
- [ ] Providers can select only active professions.
- [ ] Public search shows only active professions.
- [ ] Add tests for active profession filtering.

### Task 9.6: Build Manual Visibility Payment Review

- [ ] List pending visibility requests.
- [ ] Approve request only after admin enters payment confirmation notes.
- [ ] Approval updates:
  - request `status: 'approved'`
  - request `paymentConfirmedBy`
  - request `processedAt`
  - provider `visibilityTier: 'paid'`
  - provider `visibilityPaidUntil`
- [ ] Reject request with reason.
- [ ] Add audit entries.
- [ ] Do not integrate Paymob, Stripe, wallets, Fawry, or any gateway in this phase.

### Task 9.7: Build Reports, Review Moderation, And Audit Log

- [ ] Add report list page for abuse/dispute records.
- [ ] Add review moderation page or section under reports.
- [ ] Admin can set review `status: 'under_review'` or `removed`.
- [ ] Providers cannot respond publicly to reviews.
- [ ] Audit log is read-only and filterable by admin, target type, action, and date.
- [ ] Run:

```powershell
npm run lint
npm test
npm run build
```

- [ ] Commit:

```powershell
git add src firestore.rules storage.rules
git commit -m "feat: add admin operations console"
```

---

## Phase 10: Security Rules, Cloud Functions Integrity, Abuse Controls, And Auditability

**Objective:** Make the backend enforce product boundaries even when the client is bypassed.

**Files:**
- Modify: `firestore.rules`
- Modify: `storage.rules`
- Modify: `functions/src/index.ts`
- Create: `functions/src/visibility.ts`
- Create: `functions/src/audit.ts`
- Create: `functions/src/abuse.ts`
- Create: `functions/test/visibility.test.ts`
- Create: `tests/rules/provider-access.rules.test.ts`
- Create: `tests/rules/messaging.rules.test.ts`
- Create: `tests/rules/admin.rules.test.ts`

### Task 10.1: Lock Down Firestore Rules

- [ ] Add rules enforcing:
  - public reads approved providers only
  - users read/write own user document with protected role fields immutable
  - providers can update allowed profile fields only
  - providers cannot approve themselves
  - providers cannot set visibility tier directly
  - customers can create contacts involving themselves only
  - reviews require matching contact
  - conversations can be read only by participants
  - messages can be created only by participants
  - admin-only reads for identity-sensitive data
- [ ] Add rules tests for each case.
- [ ] Run rules tests against emulator.

### Task 10.2: Lock Down Storage Rules

- [ ] Add rules enforcing:
  - provider photos read publicly only when provider is approved
  - provider photos writeable only by owner
  - identity documents writeable only by owner during application flow
  - identity documents readable only by admins
- [ ] Add storage rules tests.

### Task 10.3: Move Sensitive Mutations To Cloud Functions Where Needed

- [ ] Use callable/admin functions for operations that need server trust:
  - approve provider
  - reject provider
  - suspend provider
  - approve visibility request
  - reject visibility request
  - aggregate reviews
- [ ] Ensure client-side admin service calls functions instead of directly writing protected fields where rules require it.
- [ ] Validate admin role via custom claims or trusted admin user document lookup.
- [ ] Add tests for non-admin rejection.

### Task 10.4: Add Abuse Controls

- [ ] Add lightweight rate checks for:
  - repeated WhatsApp reveals
  - repeated first messages to many providers
  - review spam
- [ ] Store abuse signals in admin-readable collection.
- [ ] Do not block legitimate emergency usage with overly strict global limits.
- [ ] Add admin visibility into abuse records.

### Task 10.5: Verify Audit Completeness

- [ ] Ensure all admin mutations create an audit record.
- [ ] Ensure audit records are append-only from the client perspective.
- [ ] Add tests proving non-admin cannot create or delete audit records.
- [ ] Run:

```powershell
npm run lint
npm test
npm --prefix functions test
npm run build
```

- [ ] Commit:

```powershell
git add firestore.rules storage.rules functions tests src
git commit -m "feat: enforce backend security and audit controls"
```

---

## Phase 11: End-To-End QA, Accessibility, Performance, And Release Hardening

**Objective:** Validate the full browser product from real user flows before deployment.

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/search.spec.ts`
- Create: `tests/e2e/messaging.spec.ts`
- Create: `tests/e2e/reviews.spec.ts`
- Create: `tests/e2e/admin.spec.ts`
- Create: `tests/e2e/rtl.spec.ts`
- Create: `src/components/error-boundary.tsx`
- Create: `src/components/loading-state.tsx`
- Create: `src/components/empty-state.tsx`
- Modify: `src/App.tsx`

### Task 11.1: Add Playwright

- [ ] Create Playwright config using local Vite dev server.
- [ ] Add test seed setup that creates:
  - customer user
  - pending provider
  - approved provider
  - admin user
  - active professions
- [ ] Ensure tests can run against Firebase emulators.

### Task 11.2: Add E2E Coverage For Core Flows

- [ ] `auth.spec.ts`:
  - customer registration
  - provider registration lands on pending
  - login redirects by role
- [ ] `search.spec.ts`:
  - search by profession and neighborhood
  - provider profile loads
  - paid listing label appears but is not presented as guaranteed placement
- [ ] `messaging.spec.ts`:
  - customer starts conversation
  - provider receives message
  - unread count clears on open
- [ ] `reviews.spec.ts`:
  - customer without contact cannot review
  - customer with contact can review
  - review appears on profile after aggregation
- [ ] `admin.spec.ts`:
  - admin approves provider
  - admin confirms visibility request
  - admin suspends provider
- [ ] `rtl.spec.ts`:
  - Arabic default has `dir="rtl"`
  - English toggle has `dir="ltr"`

### Task 11.3: Add Error, Loading, And Empty States

- [ ] Add app-level error boundary.
- [ ] Add feature-level empty states for search, messages, reviews, provider dashboard, admin tables.
- [ ] Add loading skeletons for search results, profile, chat, admin tables.
- [ ] Ensure errors are translated and do not expose Firebase internals.

### Task 11.4: Accessibility And Mobile Web QA

- [ ] Keyboard-test login, search, profile contact actions, chat composer, review form, admin dialogs.
- [ ] Ensure focus returns after dialogs close.
- [ ] Ensure tap targets are usable on mobile widths.
- [ ] Validate color contrast for primary actions and featured badges.
- [ ] Ensure all form fields have labels in Arabic and English.

### Task 11.5: Performance Pass

- [ ] Confirm search uses indexed Firestore queries.
- [ ] Confirm profile pages avoid duplicate profile view increments.
- [ ] Confirm chat subscriptions unsubscribe on route change.
- [ ] Confirm images are constrained and lazy-loaded.
- [ ] Run production build and inspect bundle chunks.
- [ ] Run:

```powershell
npm run lint
npm test
npm run e2e
npm run build
```

- [ ] Commit:

```powershell
git add src tests playwright.config.ts
git commit -m "test: add end-to-end coverage and release hardening"
```

---

## Phase 12: Firebase Deployment, Production Configuration, And Web Launch

**Objective:** Deploy the web app and backend safely with environment separation.

**Files:**
- Modify: `firebase.json`
- Modify: `.firebaserc`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/firebase-hosting.yml`
- Create: `docs/deployment.md`
- Create: `docs/operations/admin-runbook.md`

### Task 12.1: Configure Firebase Projects

- [ ] Create separate Firebase projects for development/staging/production.
- [ ] Update `.firebaserc` aliases:

```json
{
  "projects": {
    "default": "hand-connect-dev",
    "staging": "hand-connect-staging",
    "production": "hand-connect-production"
  }
}
```

- [ ] Store production env vars outside git.
- [ ] Confirm `.env.local` remains ignored.

### Task 12.2: Add CI

- [ ] Create `.github/workflows/ci.yml`.
- [ ] CI must run:
  - `npm ci`
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - `npm --prefix functions ci`
  - `npm --prefix functions test`
- [ ] CI should not require production Firebase secrets for unit tests.

### Task 12.3: Add Hosting Deployment

- [ ] Configure Firebase Hosting for Vite `dist`.
- [ ] Configure rewrites to `index.html`.
- [ ] Deploy Firestore rules, indexes, Storage rules, Functions, and Hosting through controlled command:

```powershell
firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting --project production
```

- [ ] Do not deploy production until staging smoke test passes.

### Task 12.4: Write Admin Operations Runbook

- [ ] Create `docs/operations/admin-runbook.md` covering:
  - approving providers
  - rejecting providers
  - suspending providers
  - confirming visibility payments manually
  - handling review removal requests
  - interpreting audit logs
  - what admins must not promise to providers or customers

### Task 12.5: Launch Checklist

- [ ] Verify seeded professions are correct.
- [ ] Verify first Cairo neighborhoods are correct.
- [ ] Verify admin account exists and has admin role/custom claim.
- [ ] Verify no test users appear in production.
- [ ] Verify public search works logged out.
- [ ] Verify provider registration works.
- [ ] Verify identity document is private.
- [ ] Verify admin can approve provider.
- [ ] Verify approved provider appears in search.
- [ ] Verify WhatsApp reveal creates contact.
- [ ] Verify chat creates contact.
- [ ] Verify review eligibility works.
- [ ] Verify manual visibility approval works.
- [ ] Run:

```powershell
npm run lint
npm test
npm run e2e
npm run build
firebase deploy --only hosting --project staging
```

- [ ] Commit:

```powershell
git add .github firebase.json .firebaserc docs
git commit -m "chore: add deployment pipeline and operations runbook"
```

---

## Phase 13: Capacitor Preparation After Web Launch

**Objective:** Prepare the stable web app for mobile wrapping without compromising the web release.

**Files:**
- Create later: `capacitor.config.ts`
- Create later: `android/`
- Create later: `ios/`
- Create later: `docs/mobile/capacitor-plan.md`

### Task 13.1: Mobile Readiness Audit

- [ ] Confirm all critical flows work at mobile viewport widths.
- [ ] Confirm no browser-only assumptions block WebView.
- [ ] Confirm WhatsApp deep links work from Android WebView.
- [ ] Confirm file uploads work for identity documents and provider photos.
- [ ] Confirm Firebase Auth flows work inside Capacitor environment.

### Task 13.2: Add Capacitor In A Separate Branch

- [ ] Install Capacitor packages after web launch:

```powershell
npm install @capacitor/core @capacitor/cli
npx cap init "Herafy" "com.herafy-eg.app" --web-dir dist
```

- [ ] Add Android first unless business requirements change.
- [ ] Keep iOS as a separate validation path because App Store review has different privacy and UGC constraints.

### Task 13.3: Mobile-Specific Validation

- [ ] Build web assets:

```powershell
npm run build
npx cap sync android
npx cap open android
```

- [ ] Test on Android emulator and physical Android device.
- [ ] Validate deep links, file upload, keyboard behavior, safe areas, and RTL rendering.
- [ ] Create a separate mobile release checklist before store submission.

---

## Cross-Phase Data Model Checklist

- [ ] `/users/{userId}` has `uid`, `email`, `role`, `displayName`, `phone`, `createdAt`, `language`.
- [ ] `/providers/{providerId}` has `userId`, `profession`, `bio`, `nationalIdVerified`, `status`, `serviceAreas`, `serviceAreaKeys`, `whatsappNumber`, `whatsappVisible`, `visibilityTier`, `visibilityPaidUntil`, `profileViews`, `avgRating`, `reviewCount`, `activityScore`, `createdAt`, `approvedAt`.
- [ ] `/professions/{professionId}` has `nameAr`, `nameEn`, `slug`, `icon`, `active`, `sortOrder`.
- [ ] `/reviews/{reviewId}` has `providerId`, `customerId`, `contactId`, `rating`, `comment`, `status`, `createdAt`.
- [ ] `/contacts/{contactId}` has `customerId`, `providerId`, `type`, `createdAt`, `hasReview`.
- [ ] `/conversations/{conversationId}` has `participants`, `providerId`, `customerId`, `lastMessage`, `lastMessageAt`, `unreadCount`.
- [ ] `/conversations/{conversationId}/messages/{messageId}` has `senderId`, `text`, `createdAt`, `read`.
- [ ] `/visibilityRequests/{requestId}` has `providerId`, `tier`, `serviceArea`, `status`, `paymentConfirmedBy`, `paymentMethod`, `notes`, `requestedAt`, `processedAt`.
- [ ] `/adminActions/{actionId}` has `adminId`, `targetType`, `targetId`, `action`, `reason`, `createdAt`.

## Cross-Phase Security Checklist

- [ ] Customers never pay in the product flow.
- [ ] Provider payments are manual admin confirmation only.
- [ ] Providers cannot create professions.
- [ ] Providers cannot approve themselves.
- [ ] Providers cannot directly set paid visibility.
- [ ] Providers cannot publicly respond to reviews.
- [ ] Customers can review only after contact.
- [ ] Identity documents are private and admin-readable only.
- [ ] Pending, rejected, and suspended providers are not publicly discoverable.
- [ ] Paid visibility is labeled and capped.
- [ ] Search does not imply job guarantees.
- [ ] Admin mutations are audited.
- [ ] User data is not sold or exposed through broad reads.

## Required Validation Commands Before Final Web Launch

Run these from repository root:

```powershell
npm run lint
npm test
npm --prefix functions test
npm run e2e
npm run build
firebase emulators:exec "npm run e2e"
firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting --project staging
```

Expected:

- lint passes
- unit tests pass
- Firebase rules tests pass
- Functions tests pass
- E2E tests pass against emulators
- production build succeeds
- staging deploy succeeds before production deploy

## Self-Review

**Spec coverage:** This plan covers the approved spec sections: project structure, Firebase data model, public/customer/provider/admin routes, role guards, provider verification, search and ranking, WhatsApp leads, real-time messaging, review gating, reputation aggregation, manual paid visibility, provider dashboard, i18n/RTL, security rules, and web-first deployment.

**Known deferred scope:** Capacitor implementation is intentionally phase 13 after web launch. Payment gateway integration is intentionally excluded because the approved scope is manual admin payment confirmation.

**Placeholder scan:** No unfinished placeholder markers, unassigned ownership, or vague future-work instructions remain. Deferred mobile work is explicitly scoped as a later phase with concrete steps.

**Type consistency:** Collection names, role values, provider statuses, review statuses, contact types, and visibility request statuses match the approved product design spec.
