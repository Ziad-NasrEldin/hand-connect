# Section 8 Geographic Expansion Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-08-geographic-expansion.md`

Scope: complete SRS section 8 so Geographic Expansion is fully implemented across provider registration, provider coverage, area expansion eligibility, recurring paid entitlements, admin approval, public discovery, Firestore rules, backend functions, and tests.

Status legend:
- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Partially done`: current code satisfies part of the task but has known gaps.
- `Done`: implemented and verified.

## Tracker Summary

| Area | Status | Owner | Notes |
| --- | --- | --- | --- |
| Product decisions | Partially done | Product/Engineering | Recurring fee, billing period, renewal method, and coverage-only scope are decided; initial-area correction and eligibility thresholds remain open. |
| Initial service area | Partially done | Engineering | Registration creates one area and search uses service-area keys, but provider edit can still mutate coverage and the initial area is not explicit. |
| Coverage enforcement | Partially done | Engineering | Search respects `serviceAreaKeys`, but active coverage is not derived from entitlement state. |
| Expansion request flow | Partially done | Engineering | Providers can request areas and 30-review gate exists, but rating/activity/status gates are missing. |
| Admin approval | Partially done | Engineering | Admin can approve/reject, but Firebase admin processing is client-side and expansion approval has no recurring entitlement. |
| Recurring fees | Partially done | Product/Engineering | Product decision is 250 EGP/month auto-renewed by Visa/card on file through Paymob; entitlement lifecycle implementation is still missing. |
| Rules hardening | Partially done | Engineering | Request ownership and 30-review gates exist; direct coverage and entitlement bypasses need tighter coverage. |
| Provider UI | Partially done | Engineering/Product | Visibility page can submit requests; needs current coverage, entitlement expiry, payment/renewal, and eligibility evidence. |
| Admin UI | Partially done | Engineering/Product | Admin can approve/reject pending visibility requests; needs provider/area/payment/eligibility evidence and robust mutation states. |
| Verification | Not started | Engineering | Targeted tests, function tests, rules tests, build, lint, and e2e need to pass after implementation. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
| --- | --- | --- | --- |
| GEO-PD-001 | Decide whether initial service area is immutable in v1. | Not started | Recommended: immutable for providers; admin correction only if needed. |
| GEO-PD-002 | Decide how initial area corrections are handled. | Not started | Options: admin-only correction, support workflow, or out of v1. |
| GEO-PD-003 | Decide reputation threshold for expansion eligibility. | Not started | Recommended: `avgRating >= 4.0`. |
| GEO-PD-004 | Decide activity threshold for expansion eligibility. | Not started | Recommended: `activityScore >= 40` until a stronger activity metric is defined. |
| GEO-PD-005 | Confirm 30-review minimum remains PRD v1 target. | Not started | SRS requires 30 unless explicitly changed. |
| GEO-PD-006 | Decide whether provider must be approved and account-active before request creation. | Not started | Recommended: yes. |
| GEO-PD-007 | Decide whether unresolved abuse/account restrictions block requests or only approvals. | Not started | Recommended: block both request creation and approval. |
| GEO-PD-008 | Define recurring fee amount and currency. | Done | Area expansion costs 250 EGP per month. |
| GEO-PD-009 | Define billing period. | Done | Monthly auto-renewal by Visa/card on file through Paymob. |
| GEO-PD-010 | Define grace-period policy for missed renewal. | Done | Paid benefits expire automatically; rejected, unpaid, expired, canceled, or past-due expansion areas do not affect search coverage. |
| GEO-PD-011 | Decide whether expansion payment grants only coverage or also ranking boost. | Done | Area expansion grants coverage only; paid boost remains separate. |
| GEO-PD-012 | Decide whether active coverage is computed live or denormalized on provider docs. | Done | Use controlled projection for search scalability, backed by active entitlement state. |

## 8.1 Initial Service Area Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| GEO-8.1-001 | Add explicit `initialServiceAreaKey` to provider model. | Done | `src/types/provider.ts` | Provider type identifies the original v1 operating area. |
| GEO-8.1-002 | Set initial area during Firebase provider registration. | Done | `src/services/firebase/auth.firebase.ts` | Registration sets `initialServiceAreaKey`, coverage radius, and coverage keys. |
| GEO-8.1-003 | Set initial area during demo provider registration. | Done | `src/services/demo/auth.demo.ts` | Demo mirrors Firebase field behavior. |
| GEO-8.1-004 | Add converter fallback for existing providers. | Done | `src/firebase/converters.ts`, tests | Existing docs without `initialServiceAreaKey` load safely. |
| GEO-8.1-005 | Update seed/demo provider data. | Done | `src/services/demo/seed-data.ts` | Seed providers include or derive initial area consistently. |
| GEO-8.1-006 | Remove coverage fields from provider self-edit payload. | Done | `src/features/providers/pages/edit-provider-profile-page.tsx` | Provider profile edit no longer sends `serviceAreas` or `serviceAreaKeys`. |
| GEO-8.1-007 | Restrict provider update contract. | Done | `src/services/contracts/providers.contract.ts` | Coverage mutation is not accepted through normal provider profile update. |
| GEO-8.1-008 | Restrict Firebase provider update service. | Done | `src/services/firebase/providers.firebase.ts` | Provider-owned update cannot mutate coverage fields. |
| GEO-8.1-009 | Restrict demo provider update service. | Done | `src/services/demo/providers.demo.ts` | Demo behavior matches Firebase restrictions. |
| GEO-8.1-010 | Add initial-area registration test. | Not started | Auth/provider service tests | Provider registration creates exactly one initial area. |
| GEO-8.1-011 | Add provider edit preserves coverage test. | Not started | Provider service/component tests | Editing profile fields does not change coverage. |
| GEO-8.1-012 | Add rules test denying provider coverage mutation. | Not started | `tests/rules/firestore.rules.test.ts` | Provider owner cannot update service-area coverage directly. |
| GEO-8.1-013 | Add search test for initial area. | Not started | Search service tests | Approved provider appears in initial area and not in unsupported areas. |

## 8.2 Additional Service Areas Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| GEO-8.2-001 | Keep provider area-expansion request entry point. | Done | `src/features/dashboard/pages/visibility-page.tsx`; verified by `npm test -- src/services/visibility.service.test.ts ...` | Provider can select a new supported area and submit a request; UI now disables duplicate submit and shows submission errors. |
| GEO-8.2-002 | Add unsupported-area validation. | Not started | Visibility service, rules, UI | Unknown area keys cannot be requested. |
| GEO-8.2-003 | Keep duplicate pending request guard. | Partially done | `src/services/firebase/visibility.firebase.ts`, demo service | Duplicate pending request for provider/area is rejected. |
| GEO-8.2-004 | Add shared expansion eligibility helper. | Not started | `src/lib/geographic-expansion-eligibility.ts` | All eligibility reasons are centralized and testable. |
| GEO-8.2-005 | Enforce approved provider status gate. | Not started | Eligibility helper, services, functions, rules if feasible | Pending/suspended/rejected providers cannot request expansion. |
| GEO-8.2-006 | Enforce active account gate. | Not started | Eligibility helper, service/backend | Banned or inactive provider accounts cannot request expansion. |
| GEO-8.2-007 | Enforce 30-review minimum. | Partially done | Visibility service, rules, tests | Existing service/rules checks remain and move into shared helper. |
| GEO-8.2-008 | Enforce reputation gate. | Not started | Eligibility helper, service/backend, rules if feasible | Providers below rating threshold cannot request or be approved. |
| GEO-8.2-009 | Enforce activity gate. | Not started | Eligibility helper, service/backend, rules if feasible | Providers below activity threshold cannot request or be approved. |
| GEO-8.2-010 | Enforce no blocking abuse/restriction gate. | Not started | Eligibility helper, backend | Blocked providers cannot expand coverage. |
| GEO-8.2-011 | Recheck eligibility at approval time. | Not started | Backend function/admin service | Request cannot be approved if current provider state is no longer eligible. |
| GEO-8.2-012 | Add eligibility denial localization. | Not started | Locale files, display helpers | UI shows specific locked reasons. |
| GEO-8.2-013 | Add typed area payload. | Not started | `VisibilityRequest` or new request type | Request stores city/area/product/payment fields consistently. |
| GEO-8.2-014 | Create active coverage helper. | Not started | `src/lib/provider-coverage.ts` | Initial area plus active entitlements determine coverage. |
| GEO-8.2-015 | Update demo search to use active coverage helper. | Not started | `src/services/demo/search.demo.ts` | Demo search includes approved active expansion areas. |
| GEO-8.2-016 | Update Firebase search to use active coverage model. | Not started | `src/services/firebase/search.firebase.ts` | Firebase search includes active expansion areas and excludes inactive ones. |
| GEO-8.2-017 | Add approved-expansion discovery test. | Not started | Search/visibility/admin service tests | Provider appears in newly approved area. |
| GEO-8.2-018 | Add pending/rejected expansion exclusion test. | Not started | Search service tests | Pending and rejected requested areas do not affect search. |
| GEO-8.2-019 | Add stale-eligibility approval test. | Not started | Function/admin service tests | Approval fails if provider no longer passes gates. |
| GEO-8.2-020 | Add e2e/component expansion request smoke. | Not started | E2E/component tests | Eligible provider can submit expansion request and see pending state. |

## 8.3 Fees and Approval Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| GEO-8.3-001 | Preserve admin approve/reject UI entry point. | Done | `src/features/admin/pages/visibility-requests-page.tsx`; verified by `npm test -- src/services/admin.service.test.ts ...` | Admin can process pending visibility/expansion requests through the existing server-owned service path and sees request context. |
| GEO-8.3-002 | Split or clarify boost vs area expansion products. | Not started | Types, admin UI, provider UI | Expansion coverage and paid boost behavior are not conflated. |
| GEO-8.3-003 | Add recurring expansion product config. | Partially done | `src/config/paid-products.ts` | Product metadata includes 250 EGP, 30-day duration, monthly auto-renew, Paymob, and coverage-only policy; separate entitlement config/tests remain open. |
| GEO-8.3-004 | Add entitlement type. | Not started | `src/types/geographic-expansion.ts` | Active/inactive area entitlement lifecycle is typed. |
| GEO-8.3-005 | Add entitlement converter. | Not started | `src/firebase/converters.ts`, tests | Entitlement timestamps serialize and deserialize correctly. |
| GEO-8.3-006 | Add demo entitlement store. | Not started | `src/services/demo/demo-db.ts`, seed data | Demo can represent active/pending/expired entitlements. |
| GEO-8.3-007 | Move approve expansion to backend callable. | Done | `functions/src/visibility.ts`, `functions/src/index.ts`, `src/services/firebase/admin.firebase.ts` | Client calls trusted backend instead of direct transaction for approval. |
| GEO-8.3-008 | Move reject expansion to backend callable. | Done | Functions/admin service | Rejection writes request status, reason, and audit server-side. |
| GEO-8.3-009 | Require admin notes/reason. | Not started | Admin UI, backend validation | Approval/rejection without required note is blocked. |
| GEO-8.3-010 | Require payment confirmation before activation. | Not started | Backend function/admin UI | Area entitlement cannot become active without payment confirmation. |
| GEO-8.3-011 | Create entitlement on approval. | Not started | Backend function/demo admin service | Approved expansion creates active entitlement with billing dates. |
| GEO-8.3-012 | Add Paymob auto-renewal flow. | Not started | Backend function/admin UI/provider UI | Successful Visa/card renewal extends current period and writes audit/event evidence. |
| GEO-8.3-013 | Add expiry or past-due processing. | Not started | Scheduled/backend function | Expired, unpaid, canceled, or past-due entitlement no longer affects search. |
| GEO-8.3-014 | Add provider coverage/status panel. | Not started | `src/features/dashboard/pages/visibility-page.tsx` | Provider sees initial area, active areas, pending requests, rejected requests, and renewal/expiry info. |
| GEO-8.3-015 | Add admin eligibility/payment evidence panel. | Not started | `src/features/admin/pages/visibility-requests-page.tsx` | Admin sees provider, area, eligibility evidence, payment method/state, billing period, and actions. |
| GEO-8.3-016 | Add mutation loading and error states. | Done | `visibility-page.tsx`, `visibility-requests-page.tsx`, i18n; verified by `npm run build` and `npm run lint` | Duplicate clicks are disabled and failures are visible/localized. |
| GEO-8.3-017 | Add inactive entitlement search exclusion test. | Not started | Search tests | Unpaid/past-due/expired/canceled areas do not affect search. |
| GEO-8.3-018 | Add backend function approval tests. | Not started | `functions/test/visibility.test.ts` | Admin approval success and failure cases pass. |
| GEO-8.3-019 | Add backend function rejection tests. | Not started | `functions/test/visibility.test.ts` | Rejection writes reason and does not activate coverage. |
| GEO-8.3-020 | Add rules tests for entitlement bypass. | Not started | `tests/rules/firestore.rules.test.ts` | Provider cannot create/update active entitlements or billing fields. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
| --- | --- | --- | --- |
| GEO-V-001 | `npm test -- src/services/visibility.service.test.ts` | Done | Passed in combined targeted run: 4 files, 9 tests. |
| GEO-V-002 | `npm test -- src/services/admin.service.test.ts` | Done | Passed in combined targeted run: 4 files, 9 tests. |
| GEO-V-003 | `npm test -- src/services/search.service.test.ts` | Done | Search coverage lifecycle tests pass. |
| GEO-V-004 | `npm test -- src/firebase/converters.test.ts` | Not started | Provider and entitlement converters pass. |
| GEO-V-005 | `npm test -- src/lib/ranking.test.ts` | Done | Ranking behavior remains stable after coverage changes. |
| GEO-V-006 | `npm run test:rules` | Not started | Firestore rules block bypasses and allow valid transitions. |
| GEO-V-007 | `cd functions && npm test` | Not started | Backend visibility function tests pass. |
| GEO-V-008 | `npm run lint` | Done | No lint failures. |
| GEO-V-009 | `npm test` | Not started | Full Vitest suite passes. |
| GEO-V-010 | `npm run build` | Done | TypeScript and Vite build pass. |
| GEO-V-011 | `npm run e2e` | Not started | Browser smoke flows pass if e2e coverage exists. |
| GEO-V-012 | Manual/admin browser smoke with `chrome-devtools-axi` | Not started | Provider and admin expansion flows render correctly without layout or console errors. |

## Definition of Done Tracker

| ID | Requirement | Status |
| --- | --- | --- |
| GEO-DOD-001 | Provider registration creates exactly one explicit initial Cairo service area. | Not started |
| GEO-DOD-002 | Existing provider docs without the new initial-area field load safely. | Not started |
| GEO-DOD-003 | Provider self-edit cannot mutate public coverage. | Not started |
| GEO-DOD-004 | Public search respects approved active coverage only. | Partially done |
| GEO-DOD-005 | Providers can request additional supported Cairo service areas. | Partially done |
| GEO-DOD-006 | Duplicate pending expansion requests are blocked. | Partially done |
| GEO-DOD-007 | Expansion request creation enforces 30-review minimum. | Partially done |
| GEO-DOD-008 | Expansion request creation enforces reputation threshold. | Not started |
| GEO-DOD-009 | Expansion request creation enforces activity threshold. | Not started |
| GEO-DOD-010 | Expansion request creation enforces provider approval/account status gates. | Not started |
| GEO-DOD-011 | Expansion approval rechecks eligibility on the backend. | Not started |
| GEO-DOD-012 | Admin approval/rejection is not a client-side privileged Firestore transaction. | Not started |
| GEO-DOD-013 | Approved expansion creates or activates a recurring paid area entitlement. | Partially done |
| GEO-DOD-014 | Active entitlement affects discovery coverage. | Not started |
| GEO-DOD-015 | Pending expansion does not affect discovery coverage. | Partially done |
| GEO-DOD-016 | Rejected expansion does not affect discovery coverage. | Partially done |
| GEO-DOD-017 | Unpaid expansion does not affect discovery coverage. | Not started |
| GEO-DOD-018 | Expired or past-due expansion does not affect discovery coverage. | Not started |
| GEO-DOD-019 | Provider UI shows coverage, eligibility, request status, fee terms, and renewal/expiry data. | Not started |
| GEO-DOD-020 | Admin UI shows provider, area, eligibility, payment, billing, and action state. | Partially done | Provider, area, request type, payment, product snapshot, disclosure, notes, rejection reason, action reason, pending, and error states are visible; stale eligibility details still need backend policy data. |
| GEO-DOD-021 | Firestore rules block direct client coverage and entitlement bypasses. | Partially done |
| GEO-DOD-022 | Backend/function tests cover approval, rejection, stale eligibility, payment, and expiry. | Not started |
| GEO-DOD-023 | Service/search tests cover initial, active expansion, pending, rejected, unpaid, expired, and canceled states. | Not started |
| GEO-DOD-024 | Full verification commands pass. | Not started |

## Risk Tracker

| ID | Risk | Status | Mitigation |
| --- | --- | --- | --- |
| GEO-RISK-001 | Provider profile edit can bypass expansion approval by replacing service areas. | Open | Remove coverage fields from provider edit path and add rules tests. |
| GEO-RISK-002 | Expansion gates exist only as partial client/service logic. | Open | Centralize eligibility and enforce at creation plus backend approval. |
| GEO-RISK-003 | Admin approval is client-side for Firebase. | Open | Move privileged approval/rejection to Cloud Functions. |
| GEO-RISK-004 | No recurring entitlement means unpaid areas can remain searchable. | Open | Add Paymob-backed entitlement lifecycle and search exclusion tests. |
| GEO-RISK-005 | Denormalized `serviceAreaKeys` can drift from entitlement state. | Open | Centralize active coverage and update projection atomically if retained. |
| GEO-RISK-006 | Product pricing must stay synchronized with Paymob. | Open | Keep 250 EGP/month as the source product decision and verify Paymob product configuration before launch. |
| GEO-RISK-007 | Firestore rules may become too complex for all gates. | Open | Use rules for hard boundaries and backend transactions for full validation. |

## Implementation Order

| Step | Work | Status | Exit Criteria |
| --- | --- | --- | --- |
| 1 | Lock product decisions. | Not started | PD checklist resolved or explicitly deferred. |
| 2 | Harden initial area and remove provider coverage edit bypass. | Not started | Provider registration/edit/rules/search tests pass. |
| 3 | Add shared eligibility helper and gates. | Not started | Unit/service/rules tests cover all gates. |
| 4 | Add entitlement model and active coverage helper. | Not started | Search can distinguish active and inactive expansion areas. |
| 5 | Move approval/rejection to backend functions. | Not started | Client admin service calls backend and function tests pass. |
| 6 | Add renewal/expiry behavior. | Not started | Expired/unpaid areas are excluded from search. |
| 7 | Improve provider/admin UI status and error states. | Not started | Browser smoke passes and no visible layout issues. |
| 8 | Run full verification. | Not started | Lint, tests, rules, functions, build, and e2e pass. |

## Open Questions

1. Should providers ever be able to change their initial area without admin approval?
2. What rating threshold should satisfy the reputation gate?
3. What activity signal should satisfy the activity gate?
4. Should unresolved abuse reports block expansion request creation, approval, or both?
5. What is the recurring fee amount, currency, and billing period?
6. Should missed renewal immediately remove public coverage or allow a short grace period?
7. Should area expansion remain coverage-only or be bundled with paid boost?
8. Should active coverage be stored as a denormalized provider projection for Firestore query performance?
