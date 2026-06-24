# Section 7 Implementation Plan - Paid Visibility

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 7.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 7.1-7.4.

Related sections:

- Section 6 ranking guardrails because paid visibility affects ranking through product rules and must not guarantee top placement.
- Section 9 provider dashboard because providers need active paid status and request history.
- Section 10 admin paid product controls because paid products, renewal/expiry policy, and request review are admin-owned.
- Section 12 analytics because paid usage and expiry should be tracked.
- Section 13 monetization because v1 must monetize provider visibility without customer charges, lead fees, commissions, or guarantees.

Goal: make Section 7 fully implemented for Herafy v1 by turning the current paid visibility request path into a clear, labeled, auditable, product-backed visibility system with no separate visibility cap policy and preserved organic provider eligibility.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 7.1 Visibility Boosts | Partially implemented | Providers can create boost requests, admin approval sets `visibilityTier: paid`, ranking applies a capped bonus, and expiry is checked at ranking/render time. |
| 7.2 Paid Labels | Partially implemented | Search results and provider profile cards use highlighted styling and `common.featured`, but the label does not explicitly distinguish promoted or sponsored listings from organic listings. |
| 7.3 No Guarantees | Partially implemented | Provider visibility copy and the admin runbook say payment does not guarantee customers, jobs, leads, ranking, or revenue, but provider UI does not explicitly say no top placement. |
| 7.4 Free Provider Visibility | Partially implemented | Approved organic providers appear in search and organic providers can outrank paid providers in ranking tests, but Firebase-mode regression coverage is missing. |

## Product Decisions Needed Before Implementation

### Decision A - Paid visibility product model

The SRS says providers must be able to request or purchase optional boosts and the monetization section requires paid visibility tiers or products.

Recommended v1 decision: **define a small server-owned paid visibility product catalog, even if payment remains manually confirmed outside the app.**

Suggested v1 products:

| Product ID | Name | Duration | Visibility effect | Renewal |
|---|---|---:|---|---|
| `visibility_boost_30_paymob` | Promoted visibility, 30 days | 30 days | No-cap paid ranking bonus and promoted label | Auto-renews by Paymob card at 500 EGP |

Reason:

- The current code hard-codes `tier: paid` and 30 days in admin approval.
- A product catalog gives transparent price, duration, disclosure copy, and cap policy without implementing full online payments yet.
- The catalog should be the only source used by provider request UI, admin approval, request records, and expiry logic.

Implementation implication:

- Add a `visibilityProducts` collection or versioned local config mirrored into Firestore.
- Persist `productId`, `productVersion`, `priceAmount`, `currency`, `durationDays`, and `capPolicyId` on every request.
- Admin approval must derive duration and cap from the selected product, not from UI text or hard-coded 30-day logic.

### Decision B - Payment scope for v1

The SRS allows paid visibility but explicitly excludes customer payments and provider job payments.

Recommended v1 decision: **keep manual provider payment confirmation for v1, but model payment state explicitly.**

Reason:

- Current UI already collects manual payment notes and admin confirms payment.
- Real online checkout adds provider onboarding, payment reconciliation, refunds, tax/accounting, and compliance complexity.
- A payment-state model is still needed so paid visibility can be audited and renewed cleanly.

Implementation implication:

- Model request `paymentStatus` as `pending`, `matched`, `rejected`, or `expired`.
- Keep `paymentMethod` as a controlled value such as `manual_cash`, `wallet_transfer`, or `bank_transfer`.
- Keep payment evidence as metadata only unless a separate secure upload design is approved.
- Do not add customer checkout, customer contact fees, escrow, commissions, or per-lead billing.

### Decision C - Paid label wording

The SRS says labels must clearly distinguish promoted listings from organic listings.

Recommended v1 decision: **replace “Featured” with “Promoted” in English and an Arabic equivalent meaning promoted paid listing.**

Reason:

- “Featured” can be interpreted as editorial recommendation or quality endorsement.
- “Promoted” communicates paid placement more directly while still fitting compact result cards.
- The profile and search surfaces should use the same label.

Implementation implication:

- Replace `common.featured` usage for paid visibility with a dedicated key such as `visibility.promotedLabel`.
- Use disclosure copy where space allows, such as “Promoted - paid visibility, no guaranteed placement.”
- Do not label organic listings.

### Decision D - Expiry enforcement and cleanup

Current ranking and label rendering ignore expired paid visibility when `visibilityPaidUntil` is in the past.

Recommended v1 decision: **keep search-time expiry checks, and add a scheduled or admin-triggered expiry cleanup that normalizes expired providers back to organic and writes an audit/event row.**

Reason:

- Search-time checks prevent stale paid ranking influence immediately.
- A cleanup job makes provider dashboard, admin lists, analytics, and future queries consistent.
- Audit rows are needed for paid usage and expiry tracking.

Implementation implication:

- Add `paidVisibilityStartedAt`, `visibilityPaidUntil`, `visibilityProductId`, and `visibilityStatus` fields.
- Expiry cleanup should set `visibilityTier: organic`, clear or preserve historical product fields according to analytics needs, and append a paid-expiry audit/event.
- Expiry cleanup must be idempotent.

## Target End State

Section 7 is complete when:

1. Providers can request optional paid visibility using a defined product or tier.
2. Every paid request records product ID, product version, price, currency, duration, payment method, payment status, request status, and disclosure acceptance.
3. Admin approval is server-owned and applies the selected product terms atomically.
4. Paid visibility has a clear start timestamp and end timestamp.
5. Expired paid visibility never affects ranking or labels.
6. Expired paid visibility is cleaned up or marked expired through an idempotent server job.
7. Paid ranking influence remains capped and cannot guarantee top placement.
8. Strong organic providers can still outrank weak paid providers.
9. Customer-facing search results clearly label active paid listings as promoted paid listings.
10. Customer-facing provider profiles use the same paid disclosure when active.
11. Provider-facing copy says paid visibility does not guarantee leads, jobs, or top placement.
12. Admin-facing copy and runbooks preserve the no-guarantee and no-commission boundaries.
13. Approved free providers remain eligible for search and profile visibility.
14. Providers are not forced into payment to remain listed.
15. Tests cover product selection, request creation, admin approval, expiry, labels, no guarantees, and organic visibility.
16. Verification commands pass for targeted unit tests, rules tests, functions tests, lint, build, and e2e smoke where available.

## Detailed Implementation Plan

## 7.1 Visibility Boosts

### Requirements Covered

- `PAID-001`: Providers MUST be able to request or purchase optional paid visibility boosts.
- `PAID-002`: Paid visibility MUST increase exposure only within configured caps.
- `PAID-003`: Paid visibility MUST have start and end/expiry handling.

### Current Implementation Evidence

- `src/features/dashboard/pages/visibility-page.tsx`
  - approved providers can submit a visibility request from the provider dashboard.
  - the request form currently uses a selected service area, manual notes, and a hard-coded `paymentMethod` value of `manual`.
  - the page lists provider visibility requests with translated status and notes.
- `src/services/firebase/visibility.firebase.ts`
  - creates a `visibilityRequests` document after confirming the provider exists.
  - infers `type: boost` when the requested service area is already in `serviceAreaKeys`.
  - prevents duplicate pending requests for the same provider and service area.
  - hard-codes `tier: paid`.
- `src/services/demo/visibility.demo.ts`
  - mirrors the same request creation behavior for demo mode.
- `src/services/firebase/admin.firebase.ts`
  - admin approval updates the visibility request to `approved`.
  - boost approval sets the provider `visibilityTier` to `paid`.
  - boost approval sets `visibilityPaidUntil` to 30 days from the current time.
  - approval is currently implemented in a client-side Firebase admin service transaction.
- `src/services/demo/admin.demo.ts`
  - demo approval hard-codes the same 30-day paid expiry.
- `src/lib/ranking.ts`
  - `isPaidVisibilityActive` checks `visibilityTier === 'paid'` and `visibilityPaidUntil > now`.
  - `providerRankingScore` adds a paid bonus of `12`.
- `src/lib/ranking.test.ts`
  - proves weak paid providers do not automatically beat strong organic providers.
  - proves expired paid visibility is inactive.
  - proves active paid visibility is recognized.
- `functions/src/visibility.ts`
  - contains a small `approveVisibility(now, days)` date helper.
- `api/visibility/approve.ts`
  - exposes a Vercel handler that returns a paid-until date for a supplied duration.
  - it does not process visibility request approval or Firestore mutation.
- `firestore.rules`
  - permits provider-owned visibility request creation with `tier == paid` and `status == pending`.
  - permits admin updates to visibility requests.
- `tests/rules/firestore.rules.test.ts`
  - covers provider-owned visibility request creation and admin-only request processing.
- `firestore.indexes.json`
  - includes indexes for provider request history, duplicate pending request checks, and admin pending request order.

### Gaps

- No paid visibility product catalog exists.
- No price, currency, product version, duration, or cap policy is persisted on requests.
- Admin approval is not fully server-owned in the app flow.
- Client-side admin code can update request status and provider paid fields through Firestore rules.
- There is no real purchase integration or explicitly modeled manual payment state.
- There is no renewal, cancellation, expired request handling, or provider-facing active paid status panel.
- There is no scheduled expiry cleanup or paid-expiry audit/event row.
- The 30-day duration is hard-coded in multiple places.
- The Firestore rules do not validate product IDs, pricing snapshots, payment status, or disclosure acceptance.

### Work Items

#### 7.1.1 Define paid visibility product schema

Files:

- New: `src/types/paid-visibility.ts` or extend `src/types/visibility.ts`.
- New or updated: `src/config/visibility-products.ts`.
- Optional Firestore seed path under `scripts/seed-dev.ts`.

Changes:

- Add a `VisibilityProduct` type.
- Include `id`, `nameKey`, `descriptionKey`, `durationDays`, `priceAmount`, `currency`, `active`, `sortOrder`, `capPolicyId`, and `version`.
- Add a `VisibilityCapPolicy` type if caps will be managed separately.
- Keep catalog values simple and transparent.
- Do not encode ranking formula internals in product copy.

Acceptance:

- The app has a single typed source for paid products.
- Product records can be used by provider UI and admin approval.
- Inactive products cannot be selected for new requests.

#### 7.1.2 Extend visibility request data model

Files:

- `src/types/visibility.ts`.
- `src/firebase/converters.ts`.
- `src/services/firebase/visibility.firebase.ts`.
- `src/services/demo/visibility.demo.ts`.
- `firestore.rules`.
- `firestore.indexes.json` if new admin queries are added.

Changes:

- Add `productId`.
- Add `productVersion`.
- Add `priceAmount`.
- Add `currency`.
- Add `durationDays`.
- Add `capPolicyId`.
- Add `paymentStatus`.
- Add `paymentEvidenceNote` or replace free-form notes with structured admin/provider notes.
- Add `disclosureAcceptedAt`.
- Add `requestedBy`.
- Add `processedBy`.
- Add `approvedAt` and `rejectedAt` if clearer than only `processedAt`.

Acceptance:

- New requests carry a complete pricing and duration snapshot.
- Existing request display handles older documents without crashing.
- Firestore rules reject provider attempts to create arbitrary product or payment values.

#### 7.1.3 Update provider request UI to select products

Files:

- `src/features/dashboard/pages/visibility-page.tsx`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.
- `src/services/visibility.service.ts`.
- `src/services/contracts/visibility.contract.ts`.

Changes:

- Show active products in a compact transparent pricing table or radio-card list.
- Include price, duration, and “promoted visibility only” disclosure.
- Require explicit disclosure acceptance before submit.
- Use controlled payment method options instead of a hard-coded `manual` string.
- Keep service area selection for boost versus area expansion until Section 8 separates expansion billing.
- Disable submit while request creation is in progress.
- Show request creation errors as localized messages.

Acceptance:

- Provider cannot submit a boost without selecting an active product.
- Provider sees price, duration, and no-guarantee copy before submit.
- Submitted request persists the selected product snapshot.

#### 7.1.4 Move admin approval to server-owned mutation

Files:

- `functions/src/visibility.ts`.
- `functions/src/index.ts`.
- `functions/test/visibility.test.ts`.
- `src/services/firebase/admin.firebase.ts`.
- `src/services/contracts/admin.contract.ts`.
- `api/visibility/approve.ts` if Vercel API remains part of deployment.
- `firestore.rules`.

Changes:

- Implement a callable or server endpoint such as `approveVisibilityRequest`.
- Require admin authentication and admin role verification server-side.
- Load the request and provider in one transaction.
- Reject non-pending requests.
- Confirm `paymentStatus` is matched or set it atomically during approval.
- Resolve the selected product from the product snapshot or catalog.
- Set `visibilityTier: paid`.
- Set `paidVisibilityStartedAt`.
- Set `visibilityPaidUntil` based on product duration.
- Set `visibilityProductId`.
- Record `processedBy`, `processedAt`, and admin notes.
- Write an audit action and paid usage event in the same server-owned flow where practical.
- Update frontend admin service to call the server mutation instead of directly updating request and provider documents.
- Tighten Firestore rules so clients cannot directly set provider paid fields or process request status.

Acceptance:

- Client-side admin UI no longer owns paid visibility state mutation.
- Provider paid fields are changed only by trusted server code.
- Approval is atomic across request, provider, audit, and paid event records.

#### 7.1.5 Add expiry cleanup

Files:

- `functions/src/visibility.ts`.
- `functions/test/visibility.test.ts`.
- Optional scheduled function export in `functions/src/index.ts`.
- Optional admin service endpoint for manual expiry reconciliation.

Changes:

- Add an idempotent `expirePaidVisibility` job.
- Query providers with `visibilityTier == paid` and `visibilityPaidUntil <= now`.
- Set expired providers to organic or set `visibilityStatus: expired`.
- Preserve historical paid period data in a separate event or history collection.
- Write a paid-expiry audit/event row once per expiry.
- Do not delete visibility request history.

Acceptance:

- Running the job twice produces the same provider state and does not duplicate expiry events.
- Expired paid providers do not receive labels or paid ranking bonus before or after cleanup.

#### 7.1.6 Keep ranking caps configurable but opaque

Files:

- `src/lib/ranking.ts`.
- `src/lib/ranking.test.ts`.
- Optional: `src/config/ranking-policy.ts`.
- Optional: admin policy path from Section 6 and Section 10.

Changes:

- Move magic paid bonus `12` into a named policy constant.
- Add tests around the maximum paid bonus.
- Do not expose exact formula values in provider/customer UI.
- Ensure paid bonus cannot overcome approval, service area, suspension, or coverage exclusions.

Acceptance:

- Paid influence remains capped by tests.
- Organic providers can outrank paid providers.
- Paid status never bypasses public visibility eligibility filters.

### Tests for 7.1

#### Unit tests

Add or update:

- `src/lib/ranking.test.ts`.
- `src/services/visibility.service.test.ts`.
- `functions/test/visibility.test.ts`.

Cases:

- active product selection creates request snapshot.
- inactive product cannot be requested.
- duplicate pending boost remains blocked.
- paid bonus remains capped.
- expired paid visibility is inactive.
- server approval uses product duration.
- server approval rejects non-pending requests.
- expiry cleanup is idempotent.

#### Rules tests

Update:

- `tests/rules/firestore.rules.test.ts`.

Cases:

- provider can create only valid pending request shape.
- provider cannot set `paymentStatus: matched`.
- provider cannot spoof price, currency, duration, or product version if product validation is rules-backed.
- provider cannot approve or reject a request.
- provider cannot update `visibilityTier`, `visibilityPaidUntil`, `paidVisibilityStartedAt`, or product fields on provider docs.
- admin direct update is removed or limited if server-owned processing replaces direct client writes.

#### Integration or callable tests

Add:

- callable tests for `approveVisibilityRequest`.
- callable tests for `rejectVisibilityRequest`.
- callable tests for `expirePaidVisibility`.

Cases:

- admin approval updates provider and request atomically.
- non-admin approval rejects.
- approved request cannot be approved twice.
- payment mismatch rejection records reason and audit row.

## 7.2 Paid Labels

### Requirements Covered

- `PAID-004`: Paid listings MUST be clearly labeled in customer-facing search results.
- `PAID-005`: The label MUST distinguish promoted listings from organic listings.

### Current Implementation Evidence

- `src/features/search/pages/search-page.tsx`
  - active paid providers use highlighted card styling.
  - active paid providers render `t('common.featured')`.
- `src/features/providers/pages/provider-profile-page.tsx`
  - active paid providers use highlighted card styling on the profile page.
  - profile page currently shows the no-guarantee note but does not show a compact promoted label in the header area.
- `src/i18n/locales/en.json`
  - `common.featured` is “Promoted”.
- `src/i18n/locales/ar.json`
  - `common.featured` is “مروج”.

### Gaps

- Search result labels now use promoted language through locale copy.
- Profile header disclosure still needs explicit promoted paid language.
- Provider profile styling can look like quality endorsement rather than promotion.
- There are no component or e2e tests for active versus expired paid labels.
- There is no test proving organic listings have no promoted label.

### Work Items

#### 7.2.1 Replace paid label copy

Files:

- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.
- `src/features/search/pages/search-page.tsx`.
- `src/features/providers/pages/provider-profile-page.tsx`.

Changes:

- Add `visibility.promotedLabel`.
- English suggestion: “Promoted”.
- Arabic suggestion: use a clear paid-promotion equivalent such as “مروّج”.
- Use this key only when `isPaidVisibilityActive(provider)` returns true.
- Keep `common.featured` only if it is used elsewhere for non-paid editorial UI, or remove it if no longer needed.

Acceptance:

- Active paid search cards say promoted.
- Organic cards do not show the label.
- Expired paid providers do not show the label.

#### 7.2.2 Add customer-facing disclosure text

Files:

- `src/features/search/pages/search-page.tsx`.
- `src/features/providers/pages/provider-profile-page.tsx`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.

Changes:

- Add short accessible label text such as “Promoted paid visibility”.
- Add `aria-label` or visually included text that makes the paid nature clear.
- On provider profile, show compact disclosure near the header when paid is active.
- Do not expose ranking formulas.

Acceptance:

- Screen readers can distinguish promoted paid listings.
- Search and profile surfaces use consistent terminology.

#### 7.2.3 Add label regression tests

Files:

- New component tests if the project adds React Testing Library coverage.
- `tests/e2e/app.spec.ts` if existing e2e smoke is the preferred route.
- `src/lib/ranking.test.ts` for active versus expired helper coverage.

Cases:

- active paid provider search result includes promoted label.
- expired paid provider search result omits promoted label.
- organic provider search result omits promoted label.
- active paid provider profile includes promoted disclosure.

Acceptance:

- Paid labels cannot regress silently.

## 7.3 No Guarantees

### Requirements Covered

- `PAID-006`: The system MUST NOT guarantee leads from payment.
- `PAID-007`: The system MUST NOT guarantee jobs from payment.
- `PAID-008`: The system MUST NOT guarantee top placement from payment.

### Current Implementation Evidence

- `src/i18n/locales/en.json`
  - `visibility.note` says payment gives exposure and tools only and does not guarantee customers or jobs.
- `src/i18n/locales/ar.json`
  - Arabic copy mirrors the customers/jobs no-guarantee message.
- `src/features/dashboard/pages/visibility-page.tsx`
  - shows `visibility.note` before the request form.
- `src/features/providers/pages/provider-profile-page.tsx`
  - shows `provider.noGuarantee`.
- `docs/operations/admin-runbook.md`
  - says paid visibility gives exposure only and does not guarantee leads, jobs, ranking, or revenue.
- `src/lib/ranking.test.ts`
  - proves paid visibility does not automatically beat a strong organic provider.

### Gaps

- Provider request UI does not explicitly say no top placement.
- Provider request UI does not require disclosure acceptance.
- There is no test asserting no-guarantee copy is present before request submission.
- There is no persisted evidence that the provider accepted paid visibility terms.
- Admin approval UI does not show selected terms or disclosure acceptance.
- Search/profile label disclosure does not explicitly avoid endorsement language.

### Work Items

#### 7.3.1 Update paid visibility disclosure copy

Files:

- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.
- `src/features/dashboard/pages/visibility-page.tsx`.
- `docs/operations/admin-runbook.md` only if a later implementation needs runbook refresh.

Changes:

- Update `visibility.note` to include no leads, no jobs, and no top placement.
- Keep copy short and direct.
- Add separate `visibility.disclosureAcceptance` copy for a required checkbox.
- Add admin-only copy that approval confirms payment and product terms, not outcomes.

Acceptance:

- Provider request page explicitly says paid visibility does not guarantee leads, jobs, or top placement.
- Arabic and English copies are equivalent.

#### 7.3.2 Persist disclosure acceptance

Files:

- `src/types/visibility.ts`.
- `src/features/dashboard/pages/visibility-page.tsx`.
- `src/services/visibility.service.ts`.
- `src/services/firebase/visibility.firebase.ts`.
- `src/services/demo/visibility.demo.ts`.
- `firestore.rules`.

Changes:

- Require a checkbox before request creation.
- Persist `disclosureAcceptedAt`.
- Persist `disclosureVersion`.
- Reject request creation when disclosure was not accepted.

Acceptance:

- Every new paid visibility request proves provider acceptance of no-guarantee terms.

#### 7.3.3 Add no-guarantee regression tests

Files:

- Component test for `VisibilityPage`, if React component test pattern is added.
- `tests/e2e/app.spec.ts`.
- `src/services/visibility.service.test.ts`.

Cases:

- request UI contains no leads/jobs/top placement wording.
- request submission is blocked until disclosure checkbox is accepted.
- persisted request includes disclosure timestamp/version.
- ranking test continues proving paid does not guarantee top placement.

Acceptance:

- No-guarantee language and behavior are test-protected.

## 7.4 Free Provider Visibility

### Requirements Covered

- `PAID-009`: Free providers MUST remain eligible for public search visibility if approved.
- `PAID-010`: Providers MUST NOT be forced to pay to remain listed.

### Current Implementation Evidence

- `src/types/provider.ts`
  - provider visibility tier supports `organic` and `paid`.
- `src/services/firebase/auth.firebase.ts`
  - provider registration creates providers with `visibilityTier: organic`.
- `src/services/firebase/search.firebase.ts`
  - public search filters by `status`, `profession`, and `serviceAreaKeys`.
  - search does not require `visibilityTier == paid`.
- `src/lib/ranking.ts`
  - organic providers receive normal location, reputation, activity, and fairness scoring.
- `src/lib/ranking.test.ts`
  - proves a strong organic provider can outrank a weak paid provider.
- `src/services/search.service.test.ts`
  - demo search returns default organic results and bounded result counts.

### Gaps

- No Firebase adapter or emulator test proves approved organic providers appear in search.
- No e2e test proves a free approved provider can be discovered and opened.
- No negative regression test guards against future `visibilityTier == paid` query filters.
- Provider dashboard does not clearly show organic status as valid and listed.
- Pricing transparency for providers is not implemented, so it is not obvious that payment is optional.

### Work Items

#### 7.4.1 Add organic visibility tests

Files:

- `src/services/search.service.test.ts`.
- Firebase adapter tests if the project adds emulator-backed service tests.
- `tests/rules/firestore.rules.test.ts`.
- `tests/e2e/app.spec.ts`.

Cases:

- approved organic provider appears in search.
- approved paid provider appears in search.
- pending, rejected, and suspended providers do not appear.
- organic provider profile is reachable from search.
- paid status is not required for public listing.

Acceptance:

- Free approved providers remain visible in tested search paths.

#### 7.4.2 Add provider dashboard active status panel

Files:

- `src/features/dashboard/pages/provider-dashboard-page.tsx`.
- `src/features/dashboard/pages/visibility-page.tsx`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.

Changes:

- Show current visibility status as organic or promoted.
- For organic providers, state that approved providers remain listed without paid visibility.
- For paid providers, show expiry date and renewal affordance.
- Do not expose ranking formula details.

Acceptance:

- Organic providers can see they are publicly eligible when approved.
- Paid providers can see active expiry without assuming guaranteed placement.

#### 7.4.3 Add pricing transparency surface

Files:

- `src/features/dashboard/pages/visibility-page.tsx`.
- `src/config/visibility-products.ts`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.

Changes:

- Show all active paid products with equal price visibility.
- Make it explicit that paid products are optional.
- Avoid hidden fees and per-lead language.

Acceptance:

- Providers can compare products before requesting.
- The UI does not imply payment is required to stay listed.

## Cross-Cutting Data Model

### Existing Data Shape

Current provider fields:

- `visibilityTier: 'organic' | 'paid'`.
- `visibilityPaidUntil: string | null`.

Current visibility request fields:

- `id`.
- `providerId`.
- `type`.
- `tier`.
- `serviceArea`.
- `status`.
- `paymentConfirmedBy`.
- `paymentMethod`.
- `notes`.
- `requestedAt`.
- `processedAt`.
- `rejectionReason`.

### Target Data Shape

Provider fields:

- `visibilityTier`.
- `paidVisibilityStartedAt`.
- `visibilityPaidUntil`.
- `visibilityProductId`.
- `visibilityProductVersion`.
- `visibilityCapPolicyId`.
- `visibilityStatus`.

Visibility request fields:

- existing request identity and status fields.
- `productId`.
- `productVersion`.
- `priceAmount`.
- `currency`.
- `durationDays`.
- `capPolicyId`.
- `paymentStatus`.
- `paymentMethod`.
- `providerNote`.
- `adminNote`.
- `disclosureVersion`.
- `disclosureAcceptedAt`.
- `requestedBy`.
- `processedBy`.
- `approvedAt`.
- `rejectedAt`.

Paid visibility event fields:

- `id`.
- `providerId`.
- `requestId`.
- `productId`.
- `eventType`.
- `occurredAt`.
- `actorId`.
- `previousPaidUntil`.
- `newPaidUntil`.
- `metadata`.

## Security and Rules Plan

Rules should preserve these boundaries:

- Providers can create their own pending requests only.
- Providers cannot approve, reject, match payment, or edit processed requests.
- Providers cannot mutate paid fields on provider docs.
- Admin clients should not directly mutate paid provider fields once server-owned approval exists.
- Server code owns paid state transitions.
- Customers have no write path to visibility products, requests, payments, or provider paid fields.

Recommended rules changes:

- Validate request keys against the extended schema.
- Validate controlled enum fields.
- Validate `requestedBy == request.auth.uid`.
- Validate `status == pending` on create.
- Validate `paymentStatus == pending` on create.
- Validate `disclosureAcceptedAt` exists on create.
- Disallow client update of visibility requests except narrowly allowed provider note cancellation if product decides to support cancellation.
- Disallow client update of provider visibility fields by owners.

## Analytics and Audit Plan

Required tracking:

- paid request created.
- paid request approved.
- paid request rejected.
- paid visibility activated.
- paid visibility expired.
- paid visibility renewed.
- paid request payment mismatch.

Current evidence:

- `src/services/admin.service.test.ts` covers audit actions for `approve_visibility` and `reject_visibility`.
- `docs/operations/admin-runbook.md` defines manual admin behavior.

Gaps:

- No dedicated paid visibility usage or expiry events exist.
- No expiry job event exists.
- No pricing/product snapshot is available for later analytics.

Acceptance:

- Admin action logs continue to record admin decisions.
- Paid visibility events support usage and expiry reporting without exposing ranking formulas.

## Verification Commands

Run after implementation:

```bash
npm test -- src/lib/ranking.test.ts
npm test -- src/services/visibility.service.test.ts src/services/admin.service.test.ts src/services/search.service.test.ts
npm run test:rules
cd functions && npm test && npm run build
npm run lint
npm run build
npm run e2e
```

Optional targeted checks:

```bash
npm test -- src/firebase/converters.test.ts src/lib/display.test.ts
npm test -- src/services/analytics.service.test.ts
```

Manual smoke checks:

1. Register or use an approved organic provider.
2. Confirm the organic provider appears in search.
3. Open provider visibility page.
4. Confirm pricing, duration, no-guarantee copy, and optional-payment language are visible.
5. Submit a paid visibility request after accepting disclosure.
6. Open admin visibility requests.
7. Confirm selected product and payment state are visible.
8. Approve the request through server-owned action.
9. Confirm provider becomes promoted until the expected expiry date.
10. Confirm customer search shows a promoted paid label.
11. Advance or seed expiry and run expiry cleanup.
12. Confirm provider returns to organic behavior and label disappears.

## Effort Estimate

| Area | Estimate | Notes |
|---|---:|---|
| Product schema and catalog | 0.5-1 day | Includes types, config, i18n, seed data, and migration notes. |
| Provider request UI and disclosure | 1-1.5 days | Includes product selection, copy, error states, and request shape. |
| Server-owned admin approval | 1.5-2.5 days | Includes callable or API, rules tightening, frontend service update, and tests. |
| Expiry cleanup and paid events | 1-2 days | Depends on scheduler setup and event/audit model. |
| Paid label and disclosure UI | 0.5-1 day | Search and profile surfaces plus tests. |
| Organic visibility regressions | 0.5-1 day | Unit, rules, and e2e coverage. |
| Full verification and fixes | 1 day | Lint, build, rules, functions, e2e, and any emulator issues. |

Total expected effort: **6-10 engineering days**.

The lower end assumes manual payments remain v1 scope and existing Firebase/function test harnesses are stable.

The upper end assumes rules refactoring and callable emulator tests need setup work.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Client-side admin approval remains privileged | Paid state can be mutated outside server-owned policy | Move approval and rejection into trusted server code and tighten rules. |
| Product terms are not snapshotted | Price or duration disputes become hard to audit | Persist product version, price, currency, and duration on every request. |
| “Featured” reads as endorsement | Customers may misunderstand paid listings | Use explicit promoted paid labels and no-guarantee disclosure. |
| Expired providers keep stale paid fields | Dashboard/admin/analytics can misreport paid state | Keep search-time checks and add idempotent expiry cleanup. |
| Paid visibility crowds out organic providers | Violates Section 7 and ranking guardrails | Keep no-guarantee product rules and add organic outranking tests. |
| Manual payment notes become sensitive or inconsistent | Privacy and audit risk | Use controlled payment states and avoid secret or credential capture. |
| Product catalog diverges between UI and server | Approval terms can differ from displayed terms | Use one catalog source or persist request snapshots server-side. |

## Definition of Done

Section 7 is done when:

- Paid visibility products are typed, transparent, active/inactive aware, and used by request UI.
- Requests persist product, price, duration, payment, status, and disclosure snapshots.
- Providers can request paid visibility without being forced to pay for public listing.
- Admin approval and rejection are server-owned and audited.
- Paid activation sets start and expiry fields from product terms.
- Expiry is enforced at ranking/render time and reconciled by cleanup.
- Search and profile labels clearly say promoted paid visibility.
- No-guarantee copy includes no leads, no jobs, and no top placement.
- Organic approved providers remain searchable and can outrank paid providers.
- Rules prevent provider/customer mutation of paid state.
- Tests cover active, expired, organic, paid, rejected, and unauthorized paths.
- Verification commands pass or documented blockers are converted into tracked checklist items.
