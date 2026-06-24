# Section 13 Monetization Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-13-monetization.md`

Scope: complete SRS section 13 so Herafy monetizes provider visibility only, supports transparent paid products and recurring area fees, preserves free customer use and organic provider listing, and blocks customer-payment, commission, per-lead, service-payment, escrow, and guarantee regressions.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but gaps/tests remain.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Partially done | Product/Engineering | Captain decided 500 EGP auto-renewing paid visibility, no visibility cap, 250 EGP monthly area expansion, Paymob/card renewal, promoted label wording, and automatic expiry; refund/cancellation details remain open. |
| Visibility-based monetization | Partially done | Engineering | Request/admin approval/ranking pieces exist; catalog snapshots, server entitlements, Paymob adapter validation, and scheduled renewal/expiry decisions exist; live card capture/webhooks remain open. |
| Customer pricing boundaries | Partially done | Engineering | No customer payment flow found; needs ADR and negative regression tests. |
| Provider transaction boundaries | Partially done | Engineering | No commission/per-lead/service-payment flow found; needs ADR, schema/API tests, and stronger no-guarantee copy. |
| Pricing transparency | Partially done | Product/Engineering | Provider page renders shared catalog terms and requests persist price/billing/cap/provider/renewal snapshots; live card terms remain open. |
| Verification | Not started | Engineering | Run targeted unit, functions, rules, e2e, lint, and build. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| MONEY-PD-001 | Decide v1 paid product catalog shape. | Done | One visibility boost product and one recurring area expansion product. |
| MONEY-PD-002 | Decide exact visibility boost price and currency. | Done | 500 EGP per 30-day auto-renewing period. |
| MONEY-PD-003 | Decide exact area expansion recurring price and currency. | Done | 250 EGP per month. |
| MONEY-PD-004 | Decide boost duration. | Done | Paid benefits start at approval and last 30 days. |
| MONEY-PD-005 | Decide area expansion billing interval. | Done | Monthly 30-day rolling period. |
| MONEY-PD-006 | Confirm v1 keeps manual provider payment confirmation. | Done | No: v1 target is Paymob/card renewal; admin approval still starts benefits after payment approval. |
| MONEY-PD-007 | Confirm no customer checkout or customer billing in v1. | Done | Customers remain free for search, profile viewing, contact, messaging, and reviews. |
| MONEY-PD-008 | Confirm no per-lead charging in v1. | Done | Contact events are not billable leads. |
| MONEY-PD-009 | Confirm no commission or service-payment processing in v1. | Done | Platform does not process customer-provider service payments or commissions. |
| MONEY-PD-010 | Decide paid listing label wording. | Done | Use `Promoted` or localized equivalent instead of ambiguous featured wording. |
| MONEY-PD-011 | Decide whether admin paid product management UI is in this section or Section 10.5. | Not started | At minimum, active products need server-owned config or seed data. |
| MONEY-PD-012 | Decide whether providers must explicitly accept pricing terms with a checkbox. | Not started | Recommended if legal/product wants durable acceptance evidence. |

## 13.1 Visibility-Based Monetization Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| MONEY-13.1-001 | Keep paid visibility request entry point. | Done | `src/features/dashboard/pages/visibility-page.tsx` | Provider can submit a visibility-related request. |
| MONEY-13.1-002 | Keep manual area expansion eligibility gate. | Done | `visibility-page.tsx`, `visibility.firebase.ts`, `firestore.rules` | Expansion request requires provider to meet the current 30-review gate. |
| MONEY-13.1-003 | Keep paid boost expiry helper. | Done | `functions/src/visibility.ts`, `functions/test/visibility.test.ts` | Default approval duration helper returns 30-day expiry. |
| MONEY-13.1-004 | Keep no-guarantee paid ranking influence. | Done | `src/lib/ranking.ts`, `src/lib/ranking.test.ts` | Weak paid provider does not automatically beat strong organic provider. |
| MONEY-13.1-005 | Add monetization product types. | Done | `src/types/monetization.ts`, `src/types/visibility.ts` | Types represent boost and area expansion products with price, currency, duration, billing model, payment provider, renewal policy, and active state. |
| MONEY-13.1-006 | Add pricing snapshot type. | Done | `src/types/monetization.ts`, `src/types/visibility.ts` | Request can persist immutable product terms accepted at request time. |
| MONEY-13.1-007 | Seed active paid products. | Not started | `src/services/demo/seed-data.ts`, Firebase seed path | Demo/Firebase data includes active boost and area expansion products. |
| MONEY-13.1-008 | Add active paid product service. | Not started | `monetization.service.ts`, Firebase/demo adapters | Providers can load active sorted product list. |
| MONEY-13.1-009 | Add paid product adapter tests. | Not started | Monetization service tests | Active products appear, inactive products are hidden, sort order is stable. |
| MONEY-13.1-010 | Update provider request UI to select a product. | Not started | `visibility-page.tsx`, locale files | Request cannot be submitted without a valid product selection. |
| MONEY-13.1-011 | Store product id on visibility requests. | Done | `VisibilityRequest`, visibility services | Request records selected product id. |
| MONEY-13.1-012 | Store pricing snapshot on visibility requests. | Done | `VisibilityRequest`, visibility services | Request records price, currency, duration, billing interval, cap policy, payment provider, renewal policy, and snapshot timestamp. |
| MONEY-13.1-013 | Store explicit payment status. | Done | `VisibilityRequest`, visibility services, admin UI | Request distinguishes pending payment, matched payment, rejected, and expired where applicable. |
| MONEY-13.1-014 | Store payment reference separately from notes. | Not started | `VisibilityRequest`, provider/admin UI | Manual payment reference is structured and auditable. |
| MONEY-13.1-015 | Validate product/request compatibility. | Not started | Visibility services, functions | Boost products target existing areas; area expansion products target eligible new areas. |
| MONEY-13.1-016 | Move visibility approval to callable. | Done | `functions/src/visibility.ts`, `functions/src/index.ts`, `admin.firebase.ts` | Admin approval no longer runs as client Firestore transaction. |
| MONEY-13.1-017 | Move visibility rejection to callable. | Done | Functions/admin service | Admin rejection is server-owned and audited. |
| MONEY-13.1-018 | Add callable auth and admin checks. | Done | Functions tests | Callable enforces active admin before approval/rejection. |
| MONEY-13.1-019 | Make audit log server-owned for paid approvals. | Done | Functions/audit path, rules | Approval/rejection writes actor, action, target, and timestamp from trusted code. |
| MONEY-13.1-020 | Tighten visibility request update rules. | Done | `firestore.rules`, rules tests | Clients cannot directly approve, reject, confirm payment, or grant paid benefits. |
| MONEY-13.1-021 | Add boost entitlement traceability. | Done | Provider type, request type, admin approval | Active boost links to request, product, pricing snapshot, paid-through date, and `visibilityEntitlements` entry. |
| MONEY-13.1-022 | Keep expired boost organic. | Done | `ranking.ts`, `ranking.test.ts` | Expired `visibilityPaidUntil` is not active paid visibility. |
| MONEY-13.1-023 | Add promoted label expiry test. | Not started | Search/profile component tests | Expired paid provider does not show promoted label. |
| MONEY-13.1-024 | Add recurring area entitlement model. | Done | `functions/src/visibility.ts` | Area expansion has paid-through/expiry/auto-renew state in `visibilityEntitlements`. |
| MONEY-13.1-025 | Update area expansion approval to create entitlement. | Done | Functions admin approval | Approval creates a 30-day entitlement period. |
| MONEY-13.1-026 | Update search to honor active area entitlements. | Not started | Search Firebase/demo services, indexes | Active paid expansion affects coverage; expired/unpaid expansion does not. |
| MONEY-13.1-027 | Add area entitlement expiry handling. | Partially done | `expirePaidVisibilityEntitlements` scheduled function | Scheduled cleanup removes expired expansion coverage; query-time guard for expired, canceled, failed-payment, or past-due entitlement remains open. |
| MONEY-13.1-028 | Add Paymob renewal status flow. | Not started | Provider visibility page, visibility services | Provider can see next card auto-renewal date and failed-payment state. |
| MONEY-13.1-029 | Add Paymob renewal processing flow. | Not started | Admin visibility page/functions | Successful Paymob renewal extends paid-through date and writes audit/event evidence. |
| MONEY-13.1-030 | Add provider paid status summary. | Not started | Provider dashboard or visibility page | Provider sees active boost expiry and area paid-through dates. |

## 13.2 Customer Pricing Boundaries Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| MONEY-13.2-001 | Keep customer search free. | Done | Search routes/services | No payment step is required for search. |
| MONEY-13.2-002 | Keep provider profile viewing free. | Done | Provider profile route | No payment step is required to view approved provider profiles. |
| MONEY-13.2-003 | Keep customer chat contact free. | Done | Provider profile/chat functions | No customer payment object is required to start chat. |
| MONEY-13.2-004 | Keep WhatsApp reveal/open free. | Done | Provider profile/engagement callable | No customer payment object is required to reveal/open WhatsApp. |
| MONEY-13.2-005 | Add customer no-charge ADR. | Not started | Product boundary doc | Docs explicitly say customers are not charged for search, profile view, contact, messaging, or reviews. |
| MONEY-13.2-006 | Add route negative test for customer checkout. | Not started | Route/static test | Customer route list has no checkout/payment/billing/subscribe path. |
| MONEY-13.2-007 | Add contact flow e2e without payment step. | Not started | `tests/e2e/app.spec.ts` or equivalent | Search to profile to chat/WhatsApp completes without payment UI. |
| MONEY-13.2-008 | Add contact payload no-fee test. | Not started | Contact/callable tests | Contact event has no customer fee, payment, or charge field. |
| MONEY-13.2-009 | Preserve copy that Herafy is direct contact/no commission. | Partially done | Locale files, landing/profile copy | Copy remains accurate and does not imply customer fees. |

## 13.3 Provider Transaction Boundaries Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| MONEY-13.3-001 | Keep no commission model. | Done | Current app/routes/types | No commission field or job payment model exists. |
| MONEY-13.3-002 | Keep no per-lead charge model. | Done | Contact/analytics types | Contact events are not billable lead charges. |
| MONEY-13.3-003 | Keep no customer-provider payment processing. | Done | Routes/services/functions | No service checkout, escrow, or provider job payment processing exists. |
| MONEY-13.3-004 | Keep no outcome guarantee positioning. | Done | Locale files, visibility copy | Copy says no leads, jobs, revenue, top placement, provider selection, or demand guarantee. |
| MONEY-13.3-005 | Add provider transaction boundary ADR. | Not started | Product boundary doc | Docs explicitly forbid commissions, per-lead charges, service payments, escrow, and paid outcome guarantees for v1. |
| MONEY-13.3-006 | Add forbidden API/static scan test. | Done | `src/features/search/search-product-boundary.test.ts` | Static scan covers `src`, `functions/src`, `api`, and rules with explicit allowlist. |
| MONEY-13.3-007 | Add contact analytics non-billing schema test. | Not started | Contact/analytics tests | Contact tracking contains no billing semantics. |
| MONEY-13.3-008 | Update paid product no-guarantee copy. | Done | `visibility-page.tsx`, locale files | Copy says no leads, jobs, revenue, top placement, provider selection, or demand guarantee. |
| MONEY-13.3-009 | Add no-guarantee disclosure test. | Not started | Component/e2e tests | Paid product request UI renders the required no-guarantee copy. |
| MONEY-13.3-010 | Add ranking no-guarantee regression. | Done | `src/lib/ranking.test.ts` | Organic provider can outrank paid provider when quality signals are stronger. |

## 13.4 Pricing Transparency Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| MONEY-13.4-001 | Add provider-facing pricing table. | Done | `visibility-page.tsx`, locale files | Product name, placeholder price, currency, duration, and billing model are visible before request. |
| MONEY-13.4-002 | Add area expansion recurring fee display. | Done | Pricing UI/locale files | Area product shows 250 EGP and monthly auto-renewal by Visa/card through Paymob. |
| MONEY-13.4-003 | Add no-hidden-fee disclosure. | Partially done | Pricing UI/locale files | Copy clarifies exposure-only scope and monthly Paymob card renewal; structured payment reference remains open. |
| MONEY-13.4-004 | Add no-guarantee disclosure beside pricing. | Done | Pricing UI/locale files | Provider sees payment does not guarantee leads, jobs, revenue, top placement, or demand. |
| MONEY-13.4-005 | Add organic listing remains free copy. | Done | Pricing UI/locale files | Provider sees paid products are optional. |
| MONEY-13.4-006 | Add equal pricing source of truth. | Done | `src/config/paid-products.ts` | Product terms render from shared catalog, not per-provider client logic. |
| MONEY-13.4-007 | Persist accepted pricing/disclosure version. | Done | `VisibilityRequest` | Request records product version and disclosure version. |
| MONEY-13.4-008 | Add optional acceptance checkbox if product requires it. | Blocked | Provider pricing UI | Decision needed from product/legal. |
| MONEY-13.4-009 | Improve admin request detail display. | Not started | `visibility-requests-page.tsx`, admin service | Admin sees product, type, target area, price snapshot, payment state, reference, and timestamps. |
| MONEY-13.4-010 | Add equal-pricing test. | Not started | Monetization service tests | Two eligible providers see same active product terms. |
| MONEY-13.4-011 | Add pricing snapshot test. | Done | Visibility service tests | Request snapshot includes price, billing, cap, payment provider, and renewal policy. |
| MONEY-13.4-012 | Add organic provider search visibility test. | Not started | Search/Firebase/rules tests | Approved organic provider appears in public search. |
| MONEY-13.4-013 | Add expired paid provider organic fallback test. | Not started | Search/ranking tests | Expired paid provider remains searchable organically if approved and in coverage. |
| MONEY-13.4-014 | Rename paid customer label from featured to promoted. | Done | Locale files, search/profile UI | Active paid listing label clearly communicates promoted/paid status through locale copy. |
| MONEY-13.4-015 | Add paid label active/expired UI tests. | Not started | Search/profile component tests | Active paid shows promoted label; expired paid does not. |

## Cross-Section Dependency Tracker

| ID | Dependency | Status | Coordination Needed |
|---|---|---|---|
| MONEY-DEP-001 | Section 7 paid visibility boosts | Partially done | Product catalog and boost entitlement should align with paid visibility implementation. |
| MONEY-DEP-002 | Section 8 area expansion fees | Partially done | Recurring area entitlement model must replace permanent unpaid expansion. |
| MONEY-DEP-003 | Section 10.5 paid product controls | Partially done | Admin product/tier management may live in Section 10, but Section 13 needs at least a server-owned catalog. |
| MONEY-DEP-004 | Section 10.6 audit logging | Partially done | Paid approval/rejection/renewal/expiry must write trusted audit rows. |
| MONEY-DEP-005 | Section 12.3 paid events | Partially done | Paid usage and expiry events should be tracked without creating billable lead semantics. |
| MONEY-DEP-006 | Section 14.4 product boundaries | Partially done | Negative tests should guard payment, booking, job assignment, and marketplace drift. |
| MONEY-DEP-007 | Section 15 out-of-scope | Partially done | Monetization must not introduce service payments, escrow, booking, or job tracking. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| MONEY-V-001 | `npm test -- src/lib/ranking.test.ts` | Done | Paid no-guarantee and expiry tests pass. |
| MONEY-V-002 | `npm test -- src/services/admin.service.test.ts` | Done | Existing admin visibility request tests still pass after adapter changes. |
| MONEY-V-003 | `npm test -- src/services/monetization.service.test.ts` | Not started | Product catalog behavior passes. |
| MONEY-V-004 | `npm test -- src/services/visibility.service.test.ts` | Done | Product-based request and pricing snapshot tests pass. |
| MONEY-V-005 | `npm test -- src/__tests__/product-boundaries.test.ts` | Done | `npm test -- src/features/search/search-product-boundary.test.ts` passes for app/function/API/rules scan. |
| MONEY-V-006 | `npm test -- functions/test/visibility.test.ts` | Done | Visibility helper tests pass. |
| MONEY-V-007 | `npm run test:rules` | Done | Rules deny direct paid entitlement/payment mutations and allow only valid provider requests. |
| MONEY-V-008 | `npm run e2e -- tests/e2e/app.spec.ts` or equivalent | Partially done | Mobile e2e covers customer no-payment contact and provider/admin shells; provider paid request/admin approval smoke remains open. |
| MONEY-V-009 | `npm run lint` | Done | Passes. |
| MONEY-V-010 | `npm run build` | Done | Passes. |
| MONEY-V-011 | Manual UI review of provider pricing page | Partially done | Build verifies render path; browser visual review not run in this slice. |
| MONEY-V-012 | Manual UI review of admin visibility page | Not started | Admin can review exact product/price/payment terms before approval. |
| MONEY-V-013 | `npm --prefix functions run build` | Done | Functions TypeScript build passes with Paymob adapter and scheduled renewal/expiry function. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| MONEY-DOD-001 | V1 paid product catalog is product-approved. | Not started |
| MONEY-DOD-002 | Paid products include price, currency, duration, billing model, active state, and display copy. | Partially done |
| MONEY-DOD-003 | Provider pricing UI shows simple transparent terms before request submission. | Done |
| MONEY-DOD-004 | Visibility requests store product id and immutable pricing snapshot. | Not started |
| MONEY-DOD-005 | Visibility requests store explicit manual payment state and reference fields. | Not started |
| MONEY-DOD-006 | Paid approval and rejection are server-owned callables. | Not started |
| MONEY-DOD-007 | Direct client writes cannot approve paid requests or grant paid entitlements. | Done |
| MONEY-DOD-008 | Boost approval creates traceable paid visibility with expiry. | Partially done |
| MONEY-DOD-009 | Expired boost has no ranking or promoted-label effect. | Partially done |
| MONEY-DOD-010 | Area expansion uses recurring entitlement with paid-through/expiry state. | Not started |
| MONEY-DOD-011 | Expired or unpaid area expansion does not affect public search coverage. | Not started |
| MONEY-DOD-012 | Free approved providers remain publicly listed and searchable. | Partially done |
| MONEY-DOD-013 | Customers are not charged for search, profile view, contact, messaging, or reviews. | Done |
| MONEY-DOD-014 | No commission, per-lead charge, service payment, escrow, or customer-provider payment processing exists. | Done |
| MONEY-DOD-015 | Paid products and copy do not guarantee leads, jobs, revenue, or top placement. | Done |
| MONEY-DOD-016 | Customer-facing paid label clearly distinguishes promoted listings from organic listings. | Not started |
| MONEY-DOD-017 | Product-boundary ADR exists. | Not started |
| MONEY-DOD-018 | Product-boundary regression tests exist. | Done |
| MONEY-DOD-019 | Unit, functions, rules, e2e where applicable, lint, and build pass. | Partially done |

## Open Questions

1. What are the exact boost and area expansion prices for v1?
2. What currency should the product catalog use?
3. Should area expansion renew monthly or on a 30-day rolling period?
4. Should v1 include an admin paid-product management UI, or should product data be seeded/configured by engineering?
5. Should expired area entitlements be cleaned by scheduled job, query-time guard, or both?
6. Should providers explicitly accept pricing terms before request submission?
7. Should the customer-facing label be `Promoted`, `Sponsored`, or another localized term?
8. Should manual provider payment methods be enumerated now, or kept as admin/provider notes for v1?
