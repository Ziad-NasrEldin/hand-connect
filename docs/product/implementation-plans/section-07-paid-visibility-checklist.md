# Section 7 Paid Visibility Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-07-paid-visibility.md`

Scope: complete SRS section 7 so paid visibility is optional, product-backed, capped, clearly labeled, no-guarantee, expiry-aware, server-owned, auditable, and does not remove free approved providers from public visibility.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but needs gaps/tests completed.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Partially done | Product/Engineering | Product catalog, Paymob/card payment method, promoted label wording, no-cap policy, 500 EGP auto-renewing visibility boost, and 250 EGP area expansion are decided; cancellation/refund scope remains open. |
| Visibility boosts | Partially done | Engineering | Provider request, admin approval, product catalog, Paymob metadata, no-cap product rule, and expiry check exist; live payment state and cleanup are missing. |
| Paid labels | Partially done | Engineering/Product | Active paid search cards now use promoted wording through locale copy; profile disclosure and tests remain open. |
| No guarantees | Partially done | Product/Engineering | Existing copy covers customers/jobs; add no top placement, acceptance checkbox, persisted disclosure, and tests. |
| Free provider visibility | Partially done | Engineering | Organic providers are supported and ranking-tested; add Firebase/e2e regression coverage and dashboard optional-payment status. |
| Security and audit | Partially done | Engineering | Rules cover provider-owned request create and admin-only processing; server-owned approval and paid event logs are missing. |
| Verification | Not started | Engineering | Run targeted tests, rules, functions tests, lint, build, and e2e after implementation. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| PAID-PD-001 | Decide paid visibility catalog source. | Done | Use typed versioned product metadata with server-owned persistence path when backend catalog is added. |
| PAID-PD-002 | Decide v1 products and durations. | Done | Use pay-as-you-go paid visibility and a 30-day area expansion product. |
| PAID-PD-003 | Decide whether prices are real launch prices or placeholders. | Done | Paid visibility is 500 EGP per 30-day auto-renewing period; area expansion is 250 EGP/month. |
| PAID-PD-004 | Decide v1 payment flow. | Done | Paymob card-on-file flow for paid products, with explicit payment state. |
| PAID-PD-005 | Decide payment methods. | Done | Visa/card on file through Paymob. |
| PAID-PD-006 | Decide paid label wording. | Done | Use “Promoted” in English and clear paid promotion wording in Arabic. |
| PAID-PD-007 | Decide disclosure acceptance versioning. | Not started | Recommended: persist `disclosureVersion` and `disclosureAcceptedAt` on every paid request. |
| PAID-PD-008 | Decide expiry cleanup mechanism. | Done | Paid benefits expire automatically; implementation should use scheduled/idempotent server reconciliation plus query-time guards. |
| PAID-PD-009 | Decide renewal behavior. | Done | Visibility boost and area expansion auto-renew monthly by Visa/card on file through Paymob. |
| PAID-PD-010 | Decide cancellation/refund scope. | Not started | Recommended: document as manual admin support process unless product requires in-app cancellation. |

## 7.1 Visibility Boosts Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PAID-7.1-001 | Keep provider request creation path. | Done | `src/features/dashboard/pages/visibility-page.tsx`, `src/services/*/visibility.*` | Providers can create pending visibility requests. |
| PAID-7.1-002 | Keep duplicate pending request guard. | Done | `visibility.firebase.ts`, `visibility.demo.ts` | Provider cannot create duplicate pending request for same service area. |
| PAID-7.1-003 | Keep no-guarantee paid ranking helper. | Done | `src/lib/ranking.ts`, `src/lib/ranking.test.ts` | Paid visibility does not guarantee top placement and expired paid status is inactive. |
| PAID-7.1-004 | Define `VisibilityProduct` type. | Done | `src/types/monetization.ts` | Product model includes ID, version, duration, price, currency, active state, no-cap or coverage-only policy, payment provider, and renewal policy. |
| PAID-7.1-005 | Add paid product catalog. | Done | `src/config/paid-products.ts` | Active pay-as-you-go boost and 250 EGP monthly area expansion products are available to services and server approval. |
| PAID-7.1-006 | Add i18n product names and descriptions. | Partially done | `src/i18n/locales/en.json`, `src/i18n/locales/ar.json` | Product names, durations, price labels, billing labels, and disclosures are localized; UI tests remain open. |
| PAID-7.1-007 | Extend visibility request type with product snapshot. | Done | `src/types/visibility.ts`, converters | Requests carry product ID/version, price, currency, duration, product policy, payment provider, and renewal policy. |
| PAID-7.1-008 | Add explicit payment status. | Done | `VisibilityRequest`, services, rules | Requests track `pending`, `matched`, `rejected`, or `expired` payment state. |
| PAID-7.1-009 | Replace hard-coded provider request `paymentMethod: manual`. | Not started | `visibility-page.tsx`, visibility service contract | Provider uses Paymob card payment state instead of manual notes. |
| PAID-7.1-010 | Add product selection UI. | Not started | `visibility-page.tsx` | Provider must select an active product before submitting. |
| PAID-7.1-011 | Persist selected product snapshot on create. | Done | `visibility.firebase.ts`, `visibility.demo.ts` | New request records selected product terms exactly. |
| PAID-7.1-012 | Add request create validation for inactive product. | Done | visibility services, rules | Unknown product lookup rejects request creation. |
| PAID-7.1-013 | Move approve visibility to server-owned callable/API. | Done | `functions/src/visibility.ts`, `src/services/firebase/admin.firebase.ts` | Frontend admin calls backend and no longer directly mutates provider paid fields. |
| PAID-7.1-014 | Add server-side admin role verification. | Done | functions/API auth helpers | Non-admin approval and rejection fail in callable guard. |
| PAID-7.1-015 | Make approval atomic. | Done | functions/API transaction | Request, provider, audit, and paid event update together. |
| PAID-7.1-016 | Derive expiry from product duration. | Done | server approval code | Duration comes from request product snapshot; 30-day and 90-day helper tests pass. |
| PAID-7.1-017 | Add `paidVisibilityStartedAt`. | Done | provider type, converters, approval code | Provider paid period has explicit start and end timestamps. |
| PAID-7.1-018 | Preserve active paid product metadata on provider. | Done | provider type, approval code | Provider stores product ID/version for active paid period. |
| PAID-7.1-019 | Add reject visibility server mutation. | Done | functions/API, frontend admin service | Rejection records reason, timestamp, payment status, and audit row. |
| PAID-7.1-020 | Tighten Firestore rules after server-owned approval. | Done | `firestore.rules` | Clients cannot process visibility requests directly. |
| PAID-7.1-021 | Add expiry cleanup job. | Not started | `functions/src/visibility.ts` | Expired paid benefits are reconciled to organic or inactive status idempotently. |
| PAID-7.1-022 | Add paid expiry event/audit row. | Not started | functions/API, admin action or event collection | Paid expiry is tracked once per paid period. |
| PAID-7.1-023 | Add renewal status affordance. | Not started | provider visibility page | Provider can see next Paymob card auto-renewal date and failed-payment status. |
| PAID-7.1-024 | Remove duplicated hard-coded 30-day logic. | Not started | demo admin, Firebase admin, functions helper | Duration comes from product terms. |
| PAID-7.1-025 | Add migration/backfill plan for existing requests. | Not started | docs or script | Legacy requests with only `tier: paid` display safely and can be processed intentionally. |

## 7.2 Paid Labels Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PAID-7.2-001 | Keep active paid label conditional. | Done | `search-page.tsx`, `isPaidVisibilityActive` | Label renders only when paid visibility is active. |
| PAID-7.2-002 | Replace “Featured” paid label with “Promoted”. | Done | `search-page.tsx`, i18n | Search cards use clear promoted paid wording through `common.featured`. |
| PAID-7.2-003 | Add Arabic promoted paid wording. | Done | `src/i18n/locales/ar.json` | Arabic label clearly distinguishes paid promotion from organic listing. |
| PAID-7.2-004 | Add paid label to provider profile header. | Not started | `provider-profile-page.tsx` | Active paid profile includes compact promoted disclosure. |
| PAID-7.2-005 | Add accessible label text. | Not started | search/profile UI | Screen readers can identify promoted paid visibility. |
| PAID-7.2-006 | Ensure expired paid providers have no label. | Partially done | ranking helper, search/profile UI | Existing helper supports this; add UI regression test. |
| PAID-7.2-007 | Ensure organic providers have no label. | Partially done | search/profile UI | Existing conditional supports this; add UI regression test. |
| PAID-7.2-008 | Add search paid label test. | Not started | component/e2e tests | Active paid result shows promoted label and organic result does not. |
| PAID-7.2-009 | Add profile paid label test. | Not started | component/e2e tests | Active paid profile shows promoted disclosure. |
| PAID-7.2-010 | Remove or repurpose `common.featured` safely. | Not started | i18n and references | No paid UI relies on ambiguous featured wording. |

## 7.3 No Guarantees Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PAID-7.3-001 | Keep existing no customers/jobs copy. | Done | `visibility.note` | Provider visibility page says payment does not guarantee customers or jobs. |
| PAID-7.3-002 | Keep admin runbook no-guarantee boundary. | Done | `docs/operations/admin-runbook.md` | Runbook says no leads, jobs, ranking, or revenue guarantees. |
| PAID-7.3-003 | Add no top placement copy to provider UI. | Not started | `src/i18n/locales/*`, `visibility-page.tsx` | Provider request page explicitly says no top placement. |
| PAID-7.3-004 | Add no-guarantee acceptance checkbox. | Not started | `visibility-page.tsx` | Submit is blocked until provider accepts disclosure. |
| PAID-7.3-005 | Persist disclosure acceptance timestamp. | Not started | request type, services, rules | New request records `disclosureAcceptedAt`. |
| PAID-7.3-006 | Persist disclosure version. | Not started | request type, config | New request records `disclosureVersion`. |
| PAID-7.3-007 | Add admin terms visibility. | Not started | `visibility-requests-page.tsx` | Admin can see selected product and provider accepted disclosure. |
| PAID-7.3-008 | Add no-guarantee UI test. | Not started | component/e2e tests | Leads, jobs, and top placement disclaimer is present before submit. |
| PAID-7.3-009 | Add acceptance-blocking test. | Not started | component/e2e or service tests | Request cannot be submitted without acceptance. |
| PAID-7.3-010 | Keep ranking no-guarantee regression. | Done | `src/lib/ranking.test.ts` | Weak paid provider does not automatically outrank strong organic provider. |

## 7.4 Free Provider Visibility Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PAID-7.4-001 | Keep provider default `visibilityTier: organic`. | Done | auth provider creation paths | New providers are organic unless paid approval occurs. |
| PAID-7.4-002 | Keep public search independent from paid tier. | Done | `search.firebase.ts`, demo search | Search does not require `visibilityTier == paid`. |
| PAID-7.4-003 | Keep organic ranking eligibility. | Done | `ranking.ts`, `ranking.test.ts` | Organic providers receive normal ranking score. |
| PAID-7.4-004 | Add Firebase-mode organic search test. | Not started | Firebase adapter or emulator test | Approved organic provider appears in search. |
| PAID-7.4-005 | Add rejected/suspended unpaid exclusion test. | Not started | search/rules/e2e tests | Public visibility depends on approval and account status, not payment. |
| PAID-7.4-006 | Add e2e search-to-profile for organic provider. | Not started | `tests/e2e/app.spec.ts` | Customer can find and open an organic approved provider. |
| PAID-7.4-007 | Add regression test against paid-only query filters. | Not started | search service test or static boundary test | A future paid-only filter fails tests. |
| PAID-7.4-008 | Add provider dashboard organic status panel. | Not started | `provider-dashboard-page.tsx` | Organic approved provider sees that public listing remains available without paid visibility. |
| PAID-7.4-009 | Add paid expiry status panel. | Not started | `provider-dashboard-page.tsx`, `visibility-page.tsx` | Paid provider sees expiry date and renewal path. |
| PAID-7.4-010 | Add optional-payment pricing copy. | Not started | visibility page/i18n | UI says paid visibility is optional and free approved listing remains available. |

## Security, Rules, and Audit Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PAID-SEC-001 | Keep provider-owned request create rules. | Done | `firestore.rules`, rules test | Provider can create valid own pending request. |
| PAID-SEC-002 | Keep providers blocked from self-approving requests. | Done | `firestore.rules`, rules test | Provider update to approved fails. |
| PAID-SEC-003 | Keep provider blocked from direct paid field mutation. | Done | `firestore.rules`, rules test | Owner cannot set `visibilityTier: paid`. |
| PAID-SEC-004 | Remove or narrow direct admin client processing after server migration. | Done | `firestore.rules`, admin service | Trusted server owns approval/rejection state changes. |
| PAID-SEC-005 | Validate extended request schema in rules. | Not started | `firestore.rules` | Unknown keys and invalid enum values fail. |
| PAID-SEC-006 | Add product snapshot rules validation. | Not started | `firestore.rules` or server-only creation | Provider cannot forge price, duration, product version, or cap policy. |
| PAID-SEC-007 | Add payment status rules validation. | Not started | `firestore.rules` | Provider can create only pending payment status. |
| PAID-SEC-008 | Add server audit rows for approve/reject. | Done | admin service/tests, functions | Server-owned visibility approval/rejection writes audit rows. |
| PAID-SEC-009 | Add paid visibility event collection or equivalent. | Partially done | functions/API, analytics service | Activation event is written; expiry/renewal events remain follow-up. |
| PAID-SEC-010 | Add tests for non-admin server mutation rejection. | Not started | functions tests | Non-admin cannot approve, reject, or expire paid state manually. |

## Data Migration and Compatibility Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PAID-MIG-001 | Inventory legacy visibility requests. | Not started | script or admin report | Existing requests missing product snapshot are known. |
| PAID-MIG-002 | Add converter fallback for legacy request docs. | Not started | `src/firebase/converters.ts`, display code | Legacy docs render safely. |
| PAID-MIG-003 | Define default legacy product mapping. | Not started | migration note/config | Legacy `tier: paid` maps to a known manual 30-day product if approved. |
| PAID-MIG-004 | Backfill provider paid metadata where possible. | Not started | script or one-time admin tool | Active paid providers have product and start/end metadata or a documented legacy marker. |
| PAID-MIG-005 | Add rollback plan for failed server approval migration. | Not started | docs/ops | Admin can pause approval without corrupting provider paid state. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| PAID-V-001 | `npm test -- src/lib/ranking.test.ts` | Done | Paid cap, active paid, expired paid, and organic outranking tests pass. |
| PAID-V-002 | `npm test -- src/services/visibility.service.test.ts` | Not started | Request creation, product selection, disclosure, duplicate pending, and area expansion tests pass. |
| PAID-V-003 | `npm test -- src/services/admin.service.test.ts` | Not started | Admin approve/reject audit tests pass in demo mode. |
| PAID-V-004 | `npm test -- src/services/search.service.test.ts` | Done | Organic and paid approved provider search behavior passes. |
| PAID-V-005 | `npm test -- src/firebase/converters.test.ts src/lib/display.test.ts` | Not started | Extended request/provider fields and translated notes render safely. |
| PAID-V-006 | `npm run test:rules` | Not started | Firestore rules reject unauthorized paid state/request mutation and allow valid request creation. |
| PAID-V-007 | `cd functions && npm test` | Not started | Server approval, rejection, duration, and expiry tests pass. |
| PAID-V-008 | `cd functions && npm run build` | Not started | Functions TypeScript builds. |
| PAID-V-009 | `npm run lint` | Not started | Lint passes. |
| PAID-V-010 | `npm run build` | Not started | App TypeScript and Vite build pass. |
| PAID-V-011 | `npm run e2e` | Not started | Paid label, organic visibility, provider request, and admin approval smoke pass if e2e coverage is added. |
| PAID-V-012 | Manual smoke: organic provider search | Not started | Approved organic provider appears and opens from search. |
| PAID-V-013 | Manual smoke: paid request | Not started | Provider sees product terms, accepts disclosure, and creates pending request. |
| PAID-V-014 | Manual smoke: admin approval | Not started | Admin approves through server-owned flow and provider becomes promoted until expected expiry. |
| PAID-V-015 | Manual smoke: expiry cleanup | Not started | Expired paid provider loses promoted label and paid ranking bonus. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| PAID-DOD-001 | Providers can request optional paid visibility products. | Partially done |
| PAID-DOD-002 | Paid products have transparent price, currency, duration, and active state. | Not started |
| PAID-DOD-003 | Requests persist product and pricing snapshots. | Not started |
| PAID-DOD-004 | Requests persist payment status and controlled payment method. | Not started |
| PAID-DOD-005 | Requests persist no-guarantee disclosure acceptance. | Not started |
| PAID-DOD-006 | Admin approval is server-owned and atomic. | Not started |
| PAID-DOD-007 | Admin rejection is server-owned and audited. | Not started |
| PAID-DOD-008 | Paid activation sets start and expiry timestamps. | Partially done |
| PAID-DOD-009 | Expired paid visibility does not affect ranking. | Done |
| PAID-DOD-010 | Expired paid visibility is reconciled by cleanup or explicit expiry status. | Not started |
| PAID-DOD-011 | Paid ranking influence remains capped. | Done |
| PAID-DOD-012 | Organic providers can outrank paid providers. | Done |
| PAID-DOD-013 | Customer-facing paid label clearly says promoted paid listing. | Not started |
| PAID-DOD-014 | Organic and expired paid providers do not show paid labels. | Partially done |
| PAID-DOD-015 | Provider UI says no leads, no jobs, and no top placement are guaranteed. | Partially done |
| PAID-DOD-016 | Approved free providers remain eligible for public search. | Partially done |
| PAID-DOD-017 | Providers are not forced to pay to remain listed. | Partially done |
| PAID-DOD-018 | Rules prevent provider/customer mutation of paid state. | Partially done |
| PAID-DOD-019 | Paid activation, rejection, renewal, and expiry are audited or event-tracked. | Partially done |
| PAID-DOD-020 | Targeted tests, rules tests, functions tests, lint, build, and e2e smoke pass. | Not started |

## Open Questions

1. What exact launch prices and currency should paid visibility products use?
2. Should v1 expose one product or multiple durations?
3. Should product catalog live in Firestore, local config, or both?
4. Should manual payment evidence remain text-only, or will receipt upload be required later?
5. Should expired paid providers be reset to `visibilityTier: organic`, or should `visibilityTier: paid` plus `visibilityStatus: expired` be preserved for analytics?
6. Should paid renewal extend from current expiry when still active, or from approval time?
7. Should area expansion remain coupled to paid visibility requests in v1, or be split into a Section 8 monetization flow?
8. What Arabic label best communicates paid promotion without implying quality endorsement?
9. Should cancellation and refunds be in-app, or handled manually by admin support for v1?
