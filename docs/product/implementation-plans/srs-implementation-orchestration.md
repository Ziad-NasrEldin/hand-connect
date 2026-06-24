# SRS Implementation Orchestration

This document assigns the remaining SRS completion work to implementation workstreams.

Source docs:

- `docs/product/herafy-software-requirements.md`
- `docs/product/herafy-srs-implementation-map.md`
- `docs/product/implementation-plans/section-01-authentication.md`
- `docs/product/implementation-plans/section-02-search-discovery.md`
- `docs/product/implementation-plans/section-03-provider-profiles.md` through `section-15-out-of-scope.md`
- matching `*-checklist.md` trackers

## Execution Rule

Implementation will run in waves, not one section-agent per section.

Reason: many SRS sections share the same code surfaces. Running one code-writing agent per section would create conflicts in provider schemas, Firebase rules, Cloud Functions, ranking, admin flows, analytics, and tests.

## Wave 1 - Foundation Agents

### Agent F1 - Data Model, Firebase Rules, Cloud Functions Foundation

Report path: `/tmp/herafy-feature-extract/impl-agent-f1-foundation.md`

Primary goal: establish safe backend/data foundations used by all later workstreams.

Assigned implementation areas:

- Provider public/approval visibility invariants.
- Coverage/entitlement data model primitives needed by search, paid visibility, and area expansion.
- Server-owned sensitive mutations where direct client mutation is unsafe.
- Abuse/rate-limit/penalty backend primitives.
- Admin audit event consistency.
- Firestore rules/indexes for new/updated fields.

Primary checklist ownership:

- Section 2: `SEARCH-2.3-003` through `SEARCH-2.3-015`, especially provider coverage fields, coverage keys, indexes/rules, approved-only tests.
- Section 3: approval visibility and provider status checklist items.
- Section 4: contact callable/rate-limit backend and rules checklist items.
- Section 5: review callable/moderation aggregate backend checklist items.
- Section 7: paid visibility state, expiry, admin-owned approval backend checklist items.
- Section 8: area expansion entitlement backend checklist items.
- Section 10: admin callable/audit/backend enforcement checklist items.
- Section 11: abuse reporting, account status, penalties, rate limits, sensitive rules checklist items.
- Section 12: backend analytics/audit event write paths.
- Section 13: paid product/catalog/snapshot backend and customer no-charge boundary enforcement.
- Section 14: rules/index/function stability items.
- Section 15: static/product boundary backend guardrails where applicable.

Strict boundaries:

- May edit Firebase rules, indexes, functions, service/contracts/types, test files directly tied to backend/rules.
- Avoid large UI rewrites.
- Avoid touching docs except checklist status updates directly related to completed items.
- If a change overlaps with Agent F2 on search/ranking code, prefer creating a small shared utility and note coordination in the report.

Minimum verification:

- Targeted unit tests for touched service/lib/function areas.
- Firestore rules tests if rules change.
- `npm run lint` or a documented blocker if lint is blocked by unrelated pre-existing issues.
- `npm run build` if frontend contracts/types changed.
- `npm --prefix functions test` and/or `npm --prefix functions run build` if functions changed.

### Agent F2 - Search, Ranking, Coverage, Visibility Foundation

Report path: `/tmp/herafy-feature-extract/impl-agent-f2-search-ranking.md`

Primary goal: complete discovery/ranking/visibility mechanics on top of or alongside the backend foundation.

Assigned implementation areas:

- Neighborhood coordinates and browser current-location mapping utilities.
- Provider coverage matching and ranking distance score.
- Approved-only, coverage-aware search behavior.
- Paid visibility ranking labels/expiry handling from current data.
- Ranking governance tests and product-boundary tests for search/profile.
- Search failure UI if it does not require broad UI refactor.

Primary checklist ownership:

- Section 2: all remaining `SEARCH-2.1`, `SEARCH-2.2`, `SEARCH-2.3`, `SEARCH-2.4`, `SEARCH-2.5` items not owned by F1.
- Section 3: profile/public listing coverage indicators and profile render evidence.
- Section 6: all ranking/visibility checklist items.
- Section 7: search/profile paid label and no-guarantee ranking behavior checklist items.
- Section 8: expanded-area search/ranking behavior checklist items.
- Section 13: paid/organic search boundary tests.
- Section 14: performance/stability checks for search/ranking.
- Section 15: product-boundary scan for search/profile no booking/assignment/payments.

Strict boundaries:

- May edit search, ranking, neighborhood/location utilities, related tests, and small profile/search UI states.
- Do not implement admin/provider dashboard flows; leave them for Wave 2.
- Do not invent final paid pricing or billing policy; use typed placeholders only if required and flag product decisions.
- Coordinate with F1 if provider model/rules need backend changes.

Minimum verification:

- `npm test -- src/services/search.service.test.ts`
- `npm test -- src/lib/ranking.test.ts`
- new tests for location/coverage utilities if added.
- targeted component/e2e tests if UI failure/current-location behavior is changed.
- `npm run lint`
- `npm run build`

## Wave 2 - Product Surface Agents

These start after Wave 1 reports are reviewed and conflicts are resolved.

### Agent P3 - Admin and Provider Dashboard Workflows

Report path: `/tmp/herafy-feature-extract/impl-agent-p3-admin-provider-dashboard.md`

Assigned areas:

- Section 8 provider area expansion request UI/history.
- Section 9 provider dashboard metrics, visibility status, request history, ranking guidance.
- Section 10 admin approval/rejection/ban/suspend/moderation/paid product workflows.
- Section 12 dashboard/admin analytics display where backend data exists.

Primary checklist ownership:

- Section 8 dashboard/request/history UI items.
- Section 9 all provider dashboard checklist items.
- Section 10 all admin UI/action checklist items not owned by F1.
- Section 12 dashboard/admin analytics display items.

### Agent P4 - Customer UX, Contact, Reviews, Profile Surface

Report path: `/tmp/herafy-feature-extract/impl-agent-p4-customer-ux-contact-reviews.md`

Assigned areas:

- Section 3 provider profile completeness and boundary copy.
- Section 4 contact UX, failure states, WhatsApp/message flows, no booking/assignment guardrails.
- Section 5 review UI, hidden/empty states, no provider reply regression, reputation display.
- Section 11 customer/provider-facing abuse and rate-limit feedback.

Primary checklist ownership:

- Section 3 profile data and independence UI items.
- Section 4 contact UI and no-platform-intermediation items.
- Section 5 review/reputation UI/test items.
- Section 11 report/abuse UI feedback items.

### Agent P5 - Analytics, Monetization, Platform Boundaries

Report path: `/tmp/herafy-feature-extract/impl-agent-p5-analytics-monetization-boundaries.md`

Assigned areas:

- Section 12 trusted analytics event instrumentation and event schema consistency.
- Section 13 monetization catalog, pricing transparency, no customer charges/commission/per-lead boundaries.
- Section 14 responsive/stability/accessibility/performance/platform-boundary tests.
- Section 15 explicit out-of-scope release guardrails.

Primary checklist ownership:

- Section 12 analytics instrumentation/checklist items not owned by F1/P3.
- Section 13 pricing transparency and customer/payment boundary items.
- Section 14 platform quality/release boundary items.
- Section 15 all out-of-scope guardrail checklist items.

## Wave 3 - Verification Agent

### Agent V6 - Integration Verification and Checklist Closure

Report path: `/tmp/herafy-feature-extract/impl-agent-v6-verification.md`

Assigned areas:

- Inspect all diffs and reports from F1/F2/P3/P4/P5.
- Run targeted tests, rules tests, function tests, lint, build, and available e2e/release gates.
- Update implementation-map statuses only where evidence proves completion.
- Update checklist trackers to `Done`, `Partially done`, or `Blocked` with evidence.
- Produce final completion report with blockers and manual Firebase/product decisions.

## Current Launch Wave

Start now:

- Agent F1 - Data Model, Firebase Rules, Cloud Functions Foundation
- Agent F2 - Search, Ranking, Coverage, Visibility Foundation

Do not start Wave 2 until Wave 1 has finished and the orchestrator has reviewed diffs and reports.
