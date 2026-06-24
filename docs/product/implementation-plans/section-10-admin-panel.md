# Section 10 Implementation Plan - Admin Panel

Source documents:
- SRS: `docs/product/herafy-software-requirements.md`, section 10.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 10.1-10.6.

Goal: make SRS section 10 fully implemented across admin UI, Firebase client services, Cloud Functions, Firestore rules, audit logging, paid controls, policy controls, and tests.

## Current Status

| SRS area | Current status | Reason |
| --- | --- | --- |
| 10.1 Provider Applications | Partially implemented | Admins can list pending provider applications, inspect identity documents, approve, and reject. Approval and rejection use Cloud Functions, but callable transaction tests and approval-to-public-visibility e2e coverage are missing. |
| 10.2 Identity Verification | Partially implemented | Provider registration stores identity documents and approval requires a document. Verification is binary through `nationalIdVerified`, with no explicit verification state, notes, reviewer metadata, or history. |
| 10.3 Reviews, Abuse, and Accounts | Partially implemented | Admins can view reports, resolve reports, hide reviews, suspend providers, and ban or unban users. Some mutations still run as direct client Firestore writes, and the banned/suspended action matrix is incomplete. |
| 10.4 Professions and Policies | Partially implemented | Admins can create professions and toggle active state. There is no platform policy settings model or admin UI, and profession mutations are direct admin Firestore writes. |
| 10.5 Paid Product Controls | Partially implemented | Admins can review paid visibility and area expansion requests, and product metadata exists for no-cap visibility plus 250 EGP monthly area expansion. Product management UI, Paymob renewal controls, and automatic expiry controls remain incomplete. |
| 10.6 Audit Logging | Partially implemented | Audit types, audit list UI, demo audit coverage, and several server audit writes exist. Some audit rows are client-created, audit writes are not fully server-owned, and the UI omits actor and timestamp. |

## Product Decisions Needed Before Implementation

### Decision A - Verification Model

Recommended v1 decision: use an explicit provider verification object, not only `nationalIdVerified`.

The current provider record stores `nationalIdVerified: boolean`.
This is enough to hide unapproved providers, but it is too thin for admin review, rejection, appeal, and accountability.

Recommended fields:
- `verificationStatus`: `not_submitted`, `submitted`, `verified`, `rejected`, `needs_more_info`.
- `verifiedBy`: admin user id or null.
- `verifiedAt`: ISO timestamp or null.
- `verificationNotes`: short internal admin note.
- `identityDocumentVersion`: number or uploaded timestamp reference.

Implementation implication:
- Approval should require `verificationStatus == verified` or should set it transactionally during approval.
- Rejection should store a reason and keep the provider hidden.
- Public provider visibility should depend on approved provider status and the verification policy.

### Decision B - Admin Mutation Boundary

Recommended v1 decision: all admin mutations that affect public visibility, money, moderation, identity, account status, policies, or professions MUST be Cloud Functions.

Current code already uses callables for provider approval, provider rejection, provider suspension, and review hiding.
Current Firebase admin service still writes visibility approvals, report resolution, user bans, professions, and audit rows directly from the client.

Implementation implication:
- Firestore rules should stop allowing direct admin writes for these collections except controlled read paths.
- Admin UI should call function-backed service methods.
- Audit rows should be written only by trusted backend code.

### Decision C - Policy Settings Scope

Recommended v1 decision: add a small typed `platformPolicies/admin` document rather than a broad dynamic settings table.

Initial settings should cover only flows that already exist or are planned in SRS sections 6-10:
- visibility boost cap per profession or area.
- default paid boost duration.
- maximum active paid providers per profession or area.
- area expansion minimum review count.
- provider approval policy for identity verification.
- review/report SLA labels if useful for admin triage.

Implementation implication:
- Keep policy values typed and validated.
- Do not allow arbitrary string settings that product flows can accidentally misuse.
- Store policy change audit entries with before and after summaries.

### Decision D - Paid Product Catalog

Recommended v1 decision: define a first-class paid product catalog before expanding paid approvals.

Current visibility requests have `type`, `tier`, `serviceArea`, `paymentMethod`, and notes.
Approval hardcodes a 30-day paid boost in `src/services/firebase/admin.firebase.ts`.

Recommended catalog:
- `paidProducts/{productId}` for boost and area expansion products.
- `active`, `displayName`, `type`, `durationDays`, `priceAmount`, `currency`, `visibilityCap`, and `requiresManualPaymentConfirmation`.
- Area expansion should carry a fee policy separate from boost duration.

Implementation implication:
- Provider request creation should choose a configured active product.
- Admin approval should apply the selected product terms, not hardcoded terms.
- Visibility caps should be enforced server-side at approval time.

## Target End State

Section 10 is complete when:

1. Admin routes remain role-protected, and banned admins cannot mutate or read admin-only data.
2. Provider applications list all pending providers with identity document context.
3. Approval requires identity verification according to policy.
4. Approval makes the provider publicly searchable and readable.
5. Rejection keeps the provider hidden and records a reason.
6. Identity verification state is explicit, stored, auditable, and visible to admins.
7. Admins can manage or hide reviews through server-owned mutations.
8. Admins can view and resolve abuse reports through server-owned mutations.
9. Admins can suspend providers and ban or unban accounts through server-owned mutations.
10. Ban and suspension state blocks protected user actions across auth, contact, reviews, messaging, visibility requests, provider edits, and report creation.
11. Admins can create, edit, activate, and deactivate professions through server-owned mutations.
12. Admins can view and update typed platform policy settings used by product flows.
13. Admins can manage paid visibility products, durations, prices, active states, no-cap product rules, and Paymob renewal policy.
14. Admins can approve or reject paid visibility and area expansion requests using configured terms.
15. Every admin mutation writes exactly one trusted audit row with actor, action, target, reason, and timestamp.
16. Audit logs are reviewable in the admin panel with actor, action, target, reason, and timestamp.
17. Firestore rules prevent direct client bypasses for admin mutation and audit paths.
18. Demo tests, rules tests, Cloud Function unit or emulator tests, and e2e smoke tests cover the above behavior.

## Current Implementation Evidence

### Admin routes and guards

- `src/router/app-router.tsx` defines `/admin`, `/admin/applications`, `/admin/providers`, `/admin/professions`, `/admin/visibility`, `/admin/reports`, and `/admin/actions`.
- `src/router/route-guards.tsx` protects admin routes with `ProtectedRoute role="admin"`.
- `firestore.rules` defines `isAdmin()` as signed in, role `admin`, and not banned.
- `tests/e2e/app.spec.ts` includes a smoke test that admin login reaches `/admin`.

### Admin UI pages

- `src/features/admin/pages/admin-dashboard-page.tsx` shows admin overview counts.
- `src/features/admin/pages/applications-page.tsx` lists pending applications, renders identity document metadata/preview, and calls approve/reject service methods.
- `src/features/admin/pages/providers-page.tsx` supports provider suspension and account ban/unban actions.
- `src/features/admin/pages/reports-page.tsx` lists reports, resolves reports, and can hide reported reviews.
- `src/features/admin/pages/professions-page.tsx` creates professions and toggles active state.
- `src/features/admin/pages/visibility-requests-page.tsx` approves/rejects paid visibility and area expansion requests.
- `src/features/admin/pages/audit-log-page.tsx` lists admin actions, but currently shows action, target type, target id, and reason without actor or timestamp.

### Services and backend

- `src/services/admin.service.ts` exposes the admin service facade.
- `src/services/firebase/admin.firebase.ts` uses callables for `approveProvider`, `rejectProvider`, `suspendProvider`, and `hideReview`.
- `src/services/firebase/admin.firebase.ts` performs direct client Firestore writes for visibility request approval/rejection, report resolution, user ban/unban, profession save/toggle, and local audit rows.
- `functions/src/providers.ts` implements callable provider approval, rejection, and suspension with admin checks and audit rows.
- `functions/src/reviews.ts` implements callable review hiding, report closing when a report id is supplied, audit row creation, and rating recalculation.
- `functions/src/visibility.ts` only exports a pure helper that returns a paid-until timestamp.
- There are no callable implementations for visibility request processing, report resolution, user ban/unban, profession management, policy settings, paid product management, or audit listing.

### Rules and tests

- `firestore.rules` lets admins update providers, users, reviews, visibility requests, reports, and professions directly.
- `firestore.rules` lets admins create `adminActions` directly.
- `tests/rules/firestore.rules.test.ts` verifies public provider visibility, owner-safe provider updates, direct report creation blocks, visibility request constraints, admin direct moderation writes, and banned user write blocking.
- `src/services/admin.service.test.ts` covers demo profession management, account ban/unban, report resolution, and audit coverage for all demo admin mutations.
- `functions/test/providers.test.ts`, `functions/test/reviews.test.ts`, and `functions/test/visibility.test.ts` cover pure helpers only, not full callable transactions.
- `tests/e2e/app.spec.ts` covers admin route access and provider join identity document visibility, but not approval-to-public-search behavior or admin mutation outcomes.

## Detailed Implementation Plan

## 10.1 Provider Applications

### Requirements Covered

- `ADMIN-001`: Admins MUST be able to review provider applications.
- `ADMIN-002`: Admins MUST be able to approve provider applications.
- `ADMIN-003`: Admins MUST be able to reject provider applications.
- `ADMIN-004`: Provider approval decisions MUST update public visibility.

### Current Implementation Evidence

- `ApplicationsPage` lists `useProviderApplications()` results.
- `listProviderApplications` loads pending providers and the matching `providerIdentityDocuments/{providerId}` document.
- `approveProvider` and `rejectProvider` in the Firebase admin adapter call Cloud Functions.
- `functions/src/providers.ts` requires active admin role, requires identity document on approval, updates provider status, and writes audit rows.
- Firestore rules hide pending providers from public reads and allow approved provider reads.

### Work Items

#### 10.1.1 Add callable transaction tests for provider approval and rejection

Files:
- `functions/test/providers.test.ts`
- optional helper test harness under `functions/test/`

Changes:
- Add tests for unauthenticated requests.
- Add tests for non-admin users.
- Add tests for banned admin users.
- Add tests for missing provider.
- Add tests for approval without identity document.
- Add tests for approval of non-pending provider.
- Add tests for rejection of non-pending provider.
- Verify approved provider patch sets `status: approved`, `nationalIdVerified: true`, `approvedAt`, and clears `rejectionReason`.
- Verify rejection patch sets `status: rejected`, `nationalIdVerified: false`, `approvedAt: null`, and `rejectionReason`.
- Verify one audit row is written per successful mutation.

Acceptance criteria:
- Callable tests prove admin-only behavior and transaction side effects.
- Failed callable attempts leave provider and audit state unchanged.

#### 10.1.2 Add approval-to-public-visibility e2e or integration test

Files:
- `tests/e2e/app.spec.ts`
- or a Firebase emulator integration test if e2e cannot perform callable mutation deterministically.

Changes:
- Create or seed a pending provider with identity document.
- Confirm anonymous/customer public search or profile cannot see provider while pending.
- Approve provider as admin.
- Confirm provider appears in search or public profile read after approval.
- Reject a separate pending provider and confirm it remains hidden.

Acceptance criteria:
- The test proves `ADMIN-004` from the user perspective, not only by checking a provider record.

#### 10.1.3 Improve application review UX safeguards

Files:
- `src/features/admin/pages/applications-page.tsx`
- locale files under `src/i18n/`

Changes:
- Disable approve/reject buttons while a mutation is pending.
- Show mutation errors in a localized, user-readable way.
- Prompt or require a rejection reason instead of using only `admin.reason.identityRejected`.
- Visually distinguish missing identity document applications.
- Prevent approval click when the identity document is missing.

Acceptance criteria:
- Admin cannot double-submit approval/rejection.
- Admin sees why an action failed.
- Missing identity document cannot be approved from the UI.

## 10.2 Identity Verification

### Requirements Covered

- `ADMIN-005`: Admins MUST be able to perform manual provider identity verification.
- `ADMIN-006`: Verification state MUST be stored for each provider.
- `ADMIN-007`: Unverified providers MUST NOT become publicly visible unless explicitly approved by policy.

### Current Implementation Evidence

- `ProviderIdentityDocument` stores provider id, file metadata, uploaded timestamp, and preview data URL.
- `ProviderProfile` stores `nationalIdVerified: boolean`.
- `approveProvider` requires identity document existence and sets `nationalIdVerified: true`.
- Public provider visibility is based on provider `status == approved`.

### Work Items

#### 10.2.1 Add explicit verification state model

Files:
- `src/types/provider.ts`
- `functions/src/providers.ts`
- `src/services/contracts/admin.contract.ts`
- `src/services/demo/admin.demo.ts`
- `src/services/firebase/admin.firebase.ts`
- seed/demo data files.

Changes:
- Add `ProviderVerificationStatus`.
- Add fields for `verificationStatus`, `verifiedBy`, `verifiedAt`, and `verificationNotes`.
- Keep `nationalIdVerified` as a compatibility field during migration if needed.
- Update converters and seed data.

Acceptance criteria:
- Provider records distinguish submitted, verified, rejected, and needs-more-info states.
- Existing approved demo providers remain approved after data migration.

#### 10.2.2 Add server-owned verification mutation

Files:
- `functions/src/providers.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `src/services/admin.service.ts`
- `src/services/contracts/admin.contract.ts`

Changes:
- Add `verifyProviderIdentity` callable or fold verification into `approveProvider` with explicit state writes.
- Require active admin.
- Require identity document existence.
- Require reason/notes for rejection or needs-more-info.
- Write audit action such as `verify_identity`, `reject_identity`, or `request_identity_info`.

Acceptance criteria:
- Admin can set verification state without directly writing provider documents.
- Verification state changes are auditable.

#### 10.2.3 Enforce verification policy in approval and public visibility

Files:
- `functions/src/providers.ts`
- `firestore.rules`
- search/profile Firebase services if policy requires additional filters.

Changes:
- Approval must either set verification state to verified or require it already verified.
- If policy says unverified providers cannot be public, search and public profile reads must require approved plus verified.
- Rules should preserve owner/admin access to pending/unverified providers.

Acceptance criteria:
- Unverified providers cannot be made public accidentally.
- Tests cover approved-but-unverified records if that transitional state is possible.

#### 10.2.4 Show verification history and notes in admin UI

Files:
- `src/features/admin/pages/applications-page.tsx`
- `src/features/admin/pages/providers-page.tsx`
- locale files.

Changes:
- Display verification status, reviewer, timestamp, and notes.
- Add admin controls for verify, reject verification, and needs-more-info if product decision includes those states.

Acceptance criteria:
- Admins can understand the identity state without inferring it from a boolean.

## 10.3 Reviews, Abuse, and Accounts

### Requirements Covered

- `ADMIN-008`: Admins MUST be able to manage or hide reviews.
- `ADMIN-009`: Admins MUST be able to view abuse reports.
- `ADMIN-010`: Admins MUST be able to flag abuse cases.
- `ADMIN-011`: Admins MUST be able to ban or suspend accounts.
- `ADMIN-012`: Ban/suspension state MUST prevent protected user actions.

### Current Implementation Evidence

- `ReportsPage` lists reports, resolves open reports, and hides review reports.
- `ProvidersPage` can suspend providers and ban/unban users.
- `hideReview` is callable-backed and recalculates provider rating.
- `suspendProvider` is callable-backed.
- `resolveReport` and `setUserBanned` are direct client Firestore writes in the Firebase admin adapter.
- `firestore.rules` blocks banned users from several direct writes through `activeUser()`.
- `admin.service.test.ts` verifies demo ban/unban login behavior and report resolution.

### Work Items

#### 10.3.1 Move report resolution to Cloud Function

Files:
- `functions/src/reports.ts` or `functions/src/admin.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `src/services/contracts/admin.contract.ts`

Changes:
- Implement `resolveReport` callable.
- Require active admin.
- Validate report exists and is open.
- Store `status: closed`, `resolvedBy`, `resolvedAt`, and `resolutionReason`.
- Write audit row in the same transaction.

Acceptance criteria:
- Client service no longer directly updates `reports`.
- Rules can deny direct report updates from clients.

#### 10.3.2 Move ban and unban to Cloud Function

Files:
- `functions/src/users.ts` or `functions/src/admin.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `firestore.rules`

Changes:
- Implement `setUserBanned` callable.
- Require active admin.
- Validate target user exists.
- Prevent self-ban unless product explicitly allows it.
- Store `status`, `banReason`, `bannedAt`, and `bannedBy`.
- Write `ban_user` or `unban_user` audit action.

Acceptance criteria:
- Client service no longer directly updates user status.
- Banned users cannot authenticate into protected app behavior.

#### 10.3.3 Add explicit abuse case flagging

Files:
- `src/types/admin.ts`
- `functions/src/reports.ts`
- `src/features/admin/pages/reports-page.tsx`
- `src/services/contracts/admin.contract.ts`

Changes:
- Add optional report fields such as `severity`, `flagged`, `flaggedBy`, `flaggedAt`, and `adminNotes`.
- Add admin action to flag or unflag an abuse case.
- Write audit action on flag changes.

Acceptance criteria:
- `ADMIN-010` is represented by an explicit product action, not only by resolving a report.

#### 10.3.4 Complete banned and suspended action matrix tests

Files:
- `tests/rules/firestore.rules.test.ts`
- `src/services/auth.service.test.ts`
- callable tests under `functions/test/`
- `tests/e2e/app.spec.ts` where practical.

Changes:
- Cover banned customer actions: login/session, WhatsApp reveal, conversation start, message send, review create, report create, profile edit.
- Cover banned provider actions: provider login/session, provider edit, visibility request create, message send.
- Cover suspended provider behavior: search hidden, profile hidden from public, dashboard restrictions if required, contact blocked.
- Cover banned admin behavior: admin routes/data/mutations blocked.

Acceptance criteria:
- Tests prove `ADMIN-012` across all protected surfaces, not only a subset of Firestore writes.

## 10.4 Professions and Policies

### Requirements Covered

- `ADMIN-013`: Admins MUST be able to manage professions/categories.
- `ADMIN-014`: Admins SHOULD be able to activate or deactivate professions.
- `ADMIN-015`: Admins SHOULD be able to manage platform policy settings used by product flows.

### Current Implementation Evidence

- `ProfessionsPage` creates professions and toggles active state.
- `saveProfession` and `setProfessionActive` write directly to Firestore in the Firebase admin adapter.
- `admin.service.test.ts` covers demo save/toggle.
- Search reads active professions.
- No policy settings type, service, collection, UI, or tests were found.

### Work Items

#### 10.4.1 Move profession mutations to Cloud Functions

Files:
- `functions/src/professions.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `firestore.rules`

Changes:
- Implement `saveProfession` callable.
- Implement `setProfessionActive` callable.
- Validate slug, localized names, icon, active flag, and sort order.
- Prevent deleting or deactivating a profession if product requires existing provider migration.
- Write audit rows with before/after summary.

Acceptance criteria:
- Client service no longer writes `professions` directly.
- Rules can deny direct profession writes from clients.

#### 10.4.2 Add profession edit coverage

Files:
- `src/features/admin/pages/professions-page.tsx`
- `src/services/admin.service.test.ts`
- component/e2e tests if available.

Changes:
- Support editing existing profession names, icon, and sort order.
- Keep active toggle separate and clear.
- Show validation errors for empty slug, duplicate slug, missing names, or invalid icon.

Acceptance criteria:
- Admin can manage existing professions, not only add new ones.

#### 10.4.3 Add typed platform policy settings

Files:
- `src/types/policy.ts`
- `src/services/contracts/admin.contract.ts`
- `src/services/firebase/admin.firebase.ts`
- `src/services/demo/admin.demo.ts`
- `functions/src/policies.ts`
- new admin page, likely `src/features/admin/pages/policies-page.tsx`.

Changes:
- Add policy type with area expansion review threshold, default boost days, max active paid providers, verification requirement, and any ranking governance flags needed by sections 6-10.
- Add list/get and update service methods.
- Add admin UI to view and update settings.
- Validate settings server-side.
- Audit policy changes.

Acceptance criteria:
- Product flows read typed policy values.
- Admin changes are validated and audited.

## 10.5 Paid Product Controls

### Requirements Covered

- `ADMIN-016`: Admins MUST be able to manage paid visibility products or tiers.
- `ADMIN-017`: Admins MUST be able to manage paid product pricing, expiry, renewal, and payment policy.
- `ADMIN-018`: Admins MUST be able to review paid visibility and area expansion requests.

### Current Implementation Evidence

- `VisibilityRequestsPage` lists paid requests and can approve/reject pending requests.
- `approveVisibilityRequest` in the Firebase admin adapter directly updates `visibilityRequests`.
- Boost approval hardcodes a 30-day paid period.
- Area expansion approval directly appends service area keys.
- Product metadata exists, but product management UI and Paymob renewal controls remain incomplete.
- `functions/src/visibility.ts` only exposes a pure `approveVisibility(now, days = 30)` helper.

### Work Items

#### 10.5.1 Add paid product and renewal policy model

Files:
- `src/types/paid-product.ts` or `src/types/visibility.ts`
- `src/services/contracts/admin.contract.ts`
- seed/demo data.

Changes:
- Define paid product fields: id, type, active, display name, duration days, price amount, currency, product policy, payment provider, renewal policy, sort order, and terms notes.
- Define no-cap visibility behavior and coverage-only area expansion behavior.
- Keep initial v1 scope small: one pay-as-you-go visibility product and one 250 EGP monthly Paymob area expansion product.

Acceptance criteria:
- Paid product/tier data is explicit and not hardcoded in approval code.

#### 10.5.2 Add paid product admin UI

Files:
- new `src/features/admin/pages/paid-products-page.tsx`
- `src/router/app-router.tsx`
- `src/layouts/admin-layout.tsx`
- locale files.

Changes:
- List paid products.
- Create/edit product terms.
- Activate/deactivate products.
- Configure no-cap product rules, Paymob renewal, and expiry policy.

Acceptance criteria:
- Admin can manage products and renewal/expiry policy without code changes.

#### 10.5.3 Move visibility request approval/rejection to Cloud Functions

Files:
- `functions/src/visibility.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `firestore.rules`

Changes:
- Implement `approveVisibilityRequest` callable.
- Implement `rejectVisibilityRequest` callable.
- Require active admin.
- Validate request exists and is pending.
- Load configured product terms.
- Enforce visibility cap before approval.
- For boost requests, set provider paid tier and paid-until based on product duration.
- For area expansion requests, add the area and apply any configured fee state.
- Write audit rows in the same transaction.

Acceptance criteria:
- No direct client writes are needed for paid request processing.
- Approval uses configured terms instead of hardcoded 30 days.
- Cap violations return a user-readable error and leave state unchanged.

#### 10.5.4 Add paid request UI review context

Files:
- `src/features/admin/pages/visibility-requests-page.tsx`
- service list methods.

Changes:
- Display provider name, request type, requested area, product name, price, cap status, payment method, notes, requestedAt, and processedAt.
- Show clear empty/loading/error states.
- Disable actions while pending mutation is running.

Acceptance criteria:
- Admin can review a paid request without decoding ids.

## 10.6 Audit Logging

### Requirements Covered

- `ADMIN-019`: All admin mutation actions MUST be logged.
- `ADMIN-020`: Audit logs MUST include actor, action, target, and timestamp where available.
- `ADMIN-021`: Audit logs SHOULD be reviewable by admins.

### Current Implementation Evidence

- `AdminAction` has `adminId`, `targetType`, `targetId`, `action`, `reason`, and `createdAt`.
- `AuditLogPage` lists audit actions.
- Provider and review callables write audit rows server-side.
- Firebase admin adapter writes some audit rows from the client with `auditLocally`.
- Firestore rules currently allow admins to create `adminActions`.
- `admin.service.test.ts` verifies demo audit coverage for many actions.

### Work Items

#### 10.6.1 Make audit logs server-owned

Files:
- `functions/src/audit.ts`
- all admin callable files.
- `firestore.rules`.

Changes:
- Add shared backend helper `writeAdminAction`.
- Require action reason with minimum and maximum length.
- Use server timestamp or trusted ISO time consistently.
- Include optional before/after summaries where useful.
- Change rules so clients cannot create, update, or delete `adminActions`.

Acceptance criteria:
- Every audit row is created by trusted backend code.
- Direct client audit writes fail in rules tests.

#### 10.6.2 Expand audit UI fields

Files:
- `src/features/admin/pages/audit-log-page.tsx`
- `src/services/firebase/admin.firebase.ts`
- locale files.

Changes:
- Display actor/admin id, action, target type, target id, reason, and timestamp.
- Add filters for action type, target type, and actor if data volume warrants it.
- Add loading, empty, and error states.

Acceptance criteria:
- `ADMIN-020` and `ADMIN-021` are visible in the product UI.

#### 10.6.3 Add audit completeness tests

Files:
- `src/services/admin.service.test.ts`
- callable tests under `functions/test/`
- `tests/rules/firestore.rules.test.ts`.

Changes:
- Assert every admin mutation path writes one audit row.
- Assert audit rows contain actor, action, target, reason, and timestamp.
- Assert failed mutations do not write audit rows.
- Assert non-admins cannot read audit rows.
- Assert clients cannot create audit rows after server-owned migration.

Acceptance criteria:
- Audit coverage is enforced by tests, not only by convention.

## Cross-Cutting Implementation Sequence

1. Add or confirm product decisions for verification state, server-owned mutations, policy settings, and paid catalog.
2. Add backend audit helper and migrate one admin callable path to use it.
3. Add callable tests for provider approval/rejection/suspension and review hiding.
4. Move report resolution and user ban/unban to callables.
5. Move visibility request approval/rejection to callables.
6. Move profession save/toggle to callables.
7. Add explicit verification state and admin UI fields.
8. Add typed policy settings model, service, UI, and backend mutation.
9. Add paid product/tier/cap model, service, UI, and backend mutation.
10. Tighten Firestore rules after each callable migration.
11. Add e2e smoke for approval-to-public-visibility and core admin mutation UX.
12. Run full verification commands.

## Verification Plan

Target commands:

```bash
npm test -- src/services/admin.service.test.ts
npm test -- src/services/visibility.service.test.ts
npm test -- src/lib/display.test.ts
npm run test:rules
(cd functions && npm test)
npm run e2e -- tests/e2e/app.spec.ts
npm run lint
npm run build
```

Optional deeper checks after callable migration:

```bash
firebase emulators:exec --only firestore,functions "npm test -- src/services/admin.service.test.ts"
firebase emulators:exec --only firestore,functions "cd functions && npm test"
```

## Effort Estimate

| Area | Estimate | Notes |
| --- | ---: | --- |
| Provider application callable tests and e2e visibility proof | 1-2 days | Mostly tests and small UI safeguards. |
| Explicit identity verification model | 2-4 days | Requires data model, migration/defaults, UI, rules, and tests. |
| Reviews, reports, bans, and suspension server migration | 2-4 days | Several callables plus rule tightening and matrix tests. |
| Profession callable migration and edit UI | 1-2 days | Straightforward but should include validation. |
| Platform policy settings | 2-3 days | Needs product decision and typed model. |
| Paid product catalog and cap enforcement | 4-6 days | Larger because product terms affect provider request and admin approval flows. |
| Audit server ownership and UI completion | 2-3 days | Cross-cutting migration and test coverage. |
| Final e2e, accessibility, lint/build hardening | 1-2 days | Depends on emulator stability. |

Expected total: 15-26 engineering days, depending on paid product and policy scope.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Direct admin writes remain allowed while callables exist | Client compromise could mutate high-impact admin state. | Migrate mutation by mutation and tighten rules immediately after each migration. |
| Audit rows are client-created | Audit trail is not trustworthy. | Make audit logs server-owned and deny client creates. |
| Verification remains boolean-only | Admin cannot defend approval decisions or handle edge cases. | Add explicit verification state, notes, reviewer, and timestamp. |
| Paid approvals stay hardcoded | Pricing/cap changes require code changes and may violate product policy. | Add typed paid product catalog and cap checks. |
| Ban/suspension matrix is incomplete | Banned or suspended users may keep using protected flows. | Add rules, callable, service, and e2e matrix coverage. |
| Admin UI actions use canned reasons only | Audit trail has weak operational value. | Require typed/admin-entered reasons for sensitive actions. |
| Firestore rules and client services drift | Tests may pass in demo but fail in Firebase. | Add emulator-backed rules/integration tests for each admin path. |

## Definition of Done

Section 10 is done when:

- All six Section 10 subsections are marked implemented in the implementation map.
- All admin mutations are function-backed or explicitly justified read-only/direct-read paths.
- Firestore rules deny direct client mutation of admin-owned state where a callable exists.
- Provider approval and rejection have callable transaction tests.
- Approval-to-public-visibility is proven by e2e or emulator integration.
- Identity verification state is explicit and auditable.
- Reports, review hiding, account bans, provider suspensions, professions, policies, paid products, and paid request processing are audited.
- Admin audit log UI displays actor, action, target, reason, and timestamp.
- Banned admins cannot access or mutate admin data.
- Banned users and suspended providers are blocked across protected flows.
- Paid visibility approvals use configured product terms and enforce caps.
- `npm test`, `npm run test:rules`, `cd functions && npm test`, `npm run lint`, `npm run build`, and targeted e2e checks pass.

## Open Questions

1. Should provider approval automatically mark identity as verified, or should identity verification be a separate admin action before approval?
2. Should rejected identity documents be retained for audit, replaced on resubmission, or versioned?
3. Should admins be able to self-ban, or should that be blocked server-side?
4. Should report flagging have severity levels, or is a boolean `flagged` state enough for v1?
5. What paid visibility cap scope is required for v1: global, profession, area, or profession-area?
6. Should area expansion have an expiration/renewal date or remain permanent after approval?
7. Should policy changes require a reason field and before/after diff in the audit log?
