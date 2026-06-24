# Section 10 Admin Panel Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-10-admin-panel.md`

Scope: complete SRS section 10 so the Admin Panel is fully implemented across admin UI, server-owned admin mutations, Firestore rules, paid/policy controls, audit logs, and verification coverage.

Status legend:
- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.

## Tracker Summary

| Area | Status | Owner | Notes |
| --- | --- | --- | --- |
| Product decisions | Not started | Product/Engineering | Decide verification model, admin mutation boundary, policy scope, and paid product catalog. |
| Provider applications | Partially done | Engineering | UI and callables exist; callable transaction tests and approval-to-public e2e are missing. |
| Identity verification | Partially done | Engineering | Identity docs and binary verification exist; explicit verification state/history are missing. |
| Reviews, abuse, and accounts | Partially done | Engineering | UI exists and report resolution, review hide, provider suspension, and ban/unban use callables; product decisions and full callable matrix tests remain. |
| Professions and policies | Partially done | Engineering/Product | Profession create/toggle use callables; policy settings do not exist. |
| Paid product controls | Partially done | Engineering/Product | Request review exists; product/tier/cap management and server-side approval terms are missing. |
| Audit logging | Partially done | Engineering | Audit rows exist; some are client-created and UI omits actor/timestamp. |
| Rules hardening | Partially done | Engineering | Current rules allow broad admin direct writes; tighten after callable migrations. |
| Verification | Not started | Engineering | Need targeted service, rules, function, and e2e verification. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
| --- | --- | --- | --- |
| ADMIN-PD-001 | Decide whether identity verification is separate from provider approval. | Not started | Recommended: explicit verification state; approval requires verified or sets verified in same transaction. |
| ADMIN-PD-002 | Choose verification states for v1. | Not started | Recommended: `not_submitted`, `submitted`, `verified`, `rejected`, `needs_more_info`. |
| ADMIN-PD-003 | Decide whether rejected identity documents are versioned or replaced. | Not started | Needed for resubmission and audit history. |
| ADMIN-PD-004 | Confirm that all admin mutations must be Cloud Functions. | Not started | Recommended: yes for visibility, money, moderation, identity, accounts, policies, professions, and audit. |
| ADMIN-PD-005 | Decide whether admins can self-ban. | Not started | Recommended: block self-ban server-side. |
| ADMIN-PD-006 | Define abuse flagging model. | Not started | Recommended: add `flagged`, optional `severity`, and admin notes. |
| ADMIN-PD-007 | Define platform policy settings for v1. | Partially done | Captain decided no visibility cap policy, fixed coverage radius rules, banned-hidden behavior, and paid-benefit expiry; storage/admin UI remains open. |
| ADMIN-PD-008 | Define paid product catalog fields. | Done | Type, active state, duration, price, currency, no-cap or coverage-only policy, payment provider, and renewal policy. |
| ADMIN-PD-009 | Define visibility cap scope. | Done | No visibility cap policy. |
| ADMIN-PD-010 | Decide whether area expansion expires or is permanent. | Done | Area expansion is 250 EGP/month and auto-renews by Visa/card on file through Paymob; unpaid or expired benefits stop affecting coverage. |

## 10.1 Provider Applications Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| ADMIN-10.1-001 | Keep admin applications list scoped to pending providers. | Done | `applications-page.tsx`, `admin.firebase.ts` | Page lists pending providers through `listProviderApplications`. |
| ADMIN-10.1-002 | Show identity document metadata in application review. | Done | `applications-page.tsx` | Admin sees file name, size, upload date, and image/link preview when available. |
| ADMIN-10.1-003 | Approve provider through callable. | Done | `admin.firebase.ts`, `functions/src/providers.ts` | Firebase adapter calls `approveProvider` function. |
| ADMIN-10.1-004 | Reject provider through callable. | Done | `admin.firebase.ts`, `functions/src/providers.ts` | Firebase adapter calls `rejectProvider` function. |
| ADMIN-10.1-005 | Add callable test for unauthenticated approval/rejection. | Not started | `functions/test/providers.test.ts` | Unauthenticated requests fail and write no audit rows. |
| ADMIN-10.1-006 | Add callable test for non-admin approval/rejection. | Not started | `functions/test/providers.test.ts` | Customer/provider callers fail with permission denied. |
| ADMIN-10.1-007 | Add callable test for banned admin approval/rejection. | Not started | `functions/test/providers.test.ts` | Banned admin cannot approve/reject. |
| ADMIN-10.1-008 | Add callable test for approval without identity document. | Not started | `functions/test/providers.test.ts` | Approval fails with failed-precondition and provider remains pending. |
| ADMIN-10.1-009 | Add callable test for approval of non-pending provider. | Not started | `functions/test/providers.test.ts` | Non-pending provider cannot be approved again. |
| ADMIN-10.1-010 | Add callable test for rejection of non-pending provider. | Not started | `functions/test/providers.test.ts` | Non-pending provider cannot be rejected. |
| ADMIN-10.1-011 | Add callable test for audit row on approval. | Not started | `functions/test/providers.test.ts` | One audit row has actor, provider target, `approve_provider`, reason, timestamp. |
| ADMIN-10.1-012 | Add callable test for audit row on rejection. | Not started | `functions/test/providers.test.ts` | One audit row has actor, provider target, `reject_provider`, reason, timestamp. |
| ADMIN-10.1-013 | Add approval-to-public-search e2e/integration test. | Not started | `tests/e2e/app.spec.ts` or emulator test | Pending provider is hidden before approval and visible after approval. |
| ADMIN-10.1-014 | Add rejection-to-hidden e2e/integration test. | Not started | `tests/e2e/app.spec.ts` or emulator test | Rejected provider remains hidden from public search/profile. |
| ADMIN-10.1-015 | Disable application action buttons while mutation is pending. | Not started | `applications-page.tsx` | Double-click cannot create duplicate action attempts. |
| ADMIN-10.1-016 | Add admin-visible mutation errors. | Not started | `applications-page.tsx`, i18n | Failed approve/reject shows localized error. |
| ADMIN-10.1-017 | Require or collect rejection reason. | Not started | `applications-page.tsx`, callable input | Rejection audit has meaningful admin reason. |

## 10.2 Identity Verification Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| ADMIN-10.2-001 | Store provider identity document on registration. | Done | Registration flow, provider identity docs | E2E confirms uploaded identity document appears in admin application review. |
| ADMIN-10.2-002 | Require identity document before approval. | Done | `functions/src/providers.ts` | Callable approval fails when identity document is missing. |
| ADMIN-10.2-003 | Store binary verification flag on approval. | Done | `ProviderProfile`, `functions/src/providers.ts` | Approval sets `nationalIdVerified: true`. |
| ADMIN-10.2-004 | Add `ProviderVerificationStatus` type. | Not started | `src/types/provider.ts` | Provider supports explicit verification states. |
| ADMIN-10.2-005 | Add verification reviewer/timestamp/notes fields. | Not started | `src/types/provider.ts`, converters, seed data | Provider stores who verified, when, and why. |
| ADMIN-10.2-006 | Add verification state defaults for demo and Firebase data. | Not started | `seed-data.ts`, demo DB, converters | Existing records load with valid verification state. |
| ADMIN-10.2-007 | Add server-owned identity verification callable. | Not started | `functions/src/providers.ts`, `functions/src/index.ts` | Active admin can verify/reject/request info with audit. |
| ADMIN-10.2-008 | Add UI controls for verification state. | Not started | `applications-page.tsx`, `providers-page.tsx` | Admin can see and update explicit verification state. |
| ADMIN-10.2-009 | Add verification notes input. | Not started | Admin pages, i18n | Notes are stored and visible to admins only. |
| ADMIN-10.2-010 | Enforce approval verification policy. | Not started | `functions/src/providers.ts`, policy settings | Approval requires or sets `verificationStatus: verified` according to policy. |
| ADMIN-10.2-011 | Add rules test for approved but unverified provider if transitional state exists. | Not started | `tests/rules/firestore.rules.test.ts` | Public visibility matches verification policy. |
| ADMIN-10.2-012 | Add callable tests for verification transitions. | Not started | `functions/test/providers.test.ts` | Valid transitions pass; invalid transitions fail without audit. |

## 10.3 Reviews, Abuse, and Accounts Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| ADMIN-10.3-001 | Show abuse reports in admin UI. | Done | `reports-page.tsx`, `admin.firebase.ts` | Admin can view report reason, target, status, reporter, and target label. |
| ADMIN-10.3-002 | Hide reviews through callable. | Done | `reports-page.tsx`, `functions/src/reviews.ts` | Admin hide action updates review, closes linked report, recalculates rating, and audits. |
| ADMIN-10.3-003 | Suspend providers through callable. | Done | `providers-page.tsx`, `functions/src/providers.ts` | Admin suspend action sets provider suspended and audits. |
| ADMIN-10.3-004 | Ban/unban users in demo service. | Done | `admin.demo.ts`, `admin.service.test.ts` | Demo login rejects banned user and allows unbanned user. |
| ADMIN-10.3-005 | Move report resolution to callable. | Done | `functions/src/admin.ts`, `admin.firebase.ts`, `firestore.rules`, `firestore.rules.test.ts` | Client no longer directly updates `reports`; callable writes resolution metadata and audit. |
| ADMIN-10.3-006 | Move user ban/unban to callable. | Done | `functions/src/admin.ts`, `admin.firebase.ts`, `firestore.rules`, `firestore.rules.test.ts` | Client no longer directly updates `users` ban fields; callable writes audit. |
| ADMIN-10.3-007 | Prevent admin self-ban unless explicitly allowed. | Blocked | `functions/src/users.ts` | Product decision required; recommended blocked. |
| ADMIN-10.3-008 | Add explicit report flag/unflag callable. | Not started | `functions/src/reports.ts`, `src/types/admin.ts` | Admin can flag abuse cases separately from resolving them. |
| ADMIN-10.3-009 | Add report severity/admin notes if chosen. | Blocked | Reports model/UI | Product decision required. |
| ADMIN-10.3-010 | Add callable test for report resolution. | Partially done | `functions/test/admin.test.ts` | Admin callable validation exists; full transaction test for closing report and audit remains open. |
| ADMIN-10.3-011 | Add callable test for report resolution denied to non-admins. | Not started | `functions/test/reports.test.ts` | Non-admin and banned admin fail. |
| ADMIN-10.3-012 | Add callable test for ban/unban. | Partially done | `functions/test/admin.test.ts` | Admin callable validation exists; full transaction test for status and audit remains open. |
| ADMIN-10.3-013 | Add callable test for review hide transaction. | Not started | `functions/test/reviews.test.ts` | Review status, linked report, rating aggregate, and audit update together. |
| ADMIN-10.3-014 | Add banned customer action matrix. | Not started | Rules, services, functions, e2e | Banned customer cannot contact, message, review, report, or edit profile. |
| ADMIN-10.3-015 | Add banned provider action matrix. | Not started | Rules, services, functions, e2e | Banned provider cannot edit provider profile, message, or request paid visibility. |
| ADMIN-10.3-016 | Add banned admin action matrix. | Not started | Rules, functions, routes | Banned admin cannot read admin data or perform mutations. |
| ADMIN-10.3-017 | Add suspended provider public visibility test. | Not started | Search/rules/e2e | Suspended provider is hidden from public search/profile and cannot receive contact. |
| ADMIN-10.3-018 | Add UI error/pending states for reports and providers pages. | Not started | `reports-page.tsx`, `providers-page.tsx` | Admin sees mutation status and errors. |

## 10.4 Professions and Policies Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| ADMIN-10.4-001 | Create professions in admin UI. | Done | `professions-page.tsx`, `admin.firebase.ts`, `functions/src/admin.ts` | Admin can add a profession in demo/Firebase; Firebase path uses callable. |
| ADMIN-10.4-002 | Activate/deactivate professions in admin UI. | Done | `professions-page.tsx`, `admin.firebase.ts`, `functions/src/admin.ts` | Admin can toggle active state; Firebase path uses callable. |
| ADMIN-10.4-003 | Demo test for profession save/toggle. | Done | `admin.service.test.ts` | Demo save and active toggle are covered. |
| ADMIN-10.4-004 | Move profession save to callable. | Done | `functions/src/admin.ts`, `admin.firebase.ts` | Client no longer directly writes profession docs; save is validated and audited server-side. |
| ADMIN-10.4-005 | Move profession active toggle to callable. | Done | `functions/src/admin.ts`, `admin.firebase.ts` | Toggle is validated and audited server-side. |
| ADMIN-10.4-006 | Add profession edit support. | Not started | `professions-page.tsx`, services | Admin can edit existing names, icon, slug policy, and sort order. |
| ADMIN-10.4-007 | Add profession validation errors. | Not started | `professions-page.tsx`, functions, i18n | Empty/duplicate/invalid values show clear errors. |
| ADMIN-10.4-008 | Add callable tests for profession mutations. | Partially done | `functions/test/admin.test.ts` | Profession payload validation is covered; full create/update/toggle admin-only and audit transaction tests remain open. |
| ADMIN-10.4-009 | Add rules test denying direct profession writes after migration. | Done | `tests/rules/firestore.rules.test.ts` | Client profession writes fail; reads remain public. |
| ADMIN-10.4-010 | Add typed platform policy model. | Not started | `src/types/policy.ts` | Policy fields cover configured product flows. |
| ADMIN-10.4-011 | Add policy get/update service methods. | Not started | Admin service contract/demo/Firebase | Admin UI can load and save policy settings. |
| ADMIN-10.4-012 | Add policy settings admin page. | Not started | `policies-page.tsx`, router, layout, i18n | Admin can review and update policy settings. |
| ADMIN-10.4-013 | Add policy update callable. | Not started | `functions/src/policies.ts` | Updates are validated and audited. |
| ADMIN-10.4-014 | Integrate policy settings into product flows. | Not started | Visibility, area expansion, verification, ranking as needed | Flows read typed policy values instead of constants. |
| ADMIN-10.4-015 | Add policy tests. | Not started | Service, functions, rules | Invalid settings fail; valid admin updates audit before/after. |

## 10.5 Paid Product Controls Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| ADMIN-10.5-001 | List paid visibility and area expansion requests. | Done | `visibility-requests-page.tsx`, `admin.firebase.ts` | Admin can see visibility requests. |
| ADMIN-10.5-002 | Approve paid request from admin UI. | Partially done | `visibility-requests-page.tsx`, `admin.firebase.ts` | Works through direct client transaction, not callable. |
| ADMIN-10.5-003 | Reject paid request from admin UI. | Partially done | `visibility-requests-page.tsx`, `admin.firebase.ts` | Works through direct client write, not callable. |
| ADMIN-10.5-004 | Define paid product/tier type. | Done | `src/types/monetization.ts` | Product terms include duration, price, currency, no-cap or coverage-only policy, type, payment provider, renewal policy, and active state. |
| ADMIN-10.5-005 | Add paid product demo/seed data. | Not started | Demo DB, seed data | At least one boost and one area expansion product exist. |
| ADMIN-10.5-006 | Add paid product admin page. | Not started | New admin page, router, layout, i18n | Admin can create/edit/activate/deactivate paid products. |
| ADMIN-10.5-007 | Add paid product policy UI. | Not started | Paid product or policy UI | Admin can view/manage no-cap visibility product rules, area expansion price, renewal, and expiry policy. |
| ADMIN-10.5-008 | Move visibility approval to callable. | Done | `functions/src/visibility.ts`, `admin.firebase.ts` | Approval uses server transaction and writes audit. |
| ADMIN-10.5-009 | Move visibility rejection to callable. | Done | `functions/src/visibility.ts`, `admin.firebase.ts` | Rejection uses server mutation and writes audit. |
| ADMIN-10.5-010 | Enforce configured boost duration. | Done | Visibility callable | Paid-until uses product snapshot duration, not client hardcoded 30 days. |
| ADMIN-10.5-011 | Enforce no-cap paid visibility policy. | Not started | Visibility callable, tests | Approval applies product rules without a separate visibility cap. |
| ADMIN-10.5-012 | Apply area expansion terms. | Partially done | Visibility callable | Area expansion approval applies selected 250 EGP monthly Paymob/card renewal policy; live Paymob renewal verification remains open. |
| ADMIN-10.5-013 | Display provider/product/payment context in request list. | Done | `visibility-requests-page.tsx`, i18n; verified by static boundary test and `npm run build` | Admin sees provider id, type, product snapshot, area, price placeholder, payment method/status, disclosure, notes, rejection reason, and request date. |
| ADMIN-10.5-014 | Add callable tests for visibility approval/rejection. | Not started | `functions/test/visibility.test.ts` | Admin-only, pending-only, product-based, no-cap, renewal-aware, audited behavior is tested. |
| ADMIN-10.5-015 | Add rules test denying direct visibility processing after migration. | Not started | `tests/rules/firestore.rules.test.ts` | Providers cannot process requests; clients cannot impersonate approval. |
| ADMIN-10.5-016 | Add e2e/admin smoke for paid request processing. | Not started | `tests/e2e/app.spec.ts` | Admin approval changes provider paid state or area state visibly. |

## 10.6 Audit Logging Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| ADMIN-10.6-001 | Audit provider approval/rejection/suspension server-side. | Done | `functions/src/providers.ts` | Provider callables write audit rows. |
| ADMIN-10.6-002 | Audit review hiding server-side. | Done | `functions/src/reviews.ts` | Hide review callable writes audit row. |
| ADMIN-10.6-003 | Audit demo admin mutations. | Done | `admin.demo.ts`, `admin.service.test.ts` | Demo audit coverage includes provider, visibility, report, review, user, and profession actions. |
| ADMIN-10.6-004 | Display audit action, target, and reason. | Partially done | `audit-log-page.tsx` | UI shows action, target type/id, and reason. |
| ADMIN-10.6-005 | Display audit actor/admin id. | Not started | `audit-log-page.tsx` | UI shows `adminId` or resolved admin label. |
| ADMIN-10.6-006 | Display audit timestamp. | Not started | `audit-log-page.tsx` | UI shows localized `createdAt`. |
| ADMIN-10.6-007 | Add shared backend audit helper. | Partially done | `functions/src/audit.ts` | Visibility callables use a shared audit writer; older callables still need migration. |
| ADMIN-10.6-008 | Move local client audit writes to backend. | Partially done | `admin.firebase.ts`, functions | Visibility audit writes moved backend-side; report/user/profession Firebase paths remain client-side follow-up. |
| ADMIN-10.6-009 | Deny client audit creation in rules. | Not started | `firestore.rules`, rules tests | Authenticated admins cannot create `adminActions` directly from client SDK. |
| ADMIN-10.6-010 | Add audit completeness callable tests. | Not started | Function tests | Every successful admin callable writes one complete audit row. |
| ADMIN-10.6-011 | Add failed-mutation audit tests. | Not started | Function tests | Failed admin mutations write no audit row. |
| ADMIN-10.6-012 | Add audit read rules tests. | Not started | `tests/rules/firestore.rules.test.ts` | Active admin can read; non-admin and banned admin cannot read. |
| ADMIN-10.6-013 | Add audit UI loading/error/empty states. | Not started | `audit-log-page.tsx` | Audit log is usable during load/failure/empty data. |
| ADMIN-10.6-014 | Add audit filters if data volume requires. | Not started | `audit-log-page.tsx` | Admin can filter by action, target type, actor, or date. |

## Firestore Rules Hardening Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| ADMIN-RULES-001 | Preserve admin read access to admin panel collections. | Partially done | `firestore.rules` | Active admins can read users, providers, reports, audit logs, and requests. |
| ADMIN-RULES-002 | Deny banned admin admin-access reads. | Partially done | `firestore.rules`, rules tests | `isAdmin()` excludes banned users; add explicit test. |
| ADMIN-RULES-003 | Deny direct provider status mutation after callable migration. | Not started | `firestore.rules` | Client SDK cannot approve/reject/suspend providers directly. |
| ADMIN-RULES-004 | Deny direct report mutation after callable migration. | Not started | `firestore.rules` | Client SDK cannot close reports directly. |
| ADMIN-RULES-005 | Deny direct user ban mutation after callable migration. | Not started | `firestore.rules` | Client SDK cannot change ban fields directly. |
| ADMIN-RULES-006 | Deny direct profession writes after callable migration. | Not started | `firestore.rules` | Client SDK cannot create/update/toggle professions directly. |
| ADMIN-RULES-007 | Deny direct visibility request processing after callable migration. | Done | `firestore.rules` | Client SDK cannot approve/reject paid requests directly. |
| ADMIN-RULES-008 | Deny direct audit creation after callable migration. | Not started | `firestore.rules` | Client SDK cannot create audit rows. |
| ADMIN-RULES-009 | Keep provider-owned visibility request creation constrained. | Done | `firestore.rules` | Existing rules require owned provider, pending status, valid type, and area expansion threshold. |
| ADMIN-RULES-010 | Keep direct abuse report creation blocked. | Done | `firestore.rules` | Existing rules deny client report creation. |
| ADMIN-RULES-011 | Keep direct review creation blocked. | Done | `firestore.rules` | Existing rules deny direct review creation. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
| --- | --- | --- | --- |
| ADMIN-V-001 | `npm test -- src/services/admin.service.test.ts` | Done | Passed in combined targeted run: 4 files, 9 tests. |
| ADMIN-V-002 | `npm test -- src/services/visibility.service.test.ts` | Done | Passed in combined targeted run: 4 files, 9 tests. |
| ADMIN-V-003 | `npm test -- src/lib/display.test.ts` | Not started | Admin labels remain mapped. |
| ADMIN-V-004 | `npm run test:rules` | Not started | Firestore/storage rules pass under emulator. |
| ADMIN-V-005 | `(cd functions && npm test)` | Not started | Function helper and callable tests pass. |
| ADMIN-V-006 | `npm run e2e -- tests/e2e/app.spec.ts` | Not started | Admin route/application/approval smoke passes. |
| ADMIN-V-007 | `npm run lint` | Done | Passed. |
| ADMIN-V-008 | `npm run build` | Done | Passed. |
| ADMIN-V-009 | Manual admin UI smoke on desktop viewport | Not started | Applications, providers, reports, professions, visibility, and actions pages are readable and non-overlapping. |
| ADMIN-V-010 | Manual admin UI smoke on mobile viewport | Not started | Admin pages remain readable, buttons do not overflow, and cards/lists stack correctly. |

## Definition of Done Tracker

| ID | Item | Status |
| --- | --- | --- |
| ADMIN-DOD-001 | Admin routes are role-protected. | Done |
| ADMIN-DOD-002 | Banned admins are blocked from admin data and mutations. | Partially done |
| ADMIN-DOD-003 | Admins can review pending provider applications. | Done |
| ADMIN-DOD-004 | Admins can approve provider applications. | Done |
| ADMIN-DOD-005 | Admins can reject provider applications. | Done |
| ADMIN-DOD-006 | Approval updates public visibility and is proven by e2e or emulator integration. | Not started |
| ADMIN-DOD-007 | Approval/rejection callable transactions are tested. | Not started |
| ADMIN-DOD-008 | Identity verification state is explicit, stored, and auditable. | Not started |
| ADMIN-DOD-009 | Unverified providers cannot become public unless policy explicitly permits it. | Partially done |
| ADMIN-DOD-010 | Admins can hide reviews through server-owned mutation. | Done |
| ADMIN-DOD-011 | Admins can view abuse reports. | Done |
| ADMIN-DOD-012 | Admins can flag abuse cases. | Not started |
| ADMIN-DOD-013 | Admins can resolve reports through server-owned mutation. | Not started |
| ADMIN-DOD-014 | Admins can suspend providers through server-owned mutation. | Done |
| ADMIN-DOD-015 | Admins can ban/unban users through server-owned mutation. | Not started |
| ADMIN-DOD-016 | Ban/suspension state blocks protected actions across the app. | Partially done |
| ADMIN-DOD-017 | Admins can manage professions through server-owned mutations. | Not started |
| ADMIN-DOD-018 | Admins can activate/deactivate professions. | Partially done |
| ADMIN-DOD-019 | Admins can manage typed platform policy settings. | Not started |
| ADMIN-DOD-020 | Admins can manage paid visibility products or tiers. | Not started |
| ADMIN-DOD-021 | Admins can manage no-cap paid visibility and Paymob renewal policies. | Not started |
| ADMIN-DOD-022 | Admins can review paid visibility and area expansion requests through server-owned mutations. | Not started |
| ADMIN-DOD-023 | Paid approvals use configured product terms rather than hardcoded terms. | Not started |
| ADMIN-DOD-024 | Every admin mutation writes a trusted server-owned audit row. | Partially done |
| ADMIN-DOD-025 | Audit rows include actor, action, target, reason, and timestamp. | Partially done |
| ADMIN-DOD-026 | Audit logs are reviewable by admins in the UI. | Partially done |
| ADMIN-DOD-027 | Firestore rules prevent direct client bypasses for admin mutations. | Not started |
| ADMIN-DOD-028 | Targeted tests, rules tests, function tests, e2e smoke, lint, and build pass. | Not started |

## Risk Tracker

| ID | Risk | Status | Mitigation |
| --- | --- | --- | --- |
| ADMIN-RISK-001 | Direct client admin writes can bypass callable validation and audit semantics. | Open | Move mutations to Cloud Functions and tighten rules. |
| ADMIN-RISK-002 | Client-created audit rows weaken audit trust. | Open | Make audit rows server-owned and deny client creates. |
| ADMIN-RISK-003 | Boolean-only identity verification cannot support review history or exceptions. | Open | Add explicit verification state and notes. |
| ADMIN-RISK-004 | Hardcoded paid duration and missing caps make paid controls brittle. | Open | Add paid product catalog and cap enforcement. |
| ADMIN-RISK-005 | Banned/suspended users may still access untested protected actions. | Open | Add full action matrix tests. |
| ADMIN-RISK-006 | Admin UI uses fixed reason keys that are weak operational evidence. | Open | Require meaningful reason input for sensitive admin actions. |
| ADMIN-RISK-007 | E2E only proves admin route access, not admin outcomes. | Open | Add approval, paid request, ban, and report workflow e2e/integration tests. |

## Open Questions

1. Should provider approval automatically mark identity as verified, or should identity verification be a separate required step?
2. Should rejected identity documents be versioned, retained, or replaced on resubmission?
3. Should admins be blocked from banning themselves?
4. Should abuse flagging include severity levels or only a boolean flag?
5. What visibility cap scope is required for v1?
6. Should area expansion expire, renew, or remain permanent after approval?
7. Should all policy and paid product changes require admin-entered reasons?
