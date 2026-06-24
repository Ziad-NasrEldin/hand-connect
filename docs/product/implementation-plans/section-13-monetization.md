# Section 13 Implementation Plan - Monetization

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 13.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 13.1-13.4 and related rows 7.1-7.4, 8.3, 10.5, 12.3, 14.4, and 15.

Goal: make section 13 fully implemented for Herafy v1 while preserving the core product boundary that Herafy monetizes provider visibility, not customer transactions, provider work, service payments, leads, commissions, or guaranteed outcomes.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 13.1 Visibility-Based Monetization | Partially implemented | Providers can request paid visibility or area expansion, paid product metadata exists, area expansion is defined at 250 EGP/month, server-owned approval exists, paid boost expiry exists, and no-cap paid visibility is the product policy. Live Paymob card capture/webhooks, renewal status, and complete query-time entitlement guards remain incomplete. |
| 13.2 Customer Pricing Boundaries | Implemented | No customer checkout, customer subscription, customer contact fee, service-payment, or customer billing route was found. Contact remains WhatsApp or in-app chat. This needs regression tests so payment routes cannot appear silently. |
| 13.3 Provider Transaction Boundaries | Implemented | No commission, per-lead charging, service payment, escrow, booking payment, customer-provider payment processing, or outcome guarantee path was found. The boundary is enforced mostly by absence and copy, not automated tests or an ADR. |
| 13.4 Pricing Transparency | Partially implemented | Provider visibility request UI displays shared product terms, area expansion price, renewal terms, no-guarantee copy, and request snapshots. Live Paymob card terms and complete accepted renewal evidence remain incomplete. |

## Product Decisions Needed Before Implementation

### Decision A - Paid product shape for v1

The SRS says paid visibility tiers or products are required.

Recommended v1 decision: **ship a small server-configured paid product catalog with one boost product and one recurring area expansion product.**

Reason:

- The current app already has request and approval surfaces.
- A catalog is the minimum durable structure needed for transparent pricing, product terms, admin selection, pricing versioning, and future tiers.
- It avoids hardcoding money and duration into UI copy or admin transactions.

Recommended initial products:

| Product | Type | Duration | Billing model | Notes |
|---|---|---:|---|---|
| Visibility Boost | `visibility_boost` | 30 days | Pay as you go by card | Gives promoted exposure without a separate visibility cap policy and never guarantees leads, jobs, or top placement. |
| Additional Service Area | `area_expansion` | Monthly | 250 EGP/month auto-renewed by Visa/card through Paymob | Requires eligibility gates and unpaid/expired entitlement handling. |

Implementation implication:

- Add a `paidProducts` or `monetizationProducts` collection.
- Keep amounts in a minor-unit integer such as `priceAmountMinor`.
- Store `currency`, `durationDays`, `billingInterval`, `active`, `sortOrder`, and transparent display copy.
- Store the selected product snapshot on each request so old approvals remain auditable after prices change.

### Decision B - Manual payment versus integrated payment processor

Current evidence shows manual payment notes, manual admin confirmation, and no payment processor dependency.

Recommended v1 decision: **keep manual provider payment confirmation for v1, but model payment state explicitly.**

Reason:

- This matches the existing architecture and App Store-safe positioning.
- It avoids introducing checkout complexity while still meeting pricing transparency and audit needs.
- It keeps service payments out of scope.

Implementation implication:

- Do not add customer checkout.
- Do not add service-payment processing.
- Do not add customer-provider payment flows.
- Add `paymentStatus`, `paymentReference`, `paymentMethod`, `paymentReceivedAt`, `paymentConfirmedBy`, and `paymentNotes` to monetization requests.
- Route approval through a trusted callable instead of allowing client-side admin transactions to mutate provider paid entitlements.

### Decision C - Area expansion recurring fee semantics

The SRS requires recurring fees for eligible geographic expansion.

Recommended v1 decision: **area expansion approval creates an area entitlement with a paid-through date, renewal status, and expiry behavior.**

Reason:

- The current implementation appends service areas permanently after approval.
- That does not satisfy recurring fee behavior.
- Search coverage must not continue for rejected, unpaid, or expired expansion areas.

Implementation implication:

- Split base service area from paid expansion entitlements.
- Add `providerAreaEntitlements` or provider subcollection records.
- Each expansion entitlement has `startsAt`, `paidThrough`, `expiresAt`, `status`, `productId`, and `pricingVersionId`.
- Search coverage must ignore expired or unpaid expansion areas.
- A scheduled job or query-time guard must expire unpaid/expired area entitlements.

### Decision D - Customer pricing and transaction boundary enforcement

Recommended v1 decision: **add explicit negative tests and an ADR, but keep these flows absent.**

Reason:

- Requirements `MONEY-004` through `MONEY-009` are mostly satisfied by the absence of routes and APIs.
- Absence can regress silently unless guarded.

Implementation implication:

- Add a short ADR or product-boundary doc that says Herafy does not charge customers, process service payments, take commissions, charge per lead, or guarantee outcomes.
- Add route/API/static regression tests that fail if checkout, escrow, booking payment, commission, lead charging, or customer billing surfaces are introduced.

### Decision E - Paid label wording

Current UI label uses `common.featured`, which is not explicit enough for the SRS paid-label and pricing transparency family.

Recommended v1 decision: **customer-facing paid listings should be labeled `Promoted` or localized equivalent, not only `Featured`.**

Reason:

- The SRS requires clear paid/promoted distinction in Section 7.
- Section 13 pricing transparency is easier to satisfy when paid exposure is plainly named.

Implementation implication:

- Rename paid label keys to explicit promoted wording.
- Preserve organic listing eligibility and avoid language that implies ranking guarantees.

## Target End State

Section 13 is complete when:

1. The monetization model is visibility-based and does not monetize customer transactions.
2. Providers can view simple, transparent paid product terms before requesting paid visibility or area expansion.
3. Paid products are represented in a server-controlled catalog with amount, currency, duration, billing model, active state, and display order.
4. Visibility requests store the product id and immutable pricing snapshot used at request time.
5. Area expansion requests support recurring fee state through entitlements, paid-through dates, expiry, renewal, and unpaid handling.
6. Admins approve or reject monetization requests through trusted callables that update request state, provider entitlements, audit logs, and paid visibility fields consistently.
7. Expired paid visibility does not affect ranking.
8. Expired or unpaid area expansion does not affect public search coverage.
9. Paid ranking influence follows product rules without a separate visibility cap policy and cannot guarantee top placement.
10. Customers are never charged to search, view, contact, message, or review.
11. Customer-provider service payments remain outside the app.
12. The platform does not take commissions, charge per lead in v1, process provider job payments, or guarantee outcomes in exchange for payment.
13. Provider pricing displays are equal for eligible providers and avoid hidden fees.
14. Public and provider-facing copy states that paid visibility gives promoted exposure only and does not guarantee leads, jobs, revenue, service quality, or top placement.
15. Tests cover catalog display, request snapshots, server-side approval, expiry behavior, boundary absence, and disclosure copy.

## Detailed Implementation Plan

## 13.1 Visibility-Based Monetization

### Requirements Covered

- `MONEY-001`: The platform MUST monetize provider visibility, not customer transactions.
- `MONEY-002`: The system MUST support paid visibility tiers or products.
- `MONEY-003`: The system MUST support recurring fees for eligible geographic expansion.

### Current Implementation Evidence

- `src/features/dashboard/pages/visibility-page.tsx`
  - Providers can submit a paid visibility or area expansion request.
  - Area expansion is blocked until `reviewCount >= 30`.
  - Request copy says payment gives exposure and tools only.
- `src/types/visibility.ts`
  - `VisibilityRequest` supports `type`, `tier: 'paid'`, `serviceArea`, status, payment method, payment confirmation, notes, and timestamps.
  - There is no product id, price, currency, duration, billing period, payment status, renewal state, or pricing snapshot.
- `src/services/firebase/visibility.firebase.ts`
  - Creates `visibilityRequests` records.
  - Determines boost versus area expansion by checking whether the selected service area is already in `provider.serviceAreaKeys`.
  - Prevents duplicate pending requests for the same provider and service area.
- `src/features/admin/pages/visibility-requests-page.tsx`
  - Admins can approve or reject pending visibility requests.
  - Admin page shows provider id and status, but not product name, price, billing term, renewal state, or payment reference.
- `src/services/firebase/admin.firebase.ts`
  - `approveVisibilityRequest` runs a client-side Firestore transaction.
  - Boost approval sets `visibilityTier: 'paid'` and `visibilityPaidUntil` for 30 days.
  - Area expansion approval appends the requested service area directly to provider coverage.
  - Approval writes an audit row through client code.
- `functions/src/visibility.ts`
  - Contains only a pure `approveVisibility(now, days = 30)` helper.
  - There is no callable for monetization request approval.
- `src/lib/ranking.ts`
  - `isPaidVisibilityActive` only applies paid influence before `visibilityPaidUntil`.
  - Paid bonus is capped at 12 points.
- `src/lib/ranking.test.ts`
  - Tests active paid visibility, expired paid visibility, and a paid cap case where weak paid providers do not automatically beat strong organic providers.
- `firestore.rules`
  - Providers can create valid pending visibility requests.
  - Admins can update visibility requests directly.
  - Provider updates do not allow owners to modify `visibilityTier` or `visibilityPaidUntil`.

### Work Items

#### 13.1.1 Add monetization product catalog types

Files:

- New or updated: `src/types/monetization.ts`
- Optional: update `src/types/visibility.ts`

Changes:

- Add `PaidProductType` with values such as `visibility_boost` and `area_expansion`.
- Add `BillingInterval` with values such as `one_time`, `monthly`, and possibly `manual_recurring`.
- Add `PaidProduct`:
  - `id`
  - `type`
  - `nameAr`
  - `nameEn`
  - `descriptionAr`
  - `descriptionEn`
  - `priceAmountMinor`
  - `currency`
  - `durationDays`
  - `billingInterval`
  - `active`
  - `sortOrder`
  - `createdAt`
  - `updatedAt`
- Add `PricingSnapshot`:
  - `productId`
  - `productType`
  - `nameAr`
  - `nameEn`
  - `priceAmountMinor`
  - `currency`
  - `durationDays`
  - `billingInterval`
  - `capturedAt`

Acceptance:

- Product catalog can represent at least one boost product and one recurring area expansion product.
- Request records can persist the exact price and duration accepted by the provider.

#### 13.1.2 Seed and load active paid products

Files:

- `src/services/demo/seed-data.ts`
- New or updated service: `src/services/monetization.service.ts`
- New or updated contract: `src/services/contracts/monetization.contract.ts`
- New Firebase adapter: `src/services/firebase/monetization.firebase.ts`
- New demo adapter: `src/services/demo/monetization.demo.ts`
- Firestore seed script if product data is seeded outside demo fixtures.

Changes:

- Seed two active products:
  - one `visibility_boost` product with 30-day duration.
  - one `area_expansion` product with recurring billing semantics.
- Add `listActivePaidProducts`.
- Query only `active == true`.
- Sort by `sortOrder`.
- Provide a demo fallback only if Firebase product catalog is empty and product accepts that fallback.

Acceptance:

- Provider UI can load product rows without hardcoding price terms in the page.
- Inactive products are not shown to providers.

#### 13.1.3 Replace free-form visibility request creation with product-based request creation

Files:

- `src/features/dashboard/pages/visibility-page.tsx`
- `src/services/contracts/visibility.contract.ts`
- `src/services/firebase/visibility.firebase.ts`
- `src/services/demo/visibility.demo.ts`
- `src/types/visibility.ts`
- Locale files.

Changes:

- Require a selected `productId` when creating a visibility request.
- Derive request type from selected product type and target area.
- Store `pricingSnapshot` on the request.
- Store `paymentStatus: 'pending_manual_confirmation'` or similar.
- Store optional `paymentReference` separately from provider notes.
- Keep provider notes for human context, not as the source of product terms.
- Validate that boost products can only target an existing active service area.
- Validate that area expansion products can only target an eligible new service area.

Acceptance:

- A request cannot be created against a missing, inactive, or mismatched paid product.
- A request remains understandable if the paid product price changes later.

#### 13.1.4 Move paid approval and rejection to Cloud Functions

Files:

- `functions/src/visibility.ts`
- `functions/src/index.ts`
- New or updated functions tests under `functions/test/`
- `src/services/firebase/admin.firebase.ts`
- `src/services/demo/admin.demo.ts`
- `firestore.rules`

Changes:

- Add callable `approveVisibilityRequest`.
- Add callable `rejectVisibilityRequest`.
- Require admin role and active account in callable.
- In one trusted transaction:
  - read request.
  - reject non-pending request.
  - read paid product or validate request snapshot.
  - update payment status and admin confirmation fields.
  - update provider boost entitlement or create area expansion entitlement.
  - write server-owned audit log.
- Update frontend admin adapter to call the callable instead of running a client Firestore transaction.
- Tighten `firestore.rules` so direct client updates to `visibilityRequests` are not allowed, or are limited to server SDK only if rules are not involved.

Acceptance:

- Admin UI can approve and reject through callables.
- Direct client writes cannot grant paid visibility, area coverage, payment confirmation, or approval state.
- Audit rows are server-owned for monetization approvals.

#### 13.1.5 Add provider paid visibility entitlement model

Files:

- `src/types/provider.ts`
- `src/types/monetization.ts`
- Firebase converters.
- Firebase search/ranking services.
- Demo seed data.

Changes:

- Keep existing provider fields if needed for fast search:
  - `visibilityTier`
  - `visibilityPaidUntil`
- Add explicit entitlement state if needed:
  - `activeVisibilityProductId`
  - `visibilityStartedAt`
  - `visibilityPaidThrough`
  - `visibilityRequestId`
  - `visibilityPricingSnapshot`
- Ensure expired visibility is treated as organic at query/ranking time.
- Add a cleanup or reconciliation path that can clear stale `visibilityTier: 'paid'` after expiry if product wants stored state to match computed state.

Acceptance:

- Active paid boost has traceability back to a product, request, payment confirmation, and expiry.
- Expired paid boost does not influence ranking or customer labels.

#### 13.1.6 Add recurring area expansion entitlements

Files:

- New type: `ProviderAreaEntitlement`
- New collection or provider subcollection.
- `src/services/firebase/search.firebase.ts`
- `src/services/demo/search.demo.ts`
- `src/lib/provider-coverage.ts` if Section 2 coverage model is implemented.
- `firestore.indexes.json`
- `firestore.rules`

Changes:

- Model area expansion as an entitlement rather than permanently appending to `serviceAreaKeys`.
- Fields:
  - `id`
  - `providerId`
  - `serviceArea`
  - `city`
  - `status`
  - `productId`
  - `pricingSnapshot`
  - `requestId`
  - `startsAt`
  - `paidThrough`
  - `expiresAt`
  - `renewalStatus`
  - `createdAt`
  - `updatedAt`
- Search must include only active entitlements whose paid-through or expiry state is valid.
- Rejected, pending, unpaid, or expired expansion areas must not affect public search coverage.
- Admin approval should create or extend entitlement period.

Acceptance:

- Paid additional area coverage can expire or be renewed.
- Public search ignores unpaid or expired expansion areas.
- The initial approved service area remains available without requiring paid expansion.

#### 13.1.7 Add renewal and expiry handling

Files:

- Cloud Functions scheduled job if Firebase scheduled functions are available.
- Or query-time helper and admin maintenance action if scheduled jobs are deferred.
- Provider dashboard visibility page.
- Admin visibility requests page.

Changes:

- Decide whether expiry is enforced by scheduled job, query-time filtering, or both.
- Add `expires_soon`, `expired`, and `renewed` states where useful.
- Add renewal request creation for active or recently expired area entitlements.
- Add admin renewal approval that extends `paidThrough`.
- Add provider UI showing active paid boost end date and active area entitlement paid-through date.

Acceptance:

- Providers can understand when paid products expire.
- Expired products stop affecting visibility even if a cleanup job has not run yet.

#### 13.1.8 Keep ranking influence capped and product-controlled

Files:

- `src/lib/ranking.ts`
- `src/lib/ranking.test.ts`
- Optional config: `src/config/ranking-policy.ts`
- Admin policy configuration if Section 6 or 10 implements it.

Changes:

- Keep paid influence as a capped additive signal.
- Consider moving paid bonus amount to a read-only ranking policy config.
- Ensure paid boost cannot overcome severe quality, status, coverage, or expiry failures.
- Ensure paid boost cannot include providers outside valid coverage.

Acceptance:

- Tests prove paid providers do not automatically rank above stronger organic providers.
- Expired paid providers rank as organic.
- Paid outside-coverage providers do not appear or do not outrank covered providers, depending Section 2 decision.

### Tests for 13.1

#### Unit tests

Add or update:

- `src/lib/ranking.test.ts`
- New `src/services/monetization.service.test.ts`
- New or updated visibility service tests.

Cases:

- Active product list excludes inactive products.
- Product snapshot is captured when request is created.
- Missing product rejects request creation.
- Inactive product rejects request creation.
- Boost product cannot create area expansion.
- Area expansion product cannot be used for existing area boost unless product explicitly allows it.
- Expired paid visibility returns false from `isPaidVisibilityActive`.
- Paid cap does not guarantee top placement.

#### Functions tests

Add or update:

- `functions/test/visibility.test.ts`

Cases:

- Non-admin approval rejects.
- Admin approval of boost sets paid visibility through selected duration.
- Admin approval of area expansion creates or extends area entitlement.
- Approval rejects already processed requests.
- Rejection stores reason and does not mutate provider visibility.
- Payment confirmation fields are set by the callable, not by provider input.
- Audit log is written with actor, action, target, and timestamp.

#### Firestore rules tests

Add or update:

- `tests/rules/firestore.rules.test.ts`

Cases:

- Provider can create only a valid pending monetization request for their own provider profile.
- Provider cannot create an approved request.
- Provider cannot set payment confirmation fields.
- Provider cannot directly update `visibilityTier`, `visibilityPaidUntil`, or area entitlements.
- Non-admin cannot update visibility requests.
- Direct client writes cannot approve paid products.

#### E2E tests

Add or update:

- `tests/e2e/app.spec.ts` or focused provider/admin e2e spec.

Cases:

- Provider sees paid product terms before request.
- Provider submits paid visibility request.
- Admin sees product, price, payment state, and can approve.
- Approved boost shows promoted label until expiry.
- Expired boost does not show promoted label.
- Area expansion does not affect search until approved and paid.

## 13.2 Customer Pricing Boundaries

### Requirements Covered

- `MONEY-004`: Customers MUST NOT be charged to use the platform.
- `MONEY-005`: The platform MUST NOT charge customers for contacting providers.

### Current Implementation Evidence

- No customer payment route was found under `src/features`.
- Customer surfaces are landing, search, provider profile, messaging, and reviews.
- `src/features/providers/pages/provider-profile-page.tsx` uses WhatsApp and chat contact behavior rather than checkout.
- Locale copy says direct contact has no commissions or platform middlemen.
- The implementation map says no customer payment, checkout, fee, or paid-contact flow was found.

### Work Items

#### 13.2.1 Add customer pricing boundary ADR

Files:

- New: `docs/product/monetization-boundaries.md` or ADR under existing docs convention.

Content:

- Customers are not charged to search.
- Customers are not charged to view provider profiles.
- Customers are not charged to start chat.
- Customers are not charged to reveal/open WhatsApp.
- Customers are not charged to submit reviews.
- Paid products are provider-side visibility products only.
- Customer-provider service payments are out of scope for v1.

Acceptance:

- Product boundary is documented in a durable place.
- Future implementers can distinguish provider visibility fees from customer transaction fees.

#### 13.2.2 Add route and navigation negative tests

Files:

- New test helper or existing app route tests.
- `tests/e2e/app.spec.ts` if browser route checks are preferred.
- Optional static test under `src/__tests__/product-boundaries.test.ts`.

Checks:

- No customer route path includes `/checkout`, `/payment`, `/billing`, `/pay`, `/subscribe`, `/invoice`, or `/wallet` unless it is provider monetization-specific and gated.
- Customer provider profile actions do not navigate to checkout.
- Chat and WhatsApp contact actions do not require payment.

Acceptance:

- A future customer-facing payment route causes a test failure or explicit review.

#### 13.2.3 Add customer contact no-fee regression test

Files:

- Provider profile component/e2e test.
- Callables tests for `startConversation` and `revealWhatsApp` if available.

Cases:

- Logged-in customer can start chat without a payment object.
- Logged-in customer can reveal WhatsApp without a payment object.
- Contact event does not contain customer fee fields.

Acceptance:

- Contact remains free to the customer.

#### 13.2.4 Keep customer copy explicit but not overbearing

Files:

- Locale files.
- Landing/profile/search copy where product boundary is mentioned.

Changes:

- Preserve concise copy that Herafy is a connection layer.
- Avoid customer-facing wording that implies paid service ordering, checkout, booking payment, or platform-provided work.

Acceptance:

- Users are not misled into thinking Herafy charges them for contact.

### Tests for 13.2

#### Static or unit tests

Cases:

- Route list does not include customer payment routes.
- Source scan or route config test catches checkout/payment route names.
- Contact payload types do not require customer fee fields.

#### E2E tests

Cases:

- Search to provider profile to chat does not show a payment step.
- Search to provider profile to WhatsApp does not show a payment step.

## 13.3 Provider Transaction Boundaries

### Requirements Covered

- `MONEY-006`: The platform MUST NOT take commissions on provider jobs.
- `MONEY-007`: The platform MUST NOT charge per lead in v1.
- `MONEY-008`: The platform MUST NOT process payments between customers and providers.
- `MONEY-009`: The platform MUST NOT guarantee outcomes in exchange for payment.

### Current Implementation Evidence

- No commission model was found.
- No per-lead billing model was found.
- Contact events exist for analytics and eligibility, not billing.
- No service payment, escrow, checkout, or job fulfillment flow was found.
- Locale copy says Herafy does not set prices or guarantee the job.
- Visibility copy says payment gives exposure and tools only and does not guarantee customers or jobs.
- Admin runbook references manual payment confirmation for paid visibility, not service payments.
- Ranking tests show paid visibility does not automatically beat strong organic providers.

### Work Items

#### 13.3.1 Add provider transaction boundary ADR

Files:

- New or shared: `docs/product/monetization-boundaries.md`

Content:

- Herafy does not take a percentage of provider jobs.
- Herafy does not bill per contact or per lead in v1.
- Herafy does not process the service payment between customer and provider.
- Herafy does not hold escrow.
- Herafy does not guarantee customer leads, job conversion, revenue, service quality, or top placement.
- Contact analytics may count contacts but must not become billing events without a new product decision and SRS change.

Acceptance:

- Provider transaction boundaries are explicit and reviewable.

#### 13.3.2 Add negative API and schema tests

Files:

- New static boundary test.
- Type tests or plain Vitest test.

Checks:

- No exported customer-provider payment service exists.
- No commission field exists on provider job entities because no job entity should exist in v1.
- No lead-price or per-lead billing fields exist on contact events.
- No escrow route or function exists.

Acceptance:

- Introducing commission, escrow, service payment, or per-lead billing requires a conscious test update.

#### 13.3.3 Harden contact analytics against billing semantics

Files:

- Contact event types and functions.
- Analytics documentation or Section 12 plan if implemented separately.

Changes:

- Keep contact events named as analytics or eligibility signals.
- Avoid `leadCharge`, `leadPrice`, `billableLead`, or similar fields.
- If internal language currently uses "lead", document it as non-billable contact analytics for v1.

Acceptance:

- Contact tracking cannot be mistaken for per-lead monetization.

#### 13.3.4 Update no-guarantee copy to include top placement

Files:

- Locale files.
- `src/features/dashboard/pages/visibility-page.tsx`
- Search/profile paid label copy if needed.

Changes:

- Current English copy says payment does not guarantee customers or jobs.
- Add no top-placement guarantee where paid visibility is requested or approved.
- Keep copy clear and short.

Acceptance:

- Provider paid product UI says payment does not guarantee customers, jobs, revenue, or top placement.

### Tests for 13.3

#### Unit/static tests

Cases:

- Visibility copy includes no lead/job/top-placement guarantee.
- Product-boundary source scan does not find forbidden commission, escrow, or service-payment routes.
- Contact event schema does not include billing fields.

#### Ranking tests

Cases:

- Paid boost cannot guarantee top result when organic quality signals are stronger.
- Expired paid boost has no paid influence.
- Suspended or unapproved paid provider is excluded by search and does not keep paid benefits.

## 13.4 Pricing Transparency

### Requirements Covered

- `MONEY-010`: Provider pricing tiers MUST be simple and transparent.
- `MONEY-011`: Provider pricing MUST avoid hidden fees.
- `MONEY-012`: Pricing visibility MUST be equal for providers.
- `MONEY-013`: Providers MUST NOT be forced to pay to remain publicly listed.

### Current Implementation Evidence

- Provider request UI currently lets providers choose a service area and enter manual payment notes.
- No visible price amount, currency, duration, renewal term, or product comparison table was found.
- The request type is inferred by whether the chosen area is already in provider coverage.
- Free provider visibility exists through `visibilityTier: 'organic'`.
- Search includes approved providers without requiring paid status.
- Ranking tests prove a strong organic provider can outrank a weak paid provider.
- There is no Firebase-mode test proving free approved providers always appear in search.

### Work Items

#### 13.4.1 Add provider-facing pricing table

Files:

- `src/features/dashboard/pages/visibility-page.tsx`
- New component: `src/features/dashboard/components/paid-products-table.tsx` if useful.
- Locale files.
- `src/services/monetization.service.ts`

Changes:

- Display active paid products as a simple table or segmented list.
- Show product name.
- Show price and currency.
- Show duration.
- Show billing model.
- Show eligibility rules.
- Show no-guarantee disclosure.
- Show renewal/expiry policy for recurring area expansion.
- Disable unavailable products with a reason instead of hiding all context.

Acceptance:

- Provider can understand what is paid, how much it costs, how long it lasts, and what it does not guarantee before submitting a request.

#### 13.4.2 Add equal pricing source of truth

Files:

- `paidProducts` collection.
- Admin product management if Section 10.5 implements it.
- Seed data.

Changes:

- Do not compute prices per provider in the client.
- Do not allow ad-hoc admin-entered price at approval time unless stored as an explicit discount policy.
- Make product list global and active/inactive controlled.
- Store product snapshot on requests.

Acceptance:

- Two eligible providers see the same active product terms.
- Admin approval cannot silently alter price after provider request without a new request or explicit audited adjustment.

#### 13.4.3 Add no-hidden-fee disclosure and request acceptance

Files:

- `visibility-page.tsx`
- Locale files.
- `VisibilityRequest` type.

Changes:

- Add concise disclosure:
  - listed price is the provider visibility fee for the stated term.
  - payment does not guarantee leads, jobs, revenue, or top placement.
  - Herafy does not charge customers and does not take job commissions.
  - area expansion renewal is required after the paid-through date if applicable.
- Add `acceptedTermsVersion` or `pricingDisclosureVersion`.
- Add checkbox only if product/legal wants explicit acceptance.

Acceptance:

- Each paid request records which pricing terms or disclosure version the provider accepted.

#### 13.4.4 Preserve free public listing eligibility

Files:

- Search services.
- Ranking tests.
- Firebase/rules tests.
- Provider dashboard copy.

Changes:

- Keep approved organic providers searchable.
- Ensure product copy says paid visibility is optional.
- Add tests that an approved free provider appears in search.
- Add tests that expired paid providers remain eligible organically if approved.

Acceptance:

- Providers are not forced to pay to remain publicly listed.
- Paid expiry does not hide an approved provider from organic discovery.

#### 13.4.5 Improve admin pricing visibility

Files:

- `src/features/admin/pages/visibility-requests-page.tsx`
- Admin service types.
- Locale files.

Changes:

- Show request product name.
- Show request type.
- Show target area.
- Show price snapshot.
- Show payment status/reference.
- Show requested date and processed date.
- Show provider identity or display name instead of only provider id if already available.

Acceptance:

- Admins can verify the payment against the exact product terms requested.

### Tests for 13.4

#### Component tests

Cases:

- Pricing table renders active products.
- Inactive products are hidden.
- Area expansion product shows recurring/renewal wording.
- No-guarantee disclosure is visible.
- Optional paid product copy says organic listing remains available.

#### Service tests

Cases:

- Product list is active-only and sorted.
- Pricing snapshot persists unchanged after source product price changes.
- Request creation fails without accepted pricing terms if required.

#### Firebase/rules tests

Cases:

- Provider cannot write arbitrary price amount into request.
- Provider cannot create request for inactive product.
- Organic approved provider appears in search.
- Expired paid provider appears organically but not as promoted.

## Cross-Section Dependencies

| Dependency | Related sections | Why it matters |
|---|---|---|
| Paid visibility boost | Section 7, Section 6, Section 10, Section 12 | Monetization depends on paid products, no-cap ranking/product rules, admin controls, and tracking expiry. |
| Area expansion recurring fee | Section 8, Section 2, Section 9 | Recurring area entitlements affect search coverage, provider dashboard, and renewal UI. |
| Admin paid product controls | Section 10.5 | Admins need product/tier configuration, Paymob renewal policy, and automatic expiry controls. |
| Audit logging | Section 10.6, Section 12.3 | Paid approvals, rejections, renewals, expiries, and price changes need auditability. |
| Product boundaries | Sections 3.3, 4.3, 14.4, 15 | Monetization must not introduce booking, service payments, escrow, customer billing, or job assignment. |
| Analytics | Section 12 | Paid usage and expiry should be tracked without turning contact events into billable leads. |

## Verification Commands

Run after implementation:

```bash
npm test -- src/lib/ranking.test.ts
npm test -- src/services/admin.service.test.ts
npm test -- src/services/monetization.service.test.ts
npm test -- src/services/visibility.service.test.ts
npm test -- src/__tests__/product-boundaries.test.ts
npm test -- functions/test/visibility.test.ts
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
npm run lint
npm run build
```

If exact test files differ, use the closest project-equivalent targeted specs and keep the checklist updated with the final command names.

## Effort Estimate

| Workstream | Estimate | Notes |
|---|---:|---|
| Product decisions and boundary ADR | 0.5-1 day | Requires product approval of v1 paid product catalog, manual payment policy, and recurring area semantics. |
| Paid product catalog and provider pricing UI | 1.5-2.5 days | Includes types, seed data, service adapters, provider UI, i18n, and component tests. |
| Product-based request snapshots | 1-1.5 days | Updates request schema, demo/Firebase adapters, duplicate checks, and tests. |
| Server-side admin approval/rejection callables | 2-3 days | Includes callable implementation, frontend adapter changes, rules hardening, audit behavior, and function tests. |
| Recurring area entitlement model | 2.5-4 days | Highest complexity because it touches search coverage, expiry, renewal, and existing area expansion behavior. |
| Boundary regression tests and copy updates | 1-1.5 days | Adds ADR/static tests/e2e checks and no-guarantee wording. |
| Full verification and cleanup | 1 day | Run unit, functions, rules, e2e, lint, and build. |

Total likely effort: 9.5-14.5 engineering days, depending on whether recurring area entitlement expiry is enforced by scheduled jobs or query-time guards only.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Paid approvals remain client-side | Admin users can mutate paid entitlements directly through Firestore rules, and audit ownership stays weaker than desired. | Move approval/rejection to callables and deny direct client updates. |
| Area expansion is permanent after one approval | Fails recurring fee requirement and lets unpaid expansion areas continue affecting search. | Add explicit area entitlement paid-through and expiry checks. |
| Pricing is hardcoded in UI | Price changes become unauditable and requests cannot prove what providers accepted. | Store catalog products and immutable pricing snapshots. |
| Paid label stays vague | Customers may not understand which listings are promoted. | Use explicit promoted wording and tests. |
| Contact analytics drifts into billable leads | Violates no per-lead charge boundary. | Document boundary and add schema/source tests for billing-like contact fields. |
| Payment processor gets added in the wrong place | Could accidentally create customer or service-payment flows. | Keep v1 manual provider payment only and add route/API negative tests. |
| Recurring entitlement joins become expensive | Search could become slow or complex if entitlements require multiple client-side reads. | Prefer denormalized active coverage keys maintained by trusted backend with expiry guard tests. |

## Definition of Done

Section 13 can be marked complete only when:

1. Product has approved the v1 paid product catalog and recurring area fee semantics.
2. Active paid products are loaded from a catalog or server-owned config.
3. Providers see product prices, currency, duration, renewal terms, eligibility, and no-guarantee disclosures before requesting paid products.
4. Visibility requests store product id, product type, pricing snapshot, payment state, and accepted disclosure version.
5. Admin approval and rejection of monetization requests happen through trusted callables.
6. Paid boost approval sets traceable paid visibility with an expiry derived from product terms.
7. Area expansion approval creates or extends a recurring entitlement rather than granting permanent unpaid coverage.
8. Expired paid boost has no ranking or promoted-label effect.
9. Expired or unpaid area expansion does not affect public search coverage.
10. Free approved providers remain publicly searchable.
11. No customer pricing, customer checkout, paid contact, service payment, commission, per-lead charge, escrow, or guarantee flow exists.
12. Product-boundary ADR and negative regression tests exist.
13. Paid listing labels and provider disclosures are explicit, localized, and tested.
14. Unit, functions, rules, e2e where applicable, lint, and build verification pass.

## Implementation Tracker Table

| ID | Area | Status | Primary files | Verification |
|---|---|---|---|---|
| MONEY-13.1-A | Paid product catalog | Not started | `src/types/monetization.ts`, monetization services, seed data | Product list unit tests |
| MONEY-13.1-B | Product-based request snapshots | Not started | `src/types/visibility.ts`, visibility services, provider UI | Visibility request service tests |
| MONEY-13.1-C | Server-side paid approvals | Not started | `functions/src/visibility.ts`, `admin.firebase.ts`, rules | Functions and rules tests |
| MONEY-13.1-D | Boost entitlement expiry | Partially done | `src/lib/ranking.ts`, provider fields | Ranking tests and UI label tests |
| MONEY-13.1-E | Recurring area entitlements | Not started | new entitlement types/services/search | Search/rules/functions tests |
| MONEY-13.2-A | Customer no-charge boundary | Partially done | routes, provider profile, boundary tests | E2E/static tests |
| MONEY-13.3-A | No commission/per-lead/payment boundary | Partially done | docs, static tests, contact schemas | Product-boundary tests |
| MONEY-13.4-A | Pricing transparency UI | Not started | visibility page, locale files | Component/e2e tests |
| MONEY-13.4-B | Equal pricing and no hidden fees | Not started | product catalog, snapshots, admin UI | Service and admin UI tests |

## Open Questions

1. Resolved: visibility boost is 500 EGP per 30-day auto-renewing period; area expansion is 250 EGP per 30-day auto-renewing period.
2. Should area expansion recurring billing be monthly, 30-day rolling, or another billing period?
3. Should v1 use only manual payment confirmation, or is a provider-side payment processor planned before launch?
4. Should paid products be managed in an admin UI now, or seeded/configured by engineering for v1?
5. Should expired area entitlements be removed from denormalized provider coverage by scheduled job, query-time filtering, or both?
6. Should providers explicitly accept pricing terms with a checkbox, or is submitting the request enough for v1?
7. What paid listing label should be used in Arabic and English: promoted, sponsored, or paid?
