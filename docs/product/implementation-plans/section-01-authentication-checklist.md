# Section 1 Authentication Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-01-authentication.md`

Scope: complete SRS section 1 so Authentication is fully implemented across frontend, Firebase/session behavior, Firestore rules/callables, and tests.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Not started | Product/Engineering | Decide phone-login scope and OAuth provider/admin policy. |
| Login validation | Not started | Engineering | Add required fields, email type, normalization, localized errors. |
| Auth error mapping | Not started | Engineering | Strengthen Firebase/password/OAuth error localization. |
| Phone-login scope docs | Not started | Product/Engineering | Recommended: phone is profile/contact data only for v1. |
| OAuth role preservation | Not started | Engineering | Prove new OAuth users are customers only; existing provider/admin roles preserved. |
| Contact auth enforcement | Not started | Engineering | Prove UI/callables/rules block unauthenticated contact. |
| Role support regression | Not started | Engineering | Add route/redirect tests for customer/provider/admin boundaries. |
| Verification | Not started | Engineering | Run targeted tests, rules/e2e where available, lint, build. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| AUTH-PD-001 | Decide whether phone-number login is enabled in v1. | Not started | Recommended decision: **disabled for v1**; phone remains profile/contact data. |
| AUTH-PD-002 | If phone login is disabled, document the v1 scope clearly. | Not started | Docs say email/password + Google OAuth are auth methods; phone is contact/profile data. |
| AUTH-PD-003 | If phone login is enabled, create separate Firebase Phone Auth implementation epic. | Not started | Must include phone ownership verification, SMS/Firebase setup, abuse controls, tests. |
| AUTH-PD-004 | Confirm OAuth policy for new users. | Not started | Recommended: new OAuth users become customers only. |
| AUTH-PD-005 | Confirm OAuth policy for existing provider/admin users. | Not started | Recommended: existing app user document role/status is preserved; OAuth never grants provider/admin. |
| AUTH-PD-006 | Confirm whether account-linking UI is in v1. | Not started | Recommended: out of v1 unless explicitly needed. |

## 1.1 Email and/or Phone Login Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| AUTH-1.1-001 | Add email input semantics. | Not started | `src/features/auth/pages/login-page.tsx` | Email input has `type="email"`, `required`, `autoComplete="email"`. |
| AUTH-1.1-002 | Add password input semantics. | Not started | `src/features/auth/pages/login-page.tsx` | Password input has `required`, `autoComplete="current-password"`. |
| AUTH-1.1-003 | Add submit-level empty email validation. | Not started | `login-page.tsx`, locale files | Empty email blocks submit and shows localized error. |
| AUTH-1.1-004 | Add submit-level invalid email validation. | Not started | `login-page.tsx`, optional validation helper | Invalid email blocks submit and shows localized error. |
| AUTH-1.1-005 | Add submit-level empty password validation. | Not started | `login-page.tsx`, locale files | Empty password blocks submit and shows localized error. |
| AUTH-1.1-006 | Normalize email before login. | Not started | `login-page.tsx` | Email is trimmed/lowercased before `login`; password is not accidentally trimmed. |
| AUTH-1.1-007 | Disable auth buttons while loading. | Not started | `login-page.tsx`, `useAuth`/store | Email login and Google buttons cannot double-submit while loading. |
| AUTH-1.1-008 | Ensure failed password login clears loading state. | Done | `src/store/auth.store.ts` | Already patched; keep regression coverage. |
| AUTH-1.1-009 | Strengthen Firebase password/email error mapping. | Not started | `src/services/firebase/auth.firebase.ts`, locale files | Missing/invalid email, missing password, too many requests, network failure produce stable localized keys. |
| AUTH-1.1-010 | Keep phone as validated profile/contact data if phone login disabled. | Not started | Registration UI/service/docs | Registration still captures phone; docs clarify it is not login. |

## 1.2 OAuth Login Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| AUTH-1.2-001 | Document OAuth account-resolution policy in code/docs. | Not started | `auth.firebase.ts`, product docs | New OAuth users default to customer; existing roles preserved; provider verification never bypassed. |
| AUTH-1.2-002 | Ensure new Google OAuth users create customer app user only. | Done | `auth.firebase.ts`, `auth.service.test.ts` | Existing test proves customer-only demo path; add Firebase/mock test if feasible. |
| AUTH-1.2-003 | Add test for no provider profile created by new OAuth login. | Done | `src/services/auth.service.test.ts` | Existing test asserts no provider row for Google customer. |
| AUTH-1.2-004 | Add OAuth existing customer role preservation test. | Not started | Firebase auth adapter tests or demo test | Existing customer remains customer after OAuth login. |
| AUTH-1.2-005 | Add OAuth pending provider role preservation test. | Not started | Firebase auth adapter tests/router tests | Existing pending provider logs in but gets `providerStatus: pending` and redirects to `/pending`. |
| AUTH-1.2-006 | Add OAuth approved provider role preservation test. | Not started | Firebase auth adapter tests/router tests | Existing approved provider logs in and can reach dashboard. |
| AUTH-1.2-007 | Add OAuth admin role preservation test. | Not started | Firebase auth adapter tests/router tests | Existing admin logs in and redirects to `/admin`. |
| AUTH-1.2-008 | Add OAuth banned-user test. | Not started | Firebase auth adapter tests | Banned user is signed out and receives `error.auth.accountBanned`. |
| AUTH-1.2-009 | Map OAuth popup errors. | Not started | `auth.firebase.ts`, locale files | Popup closed/blocked/cancelled shows friendly localized error. |
| AUTH-1.2-010 | Decide/link account-linking support. | Blocked | Product decision | If in v1, design Firebase `linkWithPopup`; otherwise document as out of v1. |

## 1.3 Login Required Before Contact Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| AUTH-1.3-001 | Confirm unauthenticated chat click behavior. | Not started | `src/features/providers/pages/provider-profile-page.tsx` | Anonymous chat attempt navigates/prompts login before creating conversation. |
| AUTH-1.3-002 | Confirm unauthenticated WhatsApp click behavior. | Not started | `provider-profile-page.tsx` | Anonymous WhatsApp attempt navigates/prompts login before revealing URL. |
| AUTH-1.3-003 | Preserve return path after login if supported. | Not started | Router state/login page | User can retry intended provider contact after login, or behavior is documented. |
| AUTH-1.3-004 | Add callable test: unauthenticated `revealWhatsApp` rejects. | Not started | `functions/test/*`, `functions/src/engagement.ts` | Callable throws `unauthenticated`. |
| AUTH-1.3-005 | Add callable test: unauthenticated `startConversation` rejects. | Not started | `functions/test/*`, `functions/src/engagement.ts` | Callable throws `unauthenticated`. |
| AUTH-1.3-006 | Add callable test: authenticated customer contact succeeds. | Not started | Functions tests | Approved provider chat/WhatsApp works for signed-in customer. |
| AUTH-1.3-007 | Add callable test: banned user contact rejects. | Not started | Functions tests | Banned user cannot reveal WhatsApp/start conversation. |
| AUTH-1.3-008 | Add Firestore rules test: anonymous cannot create contacts. | Not started | `tests/rules/firestore.rules.test.ts` | Direct write denied. |
| AUTH-1.3-009 | Add Firestore rules test: anonymous cannot create conversations. | Not started | Rules tests | Direct write denied. |
| AUTH-1.3-010 | Add Firestore rules test: anonymous cannot create messages. | Not started | Rules tests | Direct write denied. |
| AUTH-1.3-011 | Add e2e: anonymous chat redirects/prompts login. | Not started | `tests/e2e/app.spec.ts` | Browser test proves no conversation before login. |
| AUTH-1.3-012 | Add e2e: anonymous WhatsApp redirects/prompts login. | Not started | `tests/e2e/app.spec.ts` | Browser test proves no `wa.me` reveal before login. |

## 1.4 Role Support Regression Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| AUTH-1.4-001 | Add anonymous `/dashboard` route guard test. | Not started | Router/e2e tests | Anonymous user goes to `/login`. |
| AUTH-1.4-002 | Add customer `/dashboard` route guard test. | Not started | Router/e2e tests | Customer is blocked from provider dashboard. |
| AUTH-1.4-003 | Add pending provider dashboard test. | Not started | Router/e2e tests | Pending provider goes to `/pending`. |
| AUTH-1.4-004 | Add approved provider dashboard test. | Not started | Router/e2e tests | Approved provider sees dashboard. |
| AUTH-1.4-005 | Add non-admin `/admin` guard test. | Not started | Router/e2e tests | Customer/provider cannot access admin. |
| AUTH-1.4-006 | Add admin `/admin` access test. | Not started | Router/e2e tests | Admin sees admin dashboard. |
| AUTH-1.4-007 | Add provider public visibility test. | Not started | Search/rules/e2e tests | Provider role alone does not make pending provider public. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| AUTH-V-001 | `npm test -- src/services/auth.service.test.ts` | Not started | Passes. |
| AUTH-V-002 | Router redirect/guard tests, if added | Not started | Passes. |
| AUTH-V-003 | Contact/provider service tests | Not started | Passes. |
| AUTH-V-004 | Functions engagement tests | Not started | Passes. |
| AUTH-V-005 | `npm run test:rules` | Not started | Firestore rules auth/contact checks pass under emulator. |
| AUTH-V-006 | `npm run test:e2e -- tests/e2e/app.spec.ts` or project equivalent | Not started | Auth/contact/role smoke passes. |
| AUTH-V-007 | `npm run lint` | Not started | Passes. |
| AUTH-V-008 | `npm run build` | Not started | Passes. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| AUTH-DOD-001 | Login form validates required email/password before service call. | Not started |
| AUTH-DOD-002 | Login form normalizes email and preserves password exactly. | Not started |
| AUTH-DOD-003 | Failed email/password login shows localized error and clears loading state. | Partially done |
| AUTH-DOD-004 | OAuth popup errors show localized user-readable messages. | Not started |
| AUTH-DOD-005 | Phone login scope is documented or implemented with verification. | Not started |
| AUTH-DOD-006 | New Google OAuth users become customers only. | Done |
| AUTH-DOD-007 | Existing provider/admin roles are preserved under OAuth login. | Not started |
| AUTH-DOD-008 | OAuth cannot approve or publicly expose providers. | Partially done |
| AUTH-DOD-009 | UI blocks/prompts unauthenticated chat and WhatsApp attempts. | Partially done |
| AUTH-DOD-010 | Callables reject unauthenticated chat and WhatsApp attempts. | Partially done |
| AUTH-DOD-011 | Firestore rules deny direct unauthenticated contact bypasses. | Partially done |
| AUTH-DOD-012 | Customer/provider/admin role boundaries have regression coverage. | Not started |
| AUTH-DOD-013 | Provider dashboard remains approval-gated. | Done |
| AUTH-DOD-014 | Targeted tests, rules/e2e where available, lint, and build pass. | Not started |

## Open Questions

1. Should phone-number login remain out of v1, with phone as profile/contact data only?
2. Should Google OAuth be allowed for provider/admin existing accounts only, or should Herafy add explicit account linking now?
3. Should anonymous contact attempts return to the provider profile automatically after login, or is a normal login redirect acceptable?
4. Should account-linking UI be added under settings, or left for a later version?
