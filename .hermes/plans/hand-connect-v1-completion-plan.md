# Hand Connect / Herafy v1 Completion Plan

## Goal

Complete Hand Connect / Herafy v1 against the frozen PRD: a Cairo-only, directory-first home-services platform where customers discover approved providers, contact them directly through chat or WhatsApp, review only after contact, providers manage their public profile and metrics, and admins enforce trust, visibility, professions, reports, and audit logs.

## Non-Goals

- Booking or scheduling.
- Customer-provider payments, escrow, guarantees, or job tracking.
- Provider certifications.
- Multi-city support.
- Native-only feature work beyond the existing Capacitor wrapper.
- Public provider replies to reviews.
- Exposing ranking internals to providers.

## Default Product Decisions

These defaults unblock implementation unless explicitly changed:

- Public product name: Herafy; repository name can remain `hand-connect`.
- OAuth: Google OAuth for v1.
- Phone auth: deferred for v1; phone remains required profile/contact data.
- Reviews: one review per customer-provider relationship after contact.
- Paid visibility: manual admin confirmation only, no payment gateway.
- Native scope: Capacitor wrapper only, no native-only product scope.
- Sensitive mutations: Cloud Functions for trust/admin-critical writes.

## Current Gaps

| Area | Gap |
|---|---|
| Auth | OAuth missing; registration UI uses a hardcoded password; phone login scope unresolved. |
| WhatsApp | Provider visibility flag is not enforced in UI/service; returned `wa.me` URL is not exposed as a redirect/open action. |
| Reviews | Firebase direct review creation does not update provider aggregates; cardinality must be documented as one per customer-provider. |
| Paid visibility | Firebase visibility adapter and admin visibility methods are not implemented. |
| Area expansion | Missing 30-review eligibility rule. |
| Admin | Professions page is read-only; account ban is missing; report workflow and audit coverage are incomplete. |
| Dashboard | Missing response behavior metrics and review summary. |
| Abuse | No server-side contact/message/report rate limiting. |
| Search | Needs invalid-param resilience, indexes, limits/pagination, and release proof. |

## Target Architecture

- React pages call hooks.
- Hooks call service facades in `src/services/*.service.ts`.
- Contracts in `src/services/contracts/*` define shared boundaries.
- Firebase adapters implement production behavior.
- Demo adapters remain deterministic local/demo support.
- Cloud Functions own sensitive mutations and aggregate updates.
- Firestore rules enforce role, ownership, visibility, and abuse boundaries.
- Tests cover functions, rules, services, ranking, and E2E journeys.

## Build Phases

### Phase 0 — Coordination

- Confirm or override default product decisions.
- Maintain `docs/plans/hand-connect-v1-completion-tracker.md` as the source of truth.
- Keep shared contracts, types, Firestore rules, and function exports coordinated.

### Phase 1 — Firebase Production Parity

- Replace `firebaseNotImplemented()` paths for visibility/admin production routes.
- Move sensitive mutations to callable functions where needed.
- Harden Firestore rules and rules tests.
- Add Firestore index readiness for search, reviews, conversations, reports, visibility, and audit logs.

### Phase 2 — Authentication

- Remove hardcoded registration password.
- Add Google OAuth for customers.
- Explicitly defer phone OTP or implement it if product decision changes.

### Phase 3 — Contact And WhatsApp

- Enforce `whatsappVisible` in service and UI.
- Add “Open WhatsApp” link using the returned `wa.me` URL.
- Normalize contact counting so repeated reveals/messages do not inflate metrics.

### Phase 4 — Reviews And Reputation

- Route Firebase review creation through callable function.
- Update provider `avgRating` and `reviewCount` transactionally.
- Document one-review-per-customer-provider behavior.
- Add review reporting and moderation read-back.

### Phase 5 — Provider Dashboard

- Track response behavior from message timestamps.
- Show response rate, average first response time, latest reviews, rating, views, and contacts.
- Add useful empty states.

### Phase 6 — Paid Visibility And Area Expansion

- Implement Firebase visibility request creation/listing.
- Implement admin approval/rejection with audit logs.
- Enforce area expansion only after 30 reviews.
- Treat expired paid visibility as organic and keep paid boost capped.

### Phase 7 — Admin Completion

- Implement profession CRUD/toggle/reorder.
- Add user account ban/unban and enforce banned-user restrictions.
- Improve reports workflow with resolution metadata and target context.
- Centralize audit logging for every admin mutation.

### Phase 8 — Abuse Prevention

- Add server-side rate limits for WhatsApp reveals, first messages, and reports.
- Add provider and review report entry points.

### Phase 9 — Search And UX Readiness

- Validate search params and handle errors.
- Add result limits or pagination.
- Preserve under-60-second contact journey.
- Verify mobile/RTL states.

### Phase 10 — Verification And Release

- Add E2E smoke for customer, provider, and admin journeys.
- Run full release gate: `npm run lint`, `npm test`, `npm run test:rules`, `npm run build`, `npm run e2e`.
- Update admin runbook and deployment docs.

## Definition Of Done

- Firebase production mode has no shipped `not implemented` routes.
- Customer can search, contact, message, and review after contact.
- Provider can register, wait for approval, edit profile, view dashboard, and request visibility.
- Admin can approve/reject/suspend/ban, manage professions, moderate reports/reviews, process visibility, and audit actions.
- Paid visibility is labeled, capped, expires, and does not undermine trust.
- No out-of-scope booking/payment/job-tracking/multi-city behavior is introduced.
- Full release gate passes or approved deferrals are recorded in the tracker.
