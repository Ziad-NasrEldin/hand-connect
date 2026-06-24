# Section 1 Implementation Plan — Authentication

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 1.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 1.1-1.4.

Goal: make section 1 fully implemented across frontend, Firebase auth/session behavior, Firestore data, security rules, and tests.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 1.1 Email and/or Phone Login | Partially implemented | Email/password works, but login form validation is incomplete; phone is profile/contact data only; Firebase-facing auth tests are thin. |
| 1.2 OAuth Login | Partially implemented | Google login works for customer creation, but OAuth role/account resolution and provider/admin preservation need clearer tests and optional linking semantics. |
| 1.3 Login Required Before Contact | Partially implemented | UI and callables require auth, but unauthenticated callable/UI redirect paths need direct tests. |
| 1.4 Role Support | Implemented | Role guards and provider approval gates exist; keep as regression coverage while completing section 1. |

## Product Decisions Needed Before Implementation

### Decision A — Phone Login Scope

The SRS says:

- `AUTH-001`: email credentials are required.
- `AUTH-002`: phone number SHOULD be profile/contact data.
- `AUTH-003`: if phone login is enabled, ownership MUST be verified before account access.

Recommended v1 decision: **do not enable phone login for v1**.

Reason:

- The PRD says email and/or phone login, but phone auth often implies SMS setup, abuse prevention, quotas, and Firebase phone auth configuration.
- Current implementation already uses phone as required profile/contact data during registration.
- The implementation map says phone-login is missing, but SRS only makes phone-login conditional: “if enabled.”

Implementation implication:

- Keep phone as verified-format profile/contact data, not an auth method.
- Update SRS/product note if needed: “v1 authenticates by email/password and Google OAuth; phone is required contact/profile data, not login.”
- If captain explicitly wants phone login, create a separate Firebase Phone Auth epic after this section because it requires console/SMS/provider setup.

### Decision B — OAuth for Providers/Admins

Current behavior: Google OAuth creates a customer app user if no existing app user document exists.

Recommended v1 decision:

- Google OAuth MAY create new customer accounts.
- Provider and admin roles MUST only come from existing app user documents.
- Google OAuth MUST NOT auto-create provider/admin accounts.
- If a Firebase OAuth user signs in and there is an existing Herafy user document with the same UID, keep that role/status.
- If provider OAuth registration/linking is desired later, implement it as an explicit account-linking flow, not implicit provider creation.

Reason:

- This preserves provider verification and admin control.
- It matches the current Firebase-first architecture better than the playbook’s JWT/backend identity-table model.

## Target End State

Section 1 is complete when:

1. Email/password login validates required fields before hitting Firebase/demo services.
2. Failed login shows localized, user-readable errors and does not leave loading state stuck.
3. Phone is explicitly treated as profile/contact data for v1, or real Firebase phone login is implemented if product decides to enable it.
4. Google OAuth login works for customers.
5. Google OAuth preserves existing provider/admin app roles and cannot bypass provider approval.
6. New OAuth users become customers only.
7. Unauthenticated users cannot start chat or reveal WhatsApp from UI, callables, or direct Firestore writes.
8. Role guards continue to block customer/provider/admin cross-access.
9. Tests prove all above behavior in demo, Firebase adapter where feasible, callables/rules, and e2e smoke.

## Detailed Implementation Plan

## 1.1 Email and/or Phone Login

### Requirements Covered

- `AUTH-001`: email credentials.
- `AUTH-002`: phone as profile/contact data.
- `AUTH-003`: phone ownership verification only if phone login is enabled.
- `AUTH-004`: required auth field validation before submission.
- `AUTH-005`: clear login failure errors.

### Current Implementation Evidence

- `src/features/auth/pages/login-page.tsx`
  - email/password fields exist.
  - default demo values are set.
  - errors are rendered through `getLocalizedMessage`.
  - missing `required`, `type="email"`, and submit-level empty checks.
- `src/services/firebase/auth.firebase.ts`
  - uses `signInWithEmailAndPassword`.
  - maps Firebase errors via `mapFirebaseAuthError`.
- `src/services/contracts/auth.contract.ts`
  - login contract accepts email/password.
  - phone exists on registration inputs.

### Work Items

#### 1.1.1 Add frontend login field validation

Files:

- `src/features/auth/pages/login-page.tsx`
- possibly locale files under `src/i18n/`

Changes:

- Set email input:
  - `type="email"`
  - `required`
  - `autoComplete="email"`
  - trim email before submit.
- Set password input:
  - `required`
  - `autoComplete="current-password"`
- Add submit guard:
  - if email is empty, set localized error such as `error.auth.emailRequired`.
  - if password is empty, set localized error such as `error.auth.passwordRequired`.
  - if email format is invalid, set localized error such as `error.auth.invalidEmail`.
- Disable login and Google buttons while auth store `isLoading` is true, if exposed by `useAuth`.
- Keep demo defaults only in demo/dev mode if the project has a convention for that; otherwise consider clearing defaults for production readiness.

Acceptance:

- Empty email/password does not call `authService.login`.
- Error message is visible and localized.
- Valid form still calls login.

#### 1.1.2 Normalize email/password before service calls

Files:

- `src/features/auth/pages/login-page.tsx`
- optional helper: `src/lib/auth-validation.ts`

Changes:

- Use `email.trim().toLowerCase()` before login.
- Password should not be trimmed unless current project already does so; leading/trailing spaces can be intentional in passwords.
- Customer/provider registration may separately normalize email if not already covered.

Acceptance:

- ` Customer@Hand.Test ` logs in as `customer@hand.test`.
- Password value is passed exactly as typed.

#### 1.1.3 Make phone-login v1 scope explicit

Files:

- `docs/product/herafy-software-requirements.md` or a small product decision note.
- Possibly `docs/product/herafy-srs-implementation-map.md` later after implementation.
- Registration UI if wording is misleading.

Recommended change:

- Add a product note: “In v1, phone number is profile/contact data. Phone-number login is not enabled. If enabled later, ownership verification is mandatory.”

Code changes:

- None, unless UI implies phone login.

Acceptance:

- Product docs do not imply phone login is enabled.
- Registration still requires/validates phone contact data.

#### 1.1.4 Strengthen Firebase auth error mapping

Files:

- `src/services/firebase/auth.firebase.ts`
- locale files.

Changes:

- Ensure these Firebase errors map to stable local keys:
  - `auth/invalid-email` -> invalid email or invalid credentials, depending desired copy.
  - `auth/missing-password` -> password required.
  - `auth/too-many-requests` -> rate-limited/try later.
  - `auth/network-request-failed` -> network error.
  - popup errors for OAuth: `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, `auth/popup-blocked`.
- Keep non-sensitive error output; do not leak account existence details if product wants privacy.

Acceptance:

- Failed login always produces a localized error key.
- OAuth cancellation produces a friendly message rather than generic failure.

### Tests for 1.1

#### Unit/component tests

Add or update:

- login page component test, if test setup supports React component rendering.
- auth validation helper test if helper is extracted.

Cases:

- empty email blocks submit.
- empty password blocks submit.
- invalid email blocks submit.
- valid email/password calls login with normalized email.
- failed login displays localized error.

#### Service tests

Update:

- `src/services/auth.service.test.ts`

Cases:

- demo invalid credentials still throw `error.auth.invalidCredentials`.
- existing duplicate customer registration remains covered.

#### Firebase adapter tests, if feasible

Cases:

- `mapFirebaseAuthError` maps key Firebase errors correctly.
- If helper is not exported, either test through public service with mocks or extract mapper to testable helper.

## 1.2 OAuth Login

### Requirements Covered

- `AUTH-006`: Google OAuth default v1 provider.
- `AUTH-007`: OAuth creates/links account without bypassing provider verification.
- `AUTH-008`: OAuth assigns/resolves correct role.

### Current Implementation Evidence

- `src/features/auth/pages/login-page.tsx`
  - Google button exists.
- `src/services/firebase/auth.firebase.ts`
  - `loginWithGoogle` uses `signInWithPopup(requireFirebaseAuth(), new GoogleAuthProvider())`.
  - `ensureOAuthCustomer` creates a customer document if no user doc exists.
  - `buildSession` reads app role from Firestore user doc.
  - provider status comes from `providers` collection.
- `src/services/auth.service.test.ts`
  - has demo test for Google customer-only session after recent work.

### Work Items

#### 1.2.1 Make OAuth account resolution policy explicit in code comments/docs

Files:

- `src/services/firebase/auth.firebase.ts`
- docs product decision note.

Add short comment around `ensureOAuthCustomer`:

- New OAuth users default to customer.
- Existing app user documents preserve their role.
- Provider verification comes only from provider profile approval, never OAuth.

Acceptance:

- Future agents do not “fix” OAuth by auto-approving providers.

#### 1.2.2 Preserve existing roles during OAuth login

Current code likely already does this because `ensureOAuthCustomer` returns if user doc exists.

Verification needed:

- Existing customer user doc + OAuth UID -> customer session.
- Existing provider user doc + provider profile pending -> provider session with `providerStatus: pending`, redirect to `/pending`.
- Existing approved provider -> provider session with `providerStatus: approved`, redirect to `/dashboard`.
- Existing admin user doc -> admin session and redirect to `/admin`.
- New OAuth UID -> creates customer only.

Files:

- `src/services/firebase/auth.firebase.ts`
- `src/router/redirects.ts`
- tests.

Potential implementation if gap appears:

- Ensure `buildSession` returns provider status for provider role after OAuth.
- Ensure `getPostLoginRedirect` handles provider pending/approved correctly.

Acceptance:

- OAuth cannot downgrade or overwrite an existing provider/admin user doc.
- OAuth cannot create provider/admin without admin-controlled data.

#### 1.2.3 Add optional account-linking plan, but do not implement unless needed now

Because Herafy uses Firebase Auth UID as the app user ID, full account linking is more complex than the playbook’s backend identity table.

If implemented later, design should be:

- Link Google provider to current Firebase Auth user using Firebase `linkWithPopup`.
- Do not create a second app user document.
- Prevent linking if provider credential is already linked to another Firebase user.
- Re-authenticate if Firebase requires recent login.

Files likely involved if later enabled:

- `src/services/contracts/auth.contract.ts`
- `src/services/firebase/auth.firebase.ts`
- account settings page if one exists or is added.

For section 1 completion, recommended minimum:

- Do not expose linking UI unless product explicitly asks.
- Add tests proving Google login does not bypass provider/admin verification.

#### 1.2.4 Improve OAuth UI states and error messages

Files:

- `src/features/auth/pages/login-page.tsx`
- `src/store/auth.store.ts`
- locale files.

Changes:

- Disable Google button while loading.
- Show friendly messages for popup blocked/cancelled.
- Do not leave `isLoading` stuck; already fixed in `src/store/auth.store.ts`, keep regression test.

Acceptance:

- Closing popup leaves page usable.
- Popup-blocked error is clear.

### Tests for 1.2

#### Demo service tests

Update:

- `src/services/auth.service.test.ts`

Existing:

- Google creates customer-only session.
- Provider registration remains pending.

Add:

- failed Google login/loading reset, if store test exists.
- provider OAuth cannot create approved provider automatically, using demo service if demo can simulate.

#### Firebase adapter tests with mocks

If mocking Firebase is feasible:

- `signInWithPopup` returns new user -> `setDoc(users/{uid})` with `role: customer`.
- `signInWithPopup` returns existing provider UID -> no overwrite user doc; returns provider status from provider doc.
- `signInWithPopup` returns existing admin UID -> no overwrite user doc; returns admin user.
- banned user after OAuth -> signs out and throws `error.auth.accountBanned`.

#### Router redirect tests

Files:

- `src/router/redirects.ts` test, if not existing.

Cases:

- customer -> `/search`.
- admin -> `/admin`.
- provider pending -> `/pending`.
- provider approved -> `/dashboard`.

## 1.3 Login Required Before Contact

### Requirements Covered

- `AUTH-009`: logged in before in-app chat.
- `AUTH-010`: logged in before WhatsApp reveal/open.
- `AUTH-011`: unauthenticated users attempting contact redirected/prompted to login.

### Current Implementation Evidence

- `src/features/providers/pages/provider-profile-page.tsx`
  - redirects unauthenticated users before chat/WhatsApp.
- `functions/src/engagement.ts`
  - `revealWhatsApp` and `startConversation` call `requireAuth`.
- `firestore.rules`
  - blocks direct contact/conversation creation.

### Work Items

#### 1.3.1 Confirm profile UI unauthenticated contact behavior

Files:

- `src/features/providers/pages/provider-profile-page.tsx`

Expected behavior:

- Unauthenticated click on chat -> navigate to `/login` with return state or query.
- Unauthenticated click on WhatsApp -> navigate/prompt to login before revealing URL.
- After login, user should be able to resume or retry contact.

Potential improvements:

- Store `from` path in router state consistently.
- Show clear login prompt copy, e.g. “Sign in to contact this provider.”

Acceptance:

- No WhatsApp URL is revealed before auth.
- No conversation is created before auth.

#### 1.3.2 Add callable-level unauthenticated tests

Files:

- `functions/src/engagement.ts`
- `functions/test/engagement.test.ts` or equivalent.

Cases:

- unauthenticated `revealWhatsApp` throws `unauthenticated`.
- unauthenticated `startConversation` throws `unauthenticated`.
- authenticated customer can call both for approved provider.
- banned user cannot call either.

Acceptance:

- Backend protection is proven independent of frontend routing.

#### 1.3.3 Add Firestore rules/direct-write tests

Files:

- `tests/rules/firestore.rules.test.ts`

Cases:

- unauthenticated direct write to `contacts` denied.
- unauthenticated direct write to `conversations` denied.
- unauthenticated direct write to `messages` denied.
- authenticated users can only write through allowed shapes, or direct writes remain denied if callables own the path.

Acceptance:

- Direct Firestore bypass is impossible for contact initiation.

#### 1.3.4 Add e2e contact-auth smoke

Files:

- `tests/e2e/app.spec.ts`

Cases:

- anonymous user opens approved provider profile and clicks chat -> login page appears.
- anonymous user clicks WhatsApp -> login page or sign-in prompt appears; no external WhatsApp URL opens.
- after login as customer, chat/WhatsApp action succeeds.

Acceptance:

- Browser-level flow matches SRS.

## 1.4 Role Support Regression Hardening

This area is already implemented, but section 1 should not be considered “fully covered” unless role access stays protected while OAuth and contact auth are hardened.

### Requirements Covered

- `AUTH-012`: customer, provider, admin roles.
- `AUTH-013`: customers blocked from provider dashboard.
- `AUTH-014`: non-admin blocked from admin features.
- `AUTH-015`: provider role does not imply public approval.

### Work Items

#### 1.4.1 Add route guard smoke tests

Files:

- `src/router/route-guards.tsx` tests if component test setup exists.
- or `tests/e2e/app.spec.ts`.

Cases:

- anonymous `/dashboard` -> `/login`.
- customer `/dashboard` -> `/` or safe route.
- pending provider `/dashboard` -> `/pending`.
- approved provider `/dashboard` -> dashboard visible.
- customer/provider `/admin` -> `/`.
- admin `/admin` -> admin visible.

#### 1.4.2 Ensure OAuth does not bypass provider public visibility

Files:

- `src/services/firebase/auth.firebase.ts`
- search/profile tests.

Cases:

- provider role with `providerStatus: pending` cannot access dashboard and does not appear in search.
- Google login for a new user creates customer only; no provider profile is created.

Acceptance:

- Role and public approval remain separate concepts.

## Suggested Implementation Order

1. Add login validation helper or inline validation in `LoginPage`.
2. Add/adjust locale keys for auth validation and OAuth popup errors.
3. Strengthen Firebase auth error mapping.
4. Add OAuth role-preservation tests.
5. Add unauthenticated callable tests for `revealWhatsApp` and `startConversation`.
6. Add Firestore rules tests for direct unauthenticated contact writes.
7. Add e2e smoke for anonymous contact redirect and role guards.
8. Add product note clarifying phone login is not enabled in v1 unless explicitly chosen.
9. Run targeted tests.
10. Run full verification gate.

## Verification Plan

Minimum commands:

```bash
npm test -- src/services/auth.service.test.ts
npm test -- src/router/redirects.test.ts
npm test -- src/services/providers.service.test.ts
npm test -- src/services/messaging.service.test.ts
npm run lint
npm run build
```

If tests/files exist or are added:

```bash
npm run test:rules
npm run test:e2e -- tests/e2e/app.spec.ts
```

Firebase Functions tests, depending project scripts:

```bash
cd functions
npm test
```

If emulator-dependent tests are added, run with Firebase emulators rather than plain Vitest so skipped rule assertions become real assertions.

## Completion Checklist

Section 1 is complete when all are true:

- [ ] Login email input is required, typed as email, and normalized before submit.
- [ ] Password is required and not accidentally trimmed.
- [ ] Empty/invalid auth form shows localized error before service call.
- [ ] Firebase auth errors map to stable localized messages.
- [ ] Phone-login v1 scope is documented: disabled unless explicitly enabled with verification.
- [ ] Google login creates new customer users only.
- [ ] Existing provider/admin app users retain role under OAuth login.
- [ ] OAuth cannot approve or publicly expose providers.
- [ ] Unauthenticated chat and WhatsApp attempts are blocked in UI.
- [ ] Unauthenticated chat and WhatsApp callables reject server-side.
- [ ] Direct Firestore contact/conversation/message bypasses are denied by rules.
- [ ] Customer/provider/admin route boundaries have regression coverage.
- [ ] Provider dashboard remains approval-gated.
- [ ] Tests, lint, and build pass.

## Estimated Effort

| Workstream | Estimate |
|---|---:|
| Login validation + locale/error mapping | 0.5 day |
| OAuth role-preservation tests and small service fixes | 0.5-1 day |
| Callable/rules unauthenticated contact tests | 0.5-1 day |
| E2E role/contact auth smoke | 0.5 day |
| Documentation/product-scope note | 0.25 day |
| Total | 2-3.25 days |

## Risks

- Firebase emulator tests may require local setup fixes if CI/scripts are not already stable.
- Full phone login would materially expand scope and require Firebase Console/SMS configuration.
- Account linking can create identity collision edge cases; keep it out of v1 unless explicitly required.
- OAuth role preservation should never overwrite an existing user document, or admin/provider access could break.

## Recommended Definition of Done for Section 1

- The implementation map row statuses can be updated to:
  - `1.1 Email and/or Phone Login`: Implemented, with phone-login explicitly out of v1 or separately implemented.
  - `1.2 OAuth Login`: Implemented for v1 Google customer login + role preservation + provider verification protection.
  - `1.3 Login Required Before Contact`: Implemented with UI, callable, rules, and e2e coverage.
  - `1.4 Role Support`: Implemented with added regression tests.
