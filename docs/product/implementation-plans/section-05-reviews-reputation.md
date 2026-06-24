# Section 5 Implementation Plan - Reviews & Reputation
Source documents:
- SRS: `docs/product/herafy-software-requirements.md`, section 5.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 5.1-5.4.
Goal: make section 5 fully implemented across review eligibility, public review display, provider reply restrictions, reputation aggregation, ranking inputs, moderation, abuse controls, and tests.

## Current Status
| SRS area | Current status | Reason |
| 5.1 Review Eligibility | Implemented with test gaps | Customer review UI checks contact eligibility, Firebase review creation is callable-owned, the callable requires an active user, approved provider, unused contact event, and one review per customer-provider pair, and rules block direct review creation. Full emulator-backed callable transaction tests are still missing. |
| 5.2 Review Display | Implemented with UI/test gaps | Provider profiles query visible reviews only, Firestore rules allow public reads only for visible reviews, admin hide changes review status to removed, and aggregates are recalculated. Empty review display, review load failure, hidden-review UI, and CI emulator coverage need hardening. |
| 5.3 Provider Reply Restriction | Partially implemented | No provider public reply UI, route, service contract method, or `reply` field exists in the current implementation. The restriction is mostly enforced by absence, not by explicit rules/tests that prevent a future public reply field from being added accidentally. |
| 5.4 Reputation Impact | Implemented with integration gaps | Review create/hide recalculates `avgRating` and `reviewCount`, provider dashboard shows rating/latest reviews, search cards show rating, and ranking uses rating/review count with capped influence. There is no end-to-end or emulator integration proof that a newly created or hidden review changes ranking inputs in the same user-visible flow. |

## Product Decisions Needed Before Implementation
### Decision A - Review eligibility unit in v1
The SRS says one review per eligible customer-provider contact relationship as defined for v1.
Current Firebase callable enforces one review per customer-provider pair, even if multiple contact events exist.
Recommended v1 decision: **one public review per customer-provider pair, unlocked by at least one contact event**.
- This is simpler for customers.
- It reduces duplicate review abuse.
- It matches current code in `functions/src/reviews.ts` and `src/services/firebase/reviews.firebase.ts`.
- It still satisfies the v1 "contact relationship" wording if the relationship is customer-provider, not every individual contact event.
Implementation implication:
- Document the rule in product copy and tests.
- Keep `contacts.hasReview` as an eligibility flag for the first eligible contact.
- Do not allow a second review after WhatsApp plus chat unless product explicitly changes the rule.

### Decision B - Review moderation statuses
Current review statuses are `visible`, `under_review`, and `removed`.
Admin hide sets status to `removed`.
The admin overview counts `under_review`, but report creation does not currently move the reported review into `under_review`.
Recommended v1 decision: **reporting a review creates an abuse report without hiding it automatically; admin hide is the moderation action that removes it from public surfaces**.
- This avoids malicious reports instantly suppressing valid provider reputation.
- It matches the current `reportReview` behavior and the admin reports workflow.
- If product wants temporary suppression during investigation, implement it explicitly as `under_review` and decide whether it remains publicly visible.
Implementation implication:
- Keep public reads limited to `visible`.
- Clarify whether `under_review` is an admin-only queue status or a future status.
- Add tests for visible, under_review, and removed status behavior.

### Decision C - Provider replies in v1
The SRS forbids provider public replies in v1.
Recommended v1 decision: **provider public replies remain out of scope for v1**.
- No reply composer should be exposed in provider dashboard, provider profile, admin reports, or review pages.
- Review records should not accept public `reply`, `providerReply`, or similar fields from clients.
- If replies are introduced later, they should be a new moderated feature with product, safety, and notification requirements.
Implementation implication:
- Add regression tests and rule constraints that make reply support an intentional future change.
- Document in the checklist that no provider reply controls are allowed in Section 5 completion.

### Decision D - Reputation influence cap
Ranking currently uses reputation as one signal: `avgRating / 5 * 24 + min(reviewCount, 25)`.
Recommended v1 decision: **keep reviews influential but capped**.
- Reviews should improve trust and ranking inputs.
- Reviews must not guarantee top placement.
- Paid, location, activity, and fairness signals can still change final ordering.
Implementation implication:
- Add focused tests around extreme review values.
- Add integration tests proving rating/reviewCount updates feed ranking inputs without guaranteeing a fixed top rank.

### Decision E - Abuse controls for fake and coordinated reviews
Section 5 intersects with SRS section 11 safety requirements.
Current controls are contact-gated review creation, one review per customer-provider pair, direct-write denial, visible-only display, admin report/hide, and report rate limits.
Recommended v1 decision: **treat these as baseline abuse controls and add explicit signal capture for fake/coordinated review triage**.
- Do not auto-remove reviews solely based on heuristics in v1.
- Capture enough data for admin review: contact id, reviewer id, provider id, timestamps, report reasons, and audit rows.
- Add server-side review submission rate limiting for defense in depth.

## Target End State
Section 5 is complete when:
1. Customers can submit a review only after an eligible contact event.
2. Customers cannot submit more than one review for the same provider in v1.
3. Anonymous, banned, non-customer, and no-contact users cannot create reviews.
4. Direct Firestore review creation remains impossible.
5. Review creation validates provider id, rating, and comment.
6. Review creation updates the used contact and provider reputation aggregate in one server-owned transaction.
7. Provider profiles display visible reviews and aggregate rating when review data exists.
8. Hidden, removed, or under-review reviews do not appear publicly.
9. Admins can hide reviews from a report workflow.
10. Hiding a review recalculates provider `avgRating` and `reviewCount`.
11. Provider dashboard shows rating and latest visible reviews.
12. Provider public reply controls remain absent.
13. Rules/tests explicitly guard against public provider reply fields or reply-only updates.
14. Reputation signals feed ranking and visibility logic.
15. Review influence is capped and does not guarantee a specific rank.
16. Fake/coordinated review prevention has baseline enforcement, explicit tests, and a future escalation path.
17. Targeted unit, callable, rules, e2e, lint, and build checks pass.

## Detailed Implementation Plan
## 5.1 Review Eligibility
### Requirements Covered
- `REVIEW-001`: customers may review only after a contact event.
- `REVIEW-002`: one review per eligible customer-provider contact relationship.
- `REVIEW-003`: users who have not contacted the provider are rejected.

### Current Implementation Evidence
- `src/features/providers/pages/provider-profile-page.tsx`
  - Shows an "Add review" link only for customers.
  - The route is `/reviews/new/:providerId`.
- `src/features/reviews/pages/new-review-page.tsx`
  - Uses `useContactCheck(user?.uid, providerId)`.
  - Shows `reviews.notEligible` when eligibility is false.
  - Calls `createReview(user.uid, providerId, rating, comment)`.
- `src/services/firebase/reviews.firebase.ts`
  - `canCustomerReviewProvider` queries contacts with matching `customerId`, `providerId`, and `hasReview == false`.
  - Also checks no existing review exists for the same customer and provider.
  - `createReview` calls the `createReview` Cloud Function.
- `functions/src/reviews.ts`
  - Requires auth.
  - Rejects banned users through `requireActiveUser`.
  - Rejects duplicate customer-provider reviews.
  - Requires an unused contact for the same customer and provider.
  - Requires provider status `approved`.
  - Creates the review, sets the contact `hasReview`, and updates provider aggregates in a transaction.
- `firestore.rules`
  - `reviews` create is denied for all clients.
- `tests/rules/firestore.rules.test.ts`
  - Direct review creation and direct contact `hasReview` updates fail.
- `src/services/reviews.service.test.ts`
  - Demo tests cover one review after contact and eligibility becoming false.

### Work Items
#### 5.1.1 Lock the v1 eligibility semantics
- Docs/product note in this plan and any later SRS implementation map update.
- Confirm one review per customer-provider pair, not per individual contact row.
- Acceptance criteria:
- A user with multiple contacts to the same provider still has one public review slot.
- The product copy does not imply one review per message or WhatsApp reveal.

#### 5.1.2 Add callable emulator tests for review eligibility
- `functions/test/reviews.test.ts`, or a new emulator/integration test file under `functions/test`.
- Cover unauthenticated create.
- Cover banned customer create.
- Cover no-contact create.
- Cover contact with `hasReview: true`.
- Cover duplicate existing review.
- Cover pending/suspended/missing provider.
- Cover approved provider success.
- Acceptance criteria:
- `createReview` returns `unauthenticated`, `permission-denied`, `failed-precondition`, or `not-found` as appropriate.
- Success creates exactly one review and mutates exactly one contact.

#### 5.1.3 Add customer-role enforcement if missing
- `functions/src/reviews.ts`.
- Current callable validates active account but does not visibly require `role === 'customer'`.
- Add a server-side check if provider/admin users can reach the callable with a matching contact id in seeded or malicious data.
- Acceptance criteria:
- Only active `customer` users can create customer reviews.
- Admin/provider users are rejected even if a malformed contact exists.
- UI remains a convenience layer, not the enforcement boundary.

#### 5.1.4 Add review submission rate limiting
- `functions/src/reviews.ts`.
- `src/lib/rate-limits.ts` for demo parity.
- `src/services/demo/reviews.demo.ts`.
- The SRS safety section says review submission should be rate-limited.
- Current report rate limiting exists, but review creation does not have an explicit daily cap beyond one-provider duplication.
- Acceptance criteria:
- A customer cannot create reviews for many providers above the configured daily review cap.
- Rate-limit failures map to a localized, user-readable UI message.
- The cap does not block the one valid review in normal flow.

#### 5.1.5 Harden review form validation and error UI
- `src/features/reviews/pages/new-review-page.tsx`.
- Locale files under `src/i18n/`.
- Add required comment validation and max length matching the callable.
- Disable submit while create is in flight.
- Show localized errors for not eligible, duplicate, rate-limited, provider unavailable, and generic failure.
- Acceptance criteria:
- Empty comment cannot submit.
- Overlong comment cannot submit.
- Failed callable does not leave the form stuck.
- Customer can retry after a transient failure.

### Tests for 5.1
- `npm test -- src/services/reviews.service.test.ts`
- `npm test -- src/lib/rate-limits.test.ts` if review caps are added there.
- `npm --prefix functions test -- reviews.test.ts` or the functions package equivalent after adding callable integration coverage.
- `npm run test:rules`
- `npm run e2e -- tests/e2e/app.spec.ts` or equivalent for customer contact then review flow.

## 5.2 Review Display
### Requirements Covered
- `REVIEW-004`: provider profiles display visible reviews.
- `REVIEW-005`: provider profiles display aggregate rating when review data exists.
- `REVIEW-006`: hidden or moderated reviews do not appear publicly.

### Current Implementation Evidence
- `src/features/providers/pages/provider-profile-page.tsx`
  - Fetches reviews with `getProviderReviews(id!)`.
  - Renders each review rating, customer name, comment, and report action.
  - Does not render provider public reply controls.
- `src/services/firebase/reviews.firebase.ts`
  - `getProviderReviews` filters by `providerId` and `status == visible`, ordered by `createdAt desc`.
- `firestore.rules`
  - Review reads are allowed only when `status == visible` or the reader is admin.
- `functions/src/reviews.ts`
  - `hideReview` changes status to `removed`.
  - Aggregate recalculation includes only visible reviews.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - Shows provider rating and latest reviews from metrics.
- `src/services/analytics.service.ts`
  - Uses `getProviderReviews(providerId)` and returns `latestReviews.slice(0, 3)`.

### Work Items
#### 5.2.1 Add empty and loading states on provider profile reviews
- `src/features/providers/pages/provider-profile-page.tsx`.
- Current mapping can render nothing when there are zero reviews.
- Add a compact empty state such as `dashboard.noReviews` or a new `reviews.empty`.
- Add an error state when reviews fail to load.
- Acceptance criteria:
- Provider profile with zero visible reviews shows intentional empty copy.
- Review query failure shows retryable feedback.
- Loading state does not shift layout badly on mobile.

#### 5.2.2 Add provider profile review render tests
- Component test or Playwright flow.
- Cover provider with visible reviews.
- Cover provider with no visible reviews.
- Cover provider with removed/under_review reviews.
- Acceptance criteria:
- Visible reviews render.
- Removed and under_review reviews do not render to public users.
- Admin-only visibility does not leak to public profile surfaces.

#### 5.2.3 Add rules tests for visible-only public reads
- `tests/rules/firestore.rules.test.ts`.
- Cover anonymous can read visible review.
- Cover anonymous/customer cannot read removed or under_review reviews.
- Cover admin can read removed or under_review reviews.
- Acceptance criteria:
- Rules mirror the `getProviderReviews` query assumptions.
- Public profile cannot depend on security-through-query alone.

#### 5.2.4 Add admin hide integration coverage
- `functions/test/reviews.test.ts`.
- Seed visible reviews and provider aggregate.
- Call `hideReview`.
- Assert review status is removed.
- Assert associated report is closed when report id is provided.
- Assert admin action is written.
- Assert provider aggregate excludes the hidden review.
- Acceptance criteria:
- Moderation changes are transactional enough that aggregate and public visibility cannot diverge.

#### 5.2.5 Improve review report and moderation feedback
- `src/features/providers/pages/provider-profile-page.tsx`.
- `src/features/admin/pages/reports-page.tsx`.
- Show success/failure states for reporting and hiding reviews.
- Disable moderation buttons while mutations are in flight.
- Acceptance criteria:
- Customer sees confirmation or clear error after reporting a review.
- Admin cannot double-click hide/resolve into duplicate state.
- Failed hide leaves the report visible and actionable.

### Tests for 5.2
- `npm test -- src/services/reviews.service.test.ts`
- `npm test -- src/services/admin.service.test.ts`
- `npm run test:rules`
- Component test for provider profile reviews if test harness supports React rendering.
- E2E smoke for public provider profile review list and admin hide if test data supports it.

## 5.3 Provider Reply Restriction
### Requirements Covered
- `REVIEW-007`: providers cannot publicly reply to reviews in v1.
- `REVIEW-008`: UI does not expose provider public-reply controls.

### Current Implementation Evidence
- `src/types/review.ts`
  - Review has no reply field.
- `src/services/contracts/reviews.contract.ts`
  - Review service has no reply method.
- `src/features/providers/pages/provider-profile-page.tsx`
  - Renders reviews and report button, but no reply UI.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - Shows latest reviews but no reply composer.
- `src/features/reviews/pages/new-review-page.tsx`
  - Customer-only submission page, not provider reply.
- `firestore.rules`
  - Reviews can be updated by admin.
  - No explicit schema guard prevents an admin write from adding a reply field.

### Work Items
#### 5.3.1 Add explicit product note for replies out of scope
- Keep this plan as the source for Section 5 implementation.
- If a separate product decisions file is later created, add the same decision there.
- Acceptance criteria:
- Future agents can see that provider replies are intentionally absent for v1.

#### 5.3.2 Add static or unit regression test for no provider reply API
- Test source and route inventory.
- Search for forbidden public reply terms in review contracts and UI paths.
- Suggested forbidden terms: `providerReply`, `replyToReview`, `reviewReply`, `respondToReview`.
- Acceptance criteria:
- A future provider reply method or UI affordance fails a targeted test or checklist item unless the SRS changes.

#### 5.3.3 Tighten review update rules if practical
- `firestore.rules`.
- Direct review updates are currently admin-only.
- Consider restricting admin update fields to moderation fields only, such as `status`, `moderationReason`, `moderatedBy`, `moderatedAt`, while preserving current callable/admin flows.
- Acceptance criteria:
- Non-admin cannot update any review.
- Admin can hide/moderate reviews.
- Admin/client cannot add public reply fields by mistake.
- Cloud Functions Admin SDK remains able to perform server-owned moderation.

#### 5.3.4 Add provider dashboard e2e check
- `tests/e2e/app.spec.ts`.
- Log in as provider and inspect latest reviews panel.
- Acceptance criteria:
- Latest reviews are visible.
- No public reply textarea, button, link, or route is exposed.

### Tests for 5.3
- `npm run test:rules`
- Static product-boundary test for reply controls.
- Provider dashboard e2e smoke.
- Optional component test for provider profile review card.

## 5.4 Reputation Impact
### Requirements Covered
- `REVIEW-009`: reviews contribute to provider reputation signals.
- `REVIEW-010`: reputation signals are available to ranking/visibility logic.
- `REVIEW-011`: review influence does not guarantee a specific ranking position.

### Current Implementation Evidence
- `functions/src/reviews.ts`
  - `createReview` recalculates `avgRating` and `reviewCount`.
  - `hideReview` recalculates the same aggregate after removal.
- `src/services/demo/reviews.demo.ts`
  - Demo review creation and moderation recalculate provider rating and count.
- `src/types/provider.ts`
  - Provider profile includes `avgRating` and `reviewCount`.
- `src/lib/ranking.ts`
  - Ranking score includes capped `avgRating` and capped `reviewCount`.
  - Paid bonus is smaller than reputation/location signals and does not guarantee top rank alone.
- `src/lib/ranking.test.ts`
  - Proves a weak paid provider does not automatically outrank a strong organic provider.
- `src/services/firebase/search.firebase.ts`
  - Firestore search orders by `avgRating` before applying `rankProviders`.
- `src/features/search/pages/search-page.tsx`
  - Search cards display rating.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - Provider dashboard displays rating and latest reviews.
- `src/features/visibility/pages/visibility-page.tsx`
  - Area expansion availability uses `reviewCount >= 30`.

### Work Items
#### 5.4.1 Add review aggregate integration tests
- Functions emulator or Firestore emulator tests.
- Create a provider with zero reviews.
- Create first review and assert `avgRating` and `reviewCount`.
- Create hidden/removed review data and assert it is excluded.
- Hide a visible review and assert aggregate changes.
- Acceptance criteria:
- Aggregate state changes are proven against Firebase-shaped data.
- Demo-only aggregate tests are no longer the only proof.

#### 5.4.2 Add ranking input tests for review changes
- `src/lib/ranking.test.ts`.
- `src/services/search.service.test.ts` or Firebase adapter test.
- Cover higher avg rating ranking above lower avg rating when other signals are equal.
- Cover higher review count helping up to cap.
- Cover review count above cap not increasing score further.
- Cover location/activity/paid still able to influence final order.
- Acceptance criteria:
- `REVIEW-011` is explicitly tested, not inferred.

#### 5.4.3 Add visibility gate tests for review count
- `src/services/visibility.service.test.ts`.
- `tests/rules/firestore.rules.test.ts`.
- Existing behavior gates area expansion at 30 reviews.
- Add tests that hidden review removal can bring provider below the threshold if product wants strict live count semantics.
- Acceptance criteria:
- Area expansion reads provider `reviewCount`.
- Removed reviews do not keep a provider eligible unless an already-approved entitlement has separate grandfathering rules.

#### 5.4.4 Decide whether review events need analytics rows
- Section 12 already says review creation is tracked.
- Current system tracks review creation primarily as review documents and aggregate fields.
- If product needs an explicit event stream, add a server-owned `analyticsEvents` or `reviewEvents` row from `createReview` and `hideReview`.
- Acceptance criteria:
- The team can answer "how many reviews were created or hidden in a period" without querying mutable review state only.
- Admin moderation actions remain audit logged.

#### 5.4.5 Add ranking/visibility e2e smoke
- Seed two approved providers in same profession and area.
- Create or seed review differences.
- Search the same area.
- Assert the higher reputation provider is surfaced as expected when other inputs are equal.
- Then hide a review and assert the user-visible profile/search inputs refresh.
- Acceptance criteria:
- User-visible search and provider profile reflect reputation changes after moderation.
- Test does not assert an absolute top position when other configured signals differ.

### Tests for 5.4
- `npm test -- src/lib/ranking.test.ts`
- `npm test -- src/services/search.service.test.ts`
- `npm test -- src/services/visibility.service.test.ts`
- Functions review integration tests.
- `npm run test:rules`
- E2E search/profile smoke where feasible.

## Cross-Cutting Implementation Notes
### Security and Rules
- Keep review creation server-owned.
- Keep review hiding server-owned through callable where possible.
- Do not expose direct review writes for customers or providers.
- Keep public read access limited to visible reviews.
- Add schema-like rule constraints if client admin updates remain allowed.

### Data Model
Current review shape:
- `id`
- `providerId`
- `customerId`
- `customerName`
- `contactId`
- `rating`
- `comment`
- `status`
- `createdAt`

Recommended additions only if needed:
- `moderatedBy`
- `moderatedAt`
- `moderationReason`
- `reportedCount`
- `abuseSignals`

Do not add provider reply fields in v1.

### Abuse and Reputation Quality
Baseline already exists:
- Contact-gated reviews.
- One review per provider relationship.
- Direct review create denied.
- Visible-only public display.
- Report review flow.
- Admin hide flow.
- Aggregate recalculation after hide.

Recommended additions:
- Review submission daily rate limit.
- Role check requiring customer.
- Explicit duplicate/device/account signal capture if abuse increases.
- Admin report queue filters for review reports.

## Suggested Implementation Order
1. Add tests that capture current intended behavior for review eligibility, visible-only display, and no provider replies.
2. Add missing server-side customer-role enforcement and review rate limit if tests expose the gap.
3. Harden review form validation and mutation feedback.
4. Add provider profile empty/error states for reviews.
5. Add callable integration tests for create/hide aggregate transactions.
6. Add ranking and visibility tests for reputation inputs and caps.
7. Add e2e smoke for customer contact to review and admin hide to public removal if feasible.
8. Run full verification commands.

## Effort Estimate
| Workstream | Estimate | Notes |
| Review eligibility and form hardening | 1-2 days | Mostly tests, validation, and error states. |
| Callable and rules integration tests | 1-2 days | Emulator setup is the main cost. |
| Provider profile review states | 0.5-1 day | Small UI change plus component/e2e coverage. |
| Provider reply restriction hardening | 0.5 day | Static/rules tests and product note. |
| Reputation/ranking tests | 1 day | Unit tests are direct; e2e may need seed setup. |
| Abuse/rate-limit additions | 1 day | Requires demo and Firebase parity. |
| Total | 5-7 engineering days | Assumes no major Firebase emulator instability. |

## Risks
| Risk | Impact | Mitigation |
| Missing callable emulator coverage | A callable can drift from rules/demo assumptions. | Add createReview and hideReview integration tests with Firebase-shaped data. |
| Reply restriction enforced only by absence | Future UI/API work could add replies accidentally. | Add static regression and rules constraints. |
| Review rate limit absent | A customer can review many different providers quickly after contact events. | Add server-side daily cap and localized error handling. |
| Admin direct updates are broad | Admin clients can mutate review fields outside moderation intent. | Prefer callables and tighten rule field diffs. |
| Hidden review aggregate drift | Public review display and provider reputation can disagree. | Test aggregate recalculation in create/hide transactions. |
| Ranking tests overfit exact order | A test may break when unrelated ranking weights change. | Assert review signal behavior in controlled equal-signal fixtures. |
| Abuse detection remains manual | Fake/coordinated review patterns may require admin burden. | Add signal capture and report queue filters before auto-enforcement. |

## Definition of Done
Section 5 is done when:
- Review creation is contact-gated, customer-only, active-account-only, rate-limited, duplicate-safe, and server-owned.
- Review form validation and failure states are localized and retryable.
- Direct review creation remains denied by Firestore rules.
- Public provider profiles show visible reviews and an intentional zero-review state.
- Removed and under_review reviews are not publicly readable or rendered.
- Admin hide removes public visibility, closes linked reports when provided, writes audit, and recalculates provider aggregates.
- Provider public reply UI/API remains absent and is covered by regression checks.
- Reputation aggregate changes are covered by unit and emulator/integration tests.
- Ranking tests prove review influence exists, is capped, and does not guarantee a fixed top position.
- Provider dashboard and search surfaces continue to show reputation signals.
- Targeted tests, rules tests, lint, build, and relevant e2e smoke pass.

## Verification Commands
Run the most targeted checks first:
```bash
npm test -- src/services/reviews.service.test.ts
npm test -- src/services/admin.service.test.ts
npm test -- src/lib/ranking.test.ts
npm test -- src/services/search.service.test.ts
npm test -- src/services/visibility.service.test.ts
npm run test:rules
```

Run functions tests from the functions package if configured:
```bash
npm --prefix functions test
```

Run product-level gates before marking complete:
```bash
npm run lint
npm run build
npm run e2e
```

Run all checks when ready for release:
```bash
npm run release:check
```
