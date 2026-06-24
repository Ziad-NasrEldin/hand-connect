# Section 2 Search & Discovery Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-02-search-discovery.md`

Scope: complete SRS section 2 so customer search/discovery is fully implemented across UI, Firebase search, coverage/ranking rules, directory-first product boundaries, and tests.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but needs gaps/tests completed.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Partially done | Product/Engineering | Coverage radius is fixed by platform rules based on provider location, city, and profession; current-location semantics remain open. |
| Search by profession | Partially done | Engineering | Feature works; needs Firebase/emulator regression coverage and profession failure fallback UI. |
| Search by location | Partially done | Engineering | Manual selected-neighborhood search works; current-location and permission handling missing. |
| Nearby provider coverage | Partially done | Engineering | Approved service-area search works; coverage radius/equivalent geospatial matching missing. |
| Directory-first browsing | Partially done | Engineering | Feature works; needs regression tests against auto-assignment/booking behavior. |
| Search experience | Partially done | Engineering | Mobile/loading/empty/error/retry/limits exist; mobile e2e and Firebase limit regression remain open. |
| Verification | Not started | Engineering | Run unit, Firebase/rules, e2e, lint, build. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| SEARCH-PD-001 | Decide whether browser current-location search is in v1. | Not started | Recommended: yes, optional convenience only. |
| SEARCH-PD-002 | Decide current-location mapping model. | Not started | Recommended: map browser lat/lng to nearest configured Cairo neighborhood. |
| SEARCH-PD-003 | Decide whether raw customer coordinates are stored. | Not started | Recommended: do not store raw coords in v1 search. |
| SEARCH-PD-004 | Decide coverage model. | Done | Coverage radius policy is fixed platform rules based on provider location, city, and profession. |
| SEARCH-PD-005 | Decide default/max provider coverage radius. | Done | Radius values are platform-controlled policy outputs, not provider-selected expansion knobs. |
| SEARCH-PD-006 | Decide outside-coverage behavior. | Done | Outside-coverage providers are excluded from primary public discovery. |
| SEARCH-PD-007 | Decide if `coverageAreaKeys` precomputation is preferred over fetching all providers by profession. | Done | Use precomputed `coverageAreaKeys` for scalable Firestore query. |

## 2.1 Search by Profession Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SEARCH-2.1-001 | Keep profession select using active profession list. | Done | `src/features/search/pages/search-page.tsx` | Search filter options come from `listProfessions`. |
| SEARCH-2.1-002 | Keep Firebase active profession query. | Done | `src/services/firebase/search.firebase.ts` | Query filters `active == true` and orders by `sortOrder`. |
| SEARCH-2.1-003 | Add Firebase/emulator test for active professions. | Not started | Rules/Firebase adapter tests | Active appears, inactive hidden, sort respected. |
| SEARCH-2.1-004 | Add fallback test for empty Firestore professions. | Not started | Firebase adapter/search tests | Empty collection falls back to seeded active professions. |
| SEARCH-2.1-005 | Add invalid/inactive profession URL test. | Not started | `src/lib/search-filters.test.ts`, search page test | Invalid/inactive profession normalizes safely. |
| SEARCH-2.1-006 | Add profession list failure UI. | Not started | `search-page.tsx`, i18n | Profession load failure shows non-blocking localized warning/fallback. |

## 2.2 Search by Location Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SEARCH-2.2-001 | Keep manual neighborhood select. | Done | `src/features/search/pages/search-page.tsx` | Customer can select configured neighborhood. |
| SEARCH-2.2-002 | Keep invalid neighborhood normalization. | Done | `src/lib/search-filters.ts` | Invalid area resolves to default safely. |
| SEARCH-2.2-003 | Add coordinates to neighborhood config. | Done | `src/config/neighborhoods.ts` | Every neighborhood has coordinates. |
| SEARCH-2.2-004 | Add location utility. | Done | `src/lib/location.ts` | Supports distance and nearest-neighborhood lookup. |
| SEARCH-2.2-005 | Add location utility tests. | Done | `src/lib/location.test.ts` | Same point/known point/nearest neighborhood cases pass. |
| SEARCH-2.2-006 | Add “Use my location” button. | Done | `search-page.tsx`, i18n | Button requests browser geolocation. |
| SEARCH-2.2-007 | Implement geolocation success path. | Done | `search-page.tsx`, `location.ts` | Browser coords update `neighborhood` query param to nearest area. |
| SEARCH-2.2-008 | Implement denied permission handling. | Done | `search-page.tsx`, i18n | Denied permission shows localized message and preserves manual search. |
| SEARCH-2.2-009 | Implement unavailable geolocation handling. | Done | `search-page.tsx`, i18n | No geolocation support shows localized message. |
| SEARCH-2.2-010 | Ensure raw customer coords are not persisted. | Done | Search service/UI review | UI maps coords to nearest area only; search service receives neighborhood key only. |
| SEARCH-2.2-011 | Add e2e/component test for geolocation success. | Not started | `tests/e2e/app.spec.ts` or component test | Mock coordinates select expected neighborhood. |
| SEARCH-2.2-012 | Add e2e/component test for denied/unavailable geolocation. | Not started | E2E/component test | Error visible; manual select remains usable. |

## 2.3 Nearby Provider Results Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SEARCH-2.3-001 | Keep approved-only provider query. | Done | `src/services/firebase/search.firebase.ts` | Search filters `status == approved`. |
| SEARCH-2.3-002 | Add approved-only Firebase integration test. | Not started | Firebase/rules/search tests | Approved appears; pending/rejected/suspended hidden. |
| SEARCH-2.3-003 | Add `coverageRadiusKm` field to provider type. | Done | `src/types/provider.ts` | Provider model includes validated radius; utility tests pass. |
| SEARCH-2.3-004 | Add provider radius defaults/fallbacks. | Done | Firebase converters/demo seed/provider creation | Existing docs without radius get safe default through converter fallback; new Firebase/demo providers write defaults. |
| SEARCH-2.3-005 | Add provider radius validation. | Partially done | Provider registration/edit/admin paths | Radius normalization clamps finite min/max values; provider self-edit is out because radius is platform-controlled. |
| SEARCH-2.3-006 | Add `coverageAreaKeys` field if selected. | Done | Provider type/Firebase docs | Precomputed searchable coverage keys exist on provider type, seeds, creation paths, and converter fallback. |
| SEARCH-2.3-007 | Add coverage key computation utility. | Done | `src/lib/provider-coverage.ts` | Computes covered neighborhoods from service areas + radius. |
| SEARCH-2.3-008 | Add provider coverage utility tests. | Done | `src/lib/provider-coverage.test.ts` | Exact, within-radius, outside-radius cases pass. |
| SEARCH-2.3-009 | Update provider creation to set radius and coverage keys. | Done | `src/services/firebase/auth.firebase.ts`, demo service | New providers get default radius/coverage keys. |
| SEARCH-2.3-010 | Update provider edit/area expansion paths to recompute coverage keys. | Partially done | Provider service/admin visibility approval | Provider self-edit no longer mutates coverage; backend area approval updates coverage projection for the approved area. |
| SEARCH-2.3-011 | Update Firebase search query to use coverage-aware field. | Done | `src/services/firebase/search.firebase.ts`, indexes | Search returns providers covering requested neighborhood. |
| SEARCH-2.3-012 | Update ranking to use distance-aware location score. | Done | `src/lib/ranking.ts` | Closer providers rank above farther ones when other signals equal. |
| SEARCH-2.3-013 | Ensure paid visibility cannot override outside-coverage exclusion. | Done | Search/ranking tests | Paid outside coverage does not appear above covered providers. |
| SEARCH-2.3-014 | Add backfill/migration plan for existing providers. | Not started | Script/docs/callable | Existing provider docs get radius/coverage keys safely. |
| SEARCH-2.3-015 | Add Firestore index/rules updates if new field is queried. | Done | `firestore.indexes.json`, `firestore.rules` | Composite provider index uses `coverageAreaKeys`; rules tests pass. |

## 2.4 Directory-First Browsing Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SEARCH-2.4-001 | Keep provider cards as selectable directory listings. | Done | `search-page.tsx` | Cards link to `/providers/:id`. |
| SEARCH-2.4-002 | Add e2e test: search result opens selected provider. | Not started | `tests/e2e/app.spec.ts` | Clicking provider card opens exact provider profile. |
| SEARCH-2.4-003 | Add test/check that search does not auto-assign. | Done | `src/features/search/search-product-boundary.test.ts` | No auto assignment/job dispatch flow from search. |
| SEARCH-2.4-004 | Add forbidden-flow static scan/check if practical. | Done | `src/features/search/search-product-boundary.test.ts` | Booking/scheduling/job assignment routes are caught if introduced. |

## 2.5 Search Experience Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SEARCH-2.5-001 | Keep mobile responsive search grid/controls. | Done | `search-page.tsx` | Existing responsive layout remains. |
| SEARCH-2.5-002 | Keep loading state. | Done | `search-page.tsx` | Loading state appears while query loads. |
| SEARCH-2.5-003 | Keep empty state. | Done | `search-page.tsx` | Empty state appears for zero results. |
| SEARCH-2.5-004 | Keep bounded result limit. | Done | `src/lib/search-filters.ts`, Firebase service | Limit capped by `maxSearchLimit`. |
| SEARCH-2.5-005 | Add search error state. | Done | `search-page.tsx`, i18n | `query.isError` renders localized retryable error. |
| SEARCH-2.5-006 | Add retry action for failed search. | Done | `search-page.tsx` | Retry calls `query.refetch()`. |
| SEARCH-2.5-007 | Add search failure test. | Done | `src/features/search/pages/search-page.test.tsx` | Search service failure shows error and retry. |
| SEARCH-2.5-008 | Add mobile e2e for search filters/results. | Not started | `tests/e2e/app.spec.ts` | Filters/results/CTA usable on phone viewport. |
| SEARCH-2.5-009 | Add bounded-limit Firebase adapter test. | Not started | Firebase/search test | Firebase query/result path cannot exceed max. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| SEARCH-V-001 | `npm test -- src/lib/search-filters.test.ts` | Done | Passes. |
| SEARCH-V-002 | `npm test -- src/services/search.service.test.ts` | Done | Passes. |
| SEARCH-V-003 | `npm test -- src/lib/ranking.test.ts` | Done | Passes. |
| SEARCH-V-004 | `npm test -- src/lib/location.test.ts` if added | Done | Passes. |
| SEARCH-V-005 | `npm test -- src/lib/provider-coverage.test.ts` if added | Done | Passes. |
| SEARCH-V-006 | Firebase/search adapter tests if added | Not started | Passes. |
| SEARCH-V-007 | `npm run test:rules` | Done | Passes. |
| SEARCH-V-008 | `npm run test:e2e -- tests/e2e/app.spec.ts` or equivalent | Not started | Search/geolocation/directory smoke passes. |
| SEARCH-V-009 | `npm run lint` | Done | Passes. |
| SEARCH-V-010 | `npm run build` | Done | Passes. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| SEARCH-DOD-001 | Profession filter lists only active professions. | Done |
| SEARCH-DOD-002 | Invalid profession filters recover safely. | Done |
| SEARCH-DOD-003 | Active profession behavior has Firebase/emulator coverage. | Not started |
| SEARCH-DOD-004 | Manual neighborhood search works. | Done |
| SEARCH-DOD-005 | Browser current-location search is implemented or SRS is explicitly downgraded. | Done |
| SEARCH-DOD-006 | Denied/unavailable geolocation shows clear feedback. | Done |
| SEARCH-DOD-007 | Neighborhoods have coordinates/equivalent mapping data. | Done |
| SEARCH-DOD-008 | Providers have coverage radius/equivalent indicator. | Done |
| SEARCH-DOD-009 | Coverage-aware search returns providers within configured coverage. | Done |
| SEARCH-DOD-010 | Outside-coverage providers are not prioritized and preferably excluded. | Done |
| SEARCH-DOD-011 | Public search only includes approved providers. | Partially done |
| SEARCH-DOD-012 | Directory cards link to selected provider profiles. | Done |
| SEARCH-DOD-013 | No auto-assignment/job dispatch can regress silently. | Done |
| SEARCH-DOD-014 | Search UI has mobile coverage. | Partially done |
| SEARCH-DOD-015 | Search requests are bounded in UI/service/Firebase. | Done |
| SEARCH-DOD-016 | Search failure state is visible, localized, and retryable. | Done |
| SEARCH-DOD-017 | Targeted tests, rules/e2e where available, lint, and build pass. | Partially done |

## Open Questions

1. Should v1 add browser current-location search now, or should SRS be clarified to selected-neighborhood only?
2. Is neighborhood-center distance acceptable for Cairo v1 “nearby,” or do we need address-level/geohash later?
