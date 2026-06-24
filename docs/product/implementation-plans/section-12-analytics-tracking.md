# Section 12 Implementation Plan - Analytics & Tracking

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 12.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 12.1-12.3.

Goal: make section 12 fully implemented across trusted event capture, provider dashboard aggregates, ranking-visible signals, admin audit logs, paid visibility lifecycle events, security rules, and tests.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 12.1 Customer/Provider Interaction Events | Partially implemented | WhatsApp reveals and chat starts create server-side contact records; provider dashboard derives contacts and response metrics; profile views are still direct client writes to `providers.profileViews` and failures are swallowed. |
| 12.2 Trust and Reputation Events | Implemented for v1 behavior, partially verified | Review creation and hide-review callables update provider aggregates; visible reviews appear on provider profiles and dashboards; review moderation writes admin audit actions; callable transaction tests are helper-level, not emulator-level. |
| 12.3 Ranking, Admin, and Paid Events | Partially implemented | Ranking uses views, rating, review count, activity, and paid visibility; admin actions are logged for many mutations; paid approval changes provider fields; there is no dedicated paid usage/expiry event history and no automatic expiry event. |

## Product Decisions Needed Before Implementation

### Decision A - Canonical Analytics Event Store

Recommended v1 decision: add a dedicated `analyticsEvents` collection for immutable event records, while keeping existing materialized provider fields such as `profileViews`, `avgRating`, `reviewCount`, `activityScore`, `visibilityTier`, and `visibilityPaidUntil`.

Reason:

- Existing SRS requirements are event oriented, but the implementation mostly stores final state and derives metrics from operational collections.
- A small append-only event ledger gives product, admin, and debugging visibility without coupling every dashboard metric to expensive cross-collection scans.
- Firestore security can deny all direct client writes and require trusted callables for event creation.

Implementation implication:

- Add event rows for profile views, WhatsApp reveals, platform message contact starts, review creation, review moderation, ranking signal changes, admin actions, paid visibility approval, paid visibility expiry, and area expansion.
- Store only minimal non-secret metadata.
- Avoid raw customer location coordinates, phone numbers, WhatsApp URLs, identity-document contents, or message bodies in analytics events.

### Decision B - Profile View Deduplication Semantics

Recommended v1 decision: count at most one profile view per browser session per provider and viewer identity when available.

Reason:

- Current demo and Firebase paths already use `sessionStorage` to avoid repeated local increments.
- This is simple, privacy-light, and good enough for provider dashboard expectations in v1.
- It avoids over-counting refreshes while not requiring long-lived fingerprinting.

Implementation implication:

- Keep client-side session dedupe before calling the backend.
- Move the actual increment and event creation into a callable such as `trackProfileView`.
- Exclude provider self-views server-side.
- Allow anonymous viewer IDs to be omitted or stored as `null`.

### Decision C - Response Behavior Scope

Recommended v1 decision: keep response behavior as derived provider dashboard metrics, not a separate message-level event stream.

Reason:

- `getProviderMetrics` already computes response rate and average first response from conversations and messages.
- Message bodies should not be duplicated into analytics.
- Separate response events can be added later if provider coaching, SLA reports, or notifications need them.

Implementation implication:

- Keep deriving `responseRate` and `averageFirstResponseMinutes` from conversation details.
- Add tests for no-response, multiple-message, and late-response cases.
- Add a future-ready event type only for aggregated response snapshots if product later wants trend charts.

### Decision D - Paid Visibility Expiry Ownership

Recommended v1 decision: introduce an explicit backend-owned expiry routine, even if v1 runs it manually or from a scheduled function later.

Reason:

- Ranking already treats expired paid visibility as organic based on `visibilityPaidUntil`.
- Product still needs an auditable usage/expiry history for paid visibility.
- Without an expiry event, support cannot explain when a provider lost paid placement.

Implementation implication:

- Add a callable or scheduled function that finds expired paid providers, sets `visibilityTier` to `organic` where needed, and appends `paid_visibility_expired` events.
- If automatic scheduling is deferred, document the manual command and keep the function idempotent.
- Tests should prove expired paid providers lose active paid ranking and an event is written once.

## Target End State

Section 12 is complete when:

1. Provider profile views are tracked through a trusted callable, not a direct client update.
2. Profile view tracking increments `providers.profileViews` exactly once per accepted view and writes a minimal analytics event.
3. WhatsApp reveals and chat initiations continue to create deduplicated contact records through callables.
4. Contact events also write analytics events or are represented by a documented operational-source mapping.
5. Provider dashboard metrics show views, contacts, conversations, response rate, average first response, rating, and latest reviews from trusted data.
6. Review creation is contact-gated, server-side, aggregate-updating, and represented in analytics.
7. Review moderation is admin-only, aggregate-updating, audit-logged, and represented in analytics.
8. Ranking-visible signals are documented and either event-backed or clearly materialized from trusted operational records.
9. Admin actions are consistently written through backend/admin-only paths and visible in the admin audit log.
10. Paid visibility approval, area expansion, usage start, and expiry are recorded in auditable history.
11. Firestore rules deny direct client creation of analytics events and unsafe counter manipulation.
12. Tests cover service behavior, callable behavior, rules, ranking, dashboard metrics, and at least one e2e interaction path.

## Detailed Implementation Plan

## 12.1 Customer/Provider Interaction Events

### Requirements Covered

- `ANALYTICS-001`: provider profile views.
- `ANALYTICS-002`: contact events.
- `ANALYTICS-003`: WhatsApp reveals.
- `ANALYTICS-004`: chat initiations.
- `ANALYTICS-005`: response behavior.

### Current Implementation Evidence

- `src/features/providers/pages/provider-profile-page.tsx`
  - calls `incrementProfileView(id, user?.uid)` inside `useEffect`.
  - calls `revealWhatsApp(user.uid, provider.id)` for WhatsApp reveal.
  - calls `startConversation(user.uid, provider.id, message)` for in-app chat initiation.
- `src/services/firebase/providers.firebase.ts`
  - `incrementProfileView` reads the provider, skips owner views, uses `sessionStorage`, and then calls `updateDoc(..., { profileViews: increment(1) })`.
  - direct write failures are swallowed because rules may deny analytics writes.
  - `revealWhatsApp` calls the `revealWhatsApp` Cloud Function.
- `src/services/demo/providers.demo.ts`
  - demo profile views increment in local demo DB with session dedupe.
  - demo WhatsApp reveals create or reuse a `contacts` row with type `whatsapp_reveal`.
- `functions/src/engagement.ts`
  - `revealWhatsApp` requires auth, checks active account, checks approved provider and WhatsApp visibility, rate-limits new reveals, and writes `contacts/{customerId}_{providerId}_whatsapp_reveal`.
  - `startConversation` requires auth, checks active account, checks approved provider, rate-limits new conversation starts, writes `conversations`, writes a first `messages` subdocument, and writes `contacts/{customerId}_{providerId}_platform_message` if missing.
- `src/services/analytics.service.ts`
  - derives `contactsCount`, `conversationsCount`, `responseRate`, `averageFirstResponseMinutes`, and `latestReviews`.
  - response behavior is derived from first customer message and first provider response.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - displays views from `provider.profileViews`.
  - displays contacts, conversations, response rate, average response, rating, and latest reviews.
- `firestore.rules`
  - provider owners may only update safe profile fields, not `profileViews`.
  - `contacts` creation is denied to clients.
  - `conversations` creation is denied to clients.
  - message creation is still allowed for conversation participants after a callable creates the conversation.
- `src/services/analytics.service.test.ts`
  - has one demo test for provider contact, response, and review metrics.
- `src/services/providers.service.test.ts`
  - tests WhatsApp contact dedupe, platform-message contact dedupe, and daily limits in demo services.
- `tests/e2e/app.spec.ts`
  - verifies customer login, WhatsApp reveal, and messaging flow in the demo app.

### Work Items

#### 12.1.1 Define an analytics event model

Files:

- `src/types/analytics.ts`
- `src/firebase/converters.ts`
- `functions/src/analytics.ts`
- `firestore.rules`

Changes:

- Add `AnalyticsEventType`.
- Include v1 event types:
  - `profile_view`
  - `whatsapp_reveal`
  - `chat_initiated`
  - `review_created`
  - `review_moderated`
  - `admin_action`
  - `ranking_signal_changed`
  - `paid_visibility_started`
  - `paid_visibility_expired`
  - `area_expansion_approved`
- Add `AnalyticsEvent` fields:
  - `id`
  - `type`
  - `actorId`
  - `actorRole`
  - `providerId`
  - `targetType`
  - `targetId`
  - `dedupeKey`
  - `metadata`
  - `createdAt`
  - `schemaVersion`
- Keep metadata allowlisted by event type.
- Do not store phone numbers, WhatsApp URLs, identity-document data, raw message text, or raw customer coordinates.

Acceptance criteria:

- TypeScript event types compile.
- Firebase converter accepts and returns stable event shapes.
- Rules deny direct client event creation unless a deliberate admin-only migration path is chosen.

#### 12.1.2 Add `trackProfileView` callable

Files:

- `functions/src/analytics.ts`
- `functions/src/index.ts`
- `src/services/contracts/providers.contract.ts`
- `src/services/firebase/providers.firebase.ts`
- `src/services/providers.service.ts`
- `src/services/demo/providers.demo.ts`
- `src/features/providers/pages/provider-profile-page.tsx`

Changes:

- Implement callable input:
  - `providerId`
  - optional `viewerId`
  - optional `dedupeKey`
- Server behavior:
  - allow anonymous or authenticated viewers.
  - reject missing or invalid `providerId`.
  - read provider.
  - require approved provider for public view tracking.
  - skip if viewer is provider owner.
  - enforce dedupe by event `dedupeKey` when provided.
  - increment `providers.profileViews`.
  - append `analyticsEvents/profile_view`.
- Client behavior:
  - keep session-level `profile-viewed-${providerId}` guard.
  - call `trackProfileView` instead of direct `updateDoc`.
  - keep failures non-blocking for profile rendering, but log or expose testable error handling in service tests.

Acceptance criteria:

- Direct client updates to `profileViews` are no longer needed.
- Profile views increment under Firebase rules because the backend owns the write.
- Provider self-views do not increment.
- Repeated same-session views do not double count.

#### 12.1.3 Attach analytics events to WhatsApp reveals

Files:

- `functions/src/engagement.ts`
- `functions/src/analytics.ts`
- `src/services/demo/providers.demo.ts`

Changes:

- When `revealWhatsApp` creates a new contact, append `analyticsEvents/whatsapp_reveal`.
- Decide whether repeated reveals should append a repeat event.
- Recommended v1 behavior: do not append a new analytics event for repeated reveals against an existing contact, because SRS and contact-count semantics prefer deduplication.
- Include metadata:
  - `contactId`
  - `contactType`
  - `source: "provider_profile"`
- Exclude `whatsappNumber` and `whatsappUrl`.

Acceptance criteria:

- A first WhatsApp reveal creates one contact and one analytics event.
- A repeated reveal returns the existing contact without increasing contact count.
- Rate limits still apply only to new reveals.

#### 12.1.4 Attach analytics events to chat initiations

Files:

- `functions/src/engagement.ts`
- `functions/src/analytics.ts`
- `src/services/demo/messaging.demo.ts`

Changes:

- When `startConversation` creates a new `platform_message` contact, append `analyticsEvents/chat_initiated`.
- Include metadata:
  - `conversationId`
  - `contactId`
  - `source: "provider_profile"`
- Do not store first message text in analytics metadata.
- Preserve existing conversation update behavior for follow-up messages.

Acceptance criteria:

- First chat to a provider creates one contact and one analytics event.
- Follow-up messages do not create new contacts or new chat initiation events.
- Message send/read state remains governed by existing rules.

#### 12.1.5 Harden provider dashboard metrics

Files:

- `src/services/analytics.service.ts`
- `src/services/analytics.service.test.ts`
- `src/features/dashboard/pages/provider-dashboard-page.tsx`

Changes:

- Add tests for:
  - no contacts.
  - no conversations.
  - no provider response.
  - multiple customer messages before first provider response.
  - response rate denominator behavior.
  - latest reviews visibility and ordering.
- Keep `averageFirstResponseMinutes` null when no response exists.
- Consider exposing loading and error states in the provider dashboard if metrics query fails.

Acceptance criteria:

- Dashboard metric computation is deterministic from operational records.
- No-response providers show `dashboard.noResponses`.
- Latest reviews are visible-only and capped to three.

### Tests for 12.1

Unit tests:

```bash
npm test -- src/services/analytics.service.test.ts
npm test -- src/services/providers.service.test.ts
```

New or expanded tests:

- `functions/test/analytics.test.ts`
  - profile view callable increments approved provider.
  - owner view is ignored.
  - duplicate dedupe key is ignored.
  - pending provider view is rejected or ignored according to product decision.
- `functions/test/engagement.test.ts`
  - reveal writes contact event once.
  - start conversation writes chat event once.
- `tests/rules/firestore.rules.test.ts`
  - direct client analytics event create fails.
  - customer cannot update `providers.profileViews`.
  - admin-only or backend-owned event writes are documented.

E2E smoke:

```bash
npm run e2e -- tests/e2e/app.spec.ts
```

Add a smoke assertion where practical:

- open a provider profile twice in one session and verify the visible dashboard count changes at most once in demo mode.

## 12.2 Trust and Reputation Events

### Requirements Covered

- `ANALYTICS-006`: review creation.
- `ANALYTICS-007`: review moderation actions.
- `ANALYTICS-008`: aggregated reviews and ratings exposed to provider dashboards.

### Current Implementation Evidence

- `functions/src/reviews.ts`
  - `createReview` requires auth and active user.
  - it checks no existing review for the customer/provider pair.
  - it requires a contact row with `hasReview == false`.
  - it requires approved provider.
  - it writes a review with status `visible`.
  - it updates the contact `hasReview`.
  - it recalculates provider `avgRating` and `reviewCount`.
  - `hideReview` requires active admin.
  - it updates review status to `removed`.
  - it closes an optional report.
  - it writes an `adminActions` row.
  - it recalculates provider rating.
- `src/services/firebase/reviews.firebase.ts`
  - reads only visible provider reviews.
  - calls `createReview` callable for review creation.
  - calls `reportReview` callable for report creation.
- `src/services/admin.service.ts` and `src/services/firebase/admin.firebase.ts`
  - expose `hideReview`.
  - Firebase path calls the `hideReview` callable.
- `src/services/demo/admin.demo.ts`
  - demo `hideReview` removes review, closes report when provided, recalculates rating, and writes admin action.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - shows `provider.avgRating`.
  - shows latest reviews from `getProviderMetrics`.
- `tests/rules/firestore.rules.test.ts`
  - direct review creation is denied.
  - direct contact `hasReview` update by customer is denied.
- `functions/test/reviews.test.ts`
  - tests rating recalculation helper and active admin/user helper.

### Work Items

#### 12.2.1 Add review creation analytics event

Files:

- `functions/src/reviews.ts`
- `functions/src/analytics.ts`
- `src/services/demo/reviews.demo.ts`

Changes:

- Append `analyticsEvents/review_created` inside the same transaction where possible.
- Include metadata:
  - `reviewId`
  - `contactId`
  - `rating`
  - `newAvgRating`
  - `newReviewCount`
- Do not store review comment in analytics metadata.
- Keep provider aggregate update and contact `hasReview` update atomic with review creation.

Acceptance criteria:

- A successful review creates one visible review, marks one contact reviewed, updates aggregate rating, and writes one analytics event.
- A failed duplicate review writes no event.
- A failed no-contact review writes no event.

#### 12.2.2 Add review moderation analytics event

Files:

- `functions/src/reviews.ts`
- `functions/src/analytics.ts`
- `src/services/demo/admin.demo.ts`

Changes:

- Append `analyticsEvents/review_moderated` when `hideReview` removes a review.
- Include metadata:
  - `reviewId`
  - `reportId` when present.
  - `moderationAction: "hide_review"`
  - `newAvgRating`
  - `newReviewCount`
- Keep `adminActions` as the canonical admin audit log.
- Treat analytics event as product/metric history, not authorization history.

Acceptance criteria:

- Hide-review writes an admin action and an analytics event.
- Provider rating aggregate excludes removed review.
- Report closure metadata remains intact when a report is provided.

#### 12.2.3 Strengthen callable transaction tests

Files:

- `functions/test/reviews.test.ts`
- optional emulator-backed callable test harness.

Changes:

- Add tests for:
  - active customer with contact can create review.
  - customer cannot review twice.
  - customer cannot review without contact.
  - banned customer cannot create review.
  - non-admin cannot hide review.
  - admin hide-review updates aggregate and audit log.
  - analytics event is written only on successful mutations.

Acceptance criteria:

- Tests prove transaction side effects together, not only helper functions.
- If emulator callable testing is not available, add isolated transaction helpers and test those helpers directly.

#### 12.2.4 Verify dashboard aggregate exposure

Files:

- `src/services/analytics.service.ts`
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
- `src/services/analytics.service.test.ts`

Changes:

- Keep provider dashboard using `provider.avgRating` and latest visible reviews.
- Add tests that removed reviews are not returned in latest reviews.
- Add dashboard UI test or component test that rating and latest reviews render from service data.

Acceptance criteria:

- Removed reviews do not appear in provider profile or dashboard latest reviews.
- Aggregate rating matches visible reviews after moderation.

### Tests for 12.2

Minimum commands:

```bash
npm test -- src/services/analytics.service.test.ts
npm test -- src/services/reviews.service.test.ts
cd functions
npm test
```

Rules and e2e:

```bash
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
```

If callable emulator tests are added, run them with Firebase emulators so transaction and rules assumptions are real.

## 12.3 Ranking, Admin, and Paid Events

### Requirements Covered

- `ANALYTICS-009`: ranking and visibility-relevant signals.
- `ANALYTICS-010`: admin actions through audit logs.
- `ANALYTICS-011`: paid visibility usage and expiry.

### Current Implementation Evidence

- `src/lib/ranking.ts`
  - ranking uses location score, rating, review count, activity score, active paid visibility bonus, and fairness based on low profile views.
  - expired paid visibility is treated as organic by `isPaidVisibilityActive`.
- `src/lib/ranking.test.ts`
  - tests paid bonus cap behavior.
  - tests expired paid visibility is inactive.
  - tests active paid visibility is active.
- `src/services/firebase/admin.firebase.ts`
  - provider approval/rejection/suspension call Cloud Functions.
  - visibility approval updates `visibilityRequests` and provider paid/service-area fields in a client-side transaction.
  - `auditLocally` writes `adminActions`.
  - user ban/unban and profession changes write `adminActions`.
- `functions/src/providers.ts`
  - approve, reject, and suspend provider callables require active admin and write `adminActions`.
- `src/services/demo/admin.demo.ts`
  - demo admin mutations write `adminActions`.
  - demo visibility approval updates provider paid state or service areas and writes an admin action.
- `src/services/firebase/visibility.firebase.ts`
  - provider visibility request creation writes `visibilityRequests`.
  - duplicate pending request checks exist.
- `firestore.rules`
  - `adminActions` read/create is admin-only.
  - `visibilityRequests` creation is provider-owned and constrained.
  - visibility request processing is admin-only.
- `functions/src/visibility.ts`
  - only contains `approveVisibility` date helper.
  - no deployed callable currently owns paid approval or expiry.

### Work Items

#### 12.3.1 Document ranking-visible signals

Files:

- `src/lib/ranking.ts`
- `docs/product/implementation-plans/section-12-analytics-tracking.md`
- optional `docs/product/ranking-signals.md`

Changes:

- Document ranking inputs:
  - service-area match.
  - average rating.
  - review count.
  - activity score.
  - active paid visibility.
  - fairness boost for low views.
- Document non-goals:
  - do not expose exact numeric weights in provider or customer UI.
  - do not let paid visibility override trust/safety or outside-coverage exclusion.
- Add a test proving exact numeric weights are not rendered in public/provider UI if a UI test harness exists.

Acceptance criteria:

- Engineers can trace every ranking input to a trusted field or event source.
- Product has a clear privacy boundary for ranking logic.

#### 12.3.2 Add ranking signal analytics events where state changes

Files:

- `functions/src/analytics.ts`
- `functions/src/reviews.ts`
- `functions/src/providers.ts`
- `src/services/firebase/admin.firebase.ts`
- `src/services/demo/admin.demo.ts`

Changes:

- Emit `ranking_signal_changed` when:
  - profile views increment.
  - review aggregate changes.
  - provider status changes.
  - paid visibility starts or expires.
  - service areas change through paid area expansion.
- Keep event metadata compact:
  - changed field names.
  - old and new coarse values where useful.
  - no hidden ranking score or formula weights.

Acceptance criteria:

- Ranking-relevant state changes are auditable without exposing full scoring formulas.
- Events are written through trusted server/admin paths.

#### 12.3.3 Move paid visibility approval to backend-owned callable

Files:

- `functions/src/visibility.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `src/services/demo/admin.demo.ts`
- `firestore.rules`

Changes:

- Implement callable such as `approveVisibilityRequest`.
- Require active admin.
- Run transaction:
  - read request.
  - require `pending`.
  - read provider.
  - approve request.
  - set `paymentConfirmedBy`, `processedAt`, and admin notes.
  - for boost, set `visibilityTier: "paid"` and `visibilityPaidUntil`.
  - for area expansion, append service area fields.
  - write `adminActions`.
  - write `analyticsEvents/paid_visibility_started` or `analyticsEvents/area_expansion_approved`.
- Update frontend admin service to call the function instead of client transaction.
- Keep direct client processing denied except admin fallback if product deliberately allows it.

Acceptance criteria:

- Paid approval works from admin UI.
- Paid approval side effects are atomic.
- Paid approval writes an admin action and analytics event.
- Non-admin users cannot approve paid visibility.

#### 12.3.4 Add paid visibility expiry event path

Files:

- `functions/src/visibility.ts`
- `functions/src/index.ts`
- optional scheduled function config.
- `src/lib/ranking.test.ts`

Changes:

- Implement idempotent expiry routine.
- Query providers where `visibilityTier == "paid"` and `visibilityPaidUntil <= now`.
- Set `visibilityTier` to `organic` or leave paid tier with expired date only if product explicitly prefers historical tier retention.
- Recommended v1 behavior: set `visibilityTier` to `organic` and keep `visibilityPaidUntil` as the historical end date.
- Append `analyticsEvents/paid_visibility_expired`.
- Ensure running the routine twice does not write duplicate expiry events.

Acceptance criteria:

- Expired paid provider no longer receives paid ranking bonus.
- Expiry history is visible in analytics event data.
- Routine is safe to run manually or on a schedule.

#### 12.3.5 Normalize admin audit coverage

Files:

- `functions/src/providers.ts`
- `functions/src/reviews.ts`
- `functions/src/visibility.ts`
- `src/services/firebase/admin.firebase.ts`
- `src/services/demo/admin.demo.ts`
- `src/types/admin.ts`
- `tests/rules/firestore.rules.test.ts`

Changes:

- Ensure every admin mutation writes `adminActions`:
  - approve provider.
  - reject provider.
  - suspend provider.
  - approve visibility.
  - reject visibility.
  - hide review.
  - resolve report.
  - ban user.
  - unban user.
  - create/update/activate/deactivate profession.
- Prefer backend-owned callables for mutations that affect provider visibility, safety, ranking, or paid state.
- Keep demo behavior aligned with Firebase behavior.

Acceptance criteria:

- Admin actions table is a complete v1 audit trail.
- Rules prevent non-admin audit writes.
- Tests cover at least one representative admin action per mutation family.

### Tests for 12.3

Unit tests:

```bash
npm test -- src/lib/ranking.test.ts
npm test -- src/services/admin.service.test.ts
npm test -- src/services/visibility.service.test.ts
```

Functions tests:

```bash
cd functions
npm test
```

Rules tests:

```bash
npm run test:rules
```

E2E smoke:

```bash
npm run e2e -- tests/e2e/app.spec.ts
```

Additional verification:

- Admin approves visibility request and provider receives active paid visibility.
- Expiry routine removes active paid bonus and writes one expiry event.
- Admin audit list shows visibility and moderation actions.
- Ranking tests prove weak paid provider cannot automatically beat strong organic provider.

## Cross-Cutting Implementation Notes

### Analytics Event Schema Guardrails

- Use `schemaVersion: 1`.
- Use ISO strings for app-level timestamps, matching existing code.
- Consider Firestore server timestamps later if consistency becomes a problem.
- Store `actorId` as `null` for anonymous profile views.
- Store role only when already known from trusted user document.
- Store `providerId` for provider-related events.
- Store `targetType` and `targetId` for review, report, admin action, visibility request, and conversation references.
- Keep event metadata JSON-serializable and allowlisted.

### Security Rules Target State

Rules should enforce:

- Clients cannot create, update, or delete analytics events.
- Admins may read analytics events only if product wants admin analytics surfaces in v1.
- Providers may read only their own aggregate metrics, not raw event streams, unless product explicitly approves raw-event access.
- Customers should not read analytics events.
- Clients cannot update `providers.profileViews`, `avgRating`, `reviewCount`, `activityScore`, `visibilityTier`, or `visibilityPaidUntil` directly.
- Provider-owned profile edits remain limited to public profile fields.

### Data Migration and Backfill

Existing production or seeded providers may already have:

- `profileViews`
- `avgRating`
- `reviewCount`
- `activityScore`
- `visibilityTier`
- `visibilityPaidUntil`

Recommended migration:

- Do not attempt to backfill every historical event from aggregate counters.
- Add one optional `analytics_backfill_snapshot` event per provider if product needs a baseline.
- Start append-only event history from the deployment date.
- Keep current aggregate fields as source of truth until event-derived aggregates are intentionally introduced.

## Verification Plan

Minimum commands:

```bash
npm test -- src/services/analytics.service.test.ts
npm test -- src/services/providers.service.test.ts
npm test -- src/lib/ranking.test.ts
npm run lint
npm run build
```

Rules and browser checks:

```bash
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
```

Firebase Functions:

```bash
cd functions
npm test
npm run build
```

If callable emulator tests are added, run them with Firebase emulators rather than plain helper tests.

Manual smoke checklist:

- Open an approved provider profile as anonymous user.
- Verify profile page loads even if analytics callable fails.
- Open the same profile twice in one browser session.
- Verify only one profile view is counted.
- Login as customer.
- Reveal WhatsApp.
- Verify one contact event exists and no phone number is stored in analytics metadata.
- Start chat.
- Verify one chat initiation event exists and no message body is stored in analytics metadata.
- Login as provider.
- Open dashboard.
- Verify views, contacts, conversations, response rate, average response, rating, and latest reviews render.
- Login as admin.
- Hide a review from a report.
- Verify review aggregate changes, admin action exists, analytics event exists, and removed review is hidden from public reads.
- Approve a paid visibility request.
- Verify provider receives paid visibility, admin action exists, paid event exists, and ranking treats it as active until expiry.
- Run expiry routine.
- Verify paid bonus is inactive and one expiry event exists.

## Completion Checklist

Section 12 is complete when all are true:

- [ ] `analyticsEvents` schema and converter exist.
- [ ] Firestore rules deny direct client writes to analytics events.
- [ ] Profile view tracking uses a trusted callable.
- [ ] Profile view tracking skips provider self-views.
- [ ] Profile view tracking deduplicates repeated same-session views.
- [ ] WhatsApp reveal contact creation remains callable-owned.
- [ ] WhatsApp reveal analytics event is written once per new eligible contact.
- [ ] Chat initiation contact creation remains callable-owned.
- [ ] Chat initiation analytics event is written once per new eligible contact.
- [ ] Provider dashboard metrics have expanded unit coverage.
- [ ] Review creation writes review, contact update, aggregate update, and analytics event atomically.
- [ ] Review moderation writes review status update, aggregate update, admin action, and analytics event.
- [ ] Removed reviews are excluded from public/dashboard latest review reads.
- [ ] Ranking-visible signal sources are documented.
- [ ] Ranking signal changes write analytics events without exposing exact ranking weights.
- [ ] Admin actions are consistently logged for all admin mutation families.
- [ ] Paid visibility approval is backend-owned or explicitly documented as admin-only client fallback.
- [ ] Paid visibility approval writes paid usage analytics.
- [ ] Paid visibility expiry routine exists and is idempotent.
- [ ] Paid visibility expiry writes expiry analytics.
- [ ] Tests, rules tests, functions tests, lint, build, and e2e smoke pass.

## Estimated Effort

| Workstream | Estimate |
|---|---:|
| Analytics event type, converter, helper, and rules | 0.75-1.25 days |
| `trackProfileView` callable and client integration | 0.75-1 day |
| Contact event instrumentation for WhatsApp and chat | 0.5-0.75 day |
| Provider dashboard metric hardening and tests | 0.5-1 day |
| Review creation/moderation event instrumentation and callable tests | 1-1.5 days |
| Paid visibility approval callable and admin integration | 1-1.5 days |
| Paid visibility expiry routine and tests | 0.75-1 day |
| Rules, e2e, lint, build, and cleanup verification | 0.75-1 day |
| Total | 6-9 days |

## Risks

- Firestore callable transaction tests may need a stronger emulator harness than current helper-level functions tests.
- Event ledger growth can become expensive if every repeat view or message is logged; keep v1 deduped and minimal.
- Moving visibility approval from client transaction to callable touches admin paid flows and must preserve demo parity.
- Direct message sends remain client-side after conversation creation; this is acceptable for response metrics but not full message-send rate limiting.
- Exact ranking weights should not leak through analytics metadata or provider-facing UI.
- Backfilling historical analytics from aggregate counters can create misleading event histories; prefer forward-only events.
- If scheduled functions are not configured, paid expiry may rely on manual execution until deployment setup is finished.

## Recommended Definition of Done for Section 12

- The implementation map row statuses can be updated to:
  - `12.1 Customer/Provider Interaction Events`: Implemented, with trusted profile view callable, contact event instrumentation, and dashboard metric coverage.
  - `12.2 Trust and Reputation Events`: Implemented, with review creation/moderation analytics events and callable transaction coverage.
  - `12.3 Ranking, Admin, and Paid Events`: Implemented, with documented ranking signals, complete admin audit coverage, paid usage/expiry events, and idempotent expiry handling.
- The product can answer provider-facing questions about views, contacts, response behavior, reviews, paid visibility, and moderation using trusted data.
- The engineering team can verify analytics behavior with repeatable commands and emulator-backed tests.
