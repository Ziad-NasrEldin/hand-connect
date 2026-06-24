# Section 3 Implementation Plan - Provider Profiles

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 3.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 3.1-3.3.

Goal: make provider profiles fully implemented for Herafy v1: approved provider profiles expose the required public directory information, unapproved or moderated providers stay hidden from customer discovery, providers can describe their independent services/contact methods without platform-controlled pricing, and tests prove the public profile contract.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 3.1 Profile Data | Partially implemented | Public profiles display provider name, profession, bio, service areas, photos, visible reviews, aggregate rating, WhatsApp, and in-app messaging. Coverage radius or equivalent coverage indicator is not modeled/displayed, review count is not displayed on the profile card, and profile render tests are incomplete. |
| 3.2 Approval Visibility | Implemented | Public provider reads, search queries, contact callables, and rules are approval-gated. Existing rules tests cover anonymous approved read and pending read denial. Needs browser smoke and Firebase adapter coverage for rejected/suspended/banned exclusion. |
| 3.3 Provider Independence | Partially implemented | Profile copy says contact is direct and the platform does not set price or guarantee the job. Profiles support service areas and contact options. Needs explicit regression coverage that profile UI and data model do not introduce platform-controlled pricing, booking, job assignment, or execution-control language. |

## Product Decisions Needed Before Implementation

### Decision A - Coverage indicator model for provider profiles

The SRS requires coverage radius or an equivalent coverage indicator.

Recommended v1 decision: **use explicit `coverageRadiusKm` plus visible service-area chips.**

Reason:

- Section 2 already needs coverage-aware search.
- A numeric radius is easier to validate, test, backfill, and explain than hidden search-only behavior.
- The current model already has `serviceAreas` and `serviceAreaKeys`, so `coverageRadiusKm` can extend the existing data shape without replacing neighborhood search.

Implementation implication:

- Add `coverageRadiusKm` to `ProviderProfile`.
- Add min/default/max constants in one shared module.
- Backfill existing demo/Firebase provider docs with a safe default.
- Display a localized coverage line on search cards and provider profiles.
- Keep the detailed geospatial matching work aligned with Section 2, but Section 3 should at least expose the indicator on the profile.

### Decision B - Who can edit profile coverage

Coverage radius affects search visibility and customer expectations.

Recommended v1 decision: **provider can see coverage radius, but provider self-editing is constrained or admin-controlled until Section 2 coverage rules are complete.**

Reason:

- Allowing arbitrary provider radius creates an easy visibility bypass.
- Paid area expansion already exists and uses review count/admin approval.
- A simple default radius keeps public profiles SRS-compliant without weakening search fairness.

Implementation implication:

- If providers can edit the radius, validate it on client, service, rules, and functions.
- If providers cannot edit the radius in v1, document the default and expose it as read-only profile data.
- Do not let paid visibility override coverage constraints.

### Decision C - How to present independent-provider boundaries

The SRS forbids implying platform control over provider pricing or work execution.

Recommended v1 decision: **profiles may describe services, areas, and contact methods, but must not include platform-set price fields, booking confirmation, job status, dispatch, guaranteed outcome, or platform-managed execution copy.**

Reason:

- Herafy is positioned as a directory and connection layer.
- Contact can happen through WhatsApp or messages, but pricing and work execution stay between customer and provider.
- This avoids marketplace/payment/operations obligations that are outside the SRS.

Implementation implication:

- Keep `provider.noGuarantee` visible on the public profile.
- Add regression tests or static checks for forbidden product concepts on profile/search surfaces.
- If optional provider service descriptions are added later, keep them descriptive only.

## Target End State

Section 3 is complete when:

1. Public provider profiles display provider name.
2. Public provider profiles display profession with localized label.
3. Public provider profiles display service area.
4. Public provider profiles display coverage radius or an approved equivalent coverage indicator.
5. Public provider profiles support photos.
6. Public provider profiles display descriptive information.
7. Public provider profiles display aggregate rating when available.
8. Public provider profiles display visible reviews when available.
9. Public provider profiles display available contact options.
10. Pending, rejected, suspended, banned, or otherwise unapproved providers do not appear in customer search or public profile reads.
11. Provider status changes immediately affect search/profile/contact visibility.
12. Profiles let providers describe services, areas, and contact methods without platform-controlled pricing.
13. Profiles do not imply Herafy controls pricing, job assignment, booking, scheduling, service delivery, or outcomes.
14. Unit, rules, Firebase-adapter, and e2e coverage proves the profile contract.

## Detailed Implementation Plan

## 3.1 Profile Data

### Requirements Covered

- `PROFILE-001`: Provider profiles MUST include provider name.
- `PROFILE-002`: Provider profiles MUST include profession.
- `PROFILE-003`: Provider profiles MUST include service area.
- `PROFILE-004`: Provider profiles MUST include coverage radius or equivalent coverage indicator.
- `PROFILE-005`: Provider profiles MUST support photos.
- `PROFILE-006`: Provider profiles MUST include basic descriptive information.
- `PROFILE-007`: Provider profiles MUST display rating when available.
- `PROFILE-008`: Provider profiles MUST display reviews when available.
- `PROFILE-009`: Provider profiles MUST display available contact options.

### Current Implementation Evidence

- `src/types/provider.ts`
  - `ProviderProfile` includes `displayName`, `phone`, `profession`, `bio`, `serviceAreas`, `serviceAreaKeys`, `whatsappNumber`, `whatsappVisible`, `profileViews`, `avgRating`, `reviewCount`, and `photos`.
  - No `coverageRadiusKm` or equivalent coverage-distance field exists.
- `src/features/providers/pages/provider-profile-page.tsx`
  - reads the profile through `useProviderProfile(id)`.
  - displays the first photo when available.
  - displays `displayName`.
  - displays localized profession with `getProfessionName`.
  - displays `bio`.
  - displays `serviceAreaKeys` as localized area chips.
  - displays direct-contact/no-guarantee copy.
  - displays WhatsApp reveal and message actions.
  - displays visible reviews loaded through `getProviderReviews`.
  - does not display `avgRating` or `reviewCount` in the main profile header.
  - does not display coverage radius or any explicit equivalent coverage indicator beyond area chips.
- `src/features/search/pages/search-page.tsx`
  - search result cards display photo, display name, profession, bio, service areas, aggregate rating, and a profile link.
  - search cards do not display review count or coverage radius.
- `src/features/providers/pages/edit-provider-profile-page.tsx`
  - provider can edit bio, profession, one service area, WhatsApp number, WhatsApp visibility, and profile photo.
  - display name is shown but disabled.
  - coverage radius is not editable or visible.
- `src/services/firebase/providers.firebase.ts`
  - `safeProviderPatch` permits display name, bio, profession, WhatsApp fields, service areas, service-area keys, and photos.
  - profile photo upload writes under `providerPhotos/{providerId}/...`.
- `storage.rules`
  - public reads are allowed for `providerPhotos/{providerId}/{fileName}`.
  - writes are allowed only by the owner provider id.
- `src/services/firebase/reviews.firebase.ts`
  - profile reviews query `reviews` by `providerId`, `status == visible`, and descending `createdAt`.
- `functions/src/reviews.ts`
  - `createReview` recalculates `avgRating` and `reviewCount`.
  - `hideReview` recalculates provider aggregates after moderation.
- `src/services/demo/reviews.demo.ts`
  - demo review creation and hiding also recalculate `avgRating` and `reviewCount`.

### Work Items

#### 3.1.1 Add provider coverage radius field or approved equivalent

Files / areas:

- `src/types/provider.ts`
- `src/services/demo/seed-data.ts`
- `src/services/demo/auth.demo.ts`
- `src/services/firebase/auth.firebase.ts`
- `src/firebase/converters.ts`
- `tests/rules/firestore.rules.test.ts`
- `docs/product/implementation-plans/section-02-search-discovery.md`

Implementation:

- Add `coverageRadiusKm: number` to `ProviderProfile`, unless product chooses an explicitly named equivalent field.
- Add constants such as `defaultCoverageRadiusKm`, `minCoverageRadiusKm`, and `maxCoverageRadiusKm`.
- Seed demo providers with the default radius.
- Ensure provider registration creates new provider docs with the default radius.
- Ensure Firestore converter tests include the field.
- Decide whether existing providers missing this field fall back in converter/service code or require a one-time backfill.

Acceptance criteria:

- TypeScript provider model includes the coverage indicator.
- New provider docs always have a finite valid indicator.
- Existing/demo providers render without crashing.
- Tests cover missing/invalid/default radius handling.

#### 3.1.2 Display coverage indicator on public profile and search cards

Files / areas:

- `src/features/providers/pages/provider-profile-page.tsx`
- `src/features/search/pages/search-page.tsx`
- `src/locales/en.json`
- `src/locales/ar.json`
- profile/search component tests or e2e tests

Implementation:

- Add localized profile copy such as "Covers up to 10 km from listed areas" or an equivalent neighborhood-based label.
- Display the coverage indicator near service-area chips on the provider profile.
- Display compact coverage text on search cards if space allows.
- Keep service-area chips as the primary concrete location display.
- Ensure Arabic and English strings are present.

Acceptance criteria:

- Public profile clearly shows service areas and coverage radius/equivalent.
- Search card gives customers enough coverage context before opening a profile.
- Text fits on mobile.
- Arabic and English labels render without overflow.

#### 3.1.3 Add profile render coverage for required public fields

Files / areas:

- `src/features/providers/pages/provider-profile-page.tsx`
- component test file to add near the page or under existing test conventions
- `tests/e2e/app.spec.ts`

Implementation:

- Add a component or e2e assertion for approved provider profile rendering.
- Assert display name, profession, bio, service area, coverage indicator, photo alt/source when provided, contact buttons, aggregate rating/review count, and reviews.
- Assert review empty state if product wants one.
- Assert profile remains readable on mobile viewport.

Acceptance criteria:

- Tests fail if any required SRS profile field disappears from the public profile.
- Tests cover at least one profile with visible reviews and one profile without reviews.
- Mobile viewport does not clip profile/contact controls.

#### 3.1.4 Display aggregate rating and review count consistently

Files / areas:

- `src/features/providers/pages/provider-profile-page.tsx`
- `src/features/search/pages/search-page.tsx`
- `src/locales/en.json`
- `src/locales/ar.json`
- review/provider tests

Implementation:

- Keep numeric average rating on search result cards.
- Add review count next to rating on search cards and/or the provider profile header.
- Add profile header rating summary so `PROFILE-007` does not depend only on individual review rows.
- Hide or neutralize rating summary when no review data exists, depending on product decision.

Acceptance criteria:

- Provider with reviews shows rating and review count.
- Provider without reviews does not imply a fake rating.
- Review list still shows visible review details.
- Hidden/removed reviews do not contribute to aggregate display.

#### 3.1.5 Harden provider profile editing constraints

Files / areas:

- `src/features/providers/pages/edit-provider-profile-page.tsx`
- `src/services/firebase/providers.firebase.ts`
- `firestore.rules`
- `src/services/demo/providers.demo.ts`

Implementation:

- Decide whether providers can edit `serviceAreas` directly in v1.
- If yes, update Firestore rules to allow owner updates to `serviceAreas` and `serviceAreaKeys`, because current rules only allow owners to update display/profile/contact/photo fields.
- If no, remove or disable direct service-area editing in the provider profile edit page and route area changes through the paid/admin area-expansion flow.
- Add validation for profession, service area, WhatsApp number, bio length, and photo metadata.
- Ensure owner updates cannot change `status`, `nationalIdVerified`, `visibilityTier`, `avgRating`, `reviewCount`, `profileViews`, or admin-controlled fields.

Acceptance criteria:

- Provider edit UI matches Firestore rules and does not show controls that production rules deny.
- Provider-owned update path cannot mutate approval, rating, visibility, or analytics fields.
- Tests cover allowed and forbidden owner profile updates.

#### 3.1.6 Keep photo upload safe and profile-photo UX complete

Files / areas:

- `src/services/firebase/providers.firebase.ts`
- `storage.rules`
- `tests/rules/storage.rules.test.ts`
- `src/features/providers/pages/edit-provider-profile-page.tsx`

Implementation:

- Preserve public reads for provider photos.
- Preserve owner-only writes under `providerPhotos/{providerId}`.
- Add file size/type guard in the edit UI before upload.
- Add user-readable upload failure state.
- Add test coverage for public photo read and non-owner write denial if not already sufficient.

Acceptance criteria:

- Public profile can display provider photos.
- Non-owner cannot upload into another provider photo path.
- Oversized or invalid files do not reach Firebase upload.
- Upload failure does not silently discard the provider form state.

### Tests for 3.1

#### Unit/component tests

- Profile page renders name, profession, bio, service area, coverage indicator, photo, rating/review count, reviews, WhatsApp, and message actions.
- Profile page hides WhatsApp reveal button when `whatsappVisible` is false and shows unavailable copy.
- Search card renders coverage indicator and review count.
- Provider with no reviews uses the approved empty/no-rating state.

#### Service tests

- `updateProviderProfile` preserves admin-controlled fields.
- Demo provider update path handles profile fields without mutating approval/rating/profile view fields.
- Review create/hide paths update `avgRating` and `reviewCount`.

#### Rules/storage tests

- Owner can write provider photo in own path.
- Non-owner cannot write provider photo in another provider path.
- Owner profile updates are limited to approved safe fields.
- If coverage radius is provider-editable, owner can update valid values only.
- If coverage radius is admin-controlled, owner cannot update it.

## 3.2 Approval Visibility

### Requirements Covered

- `PROFILE-010`: Provider profiles MUST be hidden from public search until admin approval.
- `PROFILE-011`: Rejected, suspended, banned, or unapproved providers MUST NOT appear in public customer discovery.
- `PROFILE-012`: Provider profile state changes MUST be reflected in search visibility.

### Current Implementation Evidence

- `src/services/firebase/providers.firebase.ts`
  - `getProviderById` returns a provider only when `provider.status === 'approved'`.
- `src/services/demo/providers.demo.ts`
  - demo `getProviderById` also filters to `status === 'approved'`.
- `src/services/firebase/search.firebase.ts`
  - search query filters `providers` by `status == approved`, `profession`, and `serviceAreaKeys`.
- `firestore.rules`
  - provider read is allowed only when `resource.data.status == 'approved'`, owner, or admin.
  - provider create requires active user ownership and `status == pending`.
  - provider owner update cannot change `status`, `nationalIdVerified`, or `visibilityTier`.
- `functions/src/providers.ts`
  - `approveProvider` requires active admin and identity document before changing status to `approved`.
  - `rejectProvider` changes only pending providers to `rejected`.
  - `suspendProvider` changes non-suspended providers to `suspended`.
  - each status mutation writes an admin action.
- `functions/src/engagement.ts`
  - `revealWhatsApp` and `startConversation` require provider status `approved`.
- `functions/src/reviews.ts`
  - `createReview` requires provider status `approved`.
- `tests/rules/firestore.rules.test.ts`
  - anonymous read succeeds for approved provider.
  - anonymous read fails for pending provider.
  - owner cannot set `status`, `nationalIdVerified`, or `visibilityTier`.
  - admin can update pending provider to approved and write audit action.

### Work Items

#### 3.2.1 Add explicit rejected/suspended/banned public visibility tests

Files / areas:

- `tests/rules/firestore.rules.test.ts`
- Firebase adapter tests if available
- `src/services/search.service.test.ts`
- `tests/e2e/app.spec.ts`

Implementation:

- Add rule assertions for rejected and suspended providers.
- Add service/search assertions that pending, rejected, and suspended providers do not appear in search.
- Add an account-banned provider fixture and assert it does not appear in customer discovery if product considers banned account state part of provider public visibility.
- Add browser smoke for a direct `/providers/:id` visit to pending/rejected/suspended provider.

Acceptance criteria:

- Anonymous/customer cannot read pending/rejected/suspended provider profile docs.
- Search excludes pending/rejected/suspended providers.
- Banned providers are excluded from customer discovery or the product explicitly documents that suspension is the provider-level visibility mechanism for banned accounts.

#### 3.2.2 Ensure provider account ban affects customer discovery

Files / areas:

- `src/services/firebase/search.firebase.ts`
- `src/services/firebase/providers.firebase.ts`
- `src/services/demo/admin.demo.ts`
- `src/services/firebase/admin.firebase.ts`
- `functions/src/engagement.ts`
- `firestore.rules`

Implementation:

- Decide whether admin banning a provider user should automatically suspend the provider profile.
- Recommended: when banning a provider user, also suspend or hide owned provider profiles in a transaction or callable.
- If not implemented, update discovery queries and profile fetches to exclude provider docs whose owner user status is banned, while acknowledging Firestore query complexity.
- Make contact callables reject approved provider profiles whose owner user is banned.

Acceptance criteria:

- Banned provider account cannot remain publicly discoverable through search/profile/contact.
- Admin ban/unban behavior has tests.
- Product/admin runbook explains how ban relates to provider visibility.

#### 3.2.3 Add state-change visibility smoke

Files / areas:

- `tests/e2e/app.spec.ts`
- `src/services/admin.service.test.ts`
- functions tests if present

Implementation:

- Start with pending provider: absent from search and public profile.
- Approve provider: appears in search and public profile.
- Suspend provider: disappears from search and public profile.
- Reject provider: remains absent from search and public profile.
- Verify contact callables reject non-approved status.

Acceptance criteria:

- Visibility changes are observable through customer-facing flows.
- Tests prove state changes update search/profile/contact visibility.
- The same provider id cannot be contacted after suspension.

#### 3.2.4 Align direct profile fetch, search query, and rules behavior

Files / areas:

- `src/services/firebase/providers.firebase.ts`
- `src/services/firebase/search.firebase.ts`
- `firestore.rules`
- `functions/src/engagement.ts`
- `functions/src/reviews.ts`

Implementation:

- Keep `status == approved` as the single public visibility predicate.
- If account ban or paid visibility adds extra predicates, centralize helper logic where practical.
- Ensure search and profile fetch use the same visibility semantics.
- Ensure rules deny direct document bypasses.

Acceptance criteria:

- There is no path where search hides a provider but direct profile fetch exposes it to customers.
- There is no path where profile fetch hides a provider but contact callables still permit contact.
- Tests cover all public surfaces.

### Tests for 3.2

#### Rules tests

- Anonymous can read approved provider.
- Anonymous cannot read pending, rejected, suspended, or banned-hidden provider.
- Owner can read own pending provider.
- Admin can read any provider.
- Owner cannot approve, reject, suspend, or change visibility/rating/admin fields.

#### Service/Firebase tests

- Search returns only approved and not banned-hidden providers.
- Direct profile service returns null for pending/rejected/suspended/banned-hidden provider.
- Contact callables return `not-found` or `permission-denied` for non-approved provider.

#### E2E smoke

- Search result opens approved profile.
- Direct navigation to pending/suspended provider shows unavailable state.
- Admin suspension removes provider from customer search after query refresh.

## 3.3 Provider Independence

### Requirements Covered

- `PROFILE-013`: Provider profiles MAY describe services, areas, and contact methods.
- `PROFILE-014`: The system MUST NOT require providers to publish platform-controlled pricing.
- `PROFILE-015`: The system MUST NOT imply platform control over provider work execution.

### Current Implementation Evidence

- `src/features/providers/pages/provider-profile-page.tsx`
  - profile displays `bio`, `serviceAreaKeys`, WhatsApp reveal, and in-app message contact.
  - profile displays `provider.noGuarantee`.
- `src/locales/en.json`
  - `provider.noGuarantee`: "Contact is directly between you and the provider. The platform does not set price or guarantee the job."
  - home copy says Herafy connects users directly and does not set prices or guarantee service outcomes.
- `src/locales/ar.json`
  - Arabic `provider.noGuarantee` mirrors direct-contact/no-price/no-guarantee meaning.
- `src/types/provider.ts`
  - provider profile has no price, booking, job, assignment, schedule, order, invoice, payment, commission, or platform execution fields.
- `src/features/search/pages/search-page.tsx`
  - search cards link to provider profiles and do not auto-assign providers.
- `functions/src/engagement.ts`
  - contact callables create contact/conversation records only.
  - no job/order/booking lifecycle is created.

### Work Items

#### 3.3.1 Preserve direct-contact profile positioning

Files / areas:

- `src/features/providers/pages/provider-profile-page.tsx`
- `src/locales/en.json`
- `src/locales/ar.json`
- `tests/e2e/app.spec.ts`

Implementation:

- Keep direct-contact/no-price/no-guarantee copy visible on the profile near contact actions.
- Ensure the copy is present in Arabic and English.
- Add e2e or component test that the profile includes the boundary copy.

Acceptance criteria:

- Customer sees the direct-contact/no-platform-price/no-guarantee copy before or near contact actions.
- Boundary copy is not hidden behind an interaction.
- Arabic and English both have equivalent meaning.

#### 3.3.2 Add forbidden platform-control regression check

Files / areas:

- test script or unit test under current test conventions
- profile/search/messaging routes
- locale files

Implementation:

- Add a lightweight static test that scans customer-facing profile/search copy and route definitions for forbidden concepts such as platform-set price, booking confirmation, job assignment, dispatch, escrow, platform-managed work, guaranteed completion, or order execution.
- Keep the test focused to avoid false positives in docs or internal comments.
- Allow words like "visibility payment" only in provider/admin paid-visibility context, not customer profile pricing.

Acceptance criteria:

- Introducing a booking/job-assignment/pricing surface on provider profiles fails a test.
- Legitimate paid visibility/admin copy does not fail the test.
- Product can update the allowlist intentionally if scope changes.

#### 3.3.3 Add optional service description structure without pricing

Files / areas:

- `src/types/provider.ts`
- `src/features/providers/pages/edit-provider-profile-page.tsx`
- `src/features/providers/pages/provider-profile-page.tsx`
- `firestore.rules`

Implementation:

- This is optional for v1 because `bio` already satisfies descriptive information.
- If added, use a `servicesOffered: string[]` or `specialties: string[]` field.
- Do not add platform-controlled `price`, `minPrice`, `fixedRate`, `bookingFee`, or `commission` fields.
- Validate length and count.
- Render as descriptive chips or list items.

Acceptance criteria:

- Providers can describe what they do without publishing platform-controlled pricing.
- The profile remains directory-style and contact-first.
- No booking/job execution semantics are introduced.

#### 3.3.4 Keep contact options as customer-selected directory actions

Files / areas:

- `src/features/providers/pages/provider-profile-page.tsx`
- `src/services/firebase/providers.firebase.ts`
- `functions/src/engagement.ts`
- `tests/e2e/app.spec.ts`

Implementation:

- Preserve WhatsApp reveal and in-app message as user-selected actions.
- Do not auto-contact, auto-assign, or create work orders when a profile opens.
- Add tests that opening a profile does not create contact/conversation records.
- Add tests that contact records are created only after explicit WhatsApp reveal or message send.

Acceptance criteria:

- Profile view alone records at most profile-view analytics.
- WhatsApp reveal/contact requires explicit click and authentication.
- In-app conversation requires explicit message action and authentication.
- No job/order/booking state is created.

### Tests for 3.3

#### Product-boundary tests

- Public profile includes direct-contact/no-price/no-guarantee copy.
- Opening profile does not create job/booking/order/assignment records.
- Contact records are created only after explicit contact actions.
- Static forbidden-flow scan catches customer-facing pricing/job-control concepts.

#### E2E tests

- Customer opens profile and sees direct-contact boundary copy.
- Anonymous contact attempt redirects/prompts login before contact.
- Customer can choose WhatsApp or message, but no platform booking flow appears.

## Suggested Implementation Order

1. Decide coverage indicator model and edit permissions.
2. Add `coverageRadiusKm` or equivalent to provider model, seed data, provider creation, and converter tests.
3. Add coverage display to provider profile and search cards with Arabic/English copy.
4. Add profile render tests for required fields, rating, review count, visible reviews, contact options, and mobile layout.
5. Align provider edit UI with Firestore rules for service areas and coverage.
6. Add rejected/suspended/banned visibility tests across rules, search/profile services, and e2e smoke.
7. Decide and implement provider-user ban impact on provider public visibility.
8. Add state-change visibility smoke for pending -> approved -> suspended.
9. Add profile independence boundary tests and forbidden-flow static check.
10. Run verification.

## Verification Plan

Minimum commands:

```bash
npm test -- src/services/providers.service.test.ts
npm test -- src/services/reviews.service.test.ts
npm test -- src/services/search.service.test.ts
npm run test:rules
npm run lint
npm run build
```

If profile component tests are added:

```bash
npm test -- src/features/providers/pages/provider-profile-page.test.tsx
npm test -- src/features/search/pages/search-page.test.tsx
```

If coverage utilities are added with Section 2:

```bash
npm test -- src/lib/provider-coverage.test.ts
npm test -- src/lib/location.test.ts
```

If e2e coverage is added:

```bash
npm run e2e -- tests/e2e/app.spec.ts
```

If functions tests are added:

```bash
cd functions && npm test
```

Use project scripts if they differ from the above.

## Completion Checklist

Section 3 is complete when all are true:

- [ ] Provider name is visible on public profile.
- [ ] Profession is visible and localized on public profile.
- [ ] Service area is visible and localized on public profile.
- [ ] Coverage radius or equivalent indicator is modeled and visible.
- [ ] Provider photos are supported, displayed, and protected by storage rules.
- [ ] Basic descriptive information is visible.
- [ ] Rating is displayed only when meaningful review data exists.
- [ ] Review count is displayed consistently where rating is shown.
- [ ] Visible reviews render on the provider profile.
- [ ] Hidden/removed reviews do not render publicly or affect aggregates.
- [ ] WhatsApp and in-app message options render according to provider settings.
- [ ] Contact actions require authentication and explicit user action.
- [ ] Pending providers are hidden from public search/profile reads.
- [ ] Rejected providers are hidden from public search/profile reads.
- [ ] Suspended providers are hidden from public search/profile reads.
- [ ] Banned provider accounts are hidden or automatically suspended according to product decision.
- [ ] Provider status changes are reflected in public search/profile/contact visibility.
- [ ] Provider profile owner edits cannot mutate approval, visibility, rating, review, or analytics fields.
- [ ] Profile copy states direct contact and no platform-controlled price or guarantee.
- [ ] Profiles do not introduce booking, dispatch, job assignment, platform execution, or platform-set pricing.
- [ ] Product-boundary regression tests exist.
- [ ] Tests, rules, e2e where available, lint, and build pass.

## Estimated Effort

| Workstream | Estimate |
|---|---:|
| Product decisions for coverage and edit permissions | 0.5 day |
| Coverage field/default/backfill/converter updates | 0.5-1 day |
| Coverage display and localized profile/search UI | 0.5-1 day |
| Profile render tests and mobile smoke | 1-1.5 days |
| Provider edit/rules alignment | 0.5-1.5 days |
| Visibility tests for rejected/suspended/banned/state changes | 1-2 days |
| Ban-to-visibility behavior implementation, if needed | 0.5-1.5 days |
| Independence/product-boundary tests | 0.5-1 day |
| Total | 4.5-10 days |

## Risks

- Coverage radius is shared with Section 2 search semantics, so implementing only profile display can create product mismatch if search still uses exact service-area keys.
- Current profile edit UI lets providers submit service-area changes, but Firestore rules do not allow owner updates to `serviceAreas` or `serviceAreaKeys`.
- Provider account ban currently changes user status, while provider public visibility is primarily driven by provider `status`.
- Client-side `incrementProfileView` writes directly and swallows errors, so profile-view analytics should not be treated as trusted Section 3 completion evidence.
- Review/rating aggregate correctness depends on callable paths and moderation paths staying transactional.
- Static forbidden-flow tests can become noisy unless scoped to customer-facing profile/search surfaces.

## Recommended Definition of Done for Section 3

- `3.1 Profile Data`: Implemented with visible name, profession, service areas, coverage indicator, photos, bio, aggregate rating/review count, visible reviews, and contact options, with profile render tests.
- `3.2 Approval Visibility`: Implemented with public profile/search/contact visibility consistently restricted to approved and not banned-hidden providers, with rules/service/e2e tests for pending, rejected, suspended, and status transitions.
- `3.3 Provider Independence`: Implemented with direct-contact/no-price/no-guarantee copy, no platform-controlled pricing or execution fields, and regression tests that prevent booking/job-assignment/product-boundary drift.
