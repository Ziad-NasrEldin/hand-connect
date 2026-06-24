# Section 2 Implementation Plan — Customer Search & Discovery

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 2.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 2.1-2.5.

Goal: make customer search and discovery fully implemented for Herafy v1: customers can search by active profession and selected/current location, see approved nearby providers with coverage rules, browse directory-style listings, and receive clear mobile/search failure feedback.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 2.1 Search by Profession | Implemented | Profession filter exists, active professions are listed, invalid filters normalize safely. Needs Firebase integration regression coverage. |
| 2.2 Search by Location | Partially implemented | Selected-neighborhood search works. Current-location/geolocation and permission handling are missing. |
| 2.3 Nearby Provider Results | Partially implemented | Approved provider search by service area works. Coverage radius/geospatial-equivalent logic is missing. |
| 2.4 Directory-First Browsing | Implemented | Search displays provider cards linking to chosen profiles. Needs regression test ensuring no auto-assignment. |
| 2.5 Search Experience | Partially implemented | Mobile layout, bounded limits, loading/empty states exist. Search failure UI is missing. |

## Product Decisions Needed Before Implementation

### Decision A — What “current location” means in v1

The SRS says current-location search SHOULD be supported when permission is available and denied/unavailable permission MUST be handled gracefully.

Recommended v1 decision: **support browser geolocation as an optional convenience that maps to the nearest configured Cairo neighborhood.**

Reason:

- Current data model is Cairo-neighborhood based, not street-level geospatial.
- A “nearest neighborhood” mapping satisfies current-location UX without turning v1 into a full GIS platform.
- If geolocation is denied, customers can still use selected neighborhood search.

Implementation implication:

- Add latitude/longitude center points to neighborhood config.
- Add “Use my current location” button in search filters.
- Browser coordinates are mapped to nearest configured neighborhood.
- No raw location needs to be stored for v1.

### Decision B — What “coverage radius” means in v1

The SRS requires provider service area and coverage radius or equivalent coverage rules.

Recommended v1 decision: **add provider coverage radius in kilometers around each service-area center, while keeping neighborhood service areas as the primary filter.**

Reason:

- Existing provider model already supports `serviceAreas` and `serviceAreaKeys`.
- Adding `coverageRadiusKm` allows nearby ranking/exclusion without changing the whole discovery model.
- Neighborhood-center distance is simple and good enough for Cairo MVP.

Implementation implication:

- Extend provider profile with `coverageRadiusKm` or equivalent.
- Use neighborhood coordinates to calculate approximate distance between customer location/neighborhood and provider service-area centers.
- Treat exact service-area match as distance `0` or high-priority match.
- Do not show providers outside maximum configured coverage as “nearby.”

### Decision C — Whether to strictly exclude outside-coverage providers

SRS says outside coverage SHOULD NOT be prioritized, not MUST NOT be shown.

Recommended v1 decision:

- If the search location is known and provider is outside all configured coverage radii, exclude from primary results.
- Optionally show a separate “outside your area” section later, but not v1.

Reason:

- Cleaner user experience.
- Avoids providers receiving irrelevant contacts.
- Aligns with “nearby providers” product promise.

## Target End State

Section 2 is complete when:

1. Search profession filter only lists active professions.
2. Invalid profession and neighborhood filters recover safely without crashes.
3. Customers can choose a neighborhood manually.
4. Customers can optionally use browser current location.
5. Denied/unavailable geolocation shows clear feedback and preserves manual search.
6. Providers have an explicit coverage radius or equivalent coverage indicator.
7. Search considers provider service area + coverage radius.
8. Providers outside configured coverage are not prioritized and preferably excluded from primary nearby results.
9. Search only includes publicly approved providers.
10. Search result cards remain directory listings; customers choose a provider profile/contact path.
11. Search UI remains mobile-friendly.
12. Search requests use bounded limits.
13. Search failures show user-readable feedback.
14. Firebase/emulator or adapter tests cover active professions, approved-only search, location/coverage behavior, and failure states.

## Detailed Implementation Plan

## 2.1 Search by Profession

### Requirements Covered

- `SEARCH-001`: Customers MUST search providers by profession/category.
- `SEARCH-002`: Only active professions exposed in search filters.
- `SEARCH-003`: Invalid profession filters resolve safely without crashing.

### Current Implementation Evidence

- `src/features/search/pages/search-page.tsx`
  - pulls active professions using `listProfessions`.
  - renders profession select options from `professionOptions`.
- `src/services/firebase/search.firebase.ts`
  - `listProfessions` queries `professions` where `active == true` and falls back to seeded active professions.
  - `searchProviders` filters by provider `profession` and `status == approved`.
- `src/lib/search-filters.ts`
  - normalizes invalid profession to default/first active profession.
- `src/services/search.service.test.ts`
  - covers invalid search filters in demo mode.

### Work Items

#### 2.1.1 Add Firebase/emulator-backed active profession test

Files:

- `tests/rules/firestore.rules.test.ts`, or a new Firebase adapter test file if the project has a pattern.
- `src/services/firebase/search.firebase.ts` if small testability refactor is needed.

Cases:

- Active profession appears in search profession list.
- Inactive profession does not appear in search profession list.
- Empty Firestore profession collection falls back to seeded active professions.
- Profession sort order is respected.

Acceptance:

- Active-only profession behavior is verified against Firebase-shaped data, not only seeded demo data.

#### 2.1.2 Add search provider test for inactive/invalid profession safety

Files:

- `src/lib/search-filters.test.ts`
- `src/services/search.service.test.ts`

Cases:

- URL `?profession=inactive` normalizes to default/first active profession.
- URL `?profession=not-real` normalizes safely.
- Search page does not crash before professions query resolves.

Acceptance:

- Invalid user-controlled URL params never crash search.

#### 2.1.3 Add UI state for profession list loading/failure

Files:

- `src/features/search/pages/search-page.tsx`
- locale files.

Changes:

- While professions are loading, select can be disabled or show loading option.
- If profession loading fails, show user-readable warning and fallback to seeded/default if available.
- Do not leave search unusable if profession list fails.

Acceptance:

- Search page remains usable even if `listProfessions` fails.

## 2.2 Search by Location

### Requirements Covered

- `SEARCH-004`: Customers MUST search using selected location.
- `SEARCH-005`: SHOULD support current-location search when location permission is available.
- `SEARCH-006`: MUST handle denied/unavailable location permission gracefully.

### Current Implementation Evidence

- `src/features/search/pages/search-page.tsx`
  - neighborhood select exists.
- `src/config/neighborhoods.ts`
  - has Cairo neighborhood slugs/names.
- `src/lib/search-filters.ts`
  - validates selected neighborhood against configured slugs.
- `src/services/firebase/search.firebase.ts`
  - queries providers with `serviceAreaKeys array-contains input.neighborhood`.

### Work Items

#### 2.2.1 Add coordinates to neighborhoods

Files:

- `src/config/neighborhoods.ts`

Changes:

Extend `Neighborhood`:

```ts
export interface Neighborhood {
  slug: string;
  nameAr: string;
  nameEn: string;
  latitude: number;
  longitude: number;
}
```

Add approximate coordinates for existing areas:

- New Cairo
- Nasr City
- Maadi
- Heliopolis
- Zamalek
- Dokki
- Mohandessin
- Shorouk

Acceptance:

- Existing display helpers still work.
- Tests confirm every neighborhood has coordinates.

#### 2.2.2 Add geolocation utility

Files:

- New: `src/lib/location.ts` or `src/lib/geolocation.ts`

Functions:

- `distanceKm(a, b)` using haversine or simple Earth-distance formula.
- `findNearestNeighborhood(coords, neighborhoods)`.
- `canUseBrowserGeolocation()`.

Acceptance:

- Unit tests prove nearest-neighborhood mapping for known Cairo coordinates.
- Utility has no browser side effects at import time.

#### 2.2.3 Add current-location button to search UI

Files:

- `src/features/search/pages/search-page.tsx`
- locale files.

UI behavior:

- Add button near neighborhood select: “Use my location.”
- On click:
  - if `navigator.geolocation` unavailable, show `search.locationUnavailable`.
  - if denied, show `search.locationDenied`.
  - if success, map coords to nearest neighborhood and update URL search params.
- Show temporary loading state while location is resolving.
- Keep manual neighborhood select usable at all times.

Acceptance:

- Success updates `neighborhood` query param.
- Denied/unavailable errors do not clear current search results.
- Button is usable on mobile.

#### 2.2.4 Do not store customer raw location in v1

Files:

- Search UI/service only.

Decision:

- Do not write location coordinates to Firestore for v1 search.
- If analytics later needs it, add explicit privacy review.

Acceptance:

- No raw customer location is persisted during search.

### Tests for 2.2

Unit tests:

- `distanceKm` works for same point and known approximate distances.
- `findNearestNeighborhood` returns expected area.
- invalid/empty neighborhood normalizes safely.

Component/e2e tests:

- geolocation success selects nearest area.
- geolocation denied shows error.
- geolocation unavailable shows error.
- manual location select still works after denied permission.

## 2.3 Nearby Provider Results

### Requirements Covered

- `SEARCH-007`: Results consider provider service area and coverage radius.
- `SEARCH-008`: Providers outside configured coverage SHOULD NOT be prioritized as nearby matches.
- `SEARCH-009`: Results include only publicly approved providers.

### Current Implementation Evidence

- `src/types/provider.ts`
  - provider has `serviceAreas` and `serviceAreaKeys`, but no radius.
- `src/services/firebase/search.firebase.ts`
  - filters `status == approved`, `profession`, and `serviceAreaKeys array-contains input.neighborhood`.
- `src/lib/ranking.ts`
  - location score is exact neighborhood match only.
- `firestore.rules`
  - public provider reads are approval-gated.

### Work Items

#### 2.3.1 Add provider coverage radius field

Files:

- `src/types/provider.ts`
- Firebase converters if needed.
- Demo seed database.
- Provider creation in `src/services/firebase/auth.firebase.ts`.
- Provider edit page/service if providers can manage coverage radius.
- Admin/provider docs if needed.

Recommended field:

```ts
coverageRadiusKm: number;
```

Default:

- `5` or `10` km depending Cairo product decision.
- Cap at a max, e.g. `25` km, unless paid area expansion allows more areas, not bigger radius.

Validation:

- Minimum: `1` km.
- Maximum: `25` km.
- Must be finite integer/decimal.

Acceptance:

- All provider profiles have a coverage radius by creation/default/migration/fallback.
- Existing providers without the field get safe default in converters or data migration.

#### 2.3.2 Add coverage-aware matching utility

Files:

- `src/lib/provider-coverage.ts`

Functions:

- `providerCoversNeighborhood(provider, neighborhoodSlug)`.
- `distanceToNearestServiceAreaKm(provider, neighborhoodSlug)`.
- `providerCoverageLabel(provider, language)` if needed for UI.

Logic:

- If provider has exact service-area key -> covered.
- Else calculate distance from search neighborhood center to each provider service-area center.
- Covered if min distance <= `coverageRadiusKm`.
- If neighborhood coordinates missing, fall back safely to exact area match only.

Acceptance:

- Exact service-area match always covers.
- Nearby within radius covers.
- Outside radius does not cover.

#### 2.3.3 Update Firebase search strategy

Current Firestore query only returns exact `serviceAreaKeys array-contains`, so providers whose radius covers adjacent neighborhoods will never be fetched.

Options:

1. **Recommended simple v1:** query all approved providers in the profession up to bounded limit, then filter/rank client-side by coverage.
2. **More scalable:** store `coverageAreaKeys` precomputed on provider docs and query `coverageAreaKeys array-contains input.neighborhood`.

Recommended v1.1 implementation: **precomputed `coverageAreaKeys`**.

Reason:

- Keeps Firestore query selective.
- Supports indexes and avoids fetching all providers in a profession.
- Works with existing neighborhood model.

Files:

- `src/types/provider.ts`
- provider creation/edit/area-expansion approval paths.
- `src/services/firebase/search.firebase.ts`
- `firestore.indexes.json`
- `firestore.rules`

Changes:

- Add `coverageAreaKeys: string[]` to provider documents.
- Compute from `serviceAreas`, neighborhood coordinates, and `coverageRadiusKm`.
- Query `where('coverageAreaKeys', 'array-contains', input.neighborhood)` instead of only `serviceAreaKeys`.
- Keep status/profession filters.
- Ranking uses exact distance/coverage score after fetch.

Acceptance:

- Provider in Maadi with radius covering nearby area appears for that nearby area.
- Provider outside coverage does not appear.
- Approved-only filter remains enforced.

#### 2.3.4 Update ranking location score

Files:

- `src/lib/ranking.ts`
- maybe `src/lib/provider-coverage.ts`

Changes:

- Replace binary location score with distance-aware score:
  - exact area match: max location score.
  - within radius: score decreases as distance approaches radius.
  - outside radius: score `0` or excluded before ranking.
- Keep paid/reputation/activity/fairness contributions from later sections, but do not let paid override outside-coverage exclusion.

Acceptance:

- Closer covered providers rank above farther covered providers when other signals equal.
- Paid provider outside coverage is excluded or below all covered providers, per product decision.

#### 2.3.5 Add approved-only search tests

Files:

- `src/services/search.service.test.ts`
- Firebase/emulator adapter tests.
- `tests/rules/firestore.rules.test.ts`

Cases:

- approved provider appears.
- pending provider hidden.
- rejected provider hidden.
- suspended provider hidden.
- banned provider hidden if user/provider status supports that relation.

Acceptance:

- No non-approved provider can appear through public search.

### Migration / Backfill Plan for 2.3

If existing production/demo provider docs lack new fields:

1. Add converter fallback for `coverageRadiusKm` default.
2. Add converter fallback for `coverageAreaKeys` = `serviceAreaKeys` initially.
3. Add admin/backfill script or one-time callable to compute `coverageAreaKeys` for all approved/pending providers.
4. Deploy rules/indexes before code that queries new fields.
5. Verify search works with mixed old/new provider docs.

## 2.4 Directory-First Browsing

### Requirements Covered

- `SEARCH-010`: Providers presented as selectable directory listings.
- `SEARCH-011`: Customers choose provider to contact.
- `SEARCH-012`: System must not assign jobs automatically.

### Current Implementation Evidence

- Search page renders `ProviderResultCard` per provider.
- Cards link to `/providers/:id`.
- Contact actions live on provider profile, not auto-assignment.
- Repo audit found no job assignment service.

### Work Items

#### 2.4.1 Add product-boundary regression test

Files:

- `tests/e2e/app.spec.ts`
- optional static test under `src/__tests__` or scripts.

Cases:

- Search results show multiple selectable provider cards when data has multiple providers.
- Clicking a card opens that exact provider profile.
- No “assign job,” “book now,” “auto match,” or equivalent flow appears in search.

Acceptance:

- Directory-first browsing is protected from regression.

#### 2.4.2 Add static forbidden-flow test/check

Files:

- New test e.g. `src/product-boundaries.test.ts`, or docs checklist if code test is too brittle.

Forbidden terms/routes to scan carefully:

- booking route
- schedule route
- job assignment route
- checkout/payment for customer-provider transaction

Acceptance:

- Future accidental marketplace/job-assignment code is caught early.

## 2.5 Search Experience

### Requirements Covered

- `SEARCH-013`: Search UI usable on mobile screens.
- `SEARCH-014`: Search requests use bounded limits or pagination.
- `SEARCH-015`: Search failure states show user-readable feedback.

### Current Implementation Evidence

- `src/features/search/pages/search-page.tsx`
  - responsive grid and mobile-friendly controls exist.
  - loading and empty states exist.
  - no error state rendered from `query.isError`.
- `src/lib/search-filters.ts`
  - default/max limits exist.
- `src/services/firebase/search.firebase.ts`
  - `firestoreLimit(maxSearchLimit)` exists.
- `src/services/search.service.test.ts`
  - limit behavior covered in demo mode.

### Work Items

#### 2.5.1 Add search error state UI

Files:

- `src/features/search/pages/search-page.tsx`
- locale files.

Changes:

- If `query.isError`, render an error card/state:
  - title: “Search is temporarily unavailable” / Arabic equivalent.
  - body: “Try again or change filters.”
  - retry button calls `query.refetch()`.
- Continue showing last successful data if React Query has stale data and `isFetching` but not hard failure, if desired.

Acceptance:

- Search failure is visible and localized.
- User can retry.

#### 2.5.2 Add profession list error state UI

Files:

- `src/features/search/pages/search-page.tsx`

Changes:

- If professions fail, show non-blocking warning and fallback professions if available.

Acceptance:

- Search does not become blank/unusable because profession loading fails.

#### 2.5.3 Add mobile e2e coverage

Files:

- `tests/e2e/app.spec.ts`

Cases:

- Search filters fit on mobile viewport.
- Search results stack vertically.
- Provider card CTA is reachable.
- Current-location button is reachable and handles denied permission.

Acceptance:

- Search remains usable on phone-sized viewport.

#### 2.5.4 Confirm bounded limit everywhere

Files:

- `src/lib/search-filters.ts`
- `src/services/firebase/search.firebase.ts`
- demo service.

Checks:

- UI cannot request unbounded results.
- Service normalizes/caps limit.
- Firebase query uses capped limit.

Acceptance:

- Existing limit tests plus Firebase adapter test pass.

## Suggested Implementation Order

1. Add search error UI and locale keys.
2. Add geolocation/location utilities and tests.
3. Add neighborhood coordinates.
4. Add “Use my current location” UI with denied/unavailable handling.
5. Add provider coverage radius field and fallback/defaults.
6. Add coverage utility and tests.
7. Add `coverageAreaKeys` computation and update provider create/edit/approval/backfill paths.
8. Update Firebase search query to use coverage-aware keys.
9. Update ranking to use distance-aware location score.
10. Add Firebase/emulator tests for active professions, approved-only search, coverage search, and expiry/exclusion where relevant.
11. Add e2e tests for mobile search, geolocation denied/success mock, provider card selection, and no auto-assignment.
12. Run verification.

## Verification Plan

Minimum commands:

```bash
npm test -- src/lib/search-filters.test.ts
npm test -- src/services/search.service.test.ts
npm test -- src/lib/ranking.test.ts
npm run lint
npm run build
```

If new utilities are added:

```bash
npm test -- src/lib/location.test.ts
npm test -- src/lib/provider-coverage.test.ts
```

If emulator/rules tests are added:

```bash
npm run test:rules
```

If e2e coverage is added:

```bash
npm run test:e2e -- tests/e2e/app.spec.ts
```

If Firebase indexes/rules change:

```bash
firebase emulators:exec --only firestore "npm run test:rules"
```

Use project scripts if they differ from the above.

## Completion Checklist

Section 2 is complete when all are true:

- [ ] Search profession filter lists only active professions.
- [ ] Invalid profession filters recover safely.
- [ ] Active profession behavior has Firebase/emulator or adapter coverage.
- [ ] Manual neighborhood search still works.
- [ ] Browser current-location search is implemented or explicitly downgraded in SRS.
- [ ] Denied/unavailable geolocation shows clear localized feedback.
- [ ] Neighborhoods have coordinates or equivalent mapping data.
- [ ] Providers have coverage radius or equivalent coverage indicator.
- [ ] Coverage-aware search returns providers within configured coverage.
- [ ] Providers outside coverage are not prioritized and preferably excluded.
- [ ] Public search only includes approved providers.
- [ ] Directory listing cards link to selected provider profiles.
- [ ] No auto-assignment/job dispatch behavior exists or can regress silently.
- [ ] Search UI is mobile-friendly with e2e or component coverage.
- [ ] Search request limits are bounded in UI/service/Firebase query.
- [ ] Search failure state is visible, localized, and retryable.
- [ ] Tests, lint, and build pass.

## Estimated Effort

| Workstream | Estimate |
|---|---:|
| Search/profession Firebase coverage and failure UI | 0.5-1 day |
| Geolocation UX + utility tests | 1 day |
| Coverage radius data model + utilities | 1-1.5 days |
| Firebase search/index/rules/backfill updates | 1-2 days |
| Ranking/location scoring updates | 0.5-1 day |
| E2E/mobile/product-boundary tests | 1 day |
| Total | 5-7.5 days |

## Risks

- Adding `coverageAreaKeys` requires coordinating Firestore indexes, rules, and backfill before production deploy.
- Browser geolocation behavior is hard to test consistently unless Playwright mocks permissions/coordinates.
- Neighborhood-center distance is approximate; product should accept it as v1 “nearby” semantics.
- Fetching all providers by profession instead of precomputed coverage keys may not scale; use precomputed keys if possible.
- Coverage radius overlaps paid geographic expansion; ensure area expansion remains controlled by paid/admin flow rather than letting providers set huge radius.

## Recommended Definition of Done for Section 2

- `2.1 Search by Profession`: remains Implemented, now with Firebase/emulator regression coverage.
- `2.2 Search by Location`: Implemented via manual neighborhood + optional current-location mapping and graceful denied/unavailable states.
- `2.3 Nearby Provider Results`: Implemented via coverage radius/equivalent coverage rules, approved-only Firebase search, and distance-aware ranking/exclusion.
- `2.4 Directory-First Browsing`: remains Implemented, now with product-boundary regression tests.
- `2.5 Search Experience`: Implemented with mobile coverage, bounded limits, and user-readable retryable error states.
