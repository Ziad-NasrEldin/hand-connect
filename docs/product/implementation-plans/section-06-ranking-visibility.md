# Section 6 Implementation Plan - Ranking & Visibility

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 6.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 6.1-6.4.

Goal: make ranking and visibility fully implemented for Herafy v1 across deterministic search ordering, current signal recalculation, exclusion rules, paid-visibility guardrails, governance controls, auditability, and regression tests.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 6.1 Weighted Ranking | Partially implemented | `src/lib/ranking.ts` orders providers with service-area match, reputation, activity score, paid bonus, and low-view fairness; search applies it after querying approved providers. Distance is only an exact neighborhood match, activity source is unclear, weights are hardcoded, and fairness is not product-configured. |
| 6.2 Dynamic Recalculation | Partially implemented | Search ranking is recalculated at read time from current provider documents; review callables update `avgRating` and `reviewCount`; paid expiry is ignored by `isPaidVisibilityActive`. Firebase integration tests for updated signals, expired paid state, and rejected/suspended exclusions are missing. |
| 6.3 Guardrails | Partially implemented | Paid bonus is capped in code and unit tests prove a weak paid provider does not automatically beat a strong organic provider. The cap is hardcoded, interactions between paid/reputation/activity/fairness are thinly tested, and no platform policy defines acceptable bounds. |
| 6.4 Ranking Governance | Partially implemented | Exact formulas are not exposed in the UI; provider visibility copy and the admin runbook say paid visibility does not guarantee outcomes. There is no server-owned ranking policy object, admin governance UI, policy audit trail, or restricted policy mutation path. |

## Product Decisions Needed Before Implementation

### Decision A - Ranking policy ownership

Recommended v1 decision: **ranking policy is platform-owned and only configurable by admins through a restricted, audited policy object.**

Reason:

- The SRS forbids manual negotiated placement.
- Hardcoded weights are simple but make governance invisible and hard to audit.
- A policy object allows global product tuning without ad-hoc provider favoritism.

Implementation implication:

- Add a `rankingPolicies/active` document or equivalent server-owned configuration.
- Keep provider-specific manual overrides out of v1.
- Every policy change must create an `adminActions` row.
- Public/customer/provider UI must never expose exact numeric weights.

### Decision B - Distance model for Section 6

Recommended v1 decision: **reuse the Section 2 neighborhood-center coverage model and feed ranking with distance/coverage metadata.**

Reason:

- Current search model is Cairo-neighborhood based.
- Section 2 already plans `coverageRadiusKm` or equivalent coverage logic.
- Ranking can become distance-aware without requiring address-level geospatial search.

Implementation implication:

- `rankProviders` should accept enriched candidate context, such as exact service-area match, distance in kilometers, and coverage status.
- Exact neighborhood match should rank above farther coverage when other signals are equal.
- Paid visibility must not cause an outside-coverage provider to outrank in-coverage providers.

### Decision C - Activity and responsiveness signal source

Recommended v1 decision: **derive activity/responsiveness from trusted backend events, not provider-editable profile fields.**

Reason:

- `activityScore` currently exists on `ProviderProfile`, but no clear production job or callable updates it.
- Customer trust depends on ranking signals not being provider-controlled.
- The existing analytics service can compute contact and response metrics, but those metrics are dashboard-oriented and not persisted as ranking inputs.

Implementation implication:

- Add server-owned fields such as `rankingSignals.activityScore`, `rankingSignals.responseScore`, `rankingSignals.lastContactAt`, and `rankingSignals.updatedAt`, or a dedicated `providerRankingSignals` collection.
- Update the signal from trusted callables/jobs when contacts, conversations, reviews, profile views, or moderation events change.
- Firestore rules must prevent providers from writing ranking signals directly.

### Decision D - Fairness behavior

Recommended v1 decision: **keep fairness as a small capped exploration boost with explicit policy bounds.**

Reason:

- The current low-view bonus helps avoid a static rich-get-richer listing.
- Hardcoded fairness can create surprising ranking movement if not bounded and documented internally.
- The SRS says geographic fairness SHOULD be considered, not that it must dominate quality.

Implementation implication:

- Move the low-view threshold and boost into ranking policy config.
- Add tests that fairness cannot overcome major reputation, distance, or activity differences by itself.
- Add product-facing internal docs that fairness is an exploration aid, not manual favoritism.

### Decision E - Public transparency

Recommended v1 decision: **show high-level ranking factors only: location fit, reputation, responsiveness, availability/activity, and promoted visibility.**

Reason:

- `RANK-015` forbids exposing exact formulas publicly.
- `RANK-016` allows high-level transparency.
- Providers need enough guidance to improve without reverse-engineering placement.

Implementation implication:

- Provider dashboard may show non-numeric guidance and current paid status.
- Search UI may label active paid exposure, but Section 7 owns exact paid disclosure wording.
- Tests should assert numeric weight keys and formula text are absent from customer/provider UI.

## Target End State

Section 6 is complete when:

1. Search results are always ordered through a centralized ranking engine.
2. Ranking considers location relevance using exact neighborhood and distance/coverage metadata.
3. Ranking considers current reputation signals from visible reviews.
4. Ranking considers trusted activity/responsiveness signals that providers cannot directly edit.
5. Ranking considers active paid visibility only within configured caps.
6. Ranking considers bounded fairness/exploration without overriding strong quality and location signals.
7. Ranking recalculates from current provider, review, paid, activity, and policy data at search time or through a fresh indexed signal snapshot.
8. Expired paid visibility has no ranking effect and no paid-style customer label.
9. Pending, rejected, suspended, banned, or otherwise unapproved providers are excluded from public ranking.
10. No single factor guarantees top placement.
11. High-quality organic providers can outrank paid providers.
12. Admin controls affect ranking only through platform-wide or product-tier policy settings.
13. Ranking policy changes are audited and restricted to admins.
14. Exact ranking formulas and numeric weights are not exposed in customer or provider UI.
15. Unit, service, rules, callable, and e2e tests prove the ranking and visibility guarantees.

## Detailed Implementation Plan

## 6.1 Weighted Ranking

### Requirements Covered

- `RANK-001`: Search results MUST be ordered by ranking rules.
- `RANK-002`: Ranking MUST consider distance/location relevance.
- `RANK-003`: Ranking MUST consider review/reputation signals.
- `RANK-004`: Ranking MUST consider provider activity/responsiveness signals.
- `RANK-005`: Ranking MUST consider paid visibility status within capped limits.
- `RANK-006`: Ranking SHOULD consider geographic fairness adjustments.

### Current Implementation Evidence

- `src/lib/ranking.ts`
  - `rankProviders` sorts every candidate by `providerRankingScore`.
  - `providerRankingScore` includes location score, reputation score, activity score, paid bonus, and low-view fairness.
  - location is a binary `serviceAreaKeys.includes(input.neighborhood)` score.
  - reputation uses `avgRating` and `reviewCount`.
  - activity uses stored `activityScore`.
  - paid visibility adds `12` only when `isPaidVisibilityActive` returns true.
  - fairness adds `5` when `profileViews < 20`.
- `src/services/firebase/search.firebase.ts`
  - queries approved providers by profession and selected service area.
  - applies `rankProviders` and slices to the requested limit.
- `src/services/demo/search.demo.ts`
  - filters approved providers by profession and service area.
  - applies `rankProviders`.
- `src/types/provider.ts`
  - provider documents store `visibilityTier`, `visibilityPaidUntil`, `profileViews`, `avgRating`, `reviewCount`, and `activityScore`.
- `src/lib/ranking.test.ts`
  - verifies paid providers do not automatically beat stronger organic providers.
  - verifies expired paid visibility is inactive.
  - verifies active paid visibility before expiry.

### Work Items

#### 6.1.1 Introduce a ranking policy module

Files:

- New: `src/lib/ranking-policy.ts`
- `src/lib/ranking.ts`
- `src/lib/ranking.test.ts`

Changes:

- Define a typed default policy with named weights and bounds:
  - `location.exactArea`.
  - `location.withinCoverageMax`.
  - `reputation.ratingWeight`.
  - `reputation.reviewCountCap`.
  - `activity.activityScoreCap`.
  - `paid.activeBoostCap`.
  - `fairness.lowViewThreshold`.
  - `fairness.lowViewBoostCap`.
- Keep the default policy local and deterministic while the server-backed policy is added.
- Validate policy values so negative, `NaN`, infinite, or excessive weights cannot enter ranking.
- Export one default policy for tests and service usage.

Acceptance:

- Ranking behavior remains deterministic.
- Invalid policy values are rejected or normalized.
- Hardcoded magic values in `providerRankingScore` move behind named policy fields.

#### 6.1.2 Make ranking location-aware beyond exact area match

Files:

- `src/lib/ranking.ts`
- `src/lib/location.ts` or `src/lib/provider-coverage.ts` from Section 2 if already added.
- `src/services/firebase/search.firebase.ts`
- `src/services/demo/search.demo.ts`
- `src/types/provider.ts`

Changes:

- Extend ranking input with optional per-provider location context:
  - exact area match.
  - nearest service-area distance.
  - within coverage radius.
  - outside coverage.
- Use neighborhood-center distance from Section 2 when available.
- Keep exact neighborhood match as the strongest location case.
- Rank closer in-coverage providers above farther in-coverage providers when other signals are equal.
- Exclude outside-coverage providers before ranking if Section 2 chooses strict exclusion.

Acceptance:

- Two providers with equal reputation/activity/paid state rank by distance relevance.
- Exact service-area providers rank above radius-only providers when other signals are equal.
- Outside-coverage providers cannot be rescued by paid visibility.

#### 6.1.3 Replace raw `activityScore` dependency with trusted ranking signals

Files:

- `src/types/provider.ts`
- `src/lib/ranking.ts`
- `src/services/firebase/search.firebase.ts`
- `functions/src/*` callables that create contacts/conversations/reviews.
- New: `functions/src/ranking-signals.ts` or equivalent.

Changes:

- Decide where ranking signals live:
  - embedded provider fields under `rankingSignals`, or
  - separate `providerRankingSignals/{providerId}` documents.
- Add trusted update path for:
  - recent customer contact.
  - provider response rate.
  - average first response time.
  - recent profile activity if profile views are kept as a ranking signal.
- Keep providers unable to write these fields through Firestore rules.
- Update demo data and demo services with equivalent deterministic behavior.

Acceptance:

- Provider profile edit cannot change activity/responsiveness ranking signals.
- Ranking still considers activity/responsiveness.
- Tests prove contact/conversation activity changes the ranking signal through trusted code.

#### 6.1.4 Keep reputation signal current and bounded

Files:

- `functions/src/reviews.ts`
- `src/lib/ranking.ts`
- `src/lib/ranking.test.ts`
- `functions/test/*` review tests if emulator callable tests exist.

Changes:

- Keep review aggregate source as `avgRating` and `reviewCount`.
- Ensure only visible reviews influence aggregates.
- Keep review count contribution capped.
- Add tests for:
  - rating improvement changes ranking order when location/activity/paid are equal.
  - hidden/removed reviews no longer improve ranking.
  - many reviews do not create unbounded ranking dominance.

Acceptance:

- Reputation influences ranking without guaranteeing top placement.
- Hidden reviews are not counted in ranking inputs after aggregate recalculation.

#### 6.1.5 Make fairness explicit and bounded

Files:

- `src/lib/ranking-policy.ts`
- `src/lib/ranking.ts`
- `src/lib/ranking.test.ts`

Changes:

- Replace hardcoded `profileViews < 20 ? 5 : 0` with policy fields.
- Name the factor as exploration/fairness in code.
- Ensure fairness uses a trusted view count or trusted exposure metric.
- Add tests where low-view fairness changes order only among otherwise close providers.

Acceptance:

- Fairness cannot override major location, reputation, activity, or paid-policy differences by itself.
- Fairness is tunable through policy config.

### Tests for 6.1

Unit tests:

- `npm test -- src/lib/ranking.test.ts`
- exact area outranks non-exact area when other signals equal.
- closer coverage outranks farther coverage when other signals equal.
- reputation improves order but remains capped.
- activity improves order but remains capped.
- active paid visibility adds only capped influence.
- low-view fairness is capped.
- invalid policy values are rejected.

Service tests:

- `npm test -- src/services/search.service.test.ts`
- demo search uses the ranking engine after filter normalization.
- bounded result limits still apply after ranking.
- organic, paid, high-rating, low-rating, high-activity, and low-activity fixtures sort as expected.

Firebase/integration tests:

- Firebase search adapter returns ranked approved providers using current provider docs.
- Index changes support any new query shape.

## 6.2 Dynamic Recalculation

### Requirements Covered

- `RANK-007`: Ranking MUST recalculate from current provider and search signals.
- `RANK-008`: Expired paid visibility MUST NOT continue to affect ranking.
- `RANK-009`: Suspended, banned, rejected, or unapproved providers MUST be excluded from public ranking.

### Current Implementation Evidence

- `src/services/firebase/search.firebase.ts`
  - reads current provider documents from Firestore on each search query.
  - filters `status == approved`.
  - filters by profession and `serviceAreaKeys array-contains`.
- `src/services/demo/search.demo.ts`
  - filters current demo DB providers by `status === 'approved'`.
- `src/lib/ranking.ts`
  - checks paid expiry through `visibilityPaidUntil`.
- `functions/src/reviews.ts`
  - `createReview` updates provider `avgRating` and `reviewCount`.
  - `hideReview` recalculates provider rating after hiding a review.
- `src/services/firebase/providers.firebase.ts`
  - attempts to increment `profileViews` from the client.
  - catches failures because rules may deny analytics writes.
- `firestore.rules`
  - public provider reads require `status == 'approved'`.
  - provider owners cannot update `visibilityTier`, `status`, `nationalIdVerified`, or other restricted ranking fields.
- `tests/rules/firestore.rules.test.ts`
  - anonymous users can read approved providers and cannot read pending providers.
  - provider owners cannot set `status`, `nationalIdVerified`, or `visibilityTier`.
  - admins can update provider status.

### Work Items

#### 6.2.1 Add approved-only public search integration coverage

Files:

- `src/services/search.service.test.ts`
- Firebase adapter test or emulator-backed search test.
- `tests/e2e/app.spec.ts` or equivalent browser smoke if available.

Cases:

- approved provider appears in public search.
- pending provider does not appear.
- rejected provider does not appear.
- suspended provider does not appear.
- banned provider user does not appear if the provider status remains approved but account status is banned.

Acceptance:

- Public search never ranks non-public providers.
- The banned-user rule is explicit, either by synchronizing provider status on ban or by excluding banned owner accounts in search.

#### 6.2.2 Make banned-owner exclusion explicit

Files:

- `src/services/firebase/search.firebase.ts`
- `src/services/demo/search.demo.ts`
- `src/services/firebase/admin.firebase.ts` or provider suspension/ban callable.
- `functions/src/providers.ts`
- Firestore rules and indexes if search joins or denormalizes account status.

Changes:

- Choose one exclusion model:
  - set provider `status: 'suspended'` when provider owner is banned, or
  - denormalize `ownerAccountStatus` onto provider docs, or
  - filter against a trusted provider visibility index.
- Keep the chosen field server/admin-owned.
- Add tests proving banned owners are excluded from public search.

Acceptance:

- `RANK-009` is satisfied for banned provider accounts, not only rejected/suspended provider statuses.

#### 6.2.3 Add paid-expiry recalculation tests

Files:

- `src/lib/ranking.test.ts`
- `src/services/search.service.test.ts`
- Firebase adapter/search tests.

Cases:

- paid provider with future `visibilityPaidUntil` gets only capped boost.
- paid provider with past `visibilityPaidUntil` receives no paid boost.
- expired paid provider does not render paid/highlight label in search/profile.
- search order changes when paid expiry crosses current time.

Acceptance:

- Expired paid visibility cannot influence ranking or customer-facing paid visual state.

#### 6.2.4 Move profile views and ranking events to trusted writes

Files:

- `src/services/firebase/providers.firebase.ts`
- New or existing Firebase callable under `functions/src/providers.ts`.
- `src/services/analytics.service.ts`
- `firestore.rules`

Changes:

- Replace client-side `updateDoc` profile view increment with a callable or backend event write.
- Deduplicate view events server-side where feasible.
- Persist profile-view events or trusted counters used by ranking.
- Keep profile access resilient if analytics write fails.

Acceptance:

- Profile view ranking input updates are trusted.
- Firestore rules do not need to allow direct client writes to ranking-relevant counters.
- Profile page still renders if analytics tracking fails.

#### 6.2.5 Add review-to-ranking recalculation coverage

Files:

- `functions/test/reviews.test.ts` or equivalent callable tests.
- `src/lib/ranking.test.ts`
- `src/services/search.service.test.ts`

Cases:

- creating a visible review updates provider aggregates.
- hiding a review updates provider aggregates.
- changed aggregates affect ranking order in the next search.

Acceptance:

- Ranking uses current review-derived provider signals.

### Tests for 6.2

Commands:

```bash
npm test -- src/lib/ranking.test.ts src/services/search.service.test.ts src/services/providers.service.test.ts
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
```

Expected results:

- Search excludes non-public providers.
- Expired paid state behaves as organic.
- Review aggregate changes become ranking input changes.
- Profile view/activity writes are trusted or explicitly non-ranking.

## 6.3 Guardrails

### Requirements Covered

- `RANK-010`: No single ranking factor MUST guarantee top placement.
- `RANK-011`: Paid ranking influence MUST be capped.
- `RANK-012`: Organic high-quality providers MUST remain able to outrank paid providers.

### Current Implementation Evidence

- `src/lib/ranking.ts`
  - paid boost is fixed at `12`.
  - reputation, activity, location, and fairness all contribute to final score.
- `src/lib/ranking.test.ts`
  - proves a weak paid provider does not automatically outrank a strong organic provider.
- `docs/operations/admin-runbook.md`
  - states paid visibility gives exposure only and does not guarantee leads, jobs, ranking, or revenue.
- `src/features/providers/pages/provider-profile-page.tsx`
  - shows provider `noGuarantee` copy.
- `src/features/search/pages/search-page.tsx`
  - renders paid active providers with highlighted card treatment and `common.featured`.

### Work Items

#### 6.3.1 Define guardrail invariants as tests

Files:

- `src/lib/ranking.test.ts`

Cases:

- paid boost alone cannot beat a clearly better organic provider.
- rating alone cannot beat a much better location fit in all cases.
- review count alone cannot grow without cap.
- activity alone cannot guarantee top placement.
- fairness alone cannot guarantee top placement.
- exact area or distance alone cannot overcome severe trust/reputation penalties if such penalties are added.

Acceptance:

- Each ranking factor has a regression test proving bounded influence.

#### 6.3.2 Add configurable paid cap and policy validation

Files:

- `src/lib/ranking-policy.ts`
- `src/lib/ranking.ts`
- `src/lib/ranking.test.ts`

Changes:

- Move paid cap into policy config.
- Enforce max paid contribution relative to total score or explicit absolute bound.
- Reject policies where paid boost exceeds configured safety bound.

Acceptance:

- Paid boost cannot be configured to dominate all other factors.
- Policy tests fail if a future change creates guaranteed paid top placement.

#### 6.3.3 Add organic outranking fixtures to demo and Firebase tests

Files:

- `src/services/search.service.test.ts`
- Firebase search adapter tests.
- Demo seed data if needed.

Cases:

- strong organic provider outranks weak paid provider.
- active paid provider can outrank close competitors only when other quality signals are competitive.
- free approved provider remains eligible for search visibility.

Acceptance:

- Guardrails are verified through service search, not only through pure ranking unit tests.

#### 6.3.4 Add abuse/penalty integration point without implementing Section 11 fully

Files:

- `src/types/provider.ts`
- `src/lib/ranking.ts`
- `src/lib/ranking.test.ts`
- Admin/moderation files if penalty is added now.

Changes:

- Reserve a server-owned ranking penalty field or ranking signal slot if Section 11 adds abuse penalties.
- Ensure a penalty, if present, can reduce ranking but is admin/server controlled.
- Avoid implementing manipulation detection in Section 6 unless the Section 11 plan already adds it.

Acceptance:

- Section 6 ranking can consume a future penalty signal without exposing manual favoritism.

### Tests for 6.3

Commands:

```bash
npm test -- src/lib/ranking.test.ts
npm test -- src/services/search.service.test.ts
```

Expected results:

- No single factor guarantees top placement.
- Paid influence is capped.
- Organic high-quality providers can outrank paid providers.
- Guardrails survive through the search service path.

## 6.4 Ranking Governance

### Requirements Covered

- `RANK-013`: Providers MUST NOT be able to negotiate placement manually.
- `RANK-014`: Admin ranking controls MUST apply platform-wide or by configured product rules, not ad-hoc favoritism.
- `RANK-015`: Exact ranking formulas MUST NOT be exposed publicly.
- `RANK-016`: The system MAY expose high-level ranking factors for transparency.

### Current Implementation Evidence

- No provider-facing UI exposes numeric ranking weights.
- `src/features/dashboard/pages/visibility-page.tsx` shows visibility guidance and requests.
- `src/features/providers/pages/provider-profile-page.tsx` shows no-guarantee copy.
- `docs/operations/admin-runbook.md` says paid visibility does not guarantee ranking or revenue.
- `firestore.rules` prevents provider owners from writing `visibilityTier` and other restricted fields.
- Admin visibility approval currently happens in `src/services/firebase/admin.firebase.ts` as a client Firestore transaction, then writes an audit row.
- No `rankingPolicies` collection, policy UI, policy callable, or policy audit model exists.

### Work Items

#### 6.4.1 Add a ranking policy data model

Files:

- `src/types/admin.ts` or new `src/types/ranking-policy.ts`
- `src/lib/ranking-policy.ts`
- `firestore.rules`
- `firestore.indexes.json` if needed.

Model:

- `id`.
- `status`: `draft`, `active`, `archived`.
- `version`.
- `weights`.
- `caps`.
- `fairness`.
- `paid`.
- `createdBy`.
- `createdAt`.
- `activatedBy`.
- `activatedAt`.
- `reason`.

Acceptance:

- There is exactly one active policy.
- Providers cannot read or write exact policy internals unless product explicitly allows admin-only reads.
- Admins can read policy history.

#### 6.4.2 Add server-owned policy mutation path

Files:

- New callable under `functions/src/ranking-policy.ts`.
- `src/services/firebase/admin.firebase.ts`
- `src/services/admin.service.ts`
- `firestore.rules`
- tests under `functions/test/*`.

Changes:

- Add callable to create/update/activate ranking policy.
- Require active admin.
- Validate policy bounds.
- Write `adminActions` for every policy mutation.
- Do not allow direct provider or customer writes.

Acceptance:

- Admin policy changes are audited.
- Invalid policy values are rejected server-side.
- Providers cannot negotiate or set provider-specific placement.

#### 6.4.3 Add minimal admin governance UI

Files:

- `src/features/admin/pages/*`
- `src/router/app-router.tsx`
- `src/hooks/use-admin-actions.ts`
- locale files.

UI behavior:

- Show active policy version and high-level knobs to admins only.
- Prefer controlled presets or bounded inputs over free-form formulas.
- Require an admin reason for activation.
- Show policy history and associated audit actions.

Acceptance:

- Admin controls are platform-wide or product-tier-wide.
- UI does not allow selecting one provider for manual placement.

#### 6.4.4 Preserve ranking formula privacy

Files:

- `src/features/search/pages/search-page.tsx`
- `src/features/dashboard/pages/visibility-page.tsx`
- `src/features/providers/pages/provider-profile-page.tsx`
- locale files.
- UI/e2e tests.

Changes:

- Keep exact formula and numeric weights out of customer/provider UI.
- Add high-level guidance only:
  - service area fit.
  - customer reviews.
  - responsiveness.
  - account standing.
  - active promoted visibility.
- Avoid terms that imply guaranteed placement.

Acceptance:

- Public/provider UI contains no exact numeric weights.
- Provider guidance remains actionable without exposing the formula.

#### 6.4.5 Move adjacent privileged visibility approval server-side

Files:

- `src/services/firebase/admin.firebase.ts`
- `functions/src/visibility.ts`
- `api/visibility/approve.ts` if still used.
- `functions/test/visibility.test.ts`

Changes:

- Move admin approval of visibility requests to a callable or trusted backend route.
- Keep request approval audited.
- Keep boost duration/policy selection controlled by product rules.

Acceptance:

- Privileged visibility changes no longer run as a client Firestore transaction.
- Ranking policy and paid-visibility effects share the same governance principle.

### Tests for 6.4

Commands:

```bash
npm test -- src/lib/ranking.test.ts
npm test -- src/services/admin.service.test.ts
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
```

Expected results:

- Admins can view/change policy only through approved paths.
- Policy changes create audit rows.
- Non-admins cannot read/write policy internals.
- Customer/provider UI does not expose exact ranking formula.
- Paid/visibility approval remains audited and server-owned.

## Cross-Section Dependencies

| Dependency | Related section | Impact on Section 6 |
|---|---|---|
| Coverage radius / neighborhood distance | Section 2 | Section 6 needs distance-aware ranking input. |
| Review aggregate correctness | Section 5 | Reputation ranking depends on current `avgRating` and `reviewCount`. |
| Paid visibility lifecycle | Section 7 | Active/expired paid status must feed capped ranking influence. |
| Provider dashboard guidance | Section 9 | Provider UI should expose high-level factors without formulas. |
| Admin product controls | Section 10 | Ranking policy controls belong to admin/governance surfaces. |
| Abuse penalties | Section 11 | Ranking should be ready to consume trusted penalty signals. |
| Analytics events | Section 12 | Activity, responsiveness, profile views, and paid events should be trusted ranking inputs. |
| Monetization policy | Section 13 | Paid visibility products must not create guaranteed top placement. |

## Work Item Order

1. Add ranking policy module and expand ranking unit tests.
2. Add distance/coverage ranking input after or alongside Section 2 coverage work.
3. Add trusted activity/responsiveness signal source.
4. Add Firebase/search integration tests for approved-only, rejected/suspended, banned-owner, paid expiry, and organic outranking behavior.
5. Add policy model, validation, server mutation path, and audit trail.
6. Add admin governance UI or admin-only service surface.
7. Add privacy regression tests for customer/provider UI.
8. Run full verification gate.

## Verification Commands

Run targeted checks while implementing:

```bash
npm test -- src/lib/ranking.test.ts
npm test -- src/services/search.service.test.ts
npm test -- src/services/admin.service.test.ts
npm test -- src/services/providers.service.test.ts
npm test -- src/services/reviews.service.test.ts
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
npm run lint
npm run build
```

Run final release gate:

```bash
npm run release:check
```

## Effort Estimate

| Area | Estimate | Notes |
|---|---:|---|
| Ranking policy module and expanded unit tests | 1-2 days | Small code surface, high test value. |
| Distance/coverage-aware ranking integration | 1-3 days | Depends on Section 2 coverage data model. |
| Trusted activity/responsiveness signals | 2-4 days | Requires backend event writes or scheduled aggregation. |
| Search/Firebase/rules/e2e exclusion coverage | 1-2 days | Emulator setup may add time. |
| Ranking governance model/callables/audit | 2-4 days | Needs careful rules and validation. |
| Admin governance UI | 1-2 days | Can start as minimal active policy/history panel. |
| Privacy/disclosure regression tests | 0.5-1 day | Mostly UI assertions and locale review. |

Total expected effort: **8.5-18 days**, depending on whether Section 2 distance work and Section 12 event tracking are already completed.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Ranking weights become ad-hoc or provider-specific | High | Use platform-wide policy objects, validation, and audit trail. |
| Paid visibility is perceived as guaranteed placement | High | Keep paid cap low, add guardrail tests, and avoid guarantee copy. |
| Activity score is provider-editable or stale | High | Move activity to trusted backend signals. |
| Banned account remains searchable because provider status is still approved | High | Denormalize account status or update provider status during ban. |
| Distance ranking conflicts with Section 2 coverage model | Medium | Share one coverage utility and one set of fixtures. |
| Exact ranking formula leaks in provider dashboard | Medium | Add privacy regression tests for formula/weight strings. |
| Firestore query shape cannot support new ranking inputs | Medium | Keep bounded candidate fetches or add precomputed visibility/ranking index fields. |
| Overfitting tests to exact order makes ranking hard to tune | Medium | Test invariants and relative outcomes, not every exact score. |

## Definition of Done

- [ ] Ranking policy is typed, validated, and used by the ranking engine.
- [ ] Ranking location score supports exact match and distance/coverage-aware relevance.
- [ ] Reputation score uses current visible-review aggregates and bounded contribution.
- [ ] Activity/responsiveness score comes from trusted signals or is explicitly removed from v1 ranking.
- [ ] Paid visibility influence is capped by policy and expires correctly.
- [ ] Fairness/exploration influence is capped by policy.
- [ ] Public search excludes pending, rejected, suspended, banned, and unapproved providers.
- [ ] Organic high-quality providers can outrank paid providers.
- [ ] No single factor guarantees top placement.
- [ ] Ranking policy changes are admin-only, audited, and platform-wide or product-rule-wide.
- [ ] Customer/provider UI does not expose exact ranking formulas or numeric weights.
- [ ] Targeted unit/service/rules/e2e tests pass.
- [ ] `npm run lint`, `npm run build`, and final release gate pass.

## Open Questions

1. Should ranking policy be stored in Firestore for v1, or should v1 use code-owned config plus an admin-readable version note?
2. Should Section 6 wait for Section 2 coverage-radius implementation before adding distance-aware ranking?
3. Should banned provider users automatically set provider `status: suspended`, or should search filter by a denormalized `ownerAccountStatus`?
4. Which activity signals should count in v1: recent contacts, response rate, average response time, profile freshness, or all of them?
5. Should admins manage ranking weights directly, or only choose from named policy presets?
6. Should profile views remain a fairness/exposure signal if they are not yet trusted backend events?
