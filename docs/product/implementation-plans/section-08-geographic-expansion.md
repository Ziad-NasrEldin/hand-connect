# Section 8 Implementation Plan - Geographic Expansion

Source documents:
- SRS: `docs/product/herafy-software-requirements.md`, section 8.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 8.1-8.3.

Goal: make geographic expansion fully implemented for Herafy v1: every provider has one approved initial Cairo service area, public discovery respects only approved and paid-active expansion coverage, eligible providers can request additional areas, admins can approve or reject expansion requests through auditable server-side processing, and unpaid or expired expansion areas never affect public search coverage.

## Current Status

| SRS area | Current status | Reason |
| 8.1 Initial Service Area | Partially implemented | Provider registration creates one Cairo service area and search filters by `serviceAreaKeys`, but provider profile editing can replace service-area arrays directly and the model does not distinguish initial areas from approved expansion entitlements. |
| 8.2 Additional Service Areas | Partially implemented | Providers can request a new service area, a 30-review check exists in demo/Firebase service code and Firestore rules, and admin approval appends the area, but reputation and activity gates are incomplete, approval is client-side in the Firebase admin service, and there is no production integration test proving approved expansion changes discovery. |
| 8.3 Fees and Approval | Partially implemented | Expansion requests use `tier: paid`, `paymentMethod`, `status`, `paymentConfirmedBy`, and admin approve/reject UI, but there is no recurring fee model, billing period, renewal state, unpaid state beyond pending/rejected, entitlement expiry, or search exclusion for expired expansion entitlements. |

## Product Decisions Needed Before Implementation

### Decision A - What is the provider's initial area in v1?

Recommended v1 decision: **each provider has exactly one immutable initial Cairo service area created during provider registration**.

- The SRS says each provider MUST have one initial service area for v1 operation.
- Current registration already creates `serviceAreas: [{ neighborhood, city: 'cairo' }]` and `serviceAreaKeys: [neighborhood]`.
- Letting providers replace `serviceAreas` from profile settings weakens expansion approval and makes public coverage hard to audit.
- Corrections to an initial area should be admin-mediated or explicitly modeled as a support/admin correction, not a normal provider edit.

Implementation implication:
- Keep `initialServiceAreaKey` or equivalent provider field.
- Treat initial coverage as always active while the provider is approved.
- Remove normal provider-side service-area replacement from profile editing.
- Add a controlled admin correction path only if product needs it.

### Decision B - What eligibility gates are required before an expansion request?

Recommended v1 decision: **area expansion requires all of these gates before request creation and again before approval**:

- Provider account is active.
- Provider profile status is `approved`.
- Requested service area is a supported Cairo neighborhood and not already active.
- Review count is at least 30.
- Average rating is at least 4.0.
- Activity score is at least 40, or another documented activity threshold chosen by product.
- Provider has no pending expansion request for the same area.
- Provider has no unresolved abuse or account restriction that blocks paid coverage expansion.

Rationale:
- `GEO-005` requires reputation and activity gates.
- `GEO-006` requires at least 30 reviews for the PRD v1 target unless explicitly changed.
- Rechecking gates at approval time prevents stale requests from being approved after suspension, rating drops, or abuse restrictions.

### Decision C - What is the recurring fee model for additional areas?

Recommended v1 decision: **model additional service areas as paid recurring entitlements with a fixed billing period and explicit lifecycle**.

Use an entitlement lifecycle rather than only mutating provider service-area arrays:
- `pending_payment`: request exists but payment is not confirmed.
- `active`: area affects discovery coverage until `currentPeriodEndsAt`.
- `past_due`: payment failed or renewal is missing; area does not affect public search.
- `expired`: entitlement ended; area does not affect public search.
- `canceled`: provider/admin ended renewal; area remains inactive after period end or immediately according to product policy.
- `rejected`: admin rejected the request; area never affects public search.

Implementation implication:
- Store expansion entitlement documents separately from request documents.
- Public search should compute active coverage from initial area plus active entitlement areas, not from raw provider-edited arrays.
- Approval must confirm payment and create or activate the entitlement.
- Renewal, cancellation, and expiry must update entitlement state and remove the area from public coverage.

### Decision D - Should expansion approval also grant paid ranking boost?

Current behavior:
- `approveVisibilityRequest` adds the new area for `type: 'area_expansion'`.
- `approveVisibilityRequest` grants `visibilityTier: 'paid'` and `visibilityPaidUntil` only for non-expansion boost requests.

Recommended v1 decision: **area expansion fees buy additional coverage only, not a ranking boost, unless the provider also buys a boost**.

- This keeps Section 8 separate from Section 7 paid visibility.
- It avoids implying top placement or extra ranking from expansion payment.
- Area expansion can still be a paid product while ranking remains governed by Section 6 and Section 7.

### Decision E - How should approved additional areas affect discovery?

Recommended v1 decision: **approved, paid-active expansion areas affect discovery exactly like initial areas for coverage matching, while expired/unpaid/rejected areas are excluded**.

- Search should use an explicit active coverage set.
- Approved active expansion should make the provider discoverable in that area.
- Pending, rejected, past-due, expired, and canceled areas should not appear in `serviceAreaKeys` used by public search.
- Historical requests and entitlements should remain visible to provider/admin for audit.

## Target End State

Section 8 is complete when:

1. Every provider has exactly one initial Cairo service area at registration.
2. Public search visibility respects only approved active provider coverage.
3. Providers cannot self-edit public service coverage through profile settings.
4. Providers can request additional supported Cairo areas from the provider dashboard.
5. Area expansion request creation enforces provider ownership, approved status, active account status, supported area, non-duplicate area, 30-review minimum, reputation threshold, activity threshold, and no blocking account/abuse state.
6. Area expansion approval rechecks the same eligibility gates before activation.
7. Area expansion approval is processed through a trusted callable or backend path, not a client-side Firestore transaction.
8. Admins can approve or reject expansion requests with required reason/notes and audit rows.
9. Approved expansion creates or activates a recurring paid area entitlement with billing period fields.
10. Active expansion entitlements affect discovery coverage.
11. Rejected, pending, unpaid, past-due, expired, or canceled expansion areas do not affect public search coverage.
12. Renewal and expiry behavior are deterministic and tested.
13. Provider dashboard shows current coverage, pending requests, active expansion entitlement expiry, and rejected/unpaid states.
14. Admin UI shows provider, requested area, current areas, eligibility evidence, payment state, billing period, and approve/reject actions.
15. Firestore rules prevent direct client bypass of request, approval, coverage, entitlement, and audit constraints.
16. Demo, Firebase/rules, function, service, and e2e or component tests cover the full expansion lifecycle.

## Detailed Implementation Plan

## 8.1 Initial Service Area

### Requirements Covered

- `GEO-001`: Each provider MUST have one initial service area for v1 operation.
- `GEO-002`: Provider search visibility MUST respect the provider's approved service areas.

### Current Implementation Evidence

- `src/services/firebase/auth.firebase.ts`
  - `createProviderProfile` creates `serviceAreas: [{ neighborhood: input.serviceArea, city: 'cairo' }]`.
  - `createProviderProfile` creates `serviceAreaKeys: [input.serviceArea]`.
- `src/services/demo/auth.demo.ts`
  - Demo provider registration mirrors the Firebase provider initial area behavior.
- `src/types/provider.ts`
  - `ProviderProfile` has `serviceAreas` and `serviceAreaKeys`.
  - The model does not identify the initial area or approved expansion entitlements.
- `src/services/firebase/search.firebase.ts`
  - Search queries approved providers where `serviceAreaKeys array-contains input.neighborhood`.
- `src/services/demo/search.demo.ts`
  - Demo search filters approved providers by `serviceAreaKeys.includes(input.neighborhood)`.
- `src/features/providers/pages/edit-provider-profile-page.tsx`
  - Provider profile editing sends `serviceAreas` and `serviceAreaKeys`, which can replace coverage directly.
- `src/services/firebase/providers.firebase.ts`
  - Provider update code accepts patched `serviceAreas` and `serviceAreaKeys`.
- `firestore.rules`
  - Rules include provider owner update constraints, but current Section 8 evidence shows coverage mutation is not fully routed through expansion approval.

### Work Items

#### 8.1.1 Add explicit initial area field

Files:
- `src/types/provider.ts`
- `src/services/firebase/auth.firebase.ts`
- `src/services/demo/auth.demo.ts`
- `src/firebase/converters.ts`
- `src/firebase/converters.test.ts`
- Seed/dev data if needed.

Changes:
- Add `initialServiceAreaKey: string` to `ProviderProfile`.
- Set `initialServiceAreaKey` from registration `input.serviceArea`.
- Keep `serviceAreas` and `serviceAreaKeys` temporarily for compatibility, but treat them as derived coverage until the migration is complete.
- Add converter/default fallback for existing provider docs without `initialServiceAreaKey`.

Acceptance criteria:
- New provider registration stores one valid initial area.
- Existing provider docs without the new field load safely.
- The initial area is always a supported neighborhood slug.
- Initial area is not accidentally removed by profile edits.

#### 8.1.2 Separate editable profile fields from coverage fields

Files:
- `src/features/providers/pages/edit-provider-profile-page.tsx`
- `src/services/contracts/providers.contract.ts`
- `src/services/firebase/providers.firebase.ts`
- `src/services/demo/providers.demo.ts`
- Provider service tests.

Changes:
- Remove provider-side service-area editing from the normal profile edit payload.
- Keep editable fields to bio, profession where allowed, WhatsApp number, WhatsApp visibility, and profile photo.
- If product needs initial-area corrections, create an admin-only correction task instead of a provider self-edit.

Acceptance criteria:
- Provider profile edit cannot change `initialServiceAreaKey`, `serviceAreas`, or `serviceAreaKeys`.
- Existing profile edit behavior still works for non-coverage fields.
- A regression test proves provider-owned profile update does not mutate coverage.

#### 8.1.3 Derive active coverage from approved sources

Files:
- New `src/lib/provider-coverage.ts`
- `src/services/firebase/search.firebase.ts`
- `src/services/demo/search.demo.ts`
- `src/lib/ranking.ts`
- Tests for coverage utility and search service.

Changes:
- Create a helper that returns active coverage keys from:
  - provider initial area.
  - active additional-area entitlements.
- During the transition, support legacy `serviceAreaKeys` only as a fallback for providers without entitlement docs.
- Public search must rely on the active coverage set.

Acceptance criteria:
- Initial area appears in public search coverage.
- Inactive expansion areas do not appear in public search coverage.
- Legacy docs remain searchable through a documented fallback until migration is complete.

#### 8.1.4 Harden Firestore rules around coverage mutation

Files:
- `firestore.rules`
- `tests/rules/firestore.rules.test.ts`

Changes:
- Disallow provider-owner writes that mutate `initialServiceAreaKey`, `serviceAreas`, `serviceAreaKeys`, expansion entitlements, or entitlement status.
- Allow only trusted server/admin paths to change coverage-bearing fields.
- If current direct admin Firestore updates remain during transition, constrain them to admin users and specific valid transitions.

Acceptance criteria:
- Provider owner cannot directly add, remove, or replace coverage areas.
- Customer cannot mutate provider coverage.
- Admin or backend path can perform approved coverage transitions.
- Rules tests cover allowed and denied mutations.

### Tests for 8.1

Unit/service tests:
- Provider registration creates exactly one initial area.
- Provider profile edit preserves initial area and active coverage.
- Coverage helper returns initial area for approved provider.
- Search includes provider in initial area and excludes provider from non-covered area.

Rules tests:
- Provider owner cannot update `serviceAreaKeys`.
- Provider owner cannot update `initialServiceAreaKey`.
- Provider owner cannot create or update active entitlements directly.
- Admin/backend-only path can perform approved transition.

E2E/component tests:
- Provider settings page does not expose direct service-area replacement as a normal edit.
- Search by the initial area returns the approved provider.

## 8.2 Additional Service Areas

### Requirements Covered

- `GEO-003`: Providers MUST be able to request additional service areas.
- `GEO-004`: Area expansion MUST require eligibility checks before approval.
- `GEO-005`: Area expansion eligibility MUST include reputation and activity gates.
- `GEO-006`: Area expansion eligibility MUST require at least 30 reviews for the PRD v1 target unless explicitly changed.
- `GEO-007`: Approved additional areas MUST affect discovery coverage.

### Current Implementation Evidence

- `src/features/dashboard/pages/visibility-page.tsx`
  - Provider can select a neighborhood and submit a visibility request.
  - The page blocks expansion locally if `reviewCount < 30`.
  - It shows `visibility.areaExpansionEligible` and `visibility.areaExpansionLocked`.
- `src/services/firebase/visibility.firebase.ts`
  - `createVisibilityRequest` loads provider by provider ID.
  - It classifies requests as `area_expansion` when selected area is not already in `serviceAreaKeys`.
  - It rejects area expansion when `reviewCount < 30`.
  - It rejects duplicate pending requests for the same provider and service area.
- `src/services/demo/visibility.demo.ts`
  - Demo visibility service mirrors the 30-review gate and duplicate-pending gate.
- `firestore.rules`
  - Visibility request create is provider-owned.
  - `area_expansion` create requires requested area not already in provider `serviceAreaKeys`.
  - `area_expansion` create requires provider `reviewCount >= 30`.
- `src/services/firebase/admin.firebase.ts`
  - Admin approval of an `area_expansion` request appends the area to provider `serviceAreaKeys` and `serviceAreas`.
- `src/services/demo/admin.demo.ts`
  - Demo admin approval mirrors the append behavior.
- `src/services/visibility.service.test.ts`
  - Tests block expansion before 30 reviews.
  - Tests eligible expansion and admin approval adds the area.
- `tests/rules/firestore.rules.test.ts`
  - Tests provider-owned visibility request creation and 30-review expansion eligibility.

### Work Items

#### 8.2.1 Create an explicit expansion eligibility helper

Files:
- New `src/lib/geographic-expansion-eligibility.ts`
- New tests beside the helper.
- `src/services/firebase/visibility.firebase.ts`
- `src/services/demo/visibility.demo.ts`
- Admin approval backend path.

Changes:
- Implement `evaluateAreaExpansionEligibility(provider, requestedArea, context)`.
- Return structured result:
  - `eligible: boolean`
  - `reasons: string[]`
  - `evidence`
- Include gates for approved status, active user account, supported neighborhood, non-existing active coverage, no duplicate pending request, review count, average rating, activity score, and blocking abuse/account state.

Acceptance criteria:
- Eligibility decisions are deterministic and testable.
- UI and service paths use the same eligibility rules.
- Denial reasons map to localized user/admin messages.

#### 8.2.2 Add reputation and activity gates

Files:
- `src/lib/geographic-expansion-eligibility.ts`
- `src/services/firebase/visibility.firebase.ts`
- `src/services/demo/visibility.demo.ts`
- `firestore.rules`
- Tests.

Changes:
- Require `reviewCount >= 30`.
- Require `avgRating >= 4.0`, unless product chooses a different threshold.
- Require `activityScore >= 40`, unless product chooses a different threshold.
- Add constants such as `AREA_EXPANSION_MIN_REVIEWS`, `AREA_EXPANSION_MIN_AVG_RATING`, and `AREA_EXPANSION_MIN_ACTIVITY_SCORE`.
- Keep threshold values in a single shared config file if the repo has a config pattern.

Acceptance criteria:
- Low review count blocks request.
- Low average rating blocks request.
- Low activity score blocks request.
- Eligible provider passes all gates.
- Thresholds are covered by boundary tests.

#### 8.2.3 Recheck eligibility during admin approval

Files:
- Trusted backend function, likely `functions/src/visibility.ts`.
- `src/services/firebase/admin.firebase.ts`.
- `src/services/demo/admin.demo.ts`.
- Function tests and admin service tests.

Changes:
- Move approval from client Firestore transaction to a callable or backend function.
- Load request and provider in the backend.
- Require request status `pending`.
- Require request type `area_expansion`.
- Re-run eligibility with current provider/account/payment state.
- Reject approval if provider no longer qualifies.
- Write request status, entitlement, coverage update, and admin audit atomically.

Acceptance criteria:
- A request created while eligible cannot be approved after provider suspension.
- A request created while eligible cannot be approved after review/rating/activity drops below threshold.
- Approval cannot process a non-pending request.
- Approval writes an audit row.

#### 8.2.4 Model approved expansion coverage separately from request history

Files:
- New type, for example `src/types/geographic-expansion.ts`.
- New collection, for example `areaEntitlements` or `providerAreaEntitlements`.
- Firebase converters.
- Demo DB and seed data.
- Search services.

Suggested entitlement fields:
- `id`
- `providerId`
- `areaKey`
- `city`
- `status`
- `sourceRequestId`
- `billingPeriod`
- `currentPeriodStartsAt`
- `currentPeriodEndsAt`
- `nextBillingAt`
- `priceAmount`
- `currency`
- `createdAt`
- `updatedAt`
- `approvedBy`
- `canceledAt`
- `expiredAt`

Acceptance criteria:
- Approval creates or activates an entitlement.
- Request history remains immutable enough for audit.
- Search coverage can be computed without trusting pending request docs.
- Entitlement state explains why an area is or is not active.

#### 8.2.5 Add discovery coverage tests after approval

Files:
- `src/services/search.service.test.ts`
- Firebase adapter/integration tests if available.
- `tests/rules/firestore.rules.test.ts`
- Optional e2e smoke.

Test flow:
- Seed provider approved in `new-cairo`.
- Search `maadi` and confirm provider is absent.
- Make provider eligible.
- Create area expansion request for `maadi`.
- Approve request through the proper admin/backend path.
- Search `maadi` and confirm provider appears.
- Expire or mark entitlement unpaid.
- Search `maadi` and confirm provider disappears.

Acceptance criteria:
- Approved active expansion affects discovery.
- Pending expansion does not affect discovery.
- Rejected expansion does not affect discovery.
- Expired or unpaid expansion does not affect discovery.

### Tests for 8.2

Unit tests:
- Eligibility helper for all denial reasons and success state.
- Coverage helper includes active additional areas.
- Coverage helper excludes pending, rejected, expired, past-due, and canceled areas.

Service tests:
- Request creation rejects ineligible providers.
- Request creation rejects unsupported area keys.
- Request creation rejects duplicate pending requests.
- Admin approval rechecks eligibility.
- Admin approval activates coverage.

Rules tests:
- Provider can create a valid pending expansion request.
- Provider cannot create expansion request for already covered area.
- Provider cannot create expansion request below review threshold.
- Provider cannot create expansion request below reputation threshold.
- Provider cannot create expansion request below activity threshold if rules can enforce it from provider doc fields.
- Provider cannot directly activate coverage.

E2E/component tests:
- Ineligible provider sees clear locked state.
- Eligible provider can submit expansion request.
- Admin can see pending request and approve/reject it.
- Search reflects active approved coverage.

## 8.3 Fees and Approval

### Requirements Covered

- `GEO-008`: Additional service areas MUST support a recurring fee model.
- `GEO-009`: Admins SHOULD approve or reject area expansion requests.
- `GEO-010`: Rejected or unpaid expansion areas MUST NOT affect public search coverage.

### Current Implementation Evidence

- `src/types/visibility.ts`
  - `VisibilityRequest` has `type`, `tier`, `serviceArea`, `status`, `paymentConfirmedBy`, `paymentMethod`, `requestedAt`, `processedAt`, and optional `rejectionReason`.
- `src/features/admin/pages/visibility-requests-page.tsx`
  - Admin can confirm payment or reject pending visibility requests.
  - The UI does not show a full eligibility/payment/recurrence review surface.
- `src/services/firebase/admin.firebase.ts`
  - `approveVisibilityRequest` processes approval through a client-side Firestore transaction.
  - `rejectVisibilityRequest` updates request state directly from the client service.
  - Approval for boosts sets a 30-day paid visibility expiry.
  - Approval for area expansion appends the area but does not create renewal or expiry data.
- `functions/src/visibility.ts`
  - Only contains `approveVisibility(now, days = 30)` helper for paid-until date calculation.
  - No callable exists for recurring area entitlement approval.
- `functions/test/visibility.test.ts`
  - Tests the paid-until date helper only.
- `tests/rules/firestore.rules.test.ts`
  - Admin can update visibility request status.
  - Provider cannot process its own request.

### Work Items

#### 8.3.1 Define paid area product and billing config

Files:
- New config, for example `src/config/geographic-expansion.ts`.
- New tests for config constants.
- Product docs if product wants persistent pricing docs later.

Fields:
- `areaExpansionPriceAmount`
- `areaExpansionCurrency`
- `billingPeriod: 'monthly' | 'quarterly' | 'annual'`
- `trialDays` if any.
- `gracePeriodDays` if any.
- `renewalPolicy`

Acceptance criteria:
- Price and billing period are explicit in code.
- Provider UI can display the recurring fee terms.
- Admin UI can verify what product was purchased.
- Tests guard accidental missing or invalid config.

#### 8.3.2 Add recurring entitlement lifecycle

Files:
- `src/types/geographic-expansion.ts`
- Firebase converters.
- Demo DB.
- Admin/backend approval code.
- Search coverage helper.

Changes:
- Add entitlement statuses:
  - `pending_payment`
  - `active`
  - `past_due`
  - `expired`
  - `canceled`
  - `rejected`
- Add billing dates:
  - `currentPeriodStartsAt`
  - `currentPeriodEndsAt`
  - `nextBillingAt`
  - `lastPaymentConfirmedAt`
- Add audit fields:
  - `createdByProviderId`
  - `approvedByAdminId`
  - `sourceRequestId`
  - `updatedAt`

Acceptance criteria:
- Active entitlement has valid current period dates.
- Non-active entitlement does not affect public search.
- Entitlement can explain pending payment, rejection, expiry, and cancellation to provider/admin.

#### 8.3.3 Move approve/reject processing to backend functions

Files:
- `functions/src/visibility.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `functions/test/visibility.test.ts`
- Admin service tests.

Changes:
- Add callable functions such as:
  - `approveVisibilityRequest`
  - `rejectVisibilityRequest`
  - or narrower `approveAreaExpansionRequest` and `rejectAreaExpansionRequest`.
- Require authenticated admin.
- Use Firestore Admin SDK transactions.
- Validate request status, request type, provider eligibility, payment confirmation, and entitlement state.
- Write audit event from backend.
- Return a small result payload for UI refresh.

Acceptance criteria:
- Client no longer performs privileged approval mutations directly.
- Backend approval is atomic.
- Backend approval writes request, entitlement, provider coverage projection if retained, and audit.
- Backend rejection writes reason and audit.
- Function tests cover success, unauthenticated, non-admin, not-pending, missing provider, stale eligibility, and duplicate entitlement cases.

#### 8.3.4 Add renewal, expiry, and unpaid behavior

Files:
- Backend scheduled function or admin callable.
- Search coverage helper.
- Tests.

Changes:
- Add a function to mark entitlements `past_due` or `expired` after `currentPeriodEndsAt` plus grace period.
- Add Paymob Visa/card renewal confirmation for v1.
- Keep this lifecycle as the billing adapter target for payment success, failure, cancellation, and past-due states.
- Remove inactive areas from search coverage projection.

Acceptance criteria:
- Expired entitlement does not affect search.
- Past-due entitlement does not affect search unless product explicitly defines a grace-period public coverage rule.
- Renewal extends `currentPeriodEndsAt`.
- Rejected or unpaid request never creates active coverage.

#### 8.3.5 Improve provider and admin UI states

Files:
- `src/features/dashboard/pages/visibility-page.tsx`
- `src/features/admin/pages/visibility-requests-page.tsx`
- Locale files.
- Display helpers.

Provider UI should show:
- Initial service area.
- Active additional areas.
- Pending expansion requests.
- Rejected expansion requests and reason.
- Active entitlement expiry or next renewal date.
- Locked eligibility reasons.
- Recurring fee terms.

Admin UI should show:
- Provider name and ID.
- Requested area display name.
- Current approved areas.
- Eligibility evidence at request time and current approval time.
- Payment method and payment state.
- Billing period and price.
- Required admin notes/reason.

Acceptance criteria:
- Provider understands current coverage without hidden ranking logic.
- Admin can approve or reject without guessing what the request means.
- Error states are visible and localized.
- Buttons disable during mutations to avoid duplicate processing.

### Tests for 8.3

Unit tests:
- Entitlement active/inactive status helper.
- Billing period date calculation.
- Search coverage excludes unpaid and expired entitlements.

Function tests:
- Admin approval creates active entitlement.
- Admin rejection marks request rejected and does not create coverage.
- Non-admin approval rejects.
- Approval without payment confirmation rejects.
- Stale or ineligible provider approval rejects.
- Expiry job marks entitlement expired or past due.

Rules tests:
- Provider cannot mark request approved.
- Provider cannot create active entitlement.
- Provider cannot extend entitlement billing dates.
- Admin/backend path can update allowed lifecycle fields.
- Public reads expose only safe entitlement data if any entitlement docs are public.

E2E/component tests:
- Admin approves area expansion and provider sees active area.
- Admin rejects area expansion and provider sees rejected state.
- Search includes active expansion area.
- Search excludes expired/unpaid expansion area.

## Cross-Cutting Implementation Notes

### Data Model Direction

Recommended model:
- `providers/{providerId}` keeps stable provider profile fields and `initialServiceAreaKey`.
- `visibilityRequests/{requestId}` or `areaExpansionRequests/{requestId}` keeps request workflow history.
- `providerAreaEntitlements/{entitlementId}` keeps recurring paid coverage entitlements.
- Search uses a derived active coverage set.

Transition strategy:
1. Add new fields with fallback readers.
2. Stop provider-owned profile edits from changing coverage.
3. Add entitlement-backed expansion approval.
4. Update search to use entitlement-backed coverage.
5. Add migration or seed update to populate `initialServiceAreaKey`.
6. Retire or strictly derive mutable `serviceAreaKeys` after tests pass.

### Server-Side Enforcement

Privileged transitions should move to backend functions:
- Area expansion approval.
- Area expansion rejection.
- Entitlement activation.
- Entitlement renewal.
- Entitlement expiry.
- Coverage projection updates if `serviceAreaKeys` remains denormalized.

This avoids trusting admin UI code for security-sensitive payment and public coverage changes.

### Localization

Add or verify localized messages for:
- Area expansion locked by review count.
- Area expansion locked by rating.
- Area expansion locked by activity.
- Area already covered.
- Unsupported service area.
- Pending request already exists.
- Payment pending.
- Payment confirmed.
- Renewal due.
- Entitlement expired.
- Request rejected.
- Admin approval failed because eligibility changed.

### Analytics and Audit

Every approval, rejection, renewal, expiry, cancellation, and manual correction should produce an admin action or backend audit row with:
- actor ID.
- provider ID.
- request ID.
- entitlement ID if applicable.
- area key.
- old state.
- new state.
- reason or system note.
- timestamp.

## Verification Commands

Run targeted checks while implementing:

```bash
npm test -- src/services/visibility.service.test.ts
npm test -- src/services/admin.service.test.ts
npm test -- src/services/search.service.test.ts
npm test -- src/lib/ranking.test.ts
npm test -- src/firebase/converters.test.ts
npm run test:rules
cd functions && npm test
```

Run full release checks before marking the section done:

```bash
npm run lint
npm test
npm run test:rules
npm run build
npm run e2e
```

If a browser/UI verification pass is added:

```bash
npm run dev
npx -y chrome-devtools-axi open http://localhost:5173/visibility
npx -y chrome-devtools-axi open http://localhost:5173/admin/visibility
```

## Effort Estimate

| Workstream | Estimate | Notes |
| Initial area hardening | 1-2 days | Mostly type/service/profile/rules/test changes. |
| Eligibility gates | 1-2 days | Requires shared helper, UI messages, rules, and tests. |
| Backend approval processing | 2-4 days | Requires Cloud Function implementation, admin service adapter change, and function tests. |
| Recurring entitlement model | 3-5 days | Largest scope because it touches data model, search coverage, renewal/expiry, UI, and tests. |
| UI polish and e2e coverage | 1-2 days | Provider/admin states, localized errors, mutation loading states, search smoke. |

Total expected effort: **8-15 engineering days**, depending on whether recurring billing remains manual/offline or integrates with a real payment provider.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing provider docs lack `initialServiceAreaKey`. | Search or profile reads can break after model changes. | Add fallback converter/helper and migration tests before enforcing field. |
| `serviceAreaKeys` remains mutable from provider profile edit. | Providers can bypass expansion approval. | Remove coverage from provider edit payload and add rules tests. |
| Admin approval stays client-side. | Payment and coverage transitions depend on client trust. | Move approval/rejection to backend callables. |
| Eligibility gates exist only in UI. | Ineligible providers can bypass through direct writes. | Enforce in service, rules where possible, and backend approval. |
| Recurring fee model is under-specified. | Expired or unpaid areas may keep showing in search. | Add entitlement lifecycle, expiry job, and search exclusion tests. |
| Search uses denormalized coverage incorrectly. | Approved expansions may not appear or expired ones may remain. | Centralize active coverage helper and test every lifecycle state. |
| Rules cannot express every gate cleanly. | Firestore rules become complex or incomplete. | Keep rules as hard boundary and move final validation to backend transactions. |

## Definition of Done

Section 8 is done when:

- Provider registration creates exactly one initial service area and persists it explicitly.
- Provider profile editing cannot directly mutate public coverage.
- Expansion request creation validates ownership, supported area, non-duplicate area, approval status, active account status, 30-review minimum, rating threshold, activity threshold, and blocking restrictions.
- Expansion approval rechecks eligibility on the backend.
- Expansion approval/rejection is auditable and not performed by client-side Firestore transactions.
- Approved paid-active expansion creates an entitlement and affects search coverage.
- Pending, rejected, unpaid, past-due, expired, and canceled expansion areas do not affect search coverage.
- Provider UI shows coverage and expansion status clearly.
- Admin UI shows enough provider, eligibility, payment, and billing evidence to process requests safely.
- Rules block direct client bypass of coverage and entitlement state.
- Unit, service, rules, function, and e2e/component tests cover the lifecycle.
- `npm run lint`, `npm test`, `npm run test:rules`, `cd functions && npm test`, `npm run build`, and relevant e2e checks pass.

## Open Questions

1. Should initial area corrections be admin-only, support-request based, or completely out of v1?
2. What exact rating threshold should count as the reputation gate?
3. What exact activity metric and threshold should count as the activity gate?
4. Should unresolved abuse reports block expansion requests or only approval?
5. Should expansion entitlements have a grace period after missed Paymob renewal, or should coverage stop immediately when payment is past due?
6. Should public search read entitlement documents directly, or should backend maintain a denormalized active coverage projection on provider docs?
