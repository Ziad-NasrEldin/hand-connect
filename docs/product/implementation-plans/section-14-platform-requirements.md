# Section 14 Implementation Plan - Platform Requirements

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 14.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 14.1-14.4.

Goal: make Section 14 fully implemented and regression-protected across responsive behavior, search/contact performance, admin stability, expected peak readiness, and v1 product boundaries.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 14.1 Mobile Responsiveness | Partially implemented | Customer mobile search/contact and provider shell checks exist, major layouts use responsive grids, and a Capacitor iOS wrapper exists. Admin tablet/desktop coverage and deeper provider dashboard mobile coverage are still shallow. |
| 14.2 Performance | Implemented | Search filters clamp request limits, Firebase provider search uses `limit(maxSearchLimit)`, composite indexes exist, and search/contact E2E tests prove the primary path. Production timing instrumentation and seeded performance tests are missing. |
| 14.3 Stability | Partially implemented | Admin provider mutations use callables, release gates and admin runbook exist, rules tests cover protected writes, and E2E covers core admin/provider paths. Some privileged mutations still write directly from the client, peak availability is not demonstrated, and user-visible mutation error handling is uneven. |
| 14.4 Product Boundaries | Implemented | Product copy and code position Herafy as a directory and connection layer. Search, profile, contact, messaging, review, admin, and visibility flows exist, while booking, customer-provider payment, escrow, job assignment, and fulfillment tracking routes/services were not found. Boundary absence is not yet protected by automated negative tests. |

## Product Decisions Needed Before Implementation

### Decision A - Responsive Coverage Baseline

Recommended v1 decision: **treat customer search/contact as phone-required, provider dashboard as phone-supported, and admin as tablet/desktop-required.**

Reason:

- `PLATFORM-001` and `PLATFORM-002` are MUST requirements.
- `PLATFORM-003` and `PLATFORM-004` are SHOULD requirements.
- Current Playwright projects cover Desktop Chrome and Pixel 7 only.
- Admin workflows are operationally dense and should not be forced into full phone-first ergonomics for v1 unless product explicitly requires it.

Implementation implication:

- Keep Pixel 7 coverage for customer search/contact and provider shell.
- Add iPad/tablet coverage for admin pages.
- Add targeted provider dashboard mobile screenshots or assertions for the dashboard and paid visibility pages.
- Do not block v1 on full phone optimization for every admin table if tablet and desktop are proven.

### Decision B - Performance Success Threshold

Recommended v1 decision: **prove entry-to-provider-contact under 60 seconds with deterministic browser smoke timing, and add technical timing budgets for search.**

Reason:

- `PLATFORM-005` defines an outcome: contact in under 60 seconds from entry to provider contact.
- Current implementation likely satisfies this in demo/E2E, but the test does not assert elapsed time or capture timing evidence.
- A full production load test is useful but not necessary to satisfy the core v1 customer outcome.

Implementation implication:

- Add E2E timing assertions for landing/search/provider/contact.
- Add a seeded search dataset test that proves search remains bounded and responsive with more than the default demo providers.
- Add lightweight client timing events for search start, search result render, provider profile render, WhatsApp reveal, and message start.

### Decision C - Admin Mutation Ownership

Recommended v1 decision: **server-owned callables should own all privileged state transitions that affect approval, moderation, visibility, account status, professions, and policy-like settings.**

Reason:

- Provider approval/rejection/suspension already moved to callables.
- Review hiding also uses a callable.
- Visibility approval/rejection, report resolution, account ban/unban, and profession management still perform direct client Firestore writes in `src/services/firebase/admin.firebase.ts`.
- Client-side admin writes can be rules-guarded, but callables provide more consistent validation, transactionality, audit writes, and failure messages.

Implementation implication:

- Move remaining privileged mutations to `functions/src/*` callables.
- Keep Firestore rules as defense in depth.
- Update admin service methods to call functions instead of writing privileged state directly.
- Add callable tests and E2E/UI error-state tests for each admin mutation group.

### Decision D - Product Boundary Enforcement

Recommended v1 decision: **add a product-boundary regression test and keep Section 15 out-of-scope terms explicitly forbidden in routes, labels, and service names.**

Reason:

- Current compliance depends mostly on absence and copy.
- Future feature work could accidentally introduce booking, payments, escrow, job assignment, or fulfillment tracking.
- A lightweight static test is enough to catch most accidental boundary regressions early.

Implementation implication:

- Add a test that scans route config, visible navigation labels, service filenames, and feature directories for forbidden marketplace-operation surfaces.
- Keep allowed exceptions for docs and SRS text.
- Add E2E assertions that search cards open provider profiles and do not auto-assign or start service delivery.

## Target End State

Section 14 is complete when:

1. Customer search and provider contact are proven usable on phone viewport.
2. Provider dashboard and paid visibility pages are proven usable on phone viewport.
3. Admin dashboard, applications, providers, professions, visibility, reports, and audit pages are proven usable on desktop and tablet viewports.
4. Responsive checks include no obvious horizontal overflow, clipped primary controls, or overlapping critical text.
5. Search and contact path can complete under 60 seconds in E2E from app entry to provider contact.
6. Search requests remain bounded in filter normalization, service contracts, Firebase queries, and result slicing.
7. Search/contact paths avoid unnecessary blocking operations.
8. Production or staging timing instrumentation exists for search result render and contact action completion.
9. Admin approval, moderation, profession, and paid visibility workflows have stable server-owned mutation paths or documented temporary exceptions.
10. Critical mutation failures show clear user-facing errors and do not leave stale success UI or stuck loading states.
11. Release gates cover unit tests, rules tests, build, and E2E.
12. Peak-readiness checks define expected v1 load, seeded search/admin data, and monitoring thresholds.
13. Product boundaries remain directory-first and connection-only.
14. No booking, scheduling, customer-provider payment, escrow, job assignment, or job tracking surface can be introduced silently.

## Detailed Implementation Plan

## 14.1 Mobile Responsiveness

### Requirements Covered

- `PLATFORM-001`: Web UI must be mobile-responsive.
- `PLATFORM-002`: Core customer contact flow must be usable on mobile.
- `PLATFORM-003`: Core provider dashboard screens should be usable on mobile.
- `PLATFORM-004`: Core admin screens should be usable on desktop and tablet at minimum.

### Current Implementation Evidence

- `playwright.config.ts`
  - Defines `chromium` with Desktop Chrome.
  - Defines `mobile-chrome` with Pixel 7.
- `tests/e2e/app.spec.ts`
  - Checks Arabic RTL landing and search flow.
  - On mobile, asserts search filter stacking and result card CTA placement.
  - Checks provider profile contact buttons are visible on mobile.
  - Checks mobile auth and provider shell navigation remains readable.
- `src/features/search/pages/search-page.tsx`
  - Uses responsive filter grid: single column by default, two columns at `md`.
  - Uses responsive result grid: single column by default, two columns at `md`.
  - Uses stacked CTA layout on small screens.
- `src/features/providers/pages/provider-profile-page.tsx`
  - Uses a single-column layout until `xl`, then adds a contact side panel.
  - Primary WhatsApp and message buttons are full-width on small screens.
- `src/layouts/provider-layout.tsx`
  - Uses horizontal overflow nav on smaller screens and a sidebar on `lg`.
- `src/layouts/admin-layout.tsx`
  - Uses horizontal overflow nav on smaller screens and a sidebar on `lg`.
- `package.json`
  - Includes Capacitor dependencies and `cap:sync:ios`, which supports wrapper deployment but does not itself prove native-quality responsiveness.

### Gaps

- Admin pages do not have tablet-specific E2E coverage.
- Provider dashboard page content is not deeply checked on mobile beyond shell navigation.
- The current E2E suite has no generic horizontal-overflow or clipped-critical-control assertion.
- No screenshot baseline or visual regression artifact is generated for admin and provider layouts.
- Playwright has no iPad/tablet project.

### Work Items

#### 14.1.1 Add tablet Playwright project

Files:

- `playwright.config.ts`

Changes:

- Add a project such as `tablet-chrome` using an iPad or comparable tablet viewport.
- Keep existing `chromium` and `mobile-chrome` projects.
- Use the same base URL and web server config.

Acceptance:

- `npm run e2e -- --project=tablet-chrome` runs admin/tablet tests.
- Existing desktop and mobile projects continue to run.

#### 14.1.2 Add admin tablet/desktop coverage

Files:

- `tests/e2e/app.spec.ts`

Cases:

- Admin can log in and land on `/admin`.
- Admin can open `/admin/applications`.
- Admin can open `/admin/providers`.
- Admin can open `/admin/professions`.
- Admin can open `/admin/visibility`.
- Admin can open `/admin/reports`.
- Admin can open `/admin/actions`.
- Each page shows its primary heading or primary table/list surface.
- On tablet, the admin nav remains visible and does not hide primary actions.

Acceptance:

- Desktop and tablet projects pass.
- No critical admin action button is off-screen or unreachable.
- No horizontal document overflow is present on tablet.

#### 14.1.3 Add provider dashboard mobile coverage

Files:

- `tests/e2e/app.spec.ts`

Cases:

- Provider logs in on `mobile-chrome`.
- `/dashboard` shows provider dashboard heading and key metrics/content without overlap.
- `/profile/edit` shows the edit form with primary submit controls reachable.
- `/visibility` shows paid visibility request entry points and current status content.
- Provider shell nav can scroll horizontally if needed without clipping link text.

Acceptance:

- Provider dashboard screens are usable on phone viewport.
- The test checks at least one control below the fold through scrolling, not only initial render.

#### 14.1.4 Add reusable viewport quality assertions

Files:

- `tests/e2e/app.spec.ts`, or a new helper under `tests/e2e/helpers`.

Checks:

- `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`.
- Header and shell nav height stay within reasonable bounds.
- Primary buttons and links have non-zero bounding boxes.
- Primary controls are not covered by another element at their center point.

Acceptance:

- Customer search, provider profile, provider dashboard, and admin pages all run this check.
- Intentional horizontal nav overflow remains scoped to the nav element and does not create page-level overflow.

#### 14.1.5 Capture responsive proof artifacts

Files:

- `tests/e2e/app.spec.ts`
- Optional generated screenshots under the normal Playwright output directory.

Changes:

- Use `testInfo.attach` or Playwright screenshots on failure for customer search, provider dashboard, and admin tablet pages.
- Do not commit generated screenshots unless the project later adopts visual snapshots.

Acceptance:

- Failed responsive tests provide enough visual proof to diagnose layout issues.

### Tests for 14.1

Run:

```bash
npm run e2e -- --project=mobile-chrome
npm run e2e -- --project=chromium
npm run e2e -- --project=tablet-chrome
```

Expected result:

- Customer search/contact mobile flow passes.
- Provider dashboard mobile flow passes.
- Admin desktop/tablet navigation and page checks pass.
- No page-level horizontal overflow is detected on covered routes.

## 14.2 Performance

### Requirements Covered

- `PLATFORM-005`: Search should return results fast enough to support contact in under 60 seconds from entry to provider contact.
- `PLATFORM-006`: Search queries must use bounded limits or pagination.
- `PLATFORM-007`: The system should avoid unnecessary blocking operations on customer search/contact paths.

### Current Implementation Evidence

- `src/lib/search-filters.ts`
  - `defaultSearchLimit` is 20.
  - `maxSearchLimit` is 50.
  - `normalizeSearchLimit` clamps finite limits to the range 1-50.
- `src/services/firebase/search.firebase.ts`
  - Provider search filters by approved status, profession, and service area.
  - Query uses `firestoreLimit(maxSearchLimit)`.
  - Ranked results are sliced to `input.limit`.
- `firestore.indexes.json`
  - Includes composite provider index for `status`, `profession`, `serviceAreaKeys`, and `avgRating`.
  - Includes indexes for conversations, reviews, contacts, reports, professions, and visibility requests.
- `src/services/search.service.test.ts`
  - Covers invalid filter recovery.
  - Covers bounded ranked results for requested limit.
- `tests/e2e/app.spec.ts`
  - Covers landing to search to provider profile.
  - Covers customer login, WhatsApp reveal, and message start.
- `vite.config.ts`
  - Defines manual chunks for Firebase, UI, charts, i18n, and vendor.
  - Sets chunk warning limit to 600.

### Gaps

- No test asserts the 60-second entry-to-contact product outcome.
- No seeded large dataset search test exists.
- No client timing instrumentation exists for search result render or contact action completion.
- No production monitoring threshold is documented.
- Search still fetches up to `maxSearchLimit` and ranks client-side, which is acceptable for v1 but needs a migration plan if provider density grows.

### Work Items

#### 14.2.1 Add entry-to-contact E2E timing assertion

Files:

- `tests/e2e/app.spec.ts`

Case:

- Start timer at app entry or `/`.
- Navigate to search.
- Select or use default filters.
- Open the chosen provider.
- Login if the flow requires it, or start from an authenticated customer depending on product expectation.
- Reveal WhatsApp or start in-app message.
- Assert elapsed time is under 60 seconds in demo mode.

Acceptance:

- Test fails if the default customer contact path exceeds 60 seconds.
- Timing assertion excludes setup that end users would not experience, such as test data reset.

#### 14.2.2 Add search timing instrumentation

Files:

- `src/features/search/pages/search-page.tsx`
- `src/features/providers/pages/provider-profile-page.tsx`
- `src/services/analytics.service.ts`
- `src/services/contracts/analytics.contract.ts`
- Demo/Firebase analytics adapters if present.

Events:

- `search_started`.
- `search_results_rendered`.
- `provider_profile_rendered`.
- `whatsapp_revealed`.
- `conversation_started`.

Fields:

- route.
- profession.
- neighborhood.
- result count.
- duration milliseconds.
- data source.
- no raw customer location coordinates.

Acceptance:

- Demo mode records events without network dependency.
- Firebase/production adapter can send or log timing events without blocking the search/contact path.
- Failure to record analytics does not block contact.

#### 14.2.3 Add seeded performance test

Files:

- `src/services/search.service.test.ts`
- Optional helper under `src/services/demo/`.

Case:

- Seed more than `maxSearchLimit` approved providers for one profession/neighborhood.
- Include paid and organic providers.
- Include providers with varied rating, review count, activity, and profile views.
- Search with an excessive requested limit.
- Assert returned results are capped.
- Assert ranking completes within a small deterministic local budget.

Acceptance:

- Test proves search behavior is bounded even with more data than the default demo seed.
- Test is deterministic and does not depend on real network or Firebase.

#### 14.2.4 Add Firebase adapter bounded-query test

Files:

- New Firebase adapter test if the project has a pattern, or rules/emulator-backed test if practical.
- `src/services/firebase/search.firebase.ts` if a tiny testability seam is needed.

Case:

- Verify Firebase query path uses the hard max and cannot request unbounded data.
- Keep the existing `normalizeSearchLimit` unit coverage.

Acceptance:

- A future removal of `firestoreLimit(maxSearchLimit)` is caught.

#### 14.2.5 Document production performance thresholds

Files:

- `docs/operations/admin-runbook.md`, or a new operations note if Section 14 implementation later allows doc updates outside this planning task.

Recommended thresholds:

- Search result render p75 under 2 seconds.
- Search result render p95 under 5 seconds.
- Provider profile render p95 under 5 seconds.
- Contact action completion p95 under 5 seconds after authentication.
- Entry-to-contact E2E demo path under 60 seconds.

Acceptance:

- Release owners know what to watch after deployment.
- Thresholds are tied to product requirements, not generic web metrics alone.

### Tests for 14.2

Run:

```bash
npm test -- src/lib/search-filters.test.ts src/services/search.service.test.ts
npm run e2e -- tests/e2e/app.spec.ts
npm run build
```

Expected result:

- Search limit tests pass.
- Seeded performance test passes.
- Entry-to-contact timing assertion passes.
- Build succeeds and chunk warnings remain known or are remediated.

## 14.3 Stability

### Requirements Covered

- `PLATFORM-008`: Admin operations must be stable enough for approval, moderation, profession, and paid visibility workflows.
- `PLATFORM-009`: The system should maintain availability during expected peak usage.
- `PLATFORM-010`: Critical mutation failures must show clear errors and avoid partial inconsistent UI states where possible.

### Current Implementation Evidence

- `package.json`
  - `release:check` runs lint, Vitest, rules tests, build, and Playwright E2E.
  - `test:rules` runs Firestore and Storage rules tests under Firebase emulators.
- `docs/operations/admin-runbook.md`
  - Documents provider applications, professions, visibility requests, abuse reports, account bans, audit log review, and release checks.
- `functions/src/providers.ts`
  - `approveProvider`, `rejectProvider`, and `suspendProvider` are HTTPS callables.
  - Admin access is checked server-side.
  - Mutations run inside transactions and create admin action records.
- `src/services/firebase/admin.firebase.ts`
  - Provider approval/rejection/suspension call functions.
  - Review hiding calls a function.
  - Visibility approval/rejection, report resolution, account ban/unban, and profession writes are still direct Firestore writes with local audit writes.
- `tests/rules/firestore.rules.test.ts`
  - Covers provider visibility and owner-safe updates.
  - Covers admin direct moderation writes.
  - Covers account bans and banned-user write blocks.
  - Covers provider visibility requests and admin-only processing.
  - Covers blocked direct review creation and conversation mutation constraints.
- `tests/e2e/app.spec.ts`
  - Covers provider and admin role routes.
  - Covers provider join request and admin application visibility.
- `functions/test/providers.test.ts`, `functions/test/reviews.test.ts`, and `functions/test/visibility.test.ts`
  - Functions test coverage exists for server logic.

### Gaps

- Some privileged admin mutations still rely on direct client Firestore writes.
- Admin error states are likely handled inconsistently by page-level mutations.
- No peak availability or load-shaped test exists.
- No documented expected peak usage model exists.
- No monitoring checklist exists for critical mutation failure rates.
- `adminActions` can still be created directly by admin clients by rules design, which may be acceptable temporarily but is weaker than server-owned audit writes.

### Work Items

#### 14.3.1 Define expected v1 peak profile

Files:

- Planning docs or operations docs in a later implementation task.

Define:

- Expected concurrent customer search users.
- Expected daily searches.
- Expected daily contact actions.
- Expected daily provider applications.
- Expected daily admin actions.
- Expected provider count and max providers per profession/neighborhood.

Recommended starting assumption:

- Use conservative Cairo launch assumptions until real analytics exist.
- Size tests around the largest expected single profession/neighborhood density.

Acceptance:

- `PLATFORM-009` can be tested against a named load profile rather than an undefined peak.

#### 14.3.2 Move visibility approval/rejection to callables

Files:

- `functions/src/visibility.ts`
- `functions/src/index.ts`
- `functions/test/visibility.test.ts`
- `src/services/firebase/admin.firebase.ts`
- `src/firebase/functions.ts`

Changes:

- Implement `approveVisibilityRequest` callable.
- Implement `rejectVisibilityRequest` callable.
- Validate active admin server-side.
- Validate request exists and is pending.
- For boosts, update provider `visibilityTier` and `visibilityPaidUntil`.
- For area expansion, update provider service areas transactionally.
- Write admin action in the same transaction.
- Return stable error codes.

Acceptance:

- Client admin service calls functions.
- No client transaction directly approves visibility.
- Functions tests cover success, non-admin rejection, missing request, non-pending request, and area expansion.

#### 14.3.3 Move report resolution to callable

Files:

- `functions/src/abuse.ts`
- `functions/src/index.ts`
- `functions/test/abuse.test.ts` or existing test file.
- `src/services/firebase/admin.firebase.ts`

Changes:

- Implement `resolveReport` callable.
- Validate active admin server-side.
- Validate report exists and is open.
- Store `resolvedBy`, `resolvedAt`, and `resolutionReason`.
- Write admin action in the same transaction or same callable operation.

Acceptance:

- Report resolution cannot be partially updated without audit.
- Client receives stable localized error codes.

#### 14.3.4 Move account ban/unban to callable

Files:

- `functions/src/abuse.ts` or `functions/src/users.ts`
- `functions/src/index.ts`
- Functions tests.
- `src/services/firebase/admin.firebase.ts`

Changes:

- Implement `setUserBanned` callable.
- Validate active admin server-side.
- Validate target user exists.
- Prevent banning the acting admin's own account unless product explicitly allows a break-glass flow.
- Update status and ban metadata.
- Write admin action.

Acceptance:

- Account status changes are server-owned and audited.
- Banned user write blocks continue passing in rules tests.

#### 14.3.5 Move profession management to callables

Files:

- `functions/src/professions.ts`
- `functions/src/index.ts`
- Functions tests.
- `src/services/firebase/admin.firebase.ts`
- `src/services/firebase/search.firebase.ts` if read behavior changes.

Changes:

- Implement `saveProfession` callable.
- Implement `setProfessionActive` callable.
- Validate active admin server-side.
- Validate slug, Arabic name, English name, icon, active state, and sort order.
- Prevent duplicate active slugs if the data model permits risk.
- Write admin actions server-side.

Acceptance:

- Providers and customers cannot mutate professions.
- Admin profession changes remain auditable.
- Search still lists only active professions.

#### 14.3.6 Add admin mutation error-state tests

Files:

- Admin page component tests if available, or `tests/e2e/app.spec.ts`.
- Admin pages under `src/features/admin/pages/*`.
- Locale files if missing error copy.

Cases:

- Provider approval failure shows clear error and does not remove the application as if approved.
- Visibility approval failure shows clear error and keeps pending status visible.
- Report resolution failure shows clear error and keeps report open.
- Profession save failure shows clear error and preserves entered form values.
- Account ban failure shows clear error and does not show success state.

Acceptance:

- Critical mutation failures are visible.
- UI never shows success unless the mutation actually completed.
- Loading/disabled state is cleared on failure.

#### 14.3.7 Add peak-shaped seeded smoke

Files:

- New test or script under `scripts/` or `tests/performance/` if the project adopts one.
- Keep it lightweight and deterministic for CI if possible.

Scenario:

- Seed a large but realistic number of providers across professions and neighborhoods.
- Run search for the densest profession/neighborhood.
- Run provider profile fetch.
- Run contact action with callable limits.
- Run admin list pages with realistic pending counts.

Acceptance:

- Test completes within an agreed local/CI budget.
- Search remains bounded.
- Admin list pages do not fetch unbounded related data without need.

### Tests for 14.3

Run:

```bash
npm --prefix functions test
npm --prefix functions run build
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
npm run release:check
```

Expected result:

- Functions tests pass.
- Rules tests pass.
- Admin and provider E2E paths pass.
- Release gate passes.
- Critical mutation failure cases have visible error assertions.

## 14.4 Product Boundaries

### Requirements Covered

- `PLATFORM-011`: The system must keep clear boundaries between directory discovery and service delivery.
- `PLATFORM-012`: The system must not introduce marketplace operations outside approved v1 scope.

### Current Implementation Evidence

- `docs/app-store/listing.md`
  - States Herafy is a connection layer.
  - States Herafy does not employ providers, assign jobs, process payments, set prices, or guarantee service outcomes.
- `docs/app-store/reviewer-notes.md`
  - States Herafy helps users discover and contact providers directly.
  - States it does not sell services in-app, process payments, assign providers, set prices, employ providers, or guarantee outcomes.
- `docs/operations/admin-runbook.md`
  - States provider approval is identity review only, not skill certification.
  - States paid visibility gives exposure only and does not guarantee leads, jobs, ranking, or revenue.
- `src/features/search/pages/search-page.tsx`
  - Search result cards link to provider profiles.
  - Search does not auto-assign providers.
- `src/features/providers/pages/provider-profile-page.tsx`
  - Contact actions are WhatsApp reveal and in-app messaging.
  - Profile copy includes no-guarantee messaging.
- Repo search evidence
  - Product docs mention out-of-scope terms.
  - No implemented route/service surface for booking, scheduling, customer-provider checkout, escrow, job assignment, or job fulfillment tracking was found.

### Gaps

- Product boundary is mostly protected by absence and copy.
- No automated test scans implemented routes/features for forbidden surfaces.
- No E2E assertion proves search/contact remains user-selected rather than auto-assigned.
- Future paid visibility work could drift into service payment or marketplace operation wording without a guard.

### Work Items

#### 14.4.1 Add product-boundary static regression test

Files:

- New test such as `src/lib/product-boundaries.test.ts` or `tests/product-boundaries.test.ts`.

Scan targets:

- `src/config/routes.ts`.
- `src/router/app-router.tsx`.
- `src/features/**`.
- `src/services/**`.
- `functions/src/**`.
- User-visible locale keys if practical.

Forbidden implemented-surface terms:

- booking.
- schedule.
- appointment.
- checkout.
- payment route for customer-provider transaction.
- escrow.
- commission on jobs.
- job assignment.
- job tracking.
- fulfillment.
- dispatch.

Allowed exceptions:

- Product docs and SRS files.
- Paid visibility request/payment confirmation terminology when clearly admin/provider visibility-only.
- Test files that define the forbidden list.

Acceptance:

- The test fails if a new route, feature folder, service name, or visible label introduces out-of-scope marketplace operations.
- The test has explicit allowlist entries for approved v1 visibility monetization terms.

#### 14.4.2 Add E2E user-choice boundary test

Files:

- `tests/e2e/app.spec.ts`

Case:

- Open search.
- Click a specific provider card.
- Assert the exact provider profile opens.
- Assert no conversation is created before the user chooses message.
- Assert no WhatsApp number or external link is revealed before the user chooses reveal.
- Assert no booking/payment/job confirmation CTA exists on search or profile.

Acceptance:

- Directory-first browsing remains user-selected.
- Contact remains explicit.
- Service delivery is not implied by the UI.

#### 14.4.3 Add boundary assertions to paid visibility tests

Files:

- `src/lib/ranking.test.ts`.
- `src/services/visibility.service.test.ts`.
- Functions visibility tests.
- Product-boundary static test.

Cases:

- Paid visibility can affect exposure only inside the defined ranking cap.
- Paid visibility does not create a customer charge.
- Paid visibility approval does not create a job, booking, lead guarantee, service payment, or service delivery record.
- Area expansion approval only updates provider service area eligibility.

Acceptance:

- Monetization remains provider visibility-based.
- Section 13 and Section 14 boundaries stay aligned.

#### 14.4.4 Add copy regression checks for boundary language

Files:

- Locale files under `src/i18n/locales/`.
- Product-boundary test.

Checks:

- Provider profile no-guarantee copy remains present.
- Paid visibility copy says no guaranteed leads, jobs, revenue, or top placement after Section 7 work completes.
- App does not describe itself as a payment processor, employer, job assignment system, or service guarantor.

Acceptance:

- Critical boundary copy cannot disappear silently.

### Tests for 14.4

Run:

```bash
npm test -- src/lib/product-boundaries.test.ts
npm test -- src/lib/ranking.test.ts src/services/visibility.service.test.ts
npm run e2e -- tests/e2e/app.spec.ts
```

Expected result:

- Forbidden-surface static scan passes.
- Directory-first E2E boundary test passes.
- Paid visibility boundary tests pass.

## Cross-Section Work Items

### 14.X.1 Keep Section 14 aligned with Sections 2, 7, 10, 11, 12, 13, and 15

Reason:

- Platform responsiveness depends on Section 2 search/contact.
- Platform stability depends on Section 10 admin, Section 11 abuse, and Section 12 audit/rules.
- Product boundaries depend on Section 13 monetization and Section 15 out-of-scope enforcement.

Acceptance:

- Section 14 tests should not duplicate all downstream business logic.
- Section 14 should reference and reuse targeted tests from those sections where possible.

### 14.X.2 Update implementation map only after verified implementation

Files:

- `docs/product/herafy-srs-implementation-map.md`.

Acceptance:

- Do not mark 14.1 or 14.3 implemented until responsive/admin stability gaps are actually verified.
- Keep 14.2 implemented if performance instrumentation is considered hardening rather than requirement completion.
- Keep 14.4 implemented but add regression coverage notes once tests exist.

## Verification Commands

Use these commands for the final Section 14 completion pass:

```bash
npm test -- src/lib/search-filters.test.ts src/services/search.service.test.ts src/lib/ranking.test.ts
npm test -- src/lib/product-boundaries.test.ts
npm --prefix functions test
npm --prefix functions run build
npm run test:rules
npm run e2e
npm run build
npm run lint
npm run release:check
```

Notes:

- `npm run release:check` already runs lint, full Vitest, rules tests, build, and E2E.
- Run targeted tests first while implementing.
- Run the full release gate after all Section 14 work items are complete.

## Completion Checklist

- [ ] Tablet Playwright project exists.
- [ ] Customer mobile search/contact flow is verified.
- [ ] Provider mobile dashboard and visibility flows are verified.
- [ ] Admin desktop/tablet core pages are verified.
- [ ] Responsive tests check page-level overflow and critical control visibility.
- [ ] Entry-to-contact E2E timing assertion proves under 60 seconds in demo mode.
- [ ] Search remains bounded in filters, service input, Firebase query, and result slicing.
- [ ] Search/contact timing instrumentation exists and is non-blocking.
- [ ] Seeded search performance test exists.
- [ ] Expected v1 peak profile is documented.
- [ ] Visibility approval/rejection is server-owned or explicitly accepted as a temporary client-write exception.
- [ ] Report resolution is server-owned or explicitly accepted as a temporary client-write exception.
- [ ] Account ban/unban is server-owned or explicitly accepted as a temporary client-write exception.
- [ ] Profession management is server-owned or explicitly accepted as a temporary client-write exception.
- [ ] Critical admin mutation failures show clear errors.
- [ ] Product-boundary static regression test exists.
- [ ] Directory-first E2E boundary test exists.
- [ ] Paid visibility boundary assertions exist.
- [ ] Full release gate passes.

## Effort Estimate

| Workstream | Estimate | Notes |
|---|---:|---|
| Responsive Playwright coverage | 1.0-1.5 days | Add tablet project, admin route checks, provider mobile checks, overflow helper. |
| Performance hardening | 1.0-2.0 days | Add timing E2E, seeded search test, lightweight instrumentation. |
| Admin callable migration | 3.0-5.0 days | Visibility, reports, account bans, professions, server tests, client wiring, rules review. |
| Admin error-state hardening | 1.0-2.0 days | Depends on page mutation patterns and localization gaps. |
| Product-boundary regression tests | 0.5-1.0 day | Static scan plus E2E user-choice assertions. |
| Final verification and map update | 0.5 day | Run release gate and update implementation map only after implementation. |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Admin callable migration changes production security behavior | High | Keep rules tests, add callable tests first, migrate one mutation group at a time. |
| Static forbidden-term scan creates noisy false positives | Medium | Scope scan to implemented app surfaces and keep a narrow allowlist. |
| E2E timing test is flaky in CI | Medium | Use generous product threshold, measure user path only, avoid asserting tiny technical budgets in browser E2E. |
| Tablet coverage reveals real admin layout overflow | Medium | Fix layout in the owning page rather than weakening tests. |
| Analytics instrumentation blocks customer path | High | Make analytics fire-and-forget and test failure does not block contact. |
| Existing admin direct writes are intentionally allowed by rules | Medium | Treat rules as defense in depth after callables, and update tests to reflect server-owned target behavior. |

## Definition of Done

Section 14 is done when all of the following are true:

- Responsive coverage proves customer, provider, and admin v1 core surfaces at their required viewports.
- Search and contact performance is bounded, measured, and proven against the 60-second product outcome.
- Admin mutation workflows are stable, auditable, and have visible failure behavior.
- Expected peak usage has a named test/monitoring model.
- Product boundaries are enforced by automated tests, not only current absence.
- `npm run release:check` passes after the Section 14 implementation.
- `docs/product/herafy-srs-implementation-map.md` is updated only after verified completion.

## Implementation Tracker

| ID | Area | Task | Status | Primary files | Verification |
|---|---|---|---|---|---|
| PLATFORM-14.1-001 | Responsive | Add tablet Playwright project. | Not started | `playwright.config.ts` | `npm run e2e -- --project=tablet-chrome` |
| PLATFORM-14.1-002 | Responsive | Add admin tablet/desktop route coverage. | Not started | `tests/e2e/app.spec.ts` | Admin pages visible without overflow. |
| PLATFORM-14.1-003 | Responsive | Add provider dashboard mobile coverage. | Not started | `tests/e2e/app.spec.ts` | Provider dashboard/profile/visibility usable on Pixel 7. |
| PLATFORM-14.1-004 | Responsive | Add reusable overflow/control visibility assertions. | Not started | `tests/e2e/app.spec.ts` or helper | Covered pages have no page-level horizontal overflow. |
| PLATFORM-14.2-001 | Performance | Add entry-to-contact timing assertion. | Not started | `tests/e2e/app.spec.ts` | Contact completed under 60 seconds. |
| PLATFORM-14.2-002 | Performance | Add search/contact timing instrumentation. | Not started | Search/profile pages, analytics service | Events recorded without blocking UI. |
| PLATFORM-14.2-003 | Performance | Add seeded search performance test. | Not started | `src/services/search.service.test.ts` | Search remains bounded under dense seed. |
| PLATFORM-14.2-004 | Performance | Add Firebase bounded-query regression. | Not started | Firebase search tests | Hard max query limit protected. |
| PLATFORM-14.3-001 | Stability | Define expected v1 peak profile. | Not started | Operations doc or planning note | Peak profile documented. |
| PLATFORM-14.3-002 | Stability | Move visibility approval/rejection to callables. | Not started | `functions/src/visibility.ts`, admin Firebase service | Functions and E2E pass. |
| PLATFORM-14.3-003 | Stability | Move report resolution to callable. | Not started | `functions/src/abuse.ts`, admin Firebase service | Callable test passes. |
| PLATFORM-14.3-004 | Stability | Move account ban/unban to callable. | Not started | Functions user/abuse module, admin Firebase service | Callable and rules tests pass. |
| PLATFORM-14.3-005 | Stability | Move profession management to callables. | Not started | Functions professions module, admin Firebase service | Profession callable tests pass. |
| PLATFORM-14.3-006 | Stability | Add admin mutation failure UI tests. | Not started | Admin pages, E2E/component tests | Clear errors, no false success state. |
| PLATFORM-14.3-007 | Stability | Add peak-shaped seeded smoke. | Not started | Test/script TBD | Completes within agreed budget. |
| PLATFORM-14.4-001 | Boundaries | Add product-boundary static regression test. | Not started | New boundary test | Forbidden v1 surfaces fail the test. |
| PLATFORM-14.4-002 | Boundaries | Add E2E user-choice boundary test. | Not started | `tests/e2e/app.spec.ts` | Search/profile do not auto-assign or reveal contact. |
| PLATFORM-14.4-003 | Boundaries | Add paid visibility boundary assertions. | Not started | Ranking/visibility tests | Paid visibility remains exposure-only. |
| PLATFORM-14.4-004 | Boundaries | Add critical boundary copy checks. | Not started | Locale tests/boundary test | No-guarantee and no-payment positioning remains. |

## Open Questions

1. Should admin be tablet/desktop-only for v1, or does product want full phone support for admin pages?
2. What expected peak load should Section 14 use before real production analytics exist?
3. Should remaining direct admin writes be treated as launch blockers, or accepted temporarily because Firestore rules already guard admin-only writes?
4. Which analytics destination should receive timing events in production?
5. Should the product-boundary static scan include locale files now, or start with route/service/feature surfaces only?
