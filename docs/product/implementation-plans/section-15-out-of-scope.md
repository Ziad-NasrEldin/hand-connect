# Section 15 Implementation Plan - Explicitly Out of Scope

Source documents:
- SRS: `docs/product/herafy-software-requirements.md`, section 15.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, row 15 and related rows 3.3, 4.3, 13.2, 13.3, and 14.4.

Goal: keep Herafy v1 explicitly limited to directory discovery, provider profiles, direct customer-provider contact, messaging, reviews, visibility requests, and admin moderation.
This section is mostly complete by absence of forbidden product surfaces.
The remaining work is to make the out-of-scope boundary explicit, testable, and hard to regress silently.

## Current Status

| SRS area | Current status | Reason |
| OOS-001 Booking or scheduling | Implemented | No booking, schedule, appointment, calendar, slot, or reservation routes/services were found. |
| OOS-002 Service payments | Implemented | Paymob is allowed only for provider visibility billing. No customer checkout, service invoice, service payment, provider payout, commission, escrow, or customer-provider payment processing route was found. |
| OOS-003 Escrow | Implemented | No escrow wallet, hold, release, dispute, settlement, or payout model was found. |
| OOS-004 Service outcome guarantees | Implemented | Product copy explicitly says Herafy does not guarantee service outcomes. |
| OOS-005 Job assignment | Implemented | Search links to provider profiles and contact is customer-selected. |
| OOS-006 Job tracking | Implemented | Messaging and contacts exist, but no order, job status, dispatch, delivery, completion, or tracking workflow exists. |
| OOS-007 Provider certifications | Implemented | Identity verification exists for admin onboarding, but there is no certification, skill credential, badge, or quality guarantee system. |
| OOS-008 Multi-city support | Implemented | Provider service areas are typed as Cairo only and configured neighborhoods are Cairo neighborhoods. |
| OOS-009 New native mobile apps | Implemented with documentation gap | A Capacitor iOS wrapper exists around the web app. |

## Current Implementation Evidence

| Evidence area | Files / checks | What it proves |
| Routes | `src/router/app-router.tsx`, `src/config/routes.ts` | Public routes are landing, search, provider profile, auth, messages, review creation, provider dashboard/profile/visibility, and admin pages. |
| Provider model | `src/types/provider.ts` | Provider `ServiceArea.city` is typed as `cairo`; provider status is onboarding/moderation status, not job status. |
| Search and profile flow | `src/features/search/pages/search-page.tsx`, `src/features/providers/pages/provider-profile-page.tsx` | Search results link to provider profiles and contact actions are explicit user actions. |
| Contact model | `src/types/contact.ts`, `functions/src/engagement.ts` | Contacts are `whatsapp_reveal` or `platform_message` only. |
| Messaging model | `src/types/messaging.ts`, `src/services/contracts/messaging.contract.ts` | Messaging stores conversations and messages only. |
| Visibility product | `src/types/visibility.ts`, `src/features/dashboard/pages/visibility-page.tsx`, `src/features/admin/pages/visibility-requests-page.tsx` | Paid surface is manual visibility request/approval, not customer service payment. |
| Firestore rules | `firestore.rules` | Contacts, conversations, reviews, reports, and visibility requests are constrained; no booking/payment/job collections exist. |
| Storage rules | `storage.rules` | Storage supports provider photos and identity documents only. |
| Wrapper support | `capacitor.config.ts` | iOS wrapper targets `dist` web output and has no separate native product flow. |
| E2E smoke | `tests/e2e/app.spec.ts` | Existing browser smoke covers landing, search, selected profile contact, messaging, provider join, provider dashboard, and admin dashboard. |

## Product Decisions Needed Before Implementation

### Decision A - Treat Section 15 as a product boundary, not a feature backlog

Recommended v1 decision: **Section 15 must remain out of scope unless the SRS is explicitly changed first.**

Implementation implication:
- Do not add route, service, collection, callable, copy, or UI affordance that implies a booking, payment, escrow, job, certification, multi-city, or native-app product.
- If a future request asks for one of these features, require a product decision that updates the SRS and implementation map before implementation.
- Add negative tests and a static forbidden-surface scan so accidental reintroduction is caught during release checks.

### Decision B - Keep manual visibility payments separate from service payments

Recommended v1 decision: **manual visibility payment confirmation remains allowed because it sells provider exposure only.**

Implementation implication:
- Visibility copy must continue to say payment does not guarantee customers, jobs, ranking, or outcomes.
- Admin payment confirmation must not become service checkout, customer payment, escrow, or provider payout.
- Any payment terminology must include the qualifier "visibility" or "exposure" where practical.

### Decision C - Identity verification is not provider certification

Recommended v1 decision: **identity verification confirms admin-reviewed identity documents only.**

Implementation implication:
- Do not expose "certified", "verified skill", "licensed", "guaranteed", or equivalent quality badges unless a later certification program is approved.
- Public copy should distinguish identity/admin review from skill certification and outcome guarantee.
- Admin provider approval can remain a trust/safety gate, but it should not be marketed as skill certification.

### Decision D - Cairo-only v1 remains the approved location scope

Recommended v1 decision: **v1 remains Cairo-only unless a product owner explicitly approves multi-city support.**

Implementation implication:
- Keep the current `ServiceArea.city: 'cairo'` model for v1.
- Do not add city selectors, city route params, cross-city search, or multi-city seed data as incidental work.
- If multi-city is approved later, create a dedicated migration plan for data model, search indexes, copy, ranking, pricing, admin tooling, and tests.

### Decision E - iOS is wrapper support, not a new native app scope

Recommended v1 decision: **the existing Capacitor iOS wrapper may remain as wrapper infrastructure.**

Implementation implication:
- Document that v1 does not include a new native-only iOS or Android product.
- Do not add native-only feature flows, separate native screens, or platform-specific business logic under the Section 15 scope.
- `cap:sync:ios` can remain a build/package workflow for the web app wrapper.

## Target End State

Section 15 is complete when:
1. Product docs clearly state that booking, scheduling, service payments, escrow, guarantees, job assignment, job tracking, provider certifications, multi-city support, and new native apps are out of v1.
2. The application exposes no UI routes, service contracts, API endpoints, rules collections, or data types that implement those out-of-scope capabilities.
3. The manual visibility-payment path is clearly separated from service payments.
4. Identity verification and provider approval cannot be confused with skill certification or quality guarantees.
5. Cairo-only service-area scope is explicit in types, config, copy, seed data, and tests.
6. The existing Capacitor iOS wrapper is documented as wrapper support around the web app, not a new native product.
7. Release verification includes a negative product-boundary scan.
8. E2E smoke proves the customer path remains directory-first and user-selected.
9. Any future attempt to add forbidden surfaces requires an explicit SRS/product-scope change first.

## Detailed Implementation Plan

## 15.1 Booking and Scheduling Boundary

### Requirements Covered

- `OOS-001`: The system MUST NOT implement booking or scheduling in v1.

### Current Implementation Evidence

- `src/router/app-router.tsx` has no booking, schedule, appointment, calendar, reservation, or slot routes.
- `src/config/routes.ts` has no booking or scheduling route constants.
- `src/services/contracts/*` expose search, provider, messaging, review, visibility, auth, and admin contracts only.
- `firestore.rules` has no `bookings`, `appointments`, `schedules`, `availability`, `slots`, or `reservations` collections.
- `ProviderProfilePage` exposes WhatsApp and platform messaging only.

### Work Items

#### 15.1.1 Add a negative route and service scan

Files:
- New test or script, preferably `scripts/check-product-boundaries.ts`.
- Alternative if the project prefers tests only: `src/lib/product-boundaries.test.ts` or `tests/product-boundaries.test.ts`.

Changes:
- Scan route config, router file, service contracts, API handlers, function exports, rules, and feature page filenames.
- Fail on forbidden booking/scheduling terms unless they appear in approved docs or the test itself.
- Keep the allowlist small and explicit.

Acceptance criteria:
- A route like `/booking` or service like `createBooking` fails the scan.
- Existing docs that describe out-of-scope requirements do not fail the scan.
- The command is documented in this checklist and can be added to `release:check` later.

#### 15.1.2 Add E2E product-boundary smoke

Files:
- `tests/e2e/app.spec.ts` or a new `tests/e2e/product-boundaries.spec.ts`.

Changes:
- Visit search and provider profile.
- Assert no booking, schedule, appointment, calendar, slot, reserve, or confirm job action is visible.
- Assert primary actions remain view profile, WhatsApp reveal, and message.

Acceptance criteria:
- Customer discovery remains directory-first.
- Provider profile cannot start a booking or scheduling flow.

### Tests for 15.1

- `npm run e2e -- tests/e2e/product-boundaries.spec.ts`
- `npm test -- tests/product-boundaries.test.ts`
- `npm run product-boundaries:check` if implemented as a script.

## 15.2 Service Payments Boundary

### Requirements Covered

- `OOS-002`: The system MUST NOT implement service payments in v1.

### Current Implementation Evidence

- No customer checkout, invoice, card, provider payout, commission, or service payment route was found.
- `VisibilityRequest` contains `paymentMethod` and `paymentConfirmedBy`, but this is provider visibility/exposure only.
- `VisibilityPage` creates manual visibility requests.
- `VisibilityRequestsPage` lets admins confirm or reject manual visibility payment review.
- Landing and provider copy say Herafy does not set price or guarantee outcomes.

### Work Items

#### 15.2.1 Document visibility payment separation

Files:
- `docs/product/herafy-software-requirements.md` or a small product decision note, if doc changes are allowed in the implementation slice.
- Locale copy if any text is ambiguous.

Changes:
- State that visibility payment is provider marketing/exposure only.
- State that customers pay providers outside Herafy, if any payment occurs.
- State that Herafy does not process service fees, deposits, commissions, provider payouts, or customer-provider payments in v1.

Acceptance criteria:
- A reviewer can tell the difference between visibility payment and service payment without reading code.
- UI copy avoids generic "payment" where "visibility payment" is the intended meaning.

#### 15.2.2 Extend the negative scan to payment processors and checkout terms

Files:
- Product-boundary scan/test.

Forbidden examples:
- `checkout`
- `stripe`
- `paymob`
- `cardPayment`
- `servicePayment`
- `invoice`
- `payout`
- `commission`
- `deposit`

Acceptance criteria:
- Adding a customer checkout or processor integration fails the boundary check.
- Existing visibility-payment terms either pass because they are qualified or are explicitly allowlisted with a note.

### Tests for 15.2

- Product-boundary scan passes with current visibility implementation.
- E2E asserts provider profile does not expose checkout, deposit, pay, or invoice actions.
- Admin visibility flow remains covered by existing admin service tests.

## 15.3 Escrow Boundary

### Requirements Covered

- `OOS-003`: The system MUST NOT implement escrow in v1.

### Current Implementation Evidence

- No escrow collections, route names, balance model, wallet, hold, release, settlement, dispute, or payout service was found.
- Firestore rules do not include wallet, escrow, payout, ledger, or transaction collections.
- API handlers are limited to health, abuse check, admin reason assertion, review recalculation, and visibility approval utility.

### Work Items

#### 15.3.1 Include escrow-specific terms in the product-boundary scan

Forbidden examples:
- `escrow`
- `wallet`
- `ledger`
- `holdFunds`
- `releaseFunds`
- `settlement`
- `payout`
- `disputePayment`

Acceptance criteria:
- Any new escrow-like financial custody model fails the scan.
- Visibility request approval remains allowed only because it does not custody customer service funds.

#### 15.3.2 Add checklist gate for financial custody changes

Files:
- This checklist.
- Release or PR template if the project later adds one.

Acceptance criteria:
- Any future financial-custody proposal is explicitly marked out of v1 unless the SRS changes.

### Tests for 15.3

- Product-boundary scan.
- Firestore rules inspection.
- API handler filename scan.

## 15.4 Outcome Guarantee Boundary

### Requirements Covered

- `OOS-004`: The system MUST NOT guarantee service outcomes in v1.

### Current Implementation Evidence

- `src/i18n/locales/en.json` includes copy that Herafy does not set prices or guarantee service outcomes.
- `src/features/providers/pages/provider-profile-page.tsx` renders `provider.noGuarantee`.
- `src/features/landing/pages/landing-page.tsx` renders direct-contact and no-guarantee positioning.
- Visibility copy says payment gives exposure and tools only and does not guarantee customers or jobs.

### Work Items

#### 15.4.1 Add copy regression tests

Files:
- `src/i18n/i18n.test.ts` or `src/lib/display.test.ts`.
- Optional E2E assertion in provider profile smoke.

Changes:
- Assert English and Arabic no-guarantee locale keys exist.
- Assert provider profile renders no-guarantee copy.
- Assert visibility copy keeps no-guarantee positioning.

Acceptance criteria:
- Removing no-guarantee copy breaks a targeted test.
- Paid visibility cannot be described as guaranteed work.

#### 15.4.2 Add forbidden guarantee terms to product-boundary scan

Forbidden examples:
- `guaranteed job`
- `guaranteed outcome`
- `guaranteed customer`
- `guaranteed lead`
- `guaranteed service`

Acceptance criteria:
- Normal text saying "does not guarantee" is allowed.
- Positive guarantee claims fail unless explicitly approved by an SRS change.

### Tests for 15.4

- `npm test -- src/i18n/i18n.test.ts`
- E2E provider profile smoke asserts no-guarantee copy remains visible.
- Product-boundary scan checks positive guarantee language.

## 15.5 Job Assignment Boundary

### Requirements Covered

- `OOS-005`: The system MUST NOT assign jobs in v1.
- Related requirement: `SEARCH-012` says the system MUST NOT assign jobs automatically.

### Current Implementation Evidence

- Search result cards link to provider profiles.
- Provider profile contact actions are customer initiated.
- `functions/src/engagement.ts` creates a contact or conversation only after authenticated user action.
- There is no dispatch, assignment, claim, matching, lead routing, or provider allocation service.

### Work Items

#### 15.5.1 Add E2E assertion for directory-first search

Files:
- `tests/e2e/product-boundaries.spec.ts`.

Changes:
- Search for providers.
- Assert provider cards have profile links.
- Assert no auto-assignment confirmation appears.
- Open profile and assert customer still chooses WhatsApp or message.

Acceptance criteria:
- Search never creates contact/conversation by itself.
- Contact is only created after explicit WhatsApp reveal or message.

#### 15.5.2 Add forbidden job-assignment terms to static scan

Forbidden examples:
- `assignJob`
- `jobAssignment`
- `dispatch`
- `autoAssign`
- `claimJob`
- `acceptJob`
- `providerMatched`

Acceptance criteria:
- A new assignment flow fails the check before release.
- Existing admin provider approval is not confused with job assignment.

### Tests for 15.5

- Product-boundary E2E smoke.
- Product-boundary scan.
- Existing contact E2E remains valid.

## 15.6 Job Tracking Boundary

### Requirements Covered

- `OOS-006`: The system MUST NOT implement job tracking in v1.

### Current Implementation Evidence

- `Conversation` has participants, provider, customer, last message, unread counts, and timestamps.
- `Message` has text, sender, timestamp, and read status.
- No job/order entity exists.
- No status model exists for requested, accepted, in progress, arrived, completed, cancelled, or paid.

### Work Items

#### 15.6.1 Guard against order/job status models

Files:
- Product-boundary scan/test.

Forbidden examples:
- `orders`
- `jobs`
- `jobStatus`
- `orderStatus`
- `inProgress`
- `completedJob`
- `cancelJob`
- `trackJob`

Acceptance criteria:
- Adding a job tracking collection, type, service, or page fails the check.
- Messaging `read` status remains allowed because it is message read state, not job state.

#### 15.6.2 Add rules/schema scan for new collections

Files:
- Product-boundary scan/test.

Changes:
- Read `firestore.rules`.
- Fail on `match /jobs`, `match /orders`, `match /bookings`, `match /appointments`, `match /payments`, `match /escrow`, or equivalent.

Acceptance criteria:
- Forbidden collections cannot be added without a failing test.

### Tests for 15.6

- Product-boundary scan.
- Rules test suite remains green.

## 15.7 Provider Certification Boundary

### Requirements Covered

- `OOS-007`: The system MUST NOT implement provider certifications in v1.

### Current Implementation Evidence

- Provider onboarding collects identity documents.
- Admin can approve, reject, suspend, or ban providers.
- `ProviderProfile` has `nationalIdVerified`, but no certification type, skill badge, license, credential, exam, or certification expiry.
- Pending provider copy says manual verification is not a skill certification or quality guarantee.

### Work Items

#### 15.7.1 Document identity verification language

Files:
- Product docs or locale copy if needed.

Changes:
- State that `nationalIdVerified` means identity document reviewed only.
- State that approval does not certify skill quality or guarantee outcome.
- Avoid public "certified provider" labels.

Acceptance criteria:
- Public provider profile does not display certification claims.
- Pending/provider copy remains clear.

#### 15.7.2 Add forbidden certification terms to product-boundary scan

Forbidden examples:
- `certified`
- `certification`
- `credential`
- `licenseVerified`
- `skillVerified`
- `qualityBadge`

Acceptance criteria:
- Identity document and `nationalIdVerified` remain allowed with explicit allowlist.
- Skill certification concepts fail unless the SRS changes.

### Tests for 15.7

- Product-boundary scan.
- E2E provider profile smoke confirms no certification badge is visible.
- Provider join/admin identity-document smoke remains valid.

## 15.8 Multi-City Boundary

### Requirements Covered

- `OOS-008`: The system MUST NOT implement multi-city support in v1 unless explicitly approved.

### Current Implementation Evidence

- `ServiceArea.city` is typed as `'cairo'`.
- `src/config/neighborhoods.ts` lists Cairo neighborhoods only.
- Provider registration creates service areas with `city: 'cairo'`.
- Admin area expansion appends service areas with `city: 'cairo'`.
- Search filters use neighborhood slugs, not arbitrary city scopes.

### Work Items

#### 15.8.1 Add Cairo-only invariant tests

Files:
- `src/config/neighborhoods.test.ts` or a product-boundary test.
- Existing service tests for provider registration and visibility approval can include assertions.

Changes:
- Assert all configured neighborhoods are Cairo v1 neighborhoods.
- Assert provider fixtures and seed data use only `city: 'cairo'`.
- Assert no city selector is present in search or registration.

Acceptance criteria:
- Adding Alexandria, Giza-as-city, Riyadh, Dubai, or city-switching UI fails a test unless explicitly allowlisted.
- Existing Cairo neighborhoods remain valid.

#### 15.8.2 Add SRS-change gate for multi-city

Files:
- This checklist.
- Product decision docs if implementation starts later.

Acceptance criteria:
- Multi-city cannot be introduced as a side effect of geolocation, radius search, or area expansion.

### Tests for 15.8

- Product-boundary scan.
- Unit test for service-area city invariant.
- E2E scan for absence of city selector if practical.

## 15.9 Native Mobile App Boundary

### Requirements Covered

- `OOS-009`: The system MUST NOT implement new native mobile apps in v1; existing wrapper support may remain if already present.

### Current Implementation Evidence

- `capacitor.config.ts` uses `webDir: 'dist'`.
- The iOS config only sets content inset.
- `package.json` includes `cap:sync:ios` and `cap:open:ios`.
- No Android app wrapper was found in the current file tree.
- The SRS explicitly allows existing wrapper support to remain.

### Work Items

#### 15.9.1 Document wrapper scope

Files:
- Product docs or implementation map note.

Changes:
- State that Capacitor iOS is a wrapper around the responsive web app.
- State that v1 does not include new native-only screens, native-only business logic, Android app creation, App Store scope expansion, or platform-specific product flows.

Acceptance criteria:
- A reviewer does not confuse `ios/` and Capacitor scripts with a new native-app product.
- Wrapper support remains allowed.

#### 15.9.2 Add native-boundary scan

Files:
- Product-boundary scan/test.

Forbidden examples:
- New `android/` app directory without approved scope.
- Native-only feature routes or business logic.
- App Store readiness docs if they imply v1 native launch scope without approval.

Acceptance criteria:
- Existing `ios/` wrapper and `capacitor.config.ts` pass.
- A new Android app or native-only product feature fails the scan unless approved.

### Tests for 15.9

- Static wrapper-scope scan.
- `npm run build` remains the core app verification command.
- `npm run cap:sync:ios` can be run only when validating wrapper packaging, not for normal Section 15 completion.

## Cross-Cutting Work Items

### 15.X.1 Add product-boundary scan command

Recommended implementation:
- Add `scripts/check-product-boundaries.ts`.
- Add `product-boundaries:check` script to `package.json`.
- Add a matching Vitest test if the team prefers test runner visibility.

The scan should inspect:
- `src/router/app-router.tsx`
- `src/config/routes.ts`
- `src/services/contracts`
- `src/services/firebase`
- `src/services/demo`
- `functions/src`
- `api`
- `firestore.rules`
- `storage.rules`
- `src/features`
- `src/types`
- `src/config/neighborhoods.ts`
- `capacitor.config.ts`

The scan should ignore or allowlist:
- `docs/product/herafy-software-requirements.md`
- Section 15 implementation plan and checklist files.
- Negative test names that intentionally include forbidden terms.
- Locale strings that say Herafy does **not** guarantee outcomes.
- Visibility payment terms that are explicitly scoped to provider exposure.
- `nationalIdVerified` and identity-document flows.
- Existing Capacitor iOS wrapper files.

### 15.X.2 Add product-boundary E2E smoke

Recommended implementation:
- Add `tests/e2e/product-boundaries.spec.ts`.

Browser assertions:
- Search page shows provider profile links rather than booking actions.
- Provider profile shows WhatsApp/message contact only.
- Provider profile shows no booking, schedule, checkout, job assignment, job tracking, escrow, certification, or guarantee action.
- Visibility page copy frames payment as exposure only.
- Public UI does not expose city switching.

### 15.X.3 Add release gate integration

Recommended implementation:
- Keep initial scan command manual until it is stable.
- Add it to `release:check` after false positives are resolved.

Acceptance criteria:
- CI/release verification catches accidental forbidden routes, services, or collections.
- The command is fast enough for every release check.

## Verification Commands

Run after implementing Section 15 guardrails:

```bash
npm test -- tests/product-boundaries.test.ts
npm run e2e -- tests/e2e/product-boundaries.spec.ts
npm run test:rules
npm run lint
npm run build
```

Run current broad release verification when practical:

```bash
npm run release:check
```

Run manual audit commands while reviewing:

```bash
rg -n -i "booking|schedule|appointment|payment|checkout|stripe|paymob|escrow|guarantee|assign|dispatch|job|certified|certification|multi-city|city|native app|android" src api functions tests firestore.rules storage.rules capacitor.config.ts
```

Expected result:
- Hits should either be approved visibility-payment, Cairo-only, no-guarantee, identity-verification, wrapper-support, or negative-boundary test/doc references.
- No app route, service, callable, API handler, rules collection, or UI action should implement an out-of-scope capability.

## Effort Estimate

| Workstream | Effort | Notes |
| Product-boundary scan | 0.5-1.0 day | Mostly string/path scanning with a strict allowlist. |
| E2E boundary smoke | 0.5 day | Reuses existing demo-mode Playwright flow. |
| Copy/doc clarification | 0.25-0.5 day | Focus on visibility payment, identity verification, Cairo-only, and wrapper scope. |
| Release gate integration | 0.25 day | Add only after scan false positives are stable. |
| Total | 1.5-2.25 days | No app feature implementation expected. |

## Risks and Mitigations

| Risk | Impact | Mitigation |
| Accidental forbidden feature enters through a future UX request | Product scope creep and SRS violation | Add scan and E2E guardrails. |
| Visibility payment is confused with service payment | Customer/provider trust and legal risk | Qualify copy and allowlist only visibility-payment paths. |
| Identity verification is marketed as certification | Trust/safety and compliance risk | Keep identity-review language explicit and test for no certification badge. |
| Multi-city support leaks through geolocation/radius work | Data model and search complexity | Keep `city: 'cairo'` invariant tests. |
| iOS wrapper is interpreted as native app scope | Planning and launch confusion | Document Capacitor wrapper scope. |
| Static scan has false positives | Developer friction | Use explicit allowlist and start manual before adding to release check. |

## Definition of Done

Section 15 is done when:
- Every OOS requirement has clear current evidence and a regression guard.
- Product docs distinguish allowed v1 surfaces from forbidden v1 surfaces.
- Manual visibility payment is not represented as service payment.
- Identity verification is not represented as certification.
- Cairo-only v1 is protected by tests or scan.
- Existing iOS wrapper scope is documented.
- Product-boundary scan passes.
- Product-boundary E2E smoke passes.
- `npm run lint`, targeted tests, and `npm run build` pass after implementation.

## Tracker Table

| ID | Area | Status | Primary files | Completion signal |
| OOS-15-001 | Booking/scheduling boundary | Implemented, needs guardrail | Router, routes, service contracts, E2E | Negative scan and E2E prove no booking/scheduling flow. |
| OOS-15-002 | Service payment boundary | Implemented, needs copy guardrail | Visibility pages, visibility types, locales | Visibility payment is clearly exposure-only and no checkout exists. |
| OOS-15-003 | Escrow boundary | Implemented, needs scan | API, rules, service contracts | No escrow/wallet/ledger/payout/custody path exists. |
| OOS-15-004 | Guarantee boundary | Implemented, needs copy tests | Locales, provider profile, visibility page | No-guarantee copy remains visible and positive guarantee claims fail scan. |
| OOS-15-005 | Job assignment boundary | Implemented, needs E2E guardrail | Search page, provider profile, engagement function | Search/contact remain user-selected and no dispatch exists. |
| OOS-15-006 | Job tracking boundary | Implemented, needs scan | Messaging types, rules, services | No order/job status model or collection exists. |
| OOS-15-007 | Provider certification boundary | Implemented, needs language guardrail | Provider type, registration, admin app, locales | Identity review remains distinct from certification. |
| OOS-15-008 | Multi-city boundary | Implemented, needs invariant test | Provider type, neighborhoods, registration, admin visibility | All service areas remain Cairo-only unless SRS changes. |
| OOS-15-009 | Native app boundary | Implemented with doc gap | Capacitor config, iOS wrapper | iOS is documented as wrapper support and no new native app scope exists. |
| OOS-15-010 | Product-boundary release gate | Not started | Scripts/tests/package scripts | Boundary scan is stable and can be run in release verification. |

## Open Questions

1. Should the product-boundary scan be added to `release:check` immediately, or run manually for one iteration to tune false positives?
2. Should visibility payment copy be updated in the same implementation slice as Section 15 guardrails, or tracked under Section 13 monetization?
3. Should the SRS map row for Section 15 be updated after wrapper-scope documentation is added?
4. Should a future multi-city request require a new SRS section revision before any code change?
