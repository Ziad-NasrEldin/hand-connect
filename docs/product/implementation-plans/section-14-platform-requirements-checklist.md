# Section 14 Platform Requirements Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-14-platform-requirements.md`

Scope: complete SRS section 14 so platform requirements are fully implemented across responsive coverage, bounded performance, admin stability, expected peak readiness, product-boundary enforcement, and verification.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but needs gaps/tests completed.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Not started | Product/Engineering | Decide responsive baseline, timing thresholds, admin mutation ownership, and boundary scan scope. |
| Mobile responsiveness | Partially done | Engineering | Customer mobile search/contact, provider shell, provider dashboard, and paid visibility checks pass on Pixel 7; admin tablet coverage remains missing. |
| Performance | Partially done | Engineering | Bounded search is implemented; timing instrumentation, 60-second assertion, and seeded performance test missing. |
| Stability | Partially done | Engineering | Release gates, runbook, rules, E2E, and some callables exist; remaining privileged admin writes and error states need hardening. |
| Product boundaries | Partially done | Product/Engineering | Boundary is implemented by absence/copy, static scan, and browser smoke; release-gate integration remains undecided. |
| Verification | Not started | Engineering | Run targeted tests, functions tests, rules tests, E2E, lint, build, and release gate after implementation. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| PLATFORM-PD-001 | Confirm responsive coverage baseline. | Not started | Recommended: customer phone-required, provider phone-supported, admin tablet/desktop-required. |
| PLATFORM-PD-002 | Confirm tablet viewport/device for Playwright. | Not started | Recommended: add `tablet-chrome` using an iPad-class viewport. |
| PLATFORM-PD-003 | Confirm performance outcome measurement. | Not started | Recommended: E2E entry-to-contact under 60 seconds plus search/contact timing events. |
| PLATFORM-PD-004 | Define expected v1 peak profile. | Not started | Must name expected concurrent search users, provider density, contact volume, and admin workload. |
| PLATFORM-PD-005 | Confirm admin mutation ownership policy. | Not started | Recommended: all privileged transitions move to server-owned callables. |
| PLATFORM-PD-006 | Confirm temporary exceptions for direct admin Firestore writes, if any. | Not started | Any exception must be explicitly listed and rules-tested. |
| PLATFORM-PD-007 | Confirm product-boundary forbidden surface list. | Not started | Include booking, scheduling, payments, escrow, job assignment, dispatch, and fulfillment tracking. |
| PLATFORM-PD-008 | Confirm boundary scan scope. | Not started | Recommended: routes, feature folders, services, functions, and critical locale labels. |

## 14.1 Mobile Responsiveness Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PLATFORM-14.1-001 | Keep Desktop Chrome E2E project. | Done | `playwright.config.ts` | Desktop project exists and runs core app smoke. |
| PLATFORM-14.1-002 | Keep Pixel 7 mobile E2E project. | Done | `playwright.config.ts` | Mobile project exists and runs responsive smoke. |
| PLATFORM-14.1-003 | Add tablet E2E project. | Not started | `playwright.config.ts` | `tablet-chrome` or equivalent project runs. |
| PLATFORM-14.1-004 | Keep customer mobile search filter stacking check. | Done | `tests/e2e/app.spec.ts` | Profession and area controls stack correctly on mobile. |
| PLATFORM-14.1-005 | Keep mobile provider profile contact CTA visibility check. | Done | `tests/e2e/app.spec.ts` | WhatsApp and in-app message buttons are visible on phone viewport. |
| PLATFORM-14.1-006 | Keep provider shell mobile readability check. | Done | `tests/e2e/app.spec.ts`, `src/layouts/provider-layout.tsx` | Provider sidebar/nav links are visible on phone viewport. |
| PLATFORM-14.1-007 | Add provider dashboard mobile content check. | Done | `tests/e2e/app.spec.ts`, dashboard pages | Pixel 7 smoke verifies dashboard heading, paid visibility copy, manage-visibility link, and no page-level horizontal overflow. |
| PLATFORM-14.1-008 | Add provider visibility mobile check. | Done | `tests/e2e/app.spec.ts`, `src/features/dashboard/pages/visibility-page.tsx` | Pixel 7 smoke verifies paid visibility page heading, request control, disclosure copy, and no page-level horizontal overflow. |
| PLATFORM-14.1-009 | Add admin desktop route coverage. | Not started | `tests/e2e/app.spec.ts`, admin pages | Admin dashboard/applications/providers/professions/visibility/reports/actions render on desktop. |
| PLATFORM-14.1-010 | Add admin tablet route coverage. | Not started | `tests/e2e/app.spec.ts`, admin pages | Admin core pages render and primary actions are reachable on tablet. |
| PLATFORM-14.1-011 | Add page-level horizontal overflow assertion. | Done | `tests/e2e/app.spec.ts` | Covered search, profile, provider dashboard, provider visibility, and admin visibility smoke pages assert no document-level horizontal overflow. |
| PLATFORM-14.1-012 | Add critical control visibility assertion. | Done | `tests/e2e/app.spec.ts` | Covered provider contact, provider visibility, admin visibility, and dashboard controls assert visible non-zero boxes. |
| PLATFORM-14.1-013 | Capture screenshots on responsive failures. | Not started | Playwright test attachments | Failures include visual proof without committing generated screenshots. |

## 14.2 Performance Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PLATFORM-14.2-001 | Keep default search limit. | Done | `src/lib/search-filters.ts` | `defaultSearchLimit` remains bounded. |
| PLATFORM-14.2-002 | Keep max search limit. | Done | `src/lib/search-filters.ts` | `maxSearchLimit` caps requested limits. |
| PLATFORM-14.2-003 | Keep normalized requested limits. | Done | `src/lib/search-filters.ts`, tests | Non-finite/excessive limits clamp safely. |
| PLATFORM-14.2-004 | Keep Firebase provider search hard limit. | Done | `src/services/firebase/search.firebase.ts` | Query uses `firestoreLimit(maxSearchLimit)`. |
| PLATFORM-14.2-005 | Keep Firebase provider composite index. | Done | `firestore.indexes.json` | Search query fields are indexed. |
| PLATFORM-14.2-006 | Keep ranked result slicing. | Done | `src/services/firebase/search.firebase.ts`, search tests | Returned results slice to requested bounded limit. |
| PLATFORM-14.2-007 | Add entry-to-contact timing assertion. | Not started | `tests/e2e/app.spec.ts` | Demo user reaches WhatsApp reveal or message start in under 60 seconds. |
| PLATFORM-14.2-008 | Add search started timing event. | Not started | Search page, analytics service | Search start is recorded without blocking UI. |
| PLATFORM-14.2-009 | Add search results rendered timing event. | Not started | Search page, analytics service | Result render duration and result count are recorded. |
| PLATFORM-14.2-010 | Add provider profile rendered timing event. | Not started | Provider profile page, analytics service | Profile render timing is recorded. |
| PLATFORM-14.2-011 | Add contact completion timing events. | Not started | Provider profile page, analytics service | WhatsApp reveal and conversation start are recorded. |
| PLATFORM-14.2-012 | Add seeded dense search performance test. | Not started | `src/services/search.service.test.ts` | Search stays capped and deterministic with more than `maxSearchLimit` providers. |
| PLATFORM-14.2-013 | Add Firebase bounded-query regression. | Not started | Firebase adapter test or query helper test | Removing Firestore hard limit fails a test. |
| PLATFORM-14.2-014 | Document production timing thresholds. | Not started | Operations doc in implementation phase | Search/contact p75/p95 targets are documented. |

## 14.3 Stability Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PLATFORM-14.3-001 | Keep release gate script. | Done | `package.json` | `release:check` runs lint, tests, rules, build, and E2E. |
| PLATFORM-14.3-002 | Keep admin runbook. | Done | `docs/operations/admin-runbook.md` | Admin workflows and release check are documented. |
| PLATFORM-14.3-003 | Keep provider approval callable. | Done | `functions/src/providers.ts`, admin service | Approval is server-owned and audited. |
| PLATFORM-14.3-004 | Keep provider rejection callable. | Done | `functions/src/providers.ts`, admin service | Rejection is server-owned and audited. |
| PLATFORM-14.3-005 | Keep provider suspension callable. | Done | `functions/src/providers.ts`, admin service | Suspension is server-owned and audited. |
| PLATFORM-14.3-006 | Keep review hiding callable. | Done | Functions reviews module, admin service | Review hiding is server-owned. |
| PLATFORM-14.3-007 | Define expected peak profile. | Not started | Operations/planning doc | Peak usage model exists for Section 14 verification. |
| PLATFORM-14.3-008 | Move visibility approval to callable. | Done | `functions/src/visibility.ts`, admin service | Approval updates request/provider/audit transactionally server-side. |
| PLATFORM-14.3-009 | Move visibility rejection to callable. | Done | `functions/src/visibility.ts`, admin service | Rejection updates request/audit server-side. |
| PLATFORM-14.3-010 | Move report resolution to callable. | Not started | `functions/src/abuse.ts`, admin service | Report status and audit remain consistent. |
| PLATFORM-14.3-011 | Move account ban/unban to callable. | Not started | Functions user/abuse module, admin service | Ban metadata and audit are server-owned. |
| PLATFORM-14.3-012 | Move profession save to callable. | Not started | Functions professions module, admin service | Profession create/update validates server-side and audits. |
| PLATFORM-14.3-013 | Move profession activation toggle to callable. | Not started | Functions professions module, admin service | Active state changes validate server-side and audit. |
| PLATFORM-14.3-014 | Add visibility callable tests. | Not started | `functions/test/visibility.test.ts` | Success and failure paths pass. |
| PLATFORM-14.3-015 | Add report/account/profession callable tests. | Not started | Functions tests | Non-admin, missing target, invalid state, and success cases pass. |
| PLATFORM-14.3-016 | Add admin mutation failure UI tests. | Not started | Admin pages and E2E/component tests | Failures show clear errors and do not show false success. |
| PLATFORM-14.3-017 | Add peak-shaped seeded smoke. | Not started | Test/script TBD | Search/contact/admin core paths complete within agreed budget. |
| PLATFORM-14.3-018 | Keep Firestore rules defense in depth. | Partially done | `tests/rules/firestore.rules.test.ts` | Rules continue blocking non-admin and banned-user writes. |

## 14.4 Product Boundaries Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PLATFORM-14.4-001 | Keep directory/connection layer copy. | Done | App Store docs, runbook, provider copy | Copy avoids service-delivery guarantees. |
| PLATFORM-14.4-002 | Keep search cards as provider profile links. | Done | `src/features/search/pages/search-page.tsx` | Search opens chosen provider profile. |
| PLATFORM-14.4-003 | Keep contact actions explicit. | Done | `src/features/providers/pages/provider-profile-page.tsx` | WhatsApp/message only happen after user action. |
| PLATFORM-14.4-004 | Keep no booking/payment/job routes absent. | Done | Router/features/services/functions/API/rules | Static scan covers production source, functions, API, and rules for forbidden booking/payment/job terms. |
| PLATFORM-14.4-005 | Add product-boundary static scan test. | Done | `src/features/search/search-product-boundary.test.ts` | Broad forbidden surfaces fail CI with explicit allowlist. |
| PLATFORM-14.4-006 | Add forbidden term allowlist. | Done | Boundary test | Legitimate no-commission copy and abuse-report scheduling wording are allowlisted with reasons. |
| PLATFORM-14.4-007 | Add directory-first E2E test. | Done | `tests/e2e/app.spec.ts` | Search selection opens `/providers/provider-demo` by user click and exposes provider profile, not auto-assignment. |
| PLATFORM-14.4-008 | Add no pre-contact reveal assertion. | Done | `tests/e2e/app.spec.ts` | Provider profile smoke confirms WhatsApp number is hidden before explicit contact action. |
| PLATFORM-14.4-009 | Add no booking/payment/job CTA assertion. | Done | `tests/e2e/app.spec.ts` | Profile and admin visibility smoke assert forbidden booking/payment/job CTAs are absent. |
| PLATFORM-14.4-010 | Add paid visibility boundary tests. | Done | `tests/e2e/app.spec.ts`, existing ranking/visibility tests | Provider and admin visibility smoke confirms paid visibility request/review surfaces remain exposure-only with no booking, assignment, or service-payment CTA. |
| PLATFORM-14.4-011 | Add boundary copy regression checks. | Not started | Locale/boundary tests | No-guarantee and no-customer-payment language remains. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| PLATFORM-V-001 | `npm test -- src/lib/search-filters.test.ts src/services/search.service.test.ts src/lib/ranking.test.ts` | Done | Unit/service tests pass. |
| PLATFORM-V-002 | `npm test -- src/lib/product-boundaries.test.ts` | Done | `npm test -- src/features/search/search-product-boundary.test.ts` passes for app/function/API/rules boundary scan. |
| PLATFORM-V-003 | `npm --prefix functions test` | Done | Callable/helper tests pass. |
| PLATFORM-V-004 | `npm --prefix functions run build` | Done | Functions TypeScript build passes. |
| PLATFORM-V-005 | `npm run test:rules` | Done | Firestore/Storage rules pass under emulator. |
| PLATFORM-V-006 | `npm run e2e -- --project=mobile-chrome` | Done | Customer/provider mobile responsive checks pass. |
| PLATFORM-V-007 | `npm run e2e -- --project=tablet-chrome` | Not started | Admin tablet checks pass after tablet project exists. |
| PLATFORM-V-008 | `npm run e2e -- --project=chromium` | Done | Desktop admin/customer/provider checks pass. |
| PLATFORM-V-009 | `npm run build` | Done | Production build passes. |
| PLATFORM-V-010 | `npm run lint` | Done | Lint passes. |
| PLATFORM-V-011 | `npm run release:check` | Not started | Full release gate passes. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| PLATFORM-DOD-001 | Customer search/contact is verified on phone viewport. | Done |
| PLATFORM-DOD-002 | Provider dashboard and paid visibility are verified on phone viewport. | Done |
| PLATFORM-DOD-003 | Admin core pages are verified on desktop and tablet viewports. | Not started |
| PLATFORM-DOD-004 | Covered pages have no page-level horizontal overflow. | Done |
| PLATFORM-DOD-005 | Entry-to-contact E2E timing is under 60 seconds. | Not started |
| PLATFORM-DOD-006 | Search request limits are bounded in filters/service/Firebase/results. | Done |
| PLATFORM-DOD-007 | Seeded dense search performance test exists. | Not started |
| PLATFORM-DOD-008 | Search/contact timing instrumentation exists and is non-blocking. | Not started |
| PLATFORM-DOD-009 | Expected peak profile is documented. | Not started |
| PLATFORM-DOD-010 | Provider approval/rejection/suspension are server-owned and audited. | Done |
| PLATFORM-DOD-011 | Visibility approval/rejection are server-owned and audited. | Done |
| PLATFORM-DOD-012 | Report resolution is server-owned and audited. | Not started |
| PLATFORM-DOD-013 | Account ban/unban is server-owned and audited. | Not started |
| PLATFORM-DOD-014 | Profession management is server-owned and audited. | Not started |
| PLATFORM-DOD-015 | Critical mutation failures show clear user-facing errors. | Not started |
| PLATFORM-DOD-016 | Product-boundary static scan exists. | Done |
| PLATFORM-DOD-017 | Directory-first user-choice E2E boundary test exists. | Done |
| PLATFORM-DOD-018 | Paid visibility cannot drift into service payment/job guarantee behavior. | Done |
| PLATFORM-DOD-019 | Full release gate was not run; equivalent targeted checks except full desktop e2e and release wrapper passed. | Partially done |
| PLATFORM-DOD-020 | Implementation map is updated only after verified completion. | Done |

## Risk Tracker

| ID | Risk | Status | Mitigation |
|---|---|---|---|
| PLATFORM-RISK-001 | E2E timing assertions become flaky in CI. | Open | Use 60-second product threshold and keep smaller timing budgets in unit/instrumentation tests. |
| PLATFORM-RISK-002 | Admin callable migration introduces authorization regressions. | Open | Add callable tests before client rewiring and keep rules tests. |
| PLATFORM-RISK-003 | Static boundary scan blocks legitimate visibility monetization terms. | Open | Use narrow scan targets and explicit allowlist. |
| PLATFORM-RISK-004 | Admin tablet tests expose layout issues across multiple pages. | Open | Fix owning pages incrementally and keep tests route-scoped. |
| PLATFORM-RISK-005 | Analytics timing events accidentally block contact. | Open | Fire and forget; test analytics failure does not block UI. |

## Open Questions

1. Should admin phone support be considered required, or is tablet/desktop enough for v1?
2. What launch peak profile should engineering test against before production analytics exist?
3. Are any direct admin Firestore writes acceptable for launch if rules and audit writes remain in place?
4. Which production analytics or monitoring destination should receive timing events?
5. Should product-boundary tests scan localized UI strings immediately or start with routes/services/features first?
