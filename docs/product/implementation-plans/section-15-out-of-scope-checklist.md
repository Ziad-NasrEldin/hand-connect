# Section 15 Out-of-Scope Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-15-out-of-scope.md`

Scope: keep SRS section 15 fully implemented by preventing booking, scheduling, service payments, escrow, guarantees, job assignment, job tracking, provider certifications, multi-city support, and new native mobile app scope from entering Herafy v1.

Status legend:
- `Not started`: no implementation work done yet.
- `In progress`: docs/tests/scripts started but not fully verified.
- `Blocked`: requires product decision or external approval.
- `Done`: implemented and verified.
- `Implemented, unguarded`: current behavior satisfies the SRS, but no automated regression guard exists.

## Tracker Summary

| Area | Status | Owner | Notes |
| Product decisions | Not started | Product/Engineering | Confirm Section 15 remains a product boundary and not a backlog. |
| Booking/scheduling boundary | Implemented, unguarded | Engineering | No booking/schedule surface found; needs scan/E2E guard. |
| Service payment boundary | Implemented, unguarded | Engineering/Product | Visibility payment exists and must stay exposure-only. |
| Escrow boundary | Implemented, unguarded | Engineering | No escrow/custody surface found; needs scan guard. |
| Guarantee boundary | Implemented, unguarded | Product/Engineering | No-guarantee copy exists; needs copy regression guard. |
| Job assignment boundary | Implemented, unguarded | Engineering | Search/profile are customer-selected; needs E2E guard. |
| Job tracking boundary | Implemented, unguarded | Engineering | Messaging exists, but no job/order status exists. |
| Provider certification boundary | Implemented, unguarded | Product/Engineering | Identity verification exists and must not become certification. |
| Multi-city boundary | Implemented, unguarded | Engineering/Product | Service areas are Cairo-only; needs invariant test. |
| Native app boundary | Done | Engineering/Product | iOS wrapper exists and product docs state wrapper-only scope. |
| Verification | Not started | Engineering | Add product-boundary tests and run targeted commands. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
| OOS-PD-001 | Confirm Section 15 is a hard v1 boundary unless the SRS changes. | Not started | Future forbidden-feature requests must update SRS/product scope first. |
| OOS-PD-002 | Confirm manual visibility payments remain allowed only for provider exposure. | Not started | Visibility payment must not become service checkout, escrow, commission, or payout. |
| OOS-PD-003 | Confirm identity verification is not provider certification. | Not started | Public copy must not imply certified skill quality or guaranteed outcome. |
| OOS-PD-004 | Confirm Cairo-only v1 remains approved scope. | Not started | Multi-city requires explicit approval and migration plan. |
| OOS-PD-005 | Confirm Capacitor iOS remains wrapper support only. | Not started | Existing wrapper may remain; no native-only product scope. |
| OOS-PD-006 | Decide whether product-boundary scan enters `release:check`. | Not started | Recommended: stabilize manually first, then add to release gate. |

## 15.1 Booking and Scheduling Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.1-001 | Confirm router has no booking/schedule routes. | Done | `src/router/app-router.tsx`, `src/config/routes.ts` | No route for booking, scheduling, appointments, slots, reservations, or calendar. |
| OOS-15.1-002 | Confirm service contracts have no booking/schedule API. | Done | `src/services/contracts/*` | No create/list/update booking or appointment methods. |
| OOS-15.1-003 | Add booking/scheduling terms to product-boundary scan. | Partially done | `src/features/search/search-product-boundary.test.ts` | Introducing forbidden search/profile booking or scheduling terms fails. |
| OOS-15.1-004 | Add E2E assertion that provider profile has no booking action. | Done | `tests/e2e/app.spec.ts` | Provider profile exposes WhatsApp/message contact actions and no forbidden booking CTA. |
| OOS-15.1-005 | Add E2E assertion that search does not schedule automatically. | Done | `tests/e2e/app.spec.ts` | Search result click opens the selected profile and no scheduling/assignment CTA appears. |

## 15.2 Service Payment Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.2-001 | Confirm no customer checkout route exists. | Done | Router, routes, feature pages | No checkout, invoice, card, pay, or service payment page. |
| OOS-15.2-002 | Confirm no customer-provider service payment integration exists. | Done | `package.json`, `api`, `functions`, services | Paymob is allowed only for provider visibility billing; there is no customer checkout, payout, commission, escrow, or service-payment integration. |
| OOS-15.2-003 | Document visibility payment as exposure-only. | Done | Product docs/locales | Provider visibility copy distinguishes paid exposure from customer-provider service payment. |
| OOS-15.2-004 | Add payment processor and checkout terms to boundary scan. | Done | `src/features/search/search-product-boundary.test.ts` | Checkout and customer-payment terms fail across app/function/API/rules scan. |
| OOS-15.2-005 | Add E2E assertion that provider profile has no payment action. | Done | `tests/e2e/app.spec.ts` | Provider profile smoke asserts no payment/checkout/invoice action is visible. |
| OOS-15.2-006 | Preserve admin visibility request tests. | Implemented, unguarded | `src/services/admin.service.test.ts`, `src/services/visibility.service.test.ts` | Existing visibility flow remains allowed and tested. |

## 15.3 Escrow Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.3-001 | Confirm no escrow/custody route exists. | Done | Router, routes, feature pages | No escrow, wallet, ledger, hold, release, settlement, or payout page. |
| OOS-15.3-002 | Confirm rules have no escrow/custody collections. | Done | `firestore.rules` | No escrow, wallet, ledger, transaction, settlement, payout, or dispute-payment collections. |
| OOS-15.3-003 | Add escrow/custody terms to boundary scan. | Not started | Boundary scan/test | Adding custody/payment-hold concepts fails. |
| OOS-15.3-004 | Add checklist gate for financial custody changes. | Not started | This tracker or release process | Any escrow proposal is blocked until SRS scope changes. |

## 15.4 Guarantee Boundary Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.4-001 | Confirm no-guarantee copy exists on provider profile. | Done | `provider-profile-page.tsx`, locale files | Provider profile renders no-guarantee text. |
| OOS-15.4-002 | Confirm visibility copy does not guarantee jobs/customers. | Done | `visibility-page.tsx`, locale files | Paid visibility is framed as exposure/tools only. |
| OOS-15.4-003 | Add locale regression test for no-guarantee keys. | Not started | `src/i18n/i18n.test.ts` | English and Arabic no-guarantee keys exist. |
| OOS-15.4-004 | Add E2E assertion for provider no-guarantee copy. | Done | `tests/e2e/app.spec.ts` | Provider profile smoke verifies no-guarantee copy is visible. |
| OOS-15.4-005 | Add positive-guarantee terms to boundary scan. | Not started | Boundary scan/test | Positive guarantee claims fail; "does not guarantee" passes. |

## 15.5 Job Assignment Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.5-001 | Confirm search cards link to provider profiles. | Done | `search-page.tsx` | Search does not assign or dispatch. |
| OOS-15.5-002 | Confirm contact creation requires explicit user action. | Done | `provider-profile-page.tsx`, `functions/src/engagement.ts` | Contact/conversation starts after WhatsApp reveal or message action only. |
| OOS-15.5-003 | Add E2E assertion for directory-first browsing. | Done | `tests/e2e/app.spec.ts` | Search result opens `/providers/provider-demo` by user choice and no assignment CTA appears. |
| OOS-15.5-004 | Add job assignment terms to boundary scan. | Done | `src/features/search/search-product-boundary.test.ts` | Assignment and dispatch terms fail across app/function/API/rules scan. |
| OOS-15.5-005 | Add regression assertion that search does not write contact/conversation. | Not started | E2E or service test | Search/profile view alone creates no contact. |

## 15.6 Job Tracking Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.6-001 | Confirm messaging types are not job/order types. | Done | `src/types/messaging.ts` | Conversation/message types have no job lifecycle status. |
| OOS-15.6-002 | Confirm no job/order routes or services exist. | Done | Router, service contracts, functions, API | No jobs, orders, work orders, job status, completion, cancellation, or tracking service. |
| OOS-15.6-003 | Add job/order status terms to boundary scan. | Done | Boundary scan/test | Job tracking and related lifecycle terms fail. |
| OOS-15.6-004 | Add rules collection scan for jobs/orders/bookings/payments. | Done | Boundary scan/test | Rules file is included in forbidden collection scan. |
| OOS-15.6-005 | Preserve message read status allowlist. | Not started | Boundary scan allowlist | Messaging `read` state is allowed and not confused with job status. |

## 15.7 Provider Certification Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.7-001 | Confirm provider model has identity verification, not certification. | Done | `src/types/provider.ts` | `nationalIdVerified` exists; no certification credential fields exist. |
| OOS-15.7-002 | Confirm provider join/admin review collects identity docs only. | Done | Registration, admin applications, storage rules | Identity doc flow is onboarding/trust-safety, not certification. |
| OOS-15.7-003 | Document identity verification language. | Not started | Product docs/locales | Approval and identity review are not skill certification. |
| OOS-15.7-004 | Add certification terms to boundary scan. | Not started | Boundary scan/test | Certified, certification, credential, skill-verified, quality badge fail unless allowlisted. |
| OOS-15.7-005 | Add E2E assertion that provider profile has no certification badge. | Not started | E2E | Public profile has no certified provider badge. |

## 15.8 Multi-City Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.8-001 | Confirm service area city type is Cairo-only. | Done | `src/types/provider.ts` | `ServiceArea.city` is typed as `'cairo'`. |
| OOS-15.8-002 | Confirm configured neighborhoods are Cairo v1 areas. | Done | `src/config/neighborhoods.ts` | Neighborhood list contains Cairo neighborhoods only. |
| OOS-15.8-003 | Confirm registration/admin visibility writes Cairo service areas. | Done | Auth service, admin service, visibility flow | Created or expanded service areas use `city: 'cairo'`. |
| OOS-15.8-004 | Add Cairo-only invariant test. | Not started | Unit or boundary test | Seed/provider fixtures and area writes stay Cairo-only. |
| OOS-15.8-005 | Add city selector absence assertion. | Not started | E2E | Search/register do not expose multi-city selector. |
| OOS-15.8-006 | Add multi-city terms to boundary scan. | Not started | Boundary scan/test | New city switchers or non-Cairo service areas fail unless approved. |

## 15.9 Native Mobile App Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-15.9-001 | Confirm Capacitor iOS wrapper exists. | Done | `capacitor.config.ts`, `ios/` | Wrapper uses `webDir: 'dist'`. |
| OOS-15.9-002 | Confirm no Android app wrapper exists. | Done | Repo tree | No `android/` product directory found. |
| OOS-15.9-003 | Document iOS wrapper scope. | Done | Product docs/implementation map | Existing iOS wrapper is explicitly not a new native app, native marketplace, native payments, native booking, native dispatch, or native job-management scope. |
| OOS-15.9-004 | Add native app boundary scan. | Done | `src/features/search/search-product-boundary.test.ts` | Existing iOS wrapper passes; new native-app product scope fails unless approved. |
| OOS-15.9-005 | Keep native wrapper commands out of normal Section 15 DoD. | Not started | Checklist/release guidance | `npm run build` is normal app verification; `cap:sync:ios` is wrapper packaging verification only. |

## Cross-Cutting Product-Boundary Guardrail Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| OOS-X-001 | Create product-boundary scan implementation. | Done | `src/features/search/search-product-boundary.test.ts` | Scan inspects production app source, functions, API, and rules. |
| OOS-X-002 | Define forbidden term groups. | Done | Boundary scan/test | Booking, scheduling, payment, commission, per-lead, assignment, dispatch, tracking, certification, multi-city, escrow/custody, and native-app groups exist. |
| OOS-X-003 | Define allowlist. | Done | Boundary scan/test | Legitimate no-commission and abuse-report scheduling mentions are explicit. |
| OOS-X-004 | Add product-boundary unit test. | Done | `src/features/search/search-product-boundary.test.ts` | Test fails on introduced forbidden production-surface terms. |
| OOS-X-005 | Add product-boundary E2E test. | Done | `tests/e2e/app.spec.ts` | Browser confirms visible search/profile/contact and paid visibility flows remain in-scope. |
| OOS-X-006 | Add optional npm script. | Not started | `package.json` | `npm run product-boundaries:check` or targeted Vitest command exists. |
| OOS-X-007 | Decide release gate integration. | Blocked | Product/Engineering decision | Add to `release:check` after false positives are stable. |
| OOS-X-008 | Update implementation map after guardrails land. | Not started | `docs/product/herafy-srs-implementation-map.md` | Row 15 can mention automated OOS guardrails. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
| OOS-V-001 | `npm test -- tests/product-boundaries.test.ts` | Done | `npm test -- src/features/search/search-product-boundary.test.ts` passes. |
| OOS-V-002 | `npm run e2e -- --project=chromium` and `npm run e2e -- --project=mobile-chrome` | Done | Boundary browser smoke passes in the shared app E2E suite. |
| OOS-V-003 | `npm run test:rules` | Done | Firestore/storage rules remain green. |
| OOS-V-004 | `npm run lint` | Done | Lint passes. |
| OOS-V-005 | `npm run build` | Done | TypeScript and Vite build pass. |
| OOS-V-006 | `npm run release:check` | Not started | Full release check passes when practical. |
| OOS-V-007 | Manual `rg` forbidden-surface audit | Done for planning | Current hits are docs, no-guarantee copy, visibility payment, Cairo-only data, identity verification, package noise, or wrapper support. |

## Definition of Done Tracker

| ID | Item | Status |
| OOS-DOD-001 | No booking or scheduling route, service, API, rules collection, or UI action exists. | Done |
| OOS-DOD-002 | No service checkout, customer payment, provider payout, commission, or payment processor integration exists. | Done |
| OOS-DOD-003 | Visibility payment is documented as exposure-only. | Done |
| OOS-DOD-004 | No escrow, wallet, ledger, hold, settlement, release, or payout custody flow exists. | Done |
| OOS-DOD-005 | No-guarantee copy remains visible in public/provider/visibility flows. | Done |
| OOS-DOD-006 | Search and provider contact remain user-selected and directory-first. | Done |
| OOS-DOD-007 | No job assignment, dispatch, claim, or matching workflow exists. | Done |
| OOS-DOD-008 | No job/order lifecycle tracking model exists. | Done |
| OOS-DOD-009 | Identity verification is not displayed as skill certification. | Done |
| OOS-DOD-010 | Cairo-only service-area invariant is protected. | Not started |
| OOS-DOD-011 | Existing iOS wrapper scope is documented as wrapper support only. | Not started |
| OOS-DOD-012 | Product-boundary scan exists and passes. | Done |
| OOS-DOD-013 | Product-boundary E2E smoke exists and passes. | Not started |
| OOS-DOD-014 | Targeted tests, rules tests, mobile e2e, lint, and build pass after implementation. | Done |
| OOS-DOD-015 | Implementation map row 15 is updated after guardrails are implemented. | Not started |

## Risks

| Risk | Status | Mitigation |
| Visibility payment wording is mistaken for service payment | Open | Clarify copy and scan for generic checkout/payment language. |
| Provider approval is mistaken for certification | Open | Document identity-review language and block certification terms. |
| Multi-city support leaks through future location work | Open | Add Cairo-only invariant tests before geolocation/radius work expands. |
| Static scan blocks harmless references | Open | Keep allowlist explicit and start outside `release:check` until stable. |
| Native wrapper scope is misunderstood | Open | Document Capacitor iOS as wrapper support only. |

## Open Questions

1. Should product-boundary scanning be a Vitest test, a standalone script, or both?
2. Should scan false positives be tuned manually before adding it to `release:check`?
3. Should Section 13 own visibility-payment wording, with Section 15 only asserting the service-payment boundary?
4. Should multi-city scope changes require a formal SRS amendment before code work starts?
5. Should native wrapper scope be documented in the SRS itself or in an implementation note?
