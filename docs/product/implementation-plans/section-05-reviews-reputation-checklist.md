# Section 5 Reviews & Reputation Implementation Checklist Tracker
Parent plan: `docs/product/implementation-plans/section-05-reviews-reputation.md`
Scope: complete SRS section 5 so Reviews & Reputation is fully implemented across review eligibility, public display, moderation, provider reply restrictions, reputation aggregation, ranking inputs, and tests.
Status legend:
- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but gaps or tests remain.

## Tracker Summary
| Area | Status | Owner | Notes |
| Product decisions | Not started | Product/Engineering | Confirm review eligibility unit, moderation status semantics, replies out of scope, reputation cap, and abuse controls. |
| Review eligibility | Partially done | Engineering | Callable and UI gating exist; customer-role enforcement, rate limit, error UI, and callable integration tests need completion. |
| Review display | Partially done | Engineering | Visible review query/rules and admin hide exist; empty/error UI and visible-only rules tests need completion. |
| Provider reply restriction | Partially done | Engineering | Reply UI/API absent; explicit regression/rules protection missing. |
| Reputation impact | Partially done | Engineering | Aggregates and ranking inputs exist; integration tests for create/hide/ranking effects missing. |
| Abuse and moderation | Partially done | Engineering | Report and hide flow exists; fake/coordinated review signal handling is baseline only. |
| Verification | Not started | Engineering | Run unit, functions, rules, e2e, lint, build, and release checks. |

## Product Decision Checklist
| ID | Item | Status | Acceptance / Notes |
| REVIEW-PD-001 | Decide v1 review eligibility unit. | Not started | Recommended: one review per customer-provider relationship after at least one contact event. |
| REVIEW-PD-002 | Confirm whether multiple contact events unlock multiple reviews. | Not started | Recommended: no for v1. |
| REVIEW-PD-003 | Confirm review moderation status semantics. | Not started | Recommended: reports do not auto-hide; admin hide sets `removed`; `under_review` remains admin-only/future queue status unless explicitly used. |
| REVIEW-PD-004 | Confirm provider public replies are out of scope. | Not started | Required by SRS v1; any future reply feature needs a new product decision. |
| REVIEW-PD-005 | Confirm review influence cap. | Not started | Recommended: keep current capped formula or move weights to ranking config later. |
| REVIEW-PD-006 | Decide whether explicit review analytics events are required. | Partially done | Backend now writes sanitized review create/moderation analytics events; product reporting scope remains open. |
| REVIEW-PD-007 | Decide review submission daily cap. | Not started | Recommended: add server-side cap for cross-provider review bursts. |
| REVIEW-PD-008 | Decide fake/coordinated review enforcement level for v1. | Not started | Recommended: baseline prevention plus admin signals, not automatic removal. |

## 5.1 Review Eligibility Tracker
| ID | Task | Status | Files / Areas | Acceptance Criteria |
| REVIEW-5.1-001 | Keep review route customer-facing only. | Done | `src/features/providers/pages/provider-profile-page.tsx`, router | Add-review CTA appears only to customer users. |
| REVIEW-5.1-002 | Keep contact eligibility check. | Done | `src/features/reviews/pages/new-review-page.tsx`, `src/hooks/use-contact-check.ts`, `src/services/firebase/reviews.firebase.ts` | Customer without unused contact sees not-eligible state. |
| REVIEW-5.1-003 | Keep callable-owned review creation. | Done | `src/services/firebase/reviews.firebase.ts`, `functions/src/reviews.ts` | Firebase client calls `createReview`; direct Firestore create is not used. |
| REVIEW-5.1-004 | Keep direct review create denied. | Done | `firestore.rules`, `tests/rules/firestore.rules.test.ts` | Client review create fails under rules test. |
| REVIEW-5.1-005 | Keep duplicate customer-provider rejection. | Done | `functions/src/reviews.ts`, `src/services/reviews.service.test.ts` | Existing review for customer/provider blocks another review. |
| REVIEW-5.1-006 | Add callable test for unauthenticated create. | Not started | `functions/test/reviews.test.ts` | Callable throws `unauthenticated`. |
| REVIEW-5.1-007 | Add callable test for banned customer create. | Not started | `functions/test/reviews.test.ts` | Callable throws `permission-denied`. |
| REVIEW-5.1-008 | Add callable test for no-contact create. | Not started | `functions/test/reviews.test.ts` | Callable throws `failed-precondition`. |
| REVIEW-5.1-009 | Add callable test for already-reviewed contact. | Not started | `functions/test/reviews.test.ts` | Callable throws `failed-precondition`. |
| REVIEW-5.1-010 | Add callable test for duplicate existing review. | Not started | `functions/test/reviews.test.ts` | Second customer-provider review is rejected. |
| REVIEW-5.1-011 | Add callable test for pending/suspended/missing provider. | Not started | `functions/test/reviews.test.ts` | Callable rejects non-approved provider. |
| REVIEW-5.1-012 | Add callable success transaction test. | Not started | `functions/test/reviews.test.ts` | Review is created, contact `hasReview` is true, aggregate updates. |
| REVIEW-5.1-013 | Require customer role server-side. | Done | `functions/src/reviews.ts` | Provider/admin users cannot create reviews, even with malformed data. |
| REVIEW-5.1-014 | Add review submission daily rate limit. | Done | `functions/src/reviews.ts`, `src/lib/rate-limits.ts`, `src/services/demo/reviews.demo.ts`, `functions/test/reviews.test.ts`, `src/services/reviews.service.test.ts` | Customer cannot review more providers than the configured daily cap; verified by `npm --prefix functions test` and targeted app service tests. |
| REVIEW-5.1-015 | Add localized rate-limit error handling. | Done | `new-review-page.tsx`, i18n, `new-review-page.test.tsx` | Rate-limit failure shows localized copy and preserves review text. |
| REVIEW-5.1-016 | Add required comment validation. | Not started | `src/features/reviews/pages/new-review-page.tsx` | Empty comment cannot submit. |
| REVIEW-5.1-017 | Add comment max-length validation. | Not started | Review page, callable parity | Overlong comment is blocked before submit and rejected server-side. |
| REVIEW-5.1-018 | Disable review submit while saving. | Not started | Review page | Double-submit cannot create duplicate pending calls. |
| REVIEW-5.1-019 | Add review create failure UI. | Partially done | Review page, i18n | Review create failures show an alert; targeted coverage exists for rate-limit failures, but duplicate/not eligible/provider unavailable variants still need explicit tests. |
| REVIEW-5.1-020 | Add e2e contact-to-review happy path. | Not started | `tests/e2e/app.spec.ts` | Customer contacts provider, submits review, returns to provider profile. |

## 5.2 Review Display Tracker
| ID | Task | Status | Files / Areas | Acceptance Criteria |
| REVIEW-5.2-001 | Keep visible-only provider reviews query. | Done | `src/services/firebase/reviews.firebase.ts`, `src/services/demo/reviews.demo.ts` | Review lists filter `status == visible`. |
| REVIEW-5.2-002 | Keep public visible-only rules. | Done | `firestore.rules` | Public read allowed for visible reviews and admin read allowed for all. |
| REVIEW-5.2-003 | Keep provider profile review list. | Done | `src/features/providers/pages/provider-profile-page.tsx` | Visible reviews render rating, customer name, and comment. |
| REVIEW-5.2-004 | Keep provider dashboard latest reviews. | Done | `src/features/dashboard/pages/provider-dashboard-page.tsx`, `src/services/analytics.service.ts` | Dashboard shows latest visible reviews from metrics. |
| REVIEW-5.2-005 | Keep admin hide review callable. | Done | `src/services/firebase/admin.firebase.ts`, `functions/src/reviews.ts` | Admin hide calls `hideReview` callable. |
| REVIEW-5.2-006 | Add provider profile empty review state. | Done | Provider profile, i18n, `provider-profile-page.test.tsx` | Zero visible reviews shows intentional empty copy. |
| REVIEW-5.2-007 | Add provider profile review loading state. | Done | `provider-profile-page.tsx`, `provider-profile-page.test.tsx` | Loading state is visible with localized status copy. |
| REVIEW-5.2-008 | Add provider profile review error state. | Done | Provider profile, i18n, `provider-profile-page.test.tsx` | Review query failure shows localized retryable feedback. |
| REVIEW-5.2-009 | Add component/e2e test for visible reviews. | Done | `provider-profile-page.test.tsx` | Visible review appears on provider profile. |
| REVIEW-5.2-010 | Add component/e2e test for no reviews. | Done | `provider-profile-page.test.tsx` | Empty state appears instead of blank card. |
| REVIEW-5.2-011 | Add component/e2e test for hidden reviews. | Done | `reviews.service.test.ts`, `provider-profile-page.test.tsx` | Removed reviews are filtered before profile render and profile empty state is covered. |
| REVIEW-5.2-012 | Add rules test: anonymous reads visible review. | Not started | `tests/rules/firestore.rules.test.ts` | Anonymous/public read of visible review succeeds. |
| REVIEW-5.2-013 | Add rules test: public cannot read removed review. | Not started | Rules tests | Anonymous/customer read of removed review fails. |
| REVIEW-5.2-014 | Add rules test: public cannot read under_review review. | Not started | Rules tests | Anonymous/customer read of under_review review fails. |
| REVIEW-5.2-015 | Add rules test: admin can read removed/under_review review. | Not started | Rules tests | Admin moderation read succeeds. |
| REVIEW-5.2-016 | Add hideReview callable integration test. | Not started | `functions/test/reviews.test.ts` | Hiding review sets status removed, closes linked report, writes audit, recalculates aggregate. |
| REVIEW-5.2-017 | Add report review success/failure UI. | Done | `provider-profile-page.tsx`, `provider-profile-page.test.tsx` | Customer sees result after reporting a review, including localized rate-limit failure. |
| REVIEW-5.2-018 | Add admin hide button pending/error state. | Not started | `src/features/admin/pages/reports-page.tsx` | Admin cannot double-submit hide and sees failure feedback. |

## 5.3 Provider Reply Restriction Tracker
| ID | Task | Status | Files / Areas | Acceptance Criteria |
| REVIEW-5.3-001 | Keep review type without reply fields. | Done | `src/types/review.ts` | Review model has no `reply`, `providerReply`, or `reviewReply` field. |
| REVIEW-5.3-002 | Keep review service without reply API. | Done | `src/services/contracts/reviews.contract.ts`, `src/services/reviews.service.ts` | No public reply method exists. |
| REVIEW-5.3-003 | Keep provider profile without reply controls. | Done | `src/features/providers/pages/provider-profile-page.tsx` | Public review cards have no provider reply affordance. |
| REVIEW-5.3-004 | Keep provider dashboard without reply controls. | Done | `src/features/dashboard/pages/provider-dashboard-page.tsx` | Latest reviews panel has no reply composer/action. |
| REVIEW-5.3-005 | Add explicit no-replies product note. | Done | Section 5 plan | Plan documents provider replies as out of scope for v1. |
| REVIEW-5.3-006 | Add static regression test for reply APIs/fields. | Done | `src/features/search/search-product-boundary.test.ts` | Forbidden reply method/field/control names fail the test. |
| REVIEW-5.3-007 | Add provider dashboard e2e no-reply check. | Not started | `tests/e2e/app.spec.ts` | Provider sees latest reviews but no reply textarea/button/link. |
| REVIEW-5.3-008 | Add provider profile no-reply check. | Done | `src/features/search/search-product-boundary.test.ts` | Provider/public review card has no reply UI/API marker. |
| REVIEW-5.3-009 | Tighten review update rules to moderation fields only if practical. | Not started | `firestore.rules` | Client admin updates cannot add public reply fields. |
| REVIEW-5.3-010 | Add rules test blocking provider review update. | Not started | Rules tests | Provider cannot update review to add reply or any field. |
| REVIEW-5.3-011 | Add rules test blocking customer review update. | Not started | Rules tests | Customer cannot edit review content/reply through direct Firestore update. |

## 5.4 Reputation Impact Tracker
| ID | Task | Status | Files / Areas | Acceptance Criteria |
| REVIEW-5.4-001 | Keep aggregate fields on provider. | Done | `src/types/provider.ts`, seed/demo/Firebase converters | Provider has `avgRating` and `reviewCount`. |
| REVIEW-5.4-002 | Keep review create aggregate recalculation. | Done | `functions/src/reviews.ts`, `src/services/demo/reviews.demo.ts` | Creating visible review updates provider `avgRating` and `reviewCount`. |
| REVIEW-5.4-003 | Keep hide aggregate recalculation. | Done | `functions/src/reviews.ts`, `src/services/demo/admin.demo.ts` | Removing review excludes it from aggregate. |
| REVIEW-5.4-004 | Keep ranking reputation formula. | Done | `src/lib/ranking.ts` | Ranking includes capped rating and review count. |
| REVIEW-5.4-005 | Keep search card rating display. | Done | `src/features/search/pages/search-page.tsx` | Search cards show provider rating. |
| REVIEW-5.4-006 | Keep dashboard rating/latest reviews. | Done | Provider dashboard, analytics service | Provider sees rating and latest visible reviews. |
| REVIEW-5.4-007 | Add aggregate create integration test. | Not started | Functions/Firebase test | First visible review sets expected avg/count. |
| REVIEW-5.4-008 | Add aggregate multi-review integration test. | Not started | Functions/Firebase test | Multiple visible reviews calculate one-decimal average. |
| REVIEW-5.4-009 | Add aggregate hide integration test. | Not started | Functions/Firebase test | Removed review is excluded after hide. |
| REVIEW-5.4-010 | Add ranking test for avg rating signal. | Not started | `src/lib/ranking.test.ts` | Higher avg rating wins when all other inputs are equal. |
| REVIEW-5.4-011 | Add ranking test for review count signal. | Not started | `src/lib/ranking.test.ts` | Higher count helps until cap. |
| REVIEW-5.4-012 | Add ranking test for review count cap. | Not started | `src/lib/ranking.test.ts` | Count above cap does not increase score further. |
| REVIEW-5.4-013 | Add ranking test proving no guaranteed top placement. | Not started | `src/lib/ranking.test.ts` | High reputation can still lose when other allowed signals dominate in controlled fixture. |
| REVIEW-5.4-014 | Add search integration test for reputation ordering. | Not started | Search service/Firebase adapter tests | Reputation affects ordered results when other inputs equal. |
| REVIEW-5.4-015 | Add visibility threshold test for review count. | Partially done | `src/services/visibility.service.test.ts`, rules tests | Existing area expansion threshold exists; add hidden-review aggregate interaction if product wants live count strictness. |
| REVIEW-5.4-016 | Decide and add explicit review analytics event rows if needed. | Blocked | Functions/data model | Review create/hide can be counted without relying only on mutable review docs. |

## Abuse, Reports, And Moderation Tracker
| ID | Task | Status | Files / Areas | Acceptance Criteria |
| REVIEW-SAFE-001 | Keep review report flow. | Done | Provider profile, `src/services/firebase/reviews.firebase.ts`, `functions/src/engagement.ts` | Authenticated user can report a visible review. |
| REVIEW-SAFE-002 | Keep report rate limit. | Done | `functions/src/engagement.ts`, `src/services/reviews.service.test.ts` | Report spam is capped. |
| REVIEW-SAFE-003 | Keep admin reports page review hide action. | Done | `src/features/admin/pages/reports-page.tsx` | Review report exposes hide action for open reports. |
| REVIEW-SAFE-004 | Add fake review signal documentation. | Not started | Product/security note or plan follow-up | Baseline controls and future signals are documented. |
| REVIEW-SAFE-005 | Add coordinated review abuse tests around duplicates. | Not started | Functions tests | Same customer/provider duplicate blocked; direct writes blocked. |
| REVIEW-SAFE-006 | Add linked-account/device abuse backlog if product needs it. | Blocked | Product/security | Out of Section 5 code unless product accepts extra identity/device model. |
| REVIEW-SAFE-007 | Add admin report filter for review reports if queue grows. | Not started | Admin reports UI | Admin can focus on review reports without scanning all report types. |

## Verification Tracker
| ID | Command / Check | Status | Expected Result |
| REVIEW-V-001 | `npm test -- src/services/reviews.service.test.ts` | Done | Demo review eligibility/report and visible-only tests pass. |
| REVIEW-V-002 | `npm test -- src/services/admin.service.test.ts` | Not started | Admin hide/audit demo tests pass. |
| REVIEW-V-003 | `npm test -- src/lib/ranking.test.ts` | Not started | Reputation/ranking guardrail tests pass. |
| REVIEW-V-004 | `npm test -- src/services/search.service.test.ts` | Not started | Search ordering/limit tests pass. |
| REVIEW-V-005 | `npm test -- src/services/visibility.service.test.ts` | Not started | Area expansion review threshold tests pass. |
| REVIEW-V-006 | `npm --prefix functions test` | Done | Passed. |
| REVIEW-V-007 | `npm run test:rules` | Done | Passed. |
| REVIEW-V-008 | Review form component tests if added | Not started | Validation, error, submit loading states pass. |
| REVIEW-V-009 | Provider profile component/e2e tests if added | Done | Visible/empty/hidden review states pass through component and service tests. |
| REVIEW-V-010 | Provider no-reply static/e2e test if added | Done | Reply controls/API are absent under static regression test. |
| REVIEW-V-011 | `npm run lint` | Done | Passed. |
| REVIEW-V-012 | `npm run build` | Done | Passed. |
| REVIEW-V-013 | `npm run e2e` | Not started | Relevant customer review/admin hide smoke passes. |
| REVIEW-V-014 | `npm run release:check` | Not started | Full release gate passes. |

## Definition Of Done Tracker
| ID | Item | Status |
| REVIEW-DOD-001 | Review eligibility is explicitly defined as one review per customer-provider relationship after contact. | Not started |
| REVIEW-DOD-002 | UI blocks or explains review ineligibility before submit. | Partially done |
| REVIEW-DOD-003 | Callable rejects unauthenticated users. | Partially done |
| REVIEW-DOD-004 | Callable rejects banned users. | Partially done |
| REVIEW-DOD-005 | Callable rejects non-customer roles. | Done |
| REVIEW-DOD-006 | Callable rejects no-contact users. | Done |
| REVIEW-DOD-007 | Callable rejects duplicate reviews. | Done |
| REVIEW-DOD-008 | Callable rejects non-approved providers. | Done |
| REVIEW-DOD-009 | Review submission is rate-limited. | Not started |
| REVIEW-DOD-010 | Review form validates required comment and length. | Not started |
| REVIEW-DOD-011 | Review form displays localized failure states. | Not started |
| REVIEW-DOD-012 | Direct Firestore review creation is denied. | Done |
| REVIEW-DOD-013 | Direct contact `hasReview` tampering is denied. | Done |
| REVIEW-DOD-014 | Provider profiles render visible reviews. | Done |
| REVIEW-DOD-015 | Provider profiles show intentional empty/error states. | Done |
| REVIEW-DOD-016 | Public users cannot read removed or under_review reviews. | Done |
| REVIEW-DOD-017 | Admin hide removes public review visibility. | Done |
| REVIEW-DOD-018 | Admin hide closes linked report when supplied. | Done |
| REVIEW-DOD-019 | Admin hide writes audit action. | Done |
| REVIEW-DOD-020 | Admin hide recalculates provider aggregate. | Done |
| REVIEW-DOD-021 | Provider public reply UI is absent. | Done |
| REVIEW-DOD-022 | Provider public reply API/model fields are absent. | Done |
| REVIEW-DOD-023 | Provider reply absence is covered by regression tests. | Done |
| REVIEW-DOD-024 | Provider aggregates update after create/hide in Firebase-shaped integration tests. | Not started |
| REVIEW-DOD-025 | Ranking uses reputation inputs. | Done |
| REVIEW-DOD-026 | Ranking tests prove review influence is capped. | Partially done |
| REVIEW-DOD-027 | Ranking tests prove reviews do not guarantee top placement. | Not started |
| REVIEW-DOD-028 | Provider dashboard shows rating and latest visible reviews. | Done |
| REVIEW-DOD-029 | Search cards show rating. | Done |
| REVIEW-DOD-030 | Area expansion/visibility logic uses review count where required. | Done |
| REVIEW-DOD-031 | Fake/coordinated review baseline controls are documented and tested. | Partially done |
| REVIEW-DOD-032 | Targeted unit, functions, rules, e2e, lint, and build checks pass. | Partially done |

## Open Questions
1. Should the current one-review-per-provider behavior be the final v1 product rule, or should multiple separate contact events unlock separate reviews?
2. Should a reported review remain visible until admin action, or should report creation move it to `under_review` immediately?
3. Should review submission have a daily cap across providers, and what should that cap be?
4. Should admin direct update rules be narrowed to moderation fields only, even though hide is already callable-backed?
5. Does product need an explicit review analytics event stream, or are review documents plus audit actions enough for v1?
6. Should area expansion eligibility be recalculated live after reviews are hidden, or should approved expansions be grandfathered?
7. What fake/coordinated review signals are acceptable for v1 without adding device fingerprinting or invasive identity data?
