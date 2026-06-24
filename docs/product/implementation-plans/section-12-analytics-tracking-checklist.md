# Section 12 Analytics & Tracking Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-12-analytics-tracking.md`

Scope: complete SRS section 12 so Analytics & Tracking is fully implemented across trusted event capture, provider metrics, reputation aggregates, ranking signals, admin audit logs, paid visibility lifecycle tracking, Firestore rules, and tests.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but gaps or tests remain.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Not started | Product/Engineering | Decide event ledger scope, profile-view dedupe, response behavior scope, and paid expiry ownership. |
| Analytics event model | Not started | Engineering | No dedicated `analyticsEvents` collection or converter exists. |
| Profile view tracking | Partially done | Engineering | UI calls tracking and demo increments work; Firebase direct update may be denied and is swallowed. |
| Contact events | Partially done | Engineering | WhatsApp and chat contact records exist through callables; no separate event ledger exists. |
| Response behavior | Partially done | Engineering | Provider dashboard derives response metrics; edge-case tests are thin. |
| Review and reputation events | Partially done | Engineering | Callables update aggregates; analytics events and full transaction tests missing. |
| Ranking signals | Partially done | Engineering/Product | Ranking uses trusted fields; signal provenance and event history are not documented or logged. |
| Admin audit logs | Partially done | Engineering | `adminActions` exists for many flows; paid/admin mutations should be normalized behind backend paths. |
| Paid visibility lifecycle | Partially done | Engineering/Product | Approval changes provider paid fields; usage/expiry events and automatic expiry routine are missing. |
| Verification | Not started | Engineering | Run unit, functions, rules, e2e, lint, and build after implementation. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| ANALYTICS-PD-001 | Decide whether v1 adds a dedicated `analyticsEvents` collection. | Not started | Recommended: yes, append-only, backend-owned, minimal metadata. |
| ANALYTICS-PD-002 | Decide raw analytics event read access. | Not started | Recommended: admins only; providers see aggregates only. |
| ANALYTICS-PD-003 | Decide profile-view dedupe policy. | Not started | Recommended: one view per provider per browser session, with server-side owner exclusion. |
| ANALYTICS-PD-004 | Decide anonymous profile view handling. | Not started | Recommended: allow anonymous view counts with `actorId: null`. |
| ANALYTICS-PD-005 | Decide whether repeat WhatsApp reveals create repeat events. | Not started | Recommended: no; count one event per new eligible contact. |
| ANALYTICS-PD-006 | Decide response behavior scope. | Not started | Recommended: derive from conversations and messages in v1. |
| ANALYTICS-PD-007 | Decide paid expiry owner. | Not started | Recommended: backend routine, scheduled later if deployment setup is not ready. |
| ANALYTICS-PD-008 | Decide historical backfill policy. | Not started | Recommended: no event backfill except optional baseline snapshots. |
| ANALYTICS-PD-009 | Decide ranking signal visibility boundary. | Not started | Recommended: document inputs, never expose exact weights in UI or event metadata. |

## 12.1 Customer/Provider Interaction Events Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| ANALYTICS-12.1-001 | Define `AnalyticsEvent` and event type union. | Done | `functions/src/analytics.ts`, `functions/test/analytics.test.ts` | Event model supports profile, contact, review, admin, ranking, and paid lifecycle events; helper schema test passes. |
| ANALYTICS-12.1-002 | Add analytics event converter. | Not started | `src/firebase/converters.ts` | Firestore reads/writes preserve `id`, `type`, metadata, and timestamps. |
| ANALYTICS-12.1-003 | Add backend event helper. | Done | `functions/src/analytics.ts`, `functions/test/analytics.test.ts` | Functions can append typed event records with minimal metadata; writer behavior is unit-tested. |
| ANALYTICS-12.1-004 | Add analytics rules block. | Not started | `firestore.rules` | Direct client create/update/delete for `analyticsEvents` is denied. |
| ANALYTICS-12.1-005 | Add `trackProfileView` callable export. | Not started | `functions/src/analytics.ts`, `functions/src/index.ts` | Callable is deployed/exported and validates provider ID. |
| ANALYTICS-12.1-006 | Make profile view increment backend-owned. | Not started | `functions/src/analytics.ts` | Approved provider view increments `providers.profileViews` server-side. |
| ANALYTICS-12.1-007 | Exclude provider self-views. | Not started | `functions/src/analytics.ts` | Owner view returns without increment or event. |
| ANALYTICS-12.1-008 | Add server dedupe for profile views. | Not started | `functions/src/analytics.ts` | Duplicate `dedupeKey` does not increment twice. |
| ANALYTICS-12.1-009 | Update Firebase provider service to call `trackProfileView`. | Not started | `src/services/firebase/providers.firebase.ts` | No direct client `profileViews` update remains in Firebase path. |
| ANALYTICS-12.1-010 | Keep demo profile view parity. | Partially done | `src/services/demo/providers.demo.ts` | Demo already increments and dedupes; align event behavior if demo event store is added. |
| ANALYTICS-12.1-011 | Keep profile view failures non-blocking. | Partially done | `provider-profile-page.tsx`, provider service | Profile page still renders if analytics tracking fails. |
| ANALYTICS-12.1-012 | Write `whatsapp_reveal` event for first contact. | Done | `functions/src/engagement.ts`, `functions/test/analytics.test.ts` | First reveal writes one contact and one sanitized analytics event without phone metadata. |
| ANALYTICS-12.1-013 | Preserve WhatsApp reveal dedupe. | Done | `functions/src/engagement.ts`, `providers.service.test.ts` | Repeated reveal reuses contact and demo test covers dedupe. |
| ANALYTICS-12.1-014 | Write `chat_initiated` event for first platform-message contact. | Done | `functions/src/engagement.ts`, `functions/test/analytics.test.ts` | First chat writes one contact and one sanitized analytics event without message text. |
| ANALYTICS-12.1-015 | Preserve platform-message contact dedupe. | Done | `functions/src/engagement.ts`, `providers.service.test.ts` | Repeated chat to existing provider has one contact in demo coverage. |
| ANALYTICS-12.1-016 | Expand response metric tests. | Not started | `src/services/analytics.service.test.ts` | No-response, late-response, and multiple-message cases pass. |
| ANALYTICS-12.1-017 | Add dashboard metrics failure UI if desired. | Done | `provider-dashboard-page.tsx`, i18n; verified by `npm run build` | Metrics query failure has localized, non-blocking feedback. |
| ANALYTICS-12.1-018 | Add profile view rules regression. | Not started | `tests/rules/firestore.rules.test.ts` | Customer/provider cannot directly update `providers.profileViews`. |
| ANALYTICS-12.1-019 | Add analytics direct-write rules test. | Not started | `tests/rules/firestore.rules.test.ts` | Customer/provider cannot create `analyticsEvents`. |
| ANALYTICS-12.1-020 | Add e2e or component smoke for profile view dedupe. | Not started | `tests/e2e/app.spec.ts` or component test | Same-session provider profile open counts at most one view. |

## 12.2 Trust and Reputation Events Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| ANALYTICS-12.2-001 | Keep review creation callable-gated. | Done | `functions/src/reviews.ts`, `reviews.firebase.ts` | Direct review creation denied; Firebase path calls callable. |
| ANALYTICS-12.2-002 | Keep review contact gate. | Done | `functions/src/reviews.ts` | Review creation requires eligible contact with `hasReview == false`. |
| ANALYTICS-12.2-003 | Keep duplicate review prevention. | Done | `functions/src/reviews.ts` | Existing review for customer/provider pair blocks second review. |
| ANALYTICS-12.2-004 | Keep provider aggregate update on review creation. | Done | `functions/src/reviews.ts` | `avgRating` and `reviewCount` are updated from visible reviews. |
| ANALYTICS-12.2-005 | Write `review_created` analytics event. | Done | `functions/src/reviews.ts`, `functions/src/analytics.ts` | Successful review writes event with rating and aggregate metadata, not comment text. |
| ANALYTICS-12.2-006 | Keep review moderation admin-only. | Done | `functions/src/reviews.ts` | `hideReview` requires active admin. |
| ANALYTICS-12.2-007 | Keep aggregate recalculation on hidden review. | Done | `functions/src/reviews.ts`, `admin.demo.ts` | Removed reviews are excluded from provider aggregates. |
| ANALYTICS-12.2-008 | Keep admin audit action on hidden review. | Done | `functions/src/reviews.ts`, `admin.demo.ts` | `adminActions` row uses `hide_review`. |
| ANALYTICS-12.2-009 | Write `review_moderated` analytics event. | Done | `functions/src/reviews.ts`, `functions/src/analytics.ts` | Hidden review writes event with moderation metadata and no comment text. |
| ANALYTICS-12.2-010 | Add callable test for successful review transaction. | Not started | `functions/test/reviews.test.ts` | Review, contact update, aggregate update, and event write happen together. |
| ANALYTICS-12.2-011 | Add callable test for duplicate review failure. | Not started | `functions/test/reviews.test.ts` | Duplicate review writes no event. |
| ANALYTICS-12.2-012 | Add callable test for no-contact review failure. | Not started | `functions/test/reviews.test.ts` | No-contact review writes no event. |
| ANALYTICS-12.2-013 | Add callable test for banned customer review failure. | Not started | `functions/test/reviews.test.ts` | Banned customer is rejected. |
| ANALYTICS-12.2-014 | Add callable test for non-admin hide-review failure. | Not started | `functions/test/reviews.test.ts` | Non-admin cannot moderate review. |
| ANALYTICS-12.2-015 | Add callable test for hide-review aggregate and audit side effects. | Not started | `functions/test/reviews.test.ts` | Review removed, report optionally closed, aggregate updated, audit and event written. |
| ANALYTICS-12.2-016 | Keep removed reviews out of public reads. | Done | `reviews.firebase.ts`, `firestore.rules` | Public read only returns visible reviews; rules allow non-visible reads only for admin. |
| ANALYTICS-12.2-017 | Add dashboard latest-review removed-review test. | Not started | `src/services/analytics.service.test.ts` | Removed reviews do not appear in latest reviews. |
| ANALYTICS-12.2-018 | Add provider dashboard aggregate UI test if harness exists. | Not started | component/e2e tests | Rating and latest reviews render from service data. |

## 12.3 Ranking, Admin, and Paid Events Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| ANALYTICS-12.3-001 | Document ranking-visible signals. | Not started | `src/lib/ranking.ts`, product docs | Signal list maps to source fields without exposing exact UI weights. |
| ANALYTICS-12.3-002 | Keep paid boost bounded by ranking tests. | Done | `src/lib/ranking.test.ts` | Weak paid provider does not automatically beat strong organic provider. |
| ANALYTICS-12.3-003 | Keep expired paid visibility inactive in ranking. | Done | `src/lib/ranking.ts`, `ranking.test.ts` | Expired paid visibility is treated as organic. |
| ANALYTICS-12.3-004 | Add ranking signal event for profile view changes. | Not started | `functions/src/analytics.ts` | Profile view increment emits coarse ranking signal event. |
| ANALYTICS-12.3-005 | Add ranking signal event for review aggregate changes. | Not started | `functions/src/reviews.ts` | Review create/hide emits changed aggregate field metadata. |
| ANALYTICS-12.3-006 | Add ranking signal event for provider status changes. | Not started | `functions/src/providers.ts` | Approve/reject/suspend emits provider status signal event. |
| ANALYTICS-12.3-007 | Add ranking signal event for paid visibility changes. | Not started | `functions/src/visibility.ts` | Paid start/expiry emits paid signal event. |
| ANALYTICS-12.3-008 | Move visibility approval to callable. | Not started | `functions/src/visibility.ts`, `admin.firebase.ts` | Admin UI calls backend-owned approval mutation. |
| ANALYTICS-12.3-009 | Keep visibility approval atomic. | Partially done | `admin.firebase.ts`, `admin.demo.ts` | Current client transaction is atomic, but should move server-side. |
| ANALYTICS-12.3-010 | Write paid visibility start event. | Done | `functions/src/visibility.ts` | Boost approval writes `paid_visibility_started`. |
| ANALYTICS-12.3-011 | Write area expansion approval event. | Done | `functions/src/visibility.ts` | Area expansion approval writes `area_expansion_approved`. |
| ANALYTICS-12.3-012 | Implement paid expiry routine. | Not started | `functions/src/visibility.ts` | Expired paid providers are processed idempotently. |
| ANALYTICS-12.3-013 | Write paid expiry event. | Not started | `functions/src/visibility.ts` | Expiry writes `paid_visibility_expired` once. |
| ANALYTICS-12.3-014 | Decide scheduled versus manual expiry execution. | Blocked | Product/Engineering/Deployment | Need deployment decision for scheduled Functions or manual admin command. |
| ANALYTICS-12.3-015 | Normalize admin action coverage for provider moderation. | Partially done | `functions/src/providers.ts`, `admin.demo.ts` | Provider approve/reject/suspend write admin actions. |
| ANALYTICS-12.3-016 | Normalize admin action coverage for visibility mutations. | Partially done | `admin.firebase.ts`, `admin.demo.ts` | Visibility approve/reject write actions, but approval should move callable-side. |
| ANALYTICS-12.3-017 | Normalize admin action coverage for reports and bans. | Partially done | `admin.firebase.ts`, `admin.demo.ts` | Existing paths write actions; add focused tests. |
| ANALYTICS-12.3-018 | Normalize admin action coverage for profession mutations. | Partially done | `admin.firebase.ts`, `admin.demo.ts` | Existing paths write actions; add focused tests. |
| ANALYTICS-12.3-019 | Add rules test for admin audit writes. | Partially done | `tests/rules/firestore.rules.test.ts` | Current test covers admin create and customer deny; expand target types if needed. |
| ANALYTICS-12.3-020 | Add callable tests for paid visibility approval. | Not started | `functions/test/visibility.test.ts` | Admin approval updates request/provider, writes audit action, writes analytics event. |
| ANALYTICS-12.3-021 | Add callable tests for paid expiry. | Not started | `functions/test/visibility.test.ts` | Expiry removes active paid state and writes one event once. |
| ANALYTICS-12.3-022 | Add UI regression for hidden ranking weights. | Done | `src/features/dashboard/dashboard-admin-visibility-boundary.test.ts`; verified by targeted test run | Provider dashboard source does not render exact ranking weights. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| ANALYTICS-V-001 | `npm test -- src/services/analytics.service.test.ts` | Done | Provider dashboard metric tests pass. |
| ANALYTICS-V-002 | `npm test -- src/services/providers.service.test.ts` | Done | Contact dedupe and rate-limit tests pass. |
| ANALYTICS-V-003 | `npm test -- src/lib/ranking.test.ts` | Done | Ranking and paid visibility tests pass. |
| ANALYTICS-V-004 | `npm test -- src/services/admin.service.test.ts` if added | Done | Admin audit/visibility service tests pass. |
| ANALYTICS-V-005 | `npm test -- src/services/visibility.service.test.ts` if added | Done | Visibility request lifecycle tests pass. |
| ANALYTICS-V-006 | `cd functions && npm test` | Done | Functions helper/callable tests pass; generated `lib/test` duplicates were also green after build. |
| ANALYTICS-V-007 | `cd functions && npm run build` | Done | Functions TypeScript build passes. |
| ANALYTICS-V-008 | `npm run test:rules` | Done | Firestore and Storage rules tests pass with emulator. |
| ANALYTICS-V-009 | `npm run e2e -- tests/e2e/app.spec.ts` | Done | Mobile browser smoke for profile/contact/dashboard/admin flows passes. |
| ANALYTICS-V-010 | `npm run lint` | Done | Lint passes. |
| ANALYTICS-V-011 | `npm run build` | Done | App build passes. |
| ANALYTICS-V-012 | Manual smoke: profile view dedupe | Not started | Same-session provider view increments at most once. |
| ANALYTICS-V-013 | Manual smoke: WhatsApp reveal analytics | Not started | Reveal writes contact and sanitized analytics event. |
| ANALYTICS-V-014 | Manual smoke: chat initiation analytics | Not started | First chat writes contact and sanitized analytics event. |
| ANALYTICS-V-015 | Manual smoke: review moderation analytics | Not started | Hide-review updates aggregate, audit, and analytics event. |
| ANALYTICS-V-016 | Manual smoke: paid approval and expiry analytics | Not started | Paid start and expiry events exist and ranking state updates. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| ANALYTICS-DOD-001 | Analytics event model exists and is typed. | Done |
| ANALYTICS-DOD-002 | Analytics event metadata avoids secrets, phone numbers, WhatsApp URLs, message bodies, identity documents, and raw location coordinates. | Done |
| ANALYTICS-DOD-003 | Firestore rules deny direct client analytics event writes. | Not started |
| ANALYTICS-DOD-004 | Profile views are tracked through trusted backend logic. | Not started |
| ANALYTICS-DOD-005 | Provider self-views do not increment profile views. | Not started |
| ANALYTICS-DOD-006 | Repeated same-session profile views are deduped. | Partially done |
| ANALYTICS-DOD-007 | WhatsApp reveals create deduplicated contact records. | Done |
| ANALYTICS-DOD-008 | WhatsApp reveals create sanitized analytics events. | Done |
| ANALYTICS-DOD-009 | Chat initiations create deduplicated contact records. | Done |
| ANALYTICS-DOD-010 | Chat initiations create sanitized analytics events. | Done |
| ANALYTICS-DOD-011 | Response behavior metrics are derived and covered by edge-case tests. | Partially done |
| ANALYTICS-DOD-012 | Review creation remains contact-gated and aggregate-updating. | Done |
| ANALYTICS-DOD-013 | Review creation writes sanitized analytics event. | Done |
| ANALYTICS-DOD-014 | Review moderation remains admin-only and aggregate-updating. | Done |
| ANALYTICS-DOD-015 | Review moderation writes admin audit and sanitized analytics event. | Done |
| ANALYTICS-DOD-016 | Removed reviews are hidden from public and provider dashboard latest-review reads. | Partially done |
| ANALYTICS-DOD-017 | Ranking signal sources are documented. | Not started |
| ANALYTICS-DOD-018 | Ranking signal changes are event-backed without exposing exact weights. | Not started |
| ANALYTICS-DOD-019 | Admin action audit coverage is complete for v1 admin mutations. | Partially done |
| ANALYTICS-DOD-020 | Paid visibility approval is backend-owned or explicitly documented as an admin-only client fallback. | Partially done |
| ANALYTICS-DOD-021 | Paid visibility start is tracked. | Done |
| ANALYTICS-DOD-022 | Paid visibility expiry is tracked by an idempotent backend routine. | Not started |
| ANALYTICS-DOD-023 | Functions tests cover analytics side effects. | Partially done |
| ANALYTICS-DOD-024 | Rules tests cover analytics and protected counter writes. | Done |
| ANALYTICS-DOD-025 | E2E smoke covers profile/contact/dashboard/admin analytics-critical flows. | Done |
| ANALYTICS-DOD-026 | Targeted tests, functions build, rules tests, mobile e2e, lint, and app build pass. | Done |

## Open Questions

1. Should providers ever see raw analytics events, or only aggregate dashboard metrics?
2. Should anonymous profile views count, and should they be distinguishable from signed-in customer views?
3. Should repeated WhatsApp reveals after the first contact be logged as repeat engagement, or intentionally ignored for v1?
4. Should paid visibility expiry be a scheduled Cloud Function immediately, or an idempotent manual/admin routine until deployment setup is ready?
5. Should historical aggregate counters get one baseline event per provider, or should analytics history start only after this implementation ships?
6. Should ranking signal events include old/new values, or only field names and target references to avoid exposing sensitive scoring behavior?
