# Section 9 Implementation Plan - Provider Dashboard

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 9.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 9.1-9.3.

Goal: make the provider dashboard fully implemented for Herafy v1 so approved providers can understand performance, paid visibility, coverage, and improvement guidance without exposing hidden ranking formulas.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 9.1 Performance Metrics | Partially implemented | Dashboard shows profile views, contacts, conversations, response rate, average first response, rating, and latest reviews. |
| 9.2 Paid/Coverage Controls | Partially implemented | Providers can request paid visibility and area expansion on `/visibility`, but the main dashboard does not summarize active paid status, expiry, current coverage, entitlement state, or request lifecycle detail. |
| 9.3 Ranking Logic Privacy | Implemented with missing regression coverage | UI shows general metrics and paid request copy, and exact formula weights are not rendered. |

## Current Implementation Evidence

- `src/router/app-router.tsx`
  - `/dashboard`, `/profile/edit`, and `/visibility` are under `ProtectedRoute role="provider"`.
  - Provider dashboard access is approval-gated through `ProtectedRoute`.
- `src/router/route-guards.tsx`
  - Provider-only routes redirect non-providers away.
  - Pending providers redirect to `/pending`.
- `src/layouts/provider-layout.tsx`
  - Provider navigation includes dashboard, profile edit, and paid visibility.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - Shows profile views from `provider.profileViews`.
  - Shows contacts, conversations, response rate, average first response, rating, and latest reviews.
  - Uses `getProviderMetrics(provider.data!.id)`.
  - Does not show active paid status, paid expiry, coverage summary, pending request summary, or general ranking guidance.
  - Does not render explicit loading/error states for provider or metrics queries.
- `src/services/analytics.service.ts`
  - Derives contacts from `providerContacts`.
  - Derives conversations and response behavior from messaging records.
  - Derives latest reviews from `getProviderReviews`.
  - Does not return profile views because those are read directly from the provider document.
  - Does not expose trend windows, event counts by day, or paid visibility usage events.
- `src/services/analytics.service.test.ts`
  - Covers demo contact, response, and review metrics.
  - Does not cover zero-conversation, unanswered-conversation, multi-conversation, hidden-review, or Firebase-shaped data cases.
- `src/features/providers/pages/provider-profile-page.tsx`
  - Calls `incrementProfileView(id, user?.uid)` when a profile page is opened.
- `src/services/firebase/providers.firebase.ts`
  - `incrementProfileView` performs a direct client `updateDoc` with `increment(1)`.
  - The write is swallowed if security rules deny it.
  - Session storage dedupes one view per browser session.
- `firestore.rules`
  - Provider owner updates only allow display and profile fields.
  - Client updates to `profileViews` are not owner-allowed.
  - This makes profile view tracking fragile in Firebase mode unless the write is admin/server-owned or rules are intentionally changed.
- `src/features/dashboard/pages/visibility-page.tsx`
  - Lets providers create paid visibility or area expansion requests.
  - Lists request status and request notes.
  - Uses a 30-review gate for area expansion.
  - Does not show active paid expiry, renewal/cancel controls, current coverage summary, or detailed request metadata.
- `src/services/firebase/visibility.firebase.ts`
  - Creates pending visibility requests with type `boost` or `area_expansion`.
  - Lists provider visibility requests ordered by `requestedAt`.
  - Does not create paid usage events or entitlement records.
- `src/services/firebase/admin.firebase.ts`
  - Admin approval sets `visibilityTier: paid` and `visibilityPaidUntil` for boost requests.
  - Admin approval appends a service area for area-expansion requests.
  - Approval is still a client Firestore transaction, not a callable.
- `src/types/provider.ts`
  - Provider has `visibilityTier`, `visibilityPaidUntil`, `profileViews`, `avgRating`, `reviewCount`, `activityScore`, and `serviceAreaKeys`.
  - Provider does not have `coverageRadiusKm`, `coverageAreaKeys`, paid entitlement history, or a last-view event timestamp.
- `src/types/visibility.ts`
  - Visibility requests have provider, type, tier, service area, status, payment fields, notes, and timestamps.
  - Visibility requests do not have product ID, price, duration, renewal, cancel state, or expiry entitlement fields.
- `src/lib/ranking.ts`
  - Exact scoring uses location, reputation, activity, paid bonus, and low-view fairness.
  - Dashboard does not import this scoring function.
  - There is no UI regression test proving exact weights stay hidden.
- `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`
  - Dashboard metric labels exist.
  - Visibility copy says paid visibility does not guarantee customers or jobs.
  - Copy does not explicitly say no top placement.
- `tests/e2e/app.spec.ts`
  - Verifies provider login reaches dashboard.
  - Mobile smoke verifies provider shell links are visible.
  - Does not verify dashboard metric cards, paid status, coverage panel, ranking privacy, or chart readability.
- `tests/rules/firestore.rules.test.ts`
  - Proves provider cannot set `visibilityTier` directly.
  - Proves provider-owned visibility request creation and admin-only request processing.
  - Does not prove profile view tracking succeeds through a trusted backend path.

## Product Decisions Needed Before Implementation

### Decision A - Dashboard source of truth for analytics

Recommended v1 decision: **profile views and interaction metrics should be written by trusted backend callables or server-owned event writers, then exposed to the dashboard through aggregates.**

Reason:

- Direct client writes to `providers/{providerId}.profileViews` are currently likely denied by rules.
- Swallowing denied writes keeps profile pages usable, but it can silently produce incorrect dashboard metrics.
- Section 12 already identifies analytics tracking as a platform requirement.

Implementation implication:

- Add a `trackProfileView` callable or equivalent trusted analytics write path.
- Keep the read model simple for v1 by updating `providers.profileViews` and optionally writing `providerEvents`.
- Do not let provider owners mutate analytics counters directly.

### Decision B - Where paid status belongs

Recommended v1 decision: **show active paid status and expiry on the main dashboard, while keeping request creation and detailed history on `/visibility`.**

Reason:

- The dashboard is the provider's daily home.
- A provider should not need to infer paid state from a request list.
- `/visibility` can remain the place for request creation, renewal, and request history.

Implementation implication:

- Add a dashboard paid visibility card.
- Show organic, active paid, expired paid, and pending request states.
- Link from the dashboard card to `/visibility`.

### Decision C - Coverage display scope

Recommended v1 decision: **show current service areas now, and add coverage radius once Section 2 chooses the coverage-radius model.**

Reason:

- Current provider documents already have `serviceAreaKeys` and `serviceAreas`.
- Section 2 still owns the missing `coverageRadiusKm` and `coverageAreaKeys` model.
- The Section 9 dashboard should not invent a separate coverage model.

Implementation implication:

- Show current service areas as the current coverage summary.
- Add clear copy that approved area-expansion requests add coverage.
- Once `coverageRadiusKm` exists, display radius and covered neighborhoods without exposing scoring weights.

### Decision D - Ranking guidance boundaries

Recommended v1 decision: **dashboard may show qualitative improvement guidance, but it must not show numeric ranking weights, score formulas, or exact paid boost values.**

Allowed examples:

- Complete profile details.
- Keep response time fast.
- Maintain visible reviews.
- Keep service areas accurate.
- Paid visibility is capped and does not guarantee top placement.

Disallowed examples:

- `locationScore = 100`.
- `paidBonus = 12`.
- `activityScore * 0.22`.
- Any combined provider ranking score.

## Target End State

Section 9 is complete when:

1. Approved providers can open `/dashboard` and see performance metrics without customer/admin access leakage.
2. Profile views are tracked through a trusted path and are accurate enough for provider reporting.
3. Contacts received include WhatsApp reveals and platform messages without duplicate inflation.
4. Response behavior metrics handle no conversations, unanswered conversations, and answered conversations clearly.
5. Reviews and ratings are visible on the dashboard with a clear empty state.
6. The dashboard shows current paid visibility status.
7. The dashboard shows paid visibility expiry when active.
8. The dashboard shows pending paid or area-expansion request state when relevant.
9. `/visibility` shows richer request history with type, area, status, requested date, processed date, notes, and rejection reason.
10. Providers can request service-area expansion from `/visibility` and understand eligibility.
11. Providers can understand current coverage from service areas and later radius/coverage keys.
12. Dashboard guidance explains general improvement levers without exposing exact ranking formulas.
13. Tests prove metrics, paid status, coverage display, ranking privacy, mobile rendering, route guards, and rules/callable behavior.
14. `npm run lint`, targeted tests, rules tests, e2e tests, and `npm run build` pass.

## Detailed Implementation Plan

## 9.1 Performance Metrics

### Requirements Covered

- `DASH-001`: Providers MUST be able to view profile views.
- `DASH-002`: Providers MUST be able to view contacts received.
- `DASH-003`: Providers MUST be able to view response behavior metrics.
- `DASH-004`: Providers MUST be able to view reviews and ratings.

### Current Implementation Evidence

- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - Renders metric cards for profile views, contacts, rating, conversations, response rate, and average first response.
  - Renders a bar chart for views, contacts, and rating.
  - Renders latest reviews.
- `src/services/analytics.service.ts`
  - Computes contacts, conversations, response rate, average first response, and latest reviews.
- `src/services/analytics.service.test.ts`
  - Verifies the happy path in demo mode.
- `src/services/firebase/providers.firebase.ts`
  - Attempts client-side profile view increments.
  - Catches and ignores failed writes.
- `firestore.rules`
  - Does not allow provider owners or anonymous users to update `profileViews`.

### Work Items

#### 9.1.1 Move profile view tracking to a trusted write path

Files:

- `functions/src/engagement.ts` or a new `functions/src/analytics.ts`.
- `functions/src/index.ts`.
- `src/services/contracts/providers.contract.ts`.
- `src/services/firebase/providers.firebase.ts`.
- `src/services/demo/providers.demo.ts`.
- `src/services/providers.service.ts`.
- `tests/rules/firestore.rules.test.ts`.
- `functions/test/*` or equivalent function tests.

Changes:

- Add callable `trackProfileView` with `providerId` input.
- Allow anonymous or authenticated viewers depending product policy.
- Reject non-approved providers for public view increments.
- Do not count views from the provider owner.
- Deduplicate by viewer/session when a stable viewer ID exists.
- Keep client session storage dedupe as a UX optimization, not as the only integrity control.
- Increment `providers.profileViews` server-side.
- Optionally write `providerEvents/{eventId}` with `type: profile_view`.
- Route Firebase adapter `incrementProfileView` through the callable.
- Keep demo adapter behavior compatible with existing offline mode.

Acceptance:

- Profile view increments succeed in Firebase mode without weakening provider owner write rules.
- Provider owners cannot directly mutate `profileViews`.
- A provider viewing their own profile does not inflate profile views.
- Failed analytics writes do not break profile viewing, but failures are observable in tests/logs.

#### 9.1.2 Strengthen provider metric aggregation

Files:

- `src/services/analytics.service.ts`.
- `src/services/analytics.service.test.ts`.
- `src/services/providers.service.test.ts`.
- Possible new `src/services/firebase/analytics.firebase.test.ts` if adapter tests are introduced.

Changes:

- Keep `contactsCount` based on normalized `contacts` records.
- Ensure WhatsApp reveal and platform message contacts count once per customer-provider-type path.
- Ensure response rate uses conversations that have at least one customer message.
- Ensure average first response ignores conversations with no provider reply.
- Decide whether latest reviews should include only visible reviews.
- Return stable zero/empty values for missing provider, no contacts, no conversations, and no reviews.

Acceptance:

- Empty provider metrics return `0`, `0%`, `null`, and empty latest reviews.
- Unanswered customer conversation reduces response rate.
- Multiple messages in one conversation do not double-count first response.
- Hidden or moderated reviews do not appear in latest dashboard reviews.

#### 9.1.3 Add dashboard loading, error, and empty states

Files:

- `src/features/dashboard/pages/provider-dashboard-page.tsx`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.
- Component tests if the project adds dashboard component testing.

Changes:

- Show a loading state while provider or metrics query is loading.
- Show a provider-not-found or pending-state fallback only if the route guard did not already handle it.
- Show a metrics error state with retry.
- Keep latest reviews empty state.
- Ensure chart does not render misleading rating as a count unless design accepts mixed units.

Acceptance:

- Dashboard does not flash zero metrics while data is loading.
- Dashboard error state is localized and retryable.
- Empty metrics are visually distinct from loading.
- Chart labels remain readable on mobile.

#### 9.1.4 Add dashboard metric UI tests

Files:

- `tests/e2e/app.spec.ts`.
- Optional component test under `src/features/dashboard/pages/*`.

Cases:

- Approved provider login lands on `/dashboard`.
- Dashboard shows views, contacts, rating, conversations, response rate, and average first response.
- Latest reviews section shows reviews when present.
- Latest reviews section shows empty copy when none exist.
- Mobile dashboard metric cards do not overlap or clip.

Acceptance:

- E2E proves provider can see the key metrics.
- Mobile smoke checks actual dashboard content, not only sidebar links.

### Tests for 9.1

Add or update:

- `npm test -- src/services/analytics.service.test.ts`.
- `npm test -- src/services/providers.service.test.ts`.
- `npm --prefix functions test` if callable tests exist.
- `npm run test:rules`.
- `npm run e2e -- tests/e2e/app.spec.ts` or `npm run e2e`.

## 9.2 Paid/Coverage Controls

### Requirements Covered

- `DASH-005`: Providers SHOULD be able to view active paid visibility status.
- `DASH-006`: Providers SHOULD be able to request/manage service-area expansion.
- `DASH-007`: Providers SHOULD be able to understand current coverage without seeing hidden ranking logic.

### Current Implementation Evidence

- `src/features/dashboard/pages/visibility-page.tsx`
  - Lets providers submit a paid visibility request for an existing area.
  - Lets eligible providers submit an area-expansion request for a new area.
  - Lists status and notes for provider requests.
- `src/services/firebase/visibility.firebase.ts`
  - Creates and lists visibility requests.
  - Detects area expansion based on whether the service area is already in `serviceAreaKeys`.
  - Enforces 30 reviews in the service layer.
- `firestore.rules`
  - Enforces provider-owned visibility request creation.
  - Enforces 30 reviews for area expansion.
  - Restricts processing to admins.
- `src/services/firebase/admin.firebase.ts`
  - Applies boost approval by setting paid tier and expiry.
  - Applies area-expansion approval by appending the service area.
- `src/types/provider.ts`
  - Provider stores active paid visibility fields and service area fields.

### Work Items

#### 9.2.1 Add paid visibility summary to provider dashboard

Files:

- `src/features/dashboard/pages/provider-dashboard-page.tsx`.
- `src/lib/ranking.ts` or a new `src/lib/visibility-status.ts`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.
- `src/services/visibility.service.ts`.

Changes:

- Add a dashboard card for paid visibility state.
- Show `Organic`, `Active paid`, `Expired paid`, or `Pending request`.
- Show `visibilityPaidUntil` when active.
- Show a link or button to `/visibility`.
- Show no-guarantee copy including no guaranteed leads, jobs, revenue, or top placement.
- Do not show exact paid ranking bonus or formula.

Acceptance:

- Active paid provider sees paid status and expiry.
- Expired paid provider sees organic/expired state, not active promotion.
- Organic provider sees a clear path to request paid visibility.
- Pending boost request is visible without requiring the provider to parse the full request list.

#### 9.2.2 Add coverage summary to provider dashboard

Files:

- `src/features/dashboard/pages/provider-dashboard-page.tsx`.
- `src/config/neighborhoods.ts`.
- `src/types/provider.ts` after Section 2 coverage model lands.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.

Changes:

- Show current service areas using localized neighborhood names.
- Show current coverage count.
- Show area expansion eligibility based on review count.
- Link to `/visibility` for expansion requests.
- Once Section 2 adds `coverageRadiusKm`, show radius and derived covered areas.
- Avoid showing scoring impact or ranking position.

Acceptance:

- Provider sees current approved service areas.
- Provider understands whether expansion is available.
- Provider sees enough coverage context to verify public discovery coverage.
- UI remains useful before and after radius implementation.

#### 9.2.3 Enrich visibility request history

Files:

- `src/features/dashboard/pages/visibility-page.tsx`.
- `src/types/visibility.ts`.
- `src/lib/display.ts`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.
- `src/services/visibility.service.test.ts`.

Changes:

- Display request type.
- Display service area.
- Display status.
- Display requested date.
- Display processed date if present.
- Display payment method.
- Display admin notes.
- Display rejection reason.
- Preserve whitespace for multi-line notes only where useful.
- Add empty state when no requests exist.
- Add loading and error states for request list.

Acceptance:

- Provider can distinguish boost requests from area-expansion requests.
- Provider can tell whether payment review is pending, approved, or rejected.
- Provider can see why a request was rejected.
- Provider can see when a request was processed.

#### 9.2.4 Add manage actions for pending and future paid states

Files:

- `src/features/dashboard/pages/visibility-page.tsx`.
- `src/services/contracts/visibility.contract.ts`.
- `src/services/firebase/visibility.firebase.ts`.
- `src/services/demo/visibility.demo.ts`.
- `firestore.rules`.
- Function files if cancellation becomes server-owned.

Recommended v1 scope:

- Add cancel for pending requests only if product wants providers to self-cancel.
- Do not add renewal or recurring billing until Section 13 paid-product decisions are implemented.
- Show renewal copy as disabled or "request again when expired" only if supported.

Acceptance:

- If cancel is included, provider can cancel only their own pending request.
- Approved and rejected requests are immutable to providers.
- Renewal/cancel UI never implies an unsupported billing subscription.

#### 9.2.5 Keep paid and area expansion mutations server-owned where possible

Files:

- `functions/src/*`.
- `src/services/firebase/admin.firebase.ts`.
- `firestore.rules`.
- `tests/rules/firestore.rules.test.ts`.
- Admin service tests.

Changes:

- Move admin visibility approval/rejection to callables when Section 7 or Section 10 server-owned admin work is scheduled.
- Preserve audit log creation.
- Persist paid approval event and paid expiry event if analytics event rows are added.
- Avoid loosening provider write rules for paid fields.

Acceptance:

- Providers cannot approve their own visibility.
- Providers cannot set paid tier, paid expiry, or service areas directly.
- Admin processing remains audited.

### Tests for 9.2

Add or update:

- `npm test -- src/services/visibility.service.test.ts`.
- `npm test -- src/services/admin.service.test.ts`.
- `npm test -- src/lib/ranking.test.ts`.
- `npm run test:rules`.
- `npm run e2e -- tests/e2e/app.spec.ts` or `npm run e2e`.

## 9.3 Ranking Logic Privacy

### Requirements Covered

- `DASH-008`: Provider dashboard MUST NOT expose exact ranking formulas.
- `DASH-009`: Provider dashboard MAY show general guidance such as profile completeness, responsiveness, reviews, and activity.

### Current Implementation Evidence

- `src/lib/ranking.ts`
  - Contains exact ranking weights and tie-breakers.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
  - Does not import `providerRankingScore` or render exact scores.
  - Does not currently render general ranking guidance either.
- `src/features/dashboard/pages/visibility-page.tsx`
  - Says payment does not guarantee customers or jobs.
  - Does not explicitly say no top placement.
- `docs/operations/admin-runbook.md`
  - Says paid visibility does not guarantee leads, jobs, ranking, or revenue.
- Existing tests do not assert that dashboard UI hides formula values.

### Work Items

#### 9.3.1 Add general guidance panel

Files:

- `src/features/dashboard/pages/provider-dashboard-page.tsx`.
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.

Guidance topics:

- Complete profile details and photos.
- Keep service areas accurate.
- Respond quickly to customer messages.
- Keep WhatsApp availability accurate.
- Earn genuine reviews through completed interactions.
- Paid visibility can increase exposure within caps.
- Paid visibility does not guarantee top placement.

Acceptance:

- Providers get actionable next steps.
- Copy stays qualitative.
- Copy does not reveal scoring weights.

#### 9.3.2 Add formula privacy regression tests

Files:

- `tests/e2e/app.spec.ts`.
- Optional component test for `ProviderDashboardPage`.

Cases:

- Dashboard does not contain `locationScore`.
- Dashboard does not contain `paidBonus`.
- Dashboard does not contain numeric formula fragments such as `0.22`, `12`, or `100` in ranking-context labels.
- Dashboard does not show a combined ranking score.
- Dashboard does show qualitative guidance.

Acceptance:

- Formula leakage fails tests.
- Qualitative guidance remains visible.

#### 9.3.3 Keep ranking implementation separate from dashboard presentation

Files:

- `src/lib/ranking.ts`.
- `src/features/dashboard/pages/provider-dashboard-page.tsx`.
- Optional `src/lib/dashboard-guidance.ts`.

Changes:

- Do not call `providerRankingScore` from dashboard UI.
- If guidance needs provider state, compute categories like `needsReviews`, `slowResponse`, or `incompleteProfile` without exposing exact weights.
- Keep score configuration internal or admin-only if ranking governance later adds a policy object.

Acceptance:

- Dashboard code does not import ranking score internals.
- Dashboard guidance remains stable if weights change.

### Tests for 9.3

Add or update:

- `npm run e2e -- tests/e2e/app.spec.ts`.
- `npm test -- src/lib/ranking.test.ts`.
- Optional dashboard component test.

## Cross-Section Dependencies

| Dependency | Why it matters | Section 9 handling |
|---|---|---|
| Section 2 coverage radius | Dashboard coverage summary should eventually show radius or derived covered areas. | Show current service areas now and add radius after Section 2 finalizes model. |
| Section 6 ranking governance | Dashboard must not leak scoring formula. | Add privacy tests and keep guidance qualitative. |
| Section 7 paid visibility | Dashboard status depends on paid tier, expiry, request history, and no-guarantee copy. | Surface active state and link to `/visibility`; do not build billing beyond existing model. |
| Section 8 service areas | Area expansion eligibility and approved areas affect coverage summary. | Reflect `serviceAreaKeys` and request state. |
| Section 10 admin processing | Visibility approval should become server-owned and audited. | Avoid weakening rules; plan for callable-backed approval. |
| Section 12 analytics | Profile views and paid usage events need trusted tracking. | Move profile views to callable/event path. |
| Section 14 mobile | Provider dashboard must be usable on mobile. | Add mobile e2e checks for cards, chart, coverage, and visibility panels. |

## Recommended Implementation Sequence

1. Add profile view callable and route Firebase tracking through it.
2. Strengthen analytics service tests for empty, unanswered, and multi-conversation cases.
3. Add dashboard loading/error states.
4. Add dashboard paid status summary.
5. Add dashboard coverage summary using current service areas.
6. Enrich `/visibility` request history.
7. Add general qualitative ranking guidance.
8. Add privacy regression tests.
9. Add mobile e2e coverage for dashboard and visibility pages.
10. Run full verification.

## Verification Commands

Run targeted checks during implementation:

```bash
npm test -- src/services/analytics.service.test.ts
npm test -- src/services/providers.service.test.ts
npm test -- src/services/visibility.service.test.ts
npm test -- src/services/admin.service.test.ts
npm test -- src/lib/ranking.test.ts
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
npm run lint
npm run build
```

Run release gate before marking complete:

```bash
npm run release:check
```

If function tests are added or changed:

```bash
npm --prefix functions test
npm --prefix functions run build
```

## Completion Checklist

- [ ] Profile views are tracked through a trusted backend path.
- [ ] Direct provider/client mutation of analytics counters remains blocked.
- [ ] Dashboard metrics handle loading, error, empty, and populated states.
- [ ] Contacts and response metrics have expanded service tests.
- [ ] Latest reviews are visible and filtered correctly.
- [ ] Dashboard shows active paid status and expiry.
- [ ] Dashboard shows organic, expired, and pending paid states.
- [ ] Dashboard links clearly to `/visibility`.
- [ ] Dashboard shows current service areas.
- [ ] Dashboard explains area expansion eligibility.
- [ ] `/visibility` request history shows type, area, status, requested date, processed date, notes, and rejection reason.
- [ ] Ranking guidance is qualitative and actionable.
- [ ] Dashboard never renders exact ranking weights, formulas, or combined ranking score.
- [ ] Mobile dashboard e2e checks pass.
- [ ] Rules tests prove paid fields and analytics counters are protected from provider mutation.
- [ ] Targeted unit/service tests pass.
- [ ] Lint, build, rules, and e2e pass.

## Effort Estimate

| Workstream | Estimate | Notes |
|---|---:|---|
| Trusted profile view callable and adapter changes | 1.0-1.5 days | Includes callable tests and rules verification. |
| Analytics service hardening and tests | 0.5-1.0 day | Mostly service-level cases. |
| Dashboard loading/error states and metric UI | 0.5 day | No major data model change. |
| Paid status summary | 0.5-1.0 day | Depends on request-state query design. |
| Coverage summary | 0.5 day now, plus 0.5-1.0 day after radius model | Initial service-area summary is simple. |
| Visibility request history enrichment | 0.5-1.0 day | Includes i18n and tests. |
| Ranking guidance and privacy tests | 0.5 day | Needs careful copy and assertions. |
| Mobile/e2e verification | 0.5-1.0 day | Depends on Playwright stability. |

Total expected effort: **4-7 engineering days**.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Profile view tracking remains client-write-based | Dashboard views may be silently wrong in Firebase mode. | Use callable/server-owned increment and keep rules restrictive. |
| Dashboard mixes metrics with different units in one chart | Providers may misread rating as activity volume. | Use separate cards or clearly labeled chart groups. |
| Paid status copy implies guaranteed placement | Legal/product trust risk. | Add explicit no top placement copy and tests. |
| Coverage model diverges from Section 2 | Dashboard may display coverage that search does not honor. | Use `serviceAreaKeys` now and adopt Section 2 coverage fields later. |
| Request history becomes hard to scan on mobile | Providers may miss rejected or pending states. | Use compact rows with clear badges and mobile e2e checks. |
| Formula privacy test is too brittle | Normal metric values could look like weights. | Assert against labels/code words and ranking-context text, not all numbers. |
| Admin visibility approval remains client transaction | Paid entitlement writes rely on client permissions and are harder to secure. | Schedule callable-backed admin approval in the paid/admin hardening workstream. |

## Definition of Done

Section 9 is done when:

- All `DASH-001` through `DASH-009` requirements are either implemented or explicitly downgraded by product decision.
- Provider dashboard metrics are accurate in demo mode and Firebase mode.
- Profile view tracking succeeds through trusted writes without weakening provider owner rules.
- Providers can see paid visibility state, expiry, pending request state, and current coverage.
- Providers can create and review service-area expansion requests with clear eligibility and status.
- Dashboard guidance helps providers improve quality without exposing ranking formulas.
- E2E covers approved provider dashboard access and mobile dashboard readability.
- Unit/service/rules/function tests cover analytics, visibility requests, paid field protection, and formula privacy.
- `npm run release:check` passes.

## Tracker Table

| ID | Area | Status | Primary files | Acceptance |
|---|---|---|---|---|
| DASH-9.1-001 | Profile views | Not started | `functions/src/*`, `providers.firebase.ts`, `providers.demo.ts` | Profile views increment through trusted path. |
| DASH-9.1-002 | Profile views rules | Not started | `firestore.rules`, `tests/rules/firestore.rules.test.ts` | Provider cannot mutate `profileViews` directly. |
| DASH-9.1-003 | Contacts metric | Partially done | `analytics.service.ts`, `analytics.service.test.ts` | Contacts are normalized and not duplicated. |
| DASH-9.1-004 | Response behavior | Partially done | `analytics.service.ts`, `analytics.service.test.ts` | Response rate/time handles empty, unanswered, and answered cases. |
| DASH-9.1-005 | Reviews and ratings | Partially done | `provider-dashboard-page.tsx`, `analytics.service.ts` | Latest visible reviews and rating render correctly. |
| DASH-9.1-006 | Dashboard states | Not started | `provider-dashboard-page.tsx`, i18n | Loading, error, retry, and empty states exist. |
| DASH-9.2-001 | Paid status card | Not started | `provider-dashboard-page.tsx`, `visibility.service.ts` | Active, expired, organic, and pending states are visible. |
| DASH-9.2-002 | Paid expiry | Not started | `provider-dashboard-page.tsx` | Active paid expiry is displayed. |
| DASH-9.2-003 | Coverage summary | Not started | `provider-dashboard-page.tsx`, `neighborhoods.ts` | Current service areas are visible. |
| DASH-9.2-004 | Expansion eligibility | Partially done | `visibility-page.tsx`, rules, service tests | Eligibility is visible and enforced. |
| DASH-9.2-005 | Request history | Partially done | `visibility-page.tsx`, `display.ts`, i18n | Type, area, status, dates, notes, and rejection reason are visible. |
| DASH-9.3-001 | Guidance panel | Not started | `provider-dashboard-page.tsx`, i18n | Qualitative improvement guidance is visible. |
| DASH-9.3-002 | Formula privacy | Not started | E2E/component tests | Exact ranking formula and weights are not exposed. |
| DASH-9.V-001 | Verification | Not started | tests and scripts | Targeted tests, rules, e2e, lint, build, and release gate pass. |

## Open Questions

1. Should profile view tracking count anonymous views, signed-in customer views only, or both with dedupe?
2. Should dashboard metrics show lifetime totals only, or also 7-day and 30-day windows?
3. Should active paid status be read only from `provider.visibilityPaidUntil`, or should a separate entitlement record become the source of truth?
4. Should providers be able to cancel pending paid visibility requests in v1?
5. Should area-expansion request history stay on `/visibility`, or should the dashboard show the latest request inline?
6. Should coverage radius wait for Section 2, or should Section 9 add a temporary service-area-only coverage summary now?
7. What exact wording should product approve for "paid visibility does not guarantee top placement"?
