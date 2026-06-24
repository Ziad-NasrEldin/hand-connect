# Section 6 Ranking & Visibility Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-06-ranking-visibility.md`

Scope: complete SRS section 6 so ranking and visibility are fully implemented across search ordering, current signal recalculation, paid/fairness guardrails, governance controls, auditability, and tests.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but needs gaps/tests completed.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Partially done | Product/Engineering | Distance/coverage and no-visibility-cap decisions are closed; policy ownership, trusted activity signals, fairness bounds, and transparency UI remain open. |
| 6.1 Weighted ranking | Partially done | Engineering | Central ranking exists; hardcoded weights, binary location score, unclear activity source, and limited tests remain. |
| 6.2 Dynamic recalculation | Partially done | Engineering | Search reads current provider docs and paid expiry is checked; banned-owner exclusion, trusted profile/activity events, and integration tests are missing. |
| 6.3 Guardrails | Partially done | Engineering/Product | Organic outranking unit test exists; code/docs still need no-cap terminology cleanup and broader invariant tests. |
| 6.4 Ranking governance | Partially done | Engineering/Admin | Formula is not public and runbook states no guarantees; policy model, admin controls, server mutation path, and audit trail are missing. |
| Verification | Not started | Engineering | Run unit, service, rules, e2e, lint, build, and release gate. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| RANK-PD-001 | Decide ranking policy ownership model. | Not started | Recommended: platform-owned active policy controlled by admin-only audited path. |
| RANK-PD-002 | Decide whether policy config is Firestore-backed in v1. | Not started | Firestore-backed policy enables governance; code-owned config is simpler but weaker. |
| RANK-PD-003 | Decide distance model for ranking. | Done | Reuse platform-controlled coverage and distance metadata based on provider location, city, and profession. |
| RANK-PD-004 | Decide if outside-coverage providers are excluded before ranking. | Done | Exclude outside-coverage providers from primary public results. |
| RANK-PD-005 | Decide trusted activity/responsiveness source. | Not started | Recommended: backend-derived contacts/conversation response metrics. |
| RANK-PD-006 | Decide whether profile views remain a ranking/fairness signal. | Not started | Use only if writes are trusted or event-derived. |
| RANK-PD-007 | Decide fairness/exploration bounds. | Not started | Recommended: small capped boost for low-exposure providers only. |
| RANK-PD-008 | Decide banned-owner exclusion model. | Done | Banned provider profiles must be absent from public ranking/discovery; implementation may synchronize provider status or use a trusted visibility projection. |
| RANK-PD-009 | Decide admin policy UI scope. | Not started | Recommended v1: active policy, bounded controls/presets, history, activation reason. |
| RANK-PD-010 | Decide provider-facing transparency copy. | Not started | Recommended: high-level factors only, no numeric weights or formula. |

## 6.1 Weighted Ranking Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| RANK-6.1-001 | Keep centralized ranking engine. | Done | `src/lib/ranking.ts` | Search results pass through `rankProviders`. |
| RANK-6.1-002 | Keep Firebase search applying ranking. | Done | `src/services/firebase/search.firebase.ts` | Firebase candidates are ranked before slicing to requested limit. |
| RANK-6.1-003 | Keep demo search applying ranking. | Done | `src/services/demo/search.demo.ts` | Demo candidates are ranked before slicing to requested limit. |
| RANK-6.1-004 | Add typed ranking policy module. | Not started | `src/lib/ranking-policy.ts` | Policy names all weights/caps and exposes a default v1 policy. |
| RANK-6.1-005 | Move hardcoded ranking weights to policy. | Not started | `src/lib/ranking.ts`, `ranking-policy.ts` | No unexplained magic ranking values remain in score calculation. |
| RANK-6.1-006 | Add ranking policy validation. | Not started | `ranking-policy.ts`, tests | Negative, infinite, `NaN`, and excessive values are rejected or normalized. |
| RANK-6.1-007 | Extend ranking input with location context. | Done | Section 2 coverage model, `src/lib/ranking.ts` | Ranker can use exact match, distance, and coverage metadata. |
| RANK-6.1-008 | Add distance-aware location scoring. | Done | `ranking.ts`, location/coverage utility | Closer covered provider ranks above farther covered provider when other signals equal. |
| RANK-6.1-009 | Ensure paid cannot override outside-coverage exclusion. | Done | Search/ranking services | Paid outside-coverage provider does not outrank in-coverage providers. |
| RANK-6.1-010 | Keep reputation signal in ranking. | Done | `ranking.ts`, provider type | `avgRating` and `reviewCount` influence score. |
| RANK-6.1-011 | Add reputation cap tests. | Not started | `src/lib/ranking.test.ts` | High review count cannot create unbounded dominance. |
| RANK-6.1-012 | Replace raw activity dependency with trusted signal. | Not started | provider type, callables/jobs, ranking | Providers cannot directly edit activity/responsiveness ranking input. |
| RANK-6.1-013 | Add activity ranking tests. | Not started | `ranking.test.ts`, service tests | Activity improves close ordering but remains capped. |
| RANK-6.1-014 | Move low-view fairness to policy. | Not started | `ranking-policy.ts`, `ranking.ts` | Fairness threshold and boost are named policy settings. |
| RANK-6.1-015 | Add fairness bound tests. | Not started | `ranking.test.ts` | Fairness cannot dominate major quality or location differences. |

## 6.2 Dynamic Recalculation Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| RANK-6.2-001 | Keep search-time ranking from current provider docs. | Done | Firebase/demo search services | Search reads current provider data before ranking. |
| RANK-6.2-002 | Keep expired paid visibility inactive in ranking helper. | Done | `src/lib/ranking.ts`, `ranking.test.ts` | Past `visibilityPaidUntil` returns inactive. |
| RANK-6.2-003 | Add search service test for paid expiry order. | Not started | `src/services/search.service.test.ts` | Expired paid provider sorts as organic in search path. |
| RANK-6.2-004 | Add UI test for expired paid label removal. | Not started | Search/profile UI tests | Expired paid provider is not highlighted or labeled paid. |
| RANK-6.2-005 | Keep approved-status public search filter. | Done | `search.firebase.ts`, `search.demo.ts` | Search only considers `status === approved`. |
| RANK-6.2-006 | Add Firebase approved-only search test. | Not started | Firebase adapter/emulator test | Approved appears; pending/rejected/suspended do not appear. |
| RANK-6.2-007 | Add browser smoke for rejected/suspended exclusion. | Not started | `tests/e2e/app.spec.ts` | Customer search cannot see rejected or suspended providers. |
| RANK-6.2-008 | Make banned-owner exclusion explicit. | Not started | Admin ban flow, search service, provider model | Provider owner ban removes provider from public ranking. |
| RANK-6.2-009 | Add banned-owner search test. | Not started | Service/Firebase/e2e tests | Banned provider account cannot appear in public search. |
| RANK-6.2-010 | Keep review creation updating provider aggregates. | Partially done | `functions/src/reviews.ts` | Callable updates `avgRating` and `reviewCount`; needs integration coverage. |
| RANK-6.2-011 | Keep review hide recalculating aggregates. | Partially done | `functions/src/reviews.ts` | Hidden review removes reputation effect; needs integration coverage. |
| RANK-6.2-012 | Add review-to-ranking integration test. | Not started | Functions/service tests | New/hidden review changes next search ranking input. |
| RANK-6.2-013 | Move profile view increment to trusted backend path. | Not started | `providers.firebase.ts`, `functions/src/providers.ts` | Profile view signal updates without client direct ranking-field write. |
| RANK-6.2-014 | Add trusted ranking event or signal records. | Not started | Functions, analytics/ranking signal model | Contact/conversation/profile events update trusted signal snapshots. |
| RANK-6.2-015 | Add rules test for provider cannot mutate ranking signals. | Not started | `tests/rules/firestore.rules.test.ts` | Provider owner cannot write activity, fairness, penalty, paid, or policy fields. |

## 6.3 Ranking Guardrails Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| RANK-6.3-001 | Replace visibility-cap policy language. | Partially done | `src/lib/ranking.ts`, docs, i18n | Captain decided there is no visibility cap policy; code still needs no-cap product-rule terminology cleanup. |
| RANK-6.3-002 | Keep organic outranking unit test. | Done | `src/lib/ranking.test.ts` | Weak paid provider does not automatically beat strong organic provider. |
| RANK-6.3-003 | Move paid visibility rules to policy config. | Not started | `ranking-policy.ts`, `ranking.ts` | Paid visibility rules are named without a visibility cap policy. |
| RANK-6.3-004 | Add no-guarantee paid visibility policy test. | Not started | `ranking.test.ts` | Paid visibility cannot guarantee top placement even without a visibility cap policy. |
| RANK-6.3-005 | Add no-single-factor location test. | Not started | `ranking.test.ts` | Location alone does not guarantee top placement in all cases. |
| RANK-6.3-006 | Add no-single-factor reputation test. | Not started | `ranking.test.ts` | Rating/review count alone cannot guarantee top placement. |
| RANK-6.3-007 | Add no-single-factor activity test. | Not started | `ranking.test.ts` | Activity alone cannot guarantee top placement. |
| RANK-6.3-008 | Add no-single-factor fairness test. | Not started | `ranking.test.ts` | Low views alone cannot guarantee top placement. |
| RANK-6.3-009 | Add service-path organic outranking test. | Not started | `search.service.test.ts` | Strong organic provider outranks weak paid provider through search service. |
| RANK-6.3-010 | Add Firebase organic visibility test. | Not started | Firebase adapter/emulator test | Free approved providers remain eligible for public ranking. |
| RANK-6.3-011 | Add future penalty signal slot if Section 11 needs it. | Not started | Provider/ranking signal model | Abuse penalty can be consumed by ranker without provider control. |
| RANK-6.3-012 | Update no-guarantee copy if needed. | Not started | Provider/dashboard/i18n docs | Copy avoids implying paid or any factor guarantees top placement. |

## 6.4 Ranking Governance Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| RANK-6.4-001 | Keep exact formulas out of public UI. | Partially done | Search/profile/dashboard pages | No known numeric weights are rendered; needs regression test. |
| RANK-6.4-002 | Keep admin runbook no-guarantee guidance. | Done | `docs/operations/admin-runbook.md` | Runbook says paid visibility does not guarantee ranking or revenue. |
| RANK-6.4-003 | Add ranking policy type. | Not started | `src/types/ranking-policy.ts` or admin types | Active policy includes version, weights, caps, fairness, paid, audit metadata. |
| RANK-6.4-004 | Add ranking policy collection/rules. | Not started | `firestore.rules` | Only admins can read/write policy internals, or writes are callable-only. |
| RANK-6.4-005 | Add policy validation helper tests. | Not started | `ranking-policy.test.ts` | Invalid weights/caps cannot be saved or activated. |
| RANK-6.4-006 | Add server-owned policy mutation callable. | Not started | `functions/src/ranking-policy.ts` | Active admin can create/activate bounded policy with reason. |
| RANK-6.4-007 | Add policy mutation audit rows. | Not started | callable/admin service | Every policy mutation writes an `adminActions` row. |
| RANK-6.4-008 | Add admin service methods for policy. | Not started | `src/services/admin.service.ts`, Firebase/demo services | Admin UI can read active policy/history and request mutation. |
| RANK-6.4-009 | Add minimal admin ranking policy UI. | Not started | Admin pages/router/hooks/i18n | Admin can view active policy version and bounded controls/presets. |
| RANK-6.4-010 | Prevent provider-specific manual placement controls. | Not started | Admin UI/service tests | No UI or API accepts a provider id to boost placement outside product rules. |
| RANK-6.4-011 | Move visibility request approval server-side. | Not started | `admin.firebase.ts`, `functions/src/visibility.ts` | Privileged paid effect no longer runs as client transaction. |
| RANK-6.4-012 | Add formula privacy UI test. | Not started | E2E/component tests | Customer/provider UI does not show formula, exact weights, or policy internals. |
| RANK-6.4-013 | Add high-level provider guidance. | Not started | Dashboard visibility page/i18n | Provider sees non-numeric factors and no-guarantee message. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| RANK-V-001 | `npm test -- src/lib/ranking.test.ts` | Done | Ranking paid expiry, guardrails, and distance cases pass. |
| RANK-V-002 | `npm test -- src/services/search.service.test.ts` | Done | Search service applies ranking, limits, and exclusions. |
| RANK-V-003 | `npm test -- src/services/admin.service.test.ts` | Not started | Admin policy/visibility audit paths pass if added. |
| RANK-V-004 | `npm test -- src/services/providers.service.test.ts` | Not started | Trusted profile/activity events do not break provider profile behavior. |
| RANK-V-005 | `npm test -- src/services/reviews.service.test.ts` | Not started | Review aggregate behaviors remain valid. |
| RANK-V-006 | Functions tests for ranking policy, reviews, and visibility | Not started | Callable validations and trusted writes pass. |
| RANK-V-007 | Firebase adapter/search tests if added | Not started | Approved-only, banned-owner, paid-expiry, and policy behavior pass with Firebase-shaped data. |
| RANK-V-008 | `npm run test:rules` | Not started | Rules prevent direct provider/customer mutation of ranking and policy internals. |
| RANK-V-009 | `npm run e2e -- tests/e2e/app.spec.ts` or equivalent | Not started | Search exclusion, paid expiry label, and formula privacy smoke pass. |
| RANK-V-010 | `npm run lint` | Not started | Passes. |
| RANK-V-011 | `npm run build` | Not started | Passes. |
| RANK-V-012 | `npm run release:check` | Not started | Full release gate passes. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| RANK-DOD-001 | Search results are ordered through a centralized ranking engine. | Done |
| RANK-DOD-002 | Ranking policy is typed, validated, and not hardcoded as unexplained magic values. | Not started |
| RANK-DOD-003 | Ranking considers distance/location relevance beyond binary neighborhood match. | Done |
| RANK-DOD-004 | Ranking considers review/reputation signals from visible-review aggregates. | Partially done |
| RANK-DOD-005 | Ranking considers trusted activity/responsiveness signals. | Not started |
| RANK-DOD-006 | Active paid visibility follows configured product rules without a separate visibility cap policy. | Partially done |
| RANK-DOD-007 | Expired paid visibility has no ranking or paid-label effect. | Partially done |
| RANK-DOD-008 | Bounded fairness/exploration is explicit and policy-controlled. | Not started |
| RANK-DOD-009 | Pending, rejected, suspended, banned, and unapproved providers are excluded from public ranking. | Partially done |
| RANK-DOD-010 | No single ranking factor guarantees top placement. | Partially done |
| RANK-DOD-011 | High-quality organic providers can outrank paid providers. | Done |
| RANK-DOD-012 | Admin ranking controls are platform-wide or product-rule-wide, not provider-specific favoritism. | Not started |
| RANK-DOD-013 | Ranking policy changes are admin-only and audited. | Not started |
| RANK-DOD-014 | Exact ranking formulas and numeric weights are not exposed publicly. | Partially done |
| RANK-DOD-015 | High-level provider guidance is available without exposing formula internals. | Partially done |
| RANK-DOD-016 | Targeted unit, service, functions, rules, and e2e tests pass. | Not started |
| RANK-DOD-017 | `npm run lint`, `npm run build`, and release gate pass. | Not started |

## Risk Tracker

| ID | Risk | Status | Mitigation |
|---|---|---|---|
| RANK-RISK-001 | Paid visibility becomes de facto guaranteed placement. | Open | Policy cap, organic outranking tests, and no-guarantee copy. |
| RANK-RISK-002 | Providers can influence ranking through editable fields. | Open | Move activity/signals to trusted backend fields and rules. |
| RANK-RISK-003 | Banned providers remain public if provider status is unchanged. | Open | Decide and implement banned-owner exclusion model. |
| RANK-RISK-004 | Ranking formula leaks through dashboard or locale copy. | Open | Add UI privacy tests for formula/weight strings. |
| RANK-RISK-005 | Policy tuning becomes ad-hoc favoritism. | Open | Use platform-wide policy object, bounded controls, and audit log. |
| RANK-RISK-006 | Distance-aware ranking duplicates Section 2 coverage logic. | Open | Share one coverage/location utility and fixture set. |
| RANK-RISK-007 | Exact-order tests make ranking hard to evolve. | Open | Test invariants and relative outcomes instead of every raw score. |

## Open Questions

1. Should v1 implement Firestore-backed ranking policy, or use typed code config until admin controls are built?
2. Should Section 6 distance ranking wait for Section 2 coverage radius work?
3. Should provider account bans automatically suspend public provider profiles?
4. Which activity and responsiveness metrics should influence v1 ranking?
5. Should admins control exact weights, bounded presets, or only paid/fairness caps?
6. Should profile views count toward fairness if they are currently client-incremented and best-effort?
