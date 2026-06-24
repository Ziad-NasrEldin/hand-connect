# Section 9 Provider Dashboard Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-09-provider-dashboard.md`

Scope: complete SRS section 9 so approved providers can view performance metrics, paid visibility state, coverage controls, service-area expansion state, and qualitative ranking guidance without exposing hidden ranking formulas.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but needs gaps/tests completed.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Not started | Product/Engineering | Decide analytics source of truth, paid status surface, coverage display scope, and ranking guidance wording. |
| Performance metrics | Partially done | Engineering | Dashboard renders main metrics; profile view tracking and edge-case/Firebase coverage remain incomplete. |
| Paid visibility status | Partially done | Engineering | `/visibility` request flow exists; dashboard paid status and expiry summary missing. |
| Coverage controls | Partially done | Engineering | Service-area expansion exists; dashboard coverage summary and radius model integration missing. |
| Ranking privacy | Partially done | Engineering | Exact formulas are not exposed today; regression tests and qualitative guidance missing. |
| Mobile/dashboard QA | Partially done | Engineering | Provider shell mobile smoke exists; dashboard content mobile proof missing. |
| Verification | Not started | Engineering | Run targeted unit/service/rules/function/e2e checks, lint, build, and release gate. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| DASH-PD-001 | Decide whether profile views count anonymous views. | Not started | Recommended: count public approved-profile views with server-side abuse/dedupe controls. |
| DASH-PD-002 | Decide profile view dedupe window. | Not started | Recommended: one view per viewer/session/provider per day if event model supports it. |
| DASH-PD-003 | Decide analytics source of truth. | Not started | Recommended: trusted callable updates aggregate fields and optionally event rows. |
| DASH-PD-004 | Decide dashboard metric windows. | Not started | Recommended v1: lifetime totals plus response metrics; add 7/30-day later if event rows exist. |
| DASH-PD-005 | Decide where active paid status appears. | Not started | Recommended: dashboard summary plus detailed `/visibility` history. |
| DASH-PD-006 | Decide whether pending request cancellation is in v1. | Not started | Recommended: defer unless providers need self-service cleanup. |
| DASH-PD-007 | Decide coverage display before radius model lands. | Not started | Recommended: show current service areas now; add radius later from Section 2. |
| DASH-PD-008 | Approve no-guarantee wording. | Not started | Must include no guaranteed customers, jobs, revenue, or top placement. |
| DASH-PD-009 | Confirm ranking guidance boundaries. | Not started | Qualitative guidance allowed; exact weights/formulas/scores disallowed. |

## 9.1 Performance Metrics Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| DASH-9.1-001 | Keep provider dashboard route approval-gated. | Done | `src/router/app-router.tsx`, `src/router/route-guards.tsx` | Only approved providers can reach `/dashboard`. |
| DASH-9.1-002 | Keep metric cards for profile views, contacts, rating, conversations, response rate, and average first response. | Done | `src/features/dashboard/pages/provider-dashboard-page.tsx` | Existing cards render from provider and metrics data. |
| DASH-9.1-003 | Move profile view tracking to callable/trusted backend. | Not started | `functions/src/*`, `src/services/firebase/providers.firebase.ts` | Firebase profile views increment without client direct counter writes. |
| DASH-9.1-004 | Preserve demo profile view tracking behavior. | Not started | `src/services/demo/providers.demo.ts` | Demo mode continues to increment once per session and skip owner views. |
| DASH-9.1-005 | Add profile view callable tests. | Not started | `functions/test/*` | Approved provider views increment; owner view does not increment; invalid provider rejects. |
| DASH-9.1-006 | Add rules test proving provider cannot directly mutate profile views. | Not started | `tests/rules/firestore.rules.test.ts` | Direct `profileViews` update by provider owner fails. |
| DASH-9.1-007 | Add rules/callable proof that trusted profile view path can update aggregate. | Not started | Function tests or emulator integration | Trusted path succeeds without loosening owner rules. |
| DASH-9.1-008 | Strengthen contacts count tests. | Not started | `src/services/analytics.service.test.ts`, `providers.service.test.ts` | WhatsApp and platform contacts count correctly without duplicate inflation. |
| DASH-9.1-009 | Strengthen response rate tests for no conversations. | Not started | `analytics.service.test.ts` | No conversations returns response rate `0` and average first response `null`. |
| DASH-9.1-010 | Strengthen response rate tests for unanswered conversations. | Not started | `analytics.service.test.ts` | Unanswered conversations reduce response rate and do not affect average response time. |
| DASH-9.1-011 | Strengthen response rate tests for multiple messages. | Not started | `analytics.service.test.ts` | First customer message and first provider reply drive average response time. |
| DASH-9.1-012 | Ensure latest reviews use visible/provider-readable reviews only. | Not started | `analytics.service.ts`, `reviews.service.ts`, tests | Hidden/moderated reviews do not appear in dashboard latest reviews. |
| DASH-9.1-013 | Add dashboard provider loading state. | Done | `provider-dashboard-page.tsx`, i18n; verified by `npm run build` | Dashboard does not show misleading zeroes while provider loads. |
| DASH-9.1-014 | Add dashboard metrics loading state. | Done | `provider-dashboard-page.tsx`, i18n; verified by `npm run build` | Metric area shows clear loading state. |
| DASH-9.1-015 | Add dashboard metrics error state and retry. | Done | `provider-dashboard-page.tsx`, i18n; verified by `npm run build` | Failed metrics query shows localized error and retry. |
| DASH-9.1-016 | Review chart unit design. | Done | `provider-dashboard-page.tsx`; verified by `npm run build` | Chart now shows count metrics only: views, contacts, and conversations. |
| DASH-9.1-017 | Add dashboard metric e2e assertions. | Not started | `tests/e2e/app.spec.ts` | Approved provider sees all key dashboard metrics. |

## 9.2 Paid/Coverage Controls Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| DASH-9.2-001 | Keep provider `/visibility` route. | Done | `src/router/app-router.tsx`, `src/layouts/provider-layout.tsx` | Approved providers can navigate to paid visibility page. |
| DASH-9.2-002 | Keep visibility request creation. | Done | `visibility-page.tsx`, `visibility.firebase.ts`, `visibility.demo.ts` | Providers can submit boost or area-expansion requests. |
| DASH-9.2-003 | Keep 30-review area expansion gate. | Done | `visibility-page.tsx`, `visibility.service.test.ts`, `firestore.rules.test.ts` | Below-threshold expansion is blocked; eligible expansion is allowed. |
| DASH-9.2-004 | Add paid status summary card to dashboard. | Done | `provider-dashboard-page.tsx`, i18n; verified by `npm run build` | Dashboard shows organic, active paid, or pending state; expired paid falls back to organic until expiry lifecycle policy is finalized. |
| DASH-9.2-005 | Show active paid expiry. | Done | `provider-dashboard-page.tsx`; verified by `npm run build` | Active paid provider sees expiry date. |
| DASH-9.2-006 | Show pending boost request state. | Done | `provider-dashboard-page.tsx`, `visibility.service.ts`; verified by `npm run build` | Pending paid request is visible from dashboard. |
| DASH-9.2-007 | Show no-guarantee paid copy on dashboard. | Done | `provider-dashboard-page.tsx`, i18n; verified by static boundary test | Copy says paid does not guarantee customers, jobs, revenue, or top placement. |
| DASH-9.2-008 | Add dashboard link to `/visibility`. | Done | `provider-dashboard-page.tsx`; verified by `npm run build` | Provider can jump from summary card to request/manage page. |
| DASH-9.2-009 | Add current coverage summary. | Done | `provider-dashboard-page.tsx`, `src/config/neighborhoods.ts`; verified by `npm run build` | Dashboard lists localized current service areas. |
| DASH-9.2-010 | Add service-area count. | Not started | `provider-dashboard-page.tsx` | Provider sees how many approved areas are active. |
| DASH-9.2-011 | Add area expansion eligibility summary. | Not started | `provider-dashboard-page.tsx` | Dashboard explains whether expansion is currently available. |
| DASH-9.2-012 | Integrate coverage radius when Section 2 lands it. | Done | `src/types/provider.ts`, `provider-dashboard-page.tsx`, `visibility-page.tsx`; verified by `npm run build` | Dashboard and visibility page show radius/covered areas from the F2 model. |
| DASH-9.2-013 | Enrich request history with request type. | Done | `visibility-page.tsx`, i18n; verified by static boundary test | Provider can distinguish boost from area expansion. |
| DASH-9.2-014 | Enrich request history with requested and processed dates. | Done | `visibility-page.tsx`, i18n; verified by `npm run build` | Provider can see lifecycle timing. |
| DASH-9.2-015 | Enrich request history with rejection reason. | Not started | `visibility-page.tsx`, `display.ts`, i18n | Rejected requests show a user-readable reason. |
| DASH-9.2-016 | Add request history empty state. | Not started | `visibility-page.tsx`, i18n | No requests shows useful empty state. |
| DASH-9.2-017 | Add request history loading and error states. | Done | `visibility-page.tsx`, i18n; verified by `npm run build` | Request query failure is visible and retryable. |
| DASH-9.2-018 | Decide and implement pending request cancellation if in v1. | Blocked | visibility service, rules, tests | Provider can cancel only owned pending requests if product approves. |
| DASH-9.2-019 | Keep providers blocked from setting paid fields. | Done | `firestore.rules.test.ts` | Existing rules test blocks provider update to `visibilityTier`. |
| DASH-9.2-020 | Add rules test for `visibilityPaidUntil` direct mutation. | Not started | `firestore.rules.test.ts` | Provider cannot set paid expiry directly. |
| DASH-9.2-021 | Add rules test for direct service-area expansion mutation. | Not started | `firestore.rules.test.ts` | Provider cannot bypass request flow by editing `serviceAreaKeys`. |
| DASH-9.2-022 | Move admin visibility processing to callable when scheduled. | Blocked | `functions/src/*`, `admin.firebase.ts` | Admin approval/rejection becomes server-owned and audited. |

## 9.3 Ranking Logic Privacy Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| DASH-9.3-001 | Keep exact ranking formula out of dashboard UI. | Done | `provider-dashboard-page.tsx`, `ranking.ts` | Dashboard does not import or render `providerRankingScore`. |
| DASH-9.3-002 | Add qualitative guidance panel. | Done | `provider-dashboard-page.tsx`, i18n; verified by static boundary test | Provider sees actionable guidance about completeness, response, reviews, and service areas. |
| DASH-9.3-003 | Add explicit no top placement copy. | Done | `visibility-page.tsx`, `provider-dashboard-page.tsx`, i18n; verified by static boundary test | Paid visibility copy includes no top-placement guarantee. |
| DASH-9.3-004 | Add e2e formula privacy test. | Not started | `tests/e2e/app.spec.ts` | Dashboard does not show `locationScore`, `paidBonus`, ranking weights, or combined score. |
| DASH-9.3-005 | Add component/static privacy test if practical. | Done | `src/features/dashboard/dashboard-admin-visibility-boundary.test.ts`; verified by targeted test run | Dashboard cannot accidentally render ranking internals. |
| DASH-9.3-006 | Keep ranking internals in `src/lib/ranking.ts`. | Done | `src/lib/ranking.ts` | Formula stays implementation-only. |
| DASH-9.3-007 | Avoid exposing paid bonus value in paid status card. | Done | `provider-dashboard-page.tsx`; verified by static boundary test | Paid copy stays qualitative and capped. |

## Mobile And Accessibility Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| DASH-MOB-001 | Keep provider shell mobile links visible. | Done | `tests/e2e/app.spec.ts` | Existing mobile smoke checks dashboard/profile/visibility links. |
| DASH-MOB-002 | Add mobile metric-card readability check. | Not started | `tests/e2e/app.spec.ts` | Metric card labels and values do not overlap on mobile. |
| DASH-MOB-003 | Add mobile chart readability check or remove fragile chart from mobile. | Not started | `provider-dashboard-page.tsx`, e2e | Chart labels are readable, or chart has mobile-specific presentation. |
| DASH-MOB-004 | Add mobile paid status card check. | Not started | e2e | Paid status and expiry fit mobile viewport. |
| DASH-MOB-005 | Add mobile coverage summary check. | Not started | e2e | Service-area chips/list wrap cleanly. |
| DASH-MOB-006 | Add mobile visibility request history check. | Not started | e2e | Request rows are readable with long notes and Arabic labels. |
| DASH-A11Y-001 | Ensure dashboard cards have accessible labels/headings. | Not started | dashboard page | Screen readers can identify metrics and sections. |
| DASH-A11Y-002 | Ensure retry buttons and links are keyboard reachable. | Not started | dashboard and visibility pages | Error/retry paths work with keyboard navigation. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| DASH-V-001 | `npm test -- src/services/analytics.service.test.ts` | Done | Passed in combined targeted run: 4 files, 9 tests. |
| DASH-V-002 | `npm test -- src/services/providers.service.test.ts` | Not started | Contact/profile-view related provider service tests pass. |
| DASH-V-003 | `npm test -- src/services/visibility.service.test.ts` | Done | Passed in combined targeted run: 4 files, 9 tests. |
| DASH-V-004 | `npm test -- src/services/admin.service.test.ts` | Done | Passed in combined targeted run: 4 files, 9 tests. |
| DASH-V-005 | `npm test -- src/lib/ranking.test.ts` | Not started | Paid active/expired and ranking cap tests pass. |
| DASH-V-006 | `npm --prefix functions test` if callable added | Not started | Profile view callable tests pass. |
| DASH-V-007 | `npm --prefix functions run build` if callable added | Not started | Functions TypeScript build passes. |
| DASH-V-008 | `npm run test:rules` | Not started | Rules protect analytics counters, paid fields, service areas, and visibility requests. |
| DASH-V-009 | `npm run e2e -- tests/e2e/app.spec.ts` or `npm run e2e` | Not started | Provider dashboard, visibility, mobile, and privacy smoke pass. |
| DASH-V-010 | `npm run lint` | Done | Passed. |
| DASH-V-011 | `npm run build` | Done | Passed. |
| DASH-V-012 | `npm run release:check` | Not started | Full gate passes before marking section complete. |

## Definition Of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| DASH-DOD-001 | Approved provider route guard protects `/dashboard` and `/visibility`. | Done |
| DASH-DOD-002 | Dashboard displays profile views. | Partially done |
| DASH-DOD-003 | Profile views are tracked through trusted backend writes in Firebase mode. | Not started |
| DASH-DOD-004 | Direct provider/client analytics counter writes remain denied. | Partially done |
| DASH-DOD-005 | Dashboard displays contacts received. | Partially done |
| DASH-DOD-006 | Dashboard displays response behavior metrics. | Partially done |
| DASH-DOD-007 | Response behavior handles empty, unanswered, and answered conversations. | Not started |
| DASH-DOD-008 | Dashboard displays reviews and ratings. | Partially done |
| DASH-DOD-009 | Dashboard has loading/error/empty states. | Not started |
| DASH-DOD-010 | Dashboard displays active paid visibility status. | Not started |
| DASH-DOD-011 | Dashboard displays paid visibility expiry. | Not started |
| DASH-DOD-012 | Dashboard displays pending paid request state. | Not started |
| DASH-DOD-013 | Providers can request paid visibility. | Done |
| DASH-DOD-014 | Providers can request eligible service-area expansion. | Done |
| DASH-DOD-015 | Dashboard displays current coverage/service areas. | Not started |
| DASH-DOD-016 | Dashboard displays coverage radius once Section 2 model exists. | Blocked |
| DASH-DOD-017 | `/visibility` request history is detailed and readable. | Partially done |
| DASH-DOD-018 | Paid and area-expansion direct mutation remains protected by rules. | Partially done |
| DASH-DOD-019 | Dashboard shows qualitative improvement guidance. | Not started |
| DASH-DOD-020 | Dashboard does not expose exact ranking formulas or weights. | Partially done |
| DASH-DOD-021 | Formula privacy has regression coverage. | Not started |
| DASH-DOD-022 | Mobile dashboard content is verified. | Not started |
| DASH-DOD-023 | Targeted tests, rules, e2e, lint, build, and release gate pass. | Not started |

## Risk Tracker

| ID | Risk | Status | Mitigation |
|---|---|---|---|
| DASH-RISK-001 | Profile views silently fail in Firebase mode. | Open | Move increment to callable and test it. |
| DASH-RISK-002 | Dashboard paid copy implies guaranteed placement. | Open | Add no top-placement copy and regression test. |
| DASH-RISK-003 | Coverage summary diverges from search coverage. | Open | Use current `serviceAreaKeys` now and adopt Section 2 coverage fields later. |
| DASH-RISK-004 | Exact ranking formula leaks through future guidance work. | Open | Add e2e/static privacy tests. |
| DASH-RISK-005 | Mixed-unit chart confuses providers. | Open | Redesign chart or label units clearly. |
| DASH-RISK-006 | Mobile chart or request history clips Arabic text. | Open | Add mobile Playwright checks. |
| DASH-RISK-007 | Admin approval remains client-side for paid entitlements. | Open | Move visibility processing to callable in admin hardening workstream. |

## Open Questions

1. Should profile views count anonymous visitors, signed-in customers only, or both?
2. What dedupe period should profile views use?
3. Should dashboard show lifetime metrics only, or add 7-day and 30-day windows?
4. Should active paid status be represented by provider fields or separate entitlement records?
5. Should providers be able to cancel pending visibility requests?
6. Should dashboard coverage show only service areas until Section 2 radius work is done?
7. What final Arabic and English copy should product approve for no top-placement guarantees?
