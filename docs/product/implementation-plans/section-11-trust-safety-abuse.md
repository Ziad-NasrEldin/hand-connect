# Section 11 Implementation Plan - Trust, Safety & Abuse Prevention

Source documents:

- SRS: `docs/product/herafy-software-requirements.md`, section 11.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 11.1-11.5.

Goal: make Section 11 fully implemented across provider verification, abuse reporting, moderation, manipulation detection, penalties, rate limits, user feedback, Firebase rules, Cloud Functions, admin tools, and tests.

## Current Status

| SRS area | Current status | Reason |
|---|---|---|
| 11.1 Manual Verification | Implemented with test gaps | Provider registration stores identity documents, admin application review displays them, approval callable requires an identity document, public reads hide non-approved providers, and storage rules keep identity documents private. The missing piece is full callable transaction coverage around approval with and without identity evidence. |
| 11.2 Abuse and Disputes | Implemented for abuse reports, partially defined for disputes | Provider, review, and message reports exist through callables, admin can list reports, resolve reports, hide reviews, and resolution metadata is stored. There is no separate formal dispute object, escalation status, or appeal workflow. |
| 11.3 Manipulation Detection | Partially implemented | Reviews are contact-gated and one-per-customer/provider, direct review writes are blocked, ranking uses trust/activity signals, and a small spam helper exists. There is no integrated signal model for coordinated reviews, artificial activity, location spoofing, or duplicate/linked accounts. |
| 11.4 Penalties | Partially implemented | Admins can suspend providers, ban/unban provider accounts, hide reviews, and rules/callables block many banned-user writes. There is no provider removal path, explicit ranking penalty field, penalty expiry, abuse strike model, or automatic paid-benefit loss. |
| 11.5 Rate Limiting | Partially implemented | Server-side daily caps exist for WhatsApp reveals, first conversation starts, provider/review/message reports, and demo tests cover these paths. Follow-up message sends still use direct Firestore transactions, review creation lacks an explicit daily rate cap, and UI feedback for rate limit failures is not consistently visible. |

## Product Decisions Needed Before Implementation

### Decision A - Disputes are abuse reports or a separate workflow

The SRS groups “Abuse and Disputes” together.
The current product only has abuse reports.

Recommended v1 decision: **treat disputes as abuse reports for v1, with target type and reason taxonomy broad enough to cover service disputes.**

Reason:

- Herafy v1 is a directory/contact marketplace, not an escrow, booking, payment, or job-management platform.
- A full dispute workflow implies case assignment, evidence upload, provider/customer replies, status SLAs, notifications, and possible refunds or platform decisions.
- The existing report queue already gives admins a controlled moderation surface.

Implementation implication:

- Keep one `reports` collection for v1.
- Add dispute-oriented report reasons and admin filters if needed.
- Do not add a separate `disputes` collection until Herafy introduces booking/payment/order state.

### Decision B - Penalty model granularity

The current implementation has coarse actions: hide review, suspend provider, ban user, unban user.

Recommended v1 decision: **add a small explicit penalty model instead of building a large policy engine.**

Fields:

- `providers/{providerId}.trustPenaltyScore: number`
- `providers/{providerId}.trustPenaltyReason: string | null`
- `providers/{providerId}.trustPenaltyUntil: string | null`
- `providers/{providerId}.visibilitySuspendedUntil: string | null`
- `providers/{providerId}.visibilitySuspensionReason: string | null`
- `users/{userId}.abuseStrikeCount: number`
- `users/{userId}.lastAbuseActionAt: string | null`

Reason:

- Ranking and paid-visibility consequences become explicit and testable.
- Admins can apply a lower-severity action before suspension or ban.
- The model stays small enough for Firebase rules, callables, and UI to reason about.

### Decision C - Paid-benefit loss after abuse

The SRS says the system should support loss of paid benefits after abuse.

Recommended v1 decision: **suspending a provider or applying a paid-visibility safety hold should immediately remove paid ranking benefit while preserving payment history.**

Implementation implication:

- Do not delete visibility request history.
- Set `visibilityTier` to `organic` or make ranking ignore paid status while `visibilitySuspendedUntil` is active.
- Store the reason and admin action for audit.
- Decide separately whether commercial refunds/credits are handled outside the app.

### Decision D - Rate limit storage

The current rate limits query operational collections over the previous day.

Recommended v1 decision: **keep collection-query limits for MVP, but introduce a reusable server-side rate-limit helper before adding more actions.**

Reason:

- Query-based limits are simple and already working.
- A helper prevents each callable from inventing slightly different behavior.
- Dedicated counter documents can be added later if usage grows.

### Decision E - Manipulation detection scope

Recommended v1 decision: **support enforcement through deterministic signals and admin review, not automatic account punishment.**

Signals should create admin-visible flags.
Admins decide whether to hide reviews, apply penalties, suspend providers, or ban accounts.

Reason:

- False positives can harm legitimate providers.
- Manual review matches Herafy’s existing provider approval and moderation model.
- Deterministic signals are easier to test than opaque scoring.

## Target End State

Section 11 is complete when:

1. Provider approval requires manual identity evidence and cannot be bypassed by client writes.
2. Public provider state clearly reflects approval/verification status.
3. Users can report providers, reviews, and messages from supported surfaces.
4. Abuse reports can be reviewed, resolved, and audited by admins.
5. Resolution metadata always stores resolver, timestamp, and reason.
6. V1 dispute scope is explicitly documented as part of the abuse report model, or a separate dispute workflow exists.
7. Fake-review prevention is enforced by contact-gated, one-review-per-customer/provider callables and tested in Firebase-shaped paths.
8. Coordinated review, artificial activity, location spoofing, and linked-account signals are captured as admin-reviewable abuse signals.
9. Admins can apply graduated penalties: review removal, ranking penalty, paid-benefit hold, provider suspension, account ban, and account removal or explicit v1 non-removal policy.
10. Ranking and paid visibility respect active penalties.
11. Sensitive actions are rate-limited through server-controlled paths.
12. Rate-limited actions include contact, messaging, reporting, and review submission.
13. Rate-limit failures show localized, user-readable feedback.
14. Security rules deny direct bypasses for reports, reviews, contact creation, protected provider state, and server-owned penalty fields.
15. Targeted unit, functions, rules, and e2e smoke tests prove the above.

## Detailed Implementation Plan

## 11.1 Manual Verification

### Requirements Covered

- `SAFETY-001`: Provider trust flow MUST include manual identity verification.
- `SAFETY-002`: Public provider state MUST reflect verification/approval status.

### Current Implementation Evidence

- `src/features/auth/pages/register-page.tsx`
  - Provider registration includes identity document upload flow.
  - Registered providers start as pending.
- `src/services/firebase/auth.firebase.ts`
  - Creates provider and provider identity document records during Firebase provider registration.
- `src/features/admin/pages/applications-page.tsx`
  - Lists pending applications.
  - Displays identity document metadata and preview/download link.
  - Offers approve/reject controls.
- `functions/src/providers.ts`
  - `approveProvider` requires admin auth.
  - `approveProvider` checks `providerIdentityDocuments/{providerId}` before approval.
  - Approval sets `status: approved`, `nationalIdVerified: true`, and `approvedAt`.
  - Rejection records a reason.
  - Suspension records a reason.
- `src/services/firebase/admin.firebase.ts`
  - Firebase admin adapter calls `approveProvider`, `rejectProvider`, and `suspendProvider` callables.
  - Application listing joins pending providers with identity documents.
- `src/services/firebase/providers.firebase.ts`
  - Public provider read returns only approved providers.
- `firestore.rules`
  - Approved providers are publicly readable.
  - Pending providers are readable only by owner or admin.
  - Provider owners cannot update protected verification/status fields.
  - Direct provider delete is denied.
- `storage.rules`
  - Identity documents are readable only by owner or admin.
  - Identity documents are writable only by owner.
- `tests/rules/firestore.rules.test.ts`
  - Covers public approved provider read.
  - Covers pending provider hidden from anonymous users.
  - Covers owner blocked from changing `status`, `nationalIdVerified`, or `visibilityTier`.
- `tests/rules/storage.rules.test.ts`
  - Covers identity document privacy.
- `functions/test/providers.test.ts`
  - Covers provider moderation patch helpers and banned-admin guard.
- `tests/e2e/app.spec.ts`
  - Existing e2e suite should be checked for provider join/admin identity review coverage before marking this row fully verified.

### Remaining Gaps

- No functions emulator or callable integration test proves `approveProvider` succeeds only with identity document present.
- No callable test proves approval fails without identity document.
- Firestore rules still allow broad admin direct writes to providers, which is acceptable only if product accepts admin-client writes as trusted for v1.
- Admin application UI uses fixed reason keys and does not ask the admin to enter a custom reason.
- Identity document file type and size validation should be verified in registration and storage paths.

### Work Items

#### 11.1.1 Add callable integration tests for provider approval

Files:

- `functions/test/providers.test.ts`
- Optional Firebase Functions test harness setup file if the project adds one.

Cases:

- Unauthenticated caller cannot approve.
- Non-admin caller cannot approve.
- Banned admin cannot approve.
- Admin cannot approve missing provider.
- Admin cannot approve provider without identity document.
- Admin can approve pending provider with identity document.
- Admin cannot approve rejected/suspended/already-approved provider.
- Approval writes an admin action.

Acceptance:

- The approval callable is proven as the source of truth for manual verification.
- The approval result includes `nationalIdVerified: true` and `approvedAt`.

#### 11.1.2 Add registration identity validation tests

Files:

- `src/services/auth.service.test.ts`
- `src/services/firebase/auth.firebase.ts`
- `src/features/auth/pages/register-page.tsx`
- `tests/rules/storage.rules.test.ts`

Cases:

- Provider registration requires an identity file.
- Customer registration does not require identity file.
- Provider identity document metadata is stored with provider ID.
- Oversized or unsupported file type is rejected, if validation exists or is added.
- Identity storage object is private to owner/admin.

Acceptance:

- Provider cannot enter pending verification without identity evidence.
- Identity documents are never publicly readable.

#### 11.1.3 Make public verification state explicit

Files:

- `src/types/provider.ts`
- `src/features/providers/pages/provider-profile-page.tsx`
- `src/features/search/pages/search-page.tsx`
- locale files under `src/i18n/`

Changes:

- Show a small verified/approved state on approved provider profiles.
- Keep pending/rejected/suspended providers hidden from public search/profile.
- Ensure no UI says “verified” unless `status === 'approved'` and `nationalIdVerified === true`.

Acceptance:

- Public users can distinguish approved providers without seeing private identity details.
- Pending providers remain invisible publicly.

### Tests for 11.1

Run:

```bash
npm run test:rules
npm test -- src/services/auth.service.test.ts
cd functions && npm test -- providers.test.ts
npm run e2e -- tests/e2e/app.spec.ts
```

Expected:

- Rules and storage tests pass.
- Provider approval callable tests pass.
- Provider registration and admin review smoke pass.

## 11.2 Abuse and Disputes

### Requirements Covered

- `SAFETY-003`: Users MUST be able to report abuse from supported surfaces.
- `SAFETY-004`: Admins MUST be able to review and resolve abuse reports.
- `SAFETY-005`: Resolution outcomes SHOULD be stored with reason and resolver metadata.

### Current Implementation Evidence

- `src/features/providers/pages/provider-profile-page.tsx`
  - Signed-in users can report a provider.
  - Signed-in users can report visible reviews.
- `src/features/messaging/pages/conversation-page.tsx`
  - Signed-in users can report received messages.
- `functions/src/engagement.ts`
  - `reportProvider` creates open provider reports.
  - `reportReview` creates open review reports only for visible reviews.
  - `reportMessage` creates open message reports only when the reporter participates in the conversation.
  - All report callables require active signed-in users.
  - Report creation stores target type, target ID, target label, reporter ID, reporter name, reason, status, created timestamp, and nullable resolution metadata.
  - Report creation is daily rate-limited.
- `src/services/firebase/providers.firebase.ts`
  - Provider reports use the report callable.
- `src/services/firebase/reviews.firebase.ts`
  - Review reports use the report callable.
- `src/services/firebase/messaging.firebase.ts`
  - Message reports resolve the conversation context and call `reportMessage`.
- `src/features/admin/pages/reports-page.tsx`
  - Admins can list reports.
  - Admins can resolve open reports.
  - Admins can hide reported reviews.
  - Closed reports display resolver and resolved timestamp.
- `src/services/firebase/admin.firebase.ts`
  - `listReports` enriches report context with reporter and target labels.
  - `resolveReport` sets `status`, `resolvedBy`, `resolvedAt`, and `resolutionReason`.
  - `hideReview` uses a callable and can close the linked report.
- `functions/src/reviews.ts`
  - `hideReview` requires active admin.
  - `hideReview` sets review status to `removed`.
  - `hideReview` closes linked report with resolver metadata.
  - `hideReview` writes an admin action.
  - Rating aggregate excludes removed reviews.
- `firestore.rules`
  - Direct report creation is denied.
  - Report reads are admin-only.
  - Admins can update reports.
- `src/services/providers.service.test.ts`
  - Covers provider report creation and report rate limits in demo mode.
  - Covers message report rate limits in demo mode.
- `src/services/reviews.service.test.ts`
  - Covers review report creation and report rate limits in demo mode.
- `src/services/admin.service.test.ts`
  - Covers report target context, resolution metadata, and audit entries.
- `tests/rules/firestore.rules.test.ts`
  - Covers direct abuse report creation denial.

### Remaining Gaps

- `resolveReport` in the Firebase adapter is a direct client Firestore update, not a callable.
- Report status has only `open` and `closed`, so there is no triage state such as `under_review`, `escalated`, or `dismissed`.
- There is no separate dispute model or explicit product note that disputes are handled through reports in v1.
- Report reasons are hard-coded in some UI paths.
- Users do not appear to receive clear success/error feedback after report submission.
- Admin report page lacks filters by target type, status, reporter, and age.
- Admin report page uses fixed reason keys for actions and does not collect custom resolution notes.
- No functions tests cover the report callables with Firebase-shaped data.

### Work Items

#### 11.2.1 Formalize v1 dispute scope

Files:

- `docs/product/herafy-software-requirements.md` or a focused product decision note.
- `docs/operations/admin-runbook.md`
- locale files if new reason labels are added.

Changes:

- State that v1 disputes are reported through the abuse report queue.
- Add reason labels for service dispute, unsafe behavior, fraud/scam, spam, offensive content, and wrong category.
- Leave payment/order disputes out of scope until Herafy has platform-managed payments/orders.

Acceptance:

- Product and admin docs do not imply a missing separate dispute case system for v1.

#### 11.2.2 Move report resolution to a callable

Files:

- `functions/src/engagement.ts` or a new `functions/src/reports.ts`
- `functions/src/index.ts`
- `src/services/firebase/admin.firebase.ts`
- `functions/test/*`

Changes:

- Add `resolveReport` callable.
- Require active admin.
- Validate report exists and is open.
- Validate resolution reason.
- Set status and resolver metadata in one transaction.
- Write `adminActions` in the same transaction.
- Update Firebase admin adapter to call the function.
- Keep direct admin Firestore updates denied or narrowly allowed only where rules cannot express callable ownership.

Acceptance:

- Report resolution is server-owned and audited atomically.
- Non-admin and banned-admin resolution attempts fail.

#### 11.2.3 Add report callable tests

Files:

- `functions/test/reports.test.ts` or `functions/test/engagement.test.ts`

Cases:

- Provider report requires auth.
- Provider report rejects banned users.
- Provider report rejects missing provider.
- Provider report creates expected open report.
- Review report rejects hidden/removed review.
- Message report rejects non-participant reporter.
- Message report creates expected open report for participant.
- Report rate limit returns `resource-exhausted`.
- Resolve report requires active admin.
- Resolve report stores `resolvedBy`, `resolvedAt`, and `resolutionReason`.

Acceptance:

- Abuse report lifecycle is covered outside demo-only service tests.

#### 11.2.4 Improve report submission feedback

Files:

- `src/features/providers/pages/provider-profile-page.tsx`
- `src/features/messaging/pages/conversation-page.tsx`
- `src/hooks/use-conversation.ts`
- locale files.

Changes:

- Show success feedback after provider/review/message report submission.
- Show specific localized rate-limit feedback for `error.rateLimit.exceeded`.
- Disable report controls while submitting.
- Avoid repeated duplicate reports from the same user/target if product chooses to dedupe.

Acceptance:

- Users know whether a report was submitted.
- Rate-limit failures are clear and non-technical.

#### 11.2.5 Improve admin report queue

Files:

- `src/features/admin/pages/reports-page.tsx`
- `src/hooks/use-admin-actions.ts`
- `src/services/admin.service.ts`
- locale files.

Changes:

- Add filters for status and target type.
- Add sort by newest and oldest.
- Add custom resolution reason input.
- Add confirmation for destructive actions such as hide review.
- Show report created date and resolution reason on closed reports.

Acceptance:

- Admins can triage reports without scanning a single undifferentiated list.

### Tests for 11.2

Run:

```bash
npm test -- src/services/providers.service.test.ts src/services/reviews.service.test.ts src/services/admin.service.test.ts
npm run test:rules
cd functions && npm test
npm run e2e -- tests/e2e/app.spec.ts
```

Expected:

- Report creation, report resolution, review hiding, rules denial, and UI smoke pass.

## 11.3 Manipulation Detection

### Requirements Covered

- `SAFETY-006`: The system SHOULD detect or support enforcement against fake reviews.
- `SAFETY-007`: The system SHOULD detect or support enforcement against coordinated reviews.
- `SAFETY-008`: The system SHOULD detect or support enforcement against artificial activity signals.
- `SAFETY-009`: The system SHOULD detect or support enforcement against location spoofing.
- `SAFETY-010`: The system SHOULD detect or support enforcement against duplicate or linked accounts.

### Current Implementation Evidence

- `functions/src/reviews.ts`
  - `createReview` requires active signed-in user.
  - `createReview` rejects duplicate customer/provider reviews.
  - `createReview` requires an unused contact record for that customer/provider.
  - `createReview` only allows approved providers.
  - `createReview` marks the contact as reviewed.
  - Direct aggregate update happens in the transaction.
- `firestore.rules`
  - Direct review creation is denied.
  - Direct contact creation is denied.
  - Users cannot update protected ban fields on their own user doc.
- `src/services/firebase/reviews.firebase.ts`
  - Firebase review creation uses the callable.
  - Public review reads filter `status == visible`.
- `src/lib/ranking.ts`
  - Ranking uses service-area match, rating, review count, activity score, paid bonus, and profile-view fairness.
- `functions/src/abuse.ts`
  - `isPotentialLeadSpam` helper exists for reveals/messages per hour.
- `src/services/reviews.service.test.ts`
  - Demo tests prove one review after contact and rate-limited review reporting.
- `functions/test/reviews.test.ts`
  - Unit tests prove removed reviews are excluded from aggregates and banned users/admins are rejected by helper functions.
- `tests/rules/firestore.rules.test.ts`
  - Rules tests prove direct review creation and contact mutation are denied.

### Remaining Gaps

- `isPotentialLeadSpam` is not integrated into callables, admin reports, or penalties.
- There is no `abuseSignals` or `trustSignals` collection.
- There is no signal for multiple reviews from related accounts.
- There is no signal for many accounts reviewing the same provider in a short window.
- There is no signal for artificial profile views or contact bursts.
- There is no IP/device/fingerprint model, which may be acceptable for privacy but should be documented.
- Location spoofing is not addressed because current search/contact model uses selected neighborhoods, not verified service addresses.
- Duplicate account detection does not exist beyond auth email uniqueness.
- Review creation has no explicit daily rate cap, even though fake-review prevention exists through contact gating.

### Work Items

#### 11.3.1 Add an abuse signal model

Files:

- `src/types/admin.ts`
- `src/firebase/converters.ts`
- `firestore.rules`
- `functions/src/abuse.ts`
- `functions/src/index.ts`

Model:

```ts
export interface AbuseSignal {
  id: string;
  signalType:
    | 'review_burst'
    | 'duplicate_review_pattern'
    | 'lead_spam'
    | 'activity_spike'
    | 'location_mismatch'
    | 'linked_account_suspected';
  targetType: 'provider' | 'review' | 'user' | 'conversation';
  targetId: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'closed';
  summary: string;
  evidence: Record<string, unknown>;
  createdAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionReason: string | null;
}
```

Rules:

- Admins can read abuse signals.
- Clients cannot create/update/delete abuse signals.
- Cloud Functions or trusted admin scripts create signals.

Acceptance:

- Detection can feed admin review without immediately punishing users.

#### 11.3.2 Integrate lead spam detection

Files:

- `functions/src/abuse.ts`
- `functions/src/engagement.ts`
- `functions/test/engagement.test.ts`

Changes:

- Count recent WhatsApp reveals and message starts.
- Use `isPotentialLeadSpam` thresholds or replace it with named constants.
- Create a `lead_spam` abuse signal when thresholds are crossed.
- Keep current hard daily limits for clear enforcement.

Acceptance:

- Lead-spam signals appear before or at enforcement thresholds.
- Admins can investigate high-volume contact behavior.

#### 11.3.3 Add review manipulation signals

Files:

- `functions/src/reviews.ts`
- `functions/src/abuse.ts`
- `functions/test/reviews.test.ts`

Signals:

- Many reviews for one provider in a short period.
- Many reviews with identical or near-identical comments.
- Review from a customer who contacted the provider only seconds before submitting.
- Many reviews from accounts created recently.
- Review from a user linked to provider account by phone/email if data model exposes it safely.

Acceptance:

- Suspicious reviews remain visible or become `under_review` based on product choice.
- Admin queue shows enough evidence to take action.

#### 11.3.4 Add artificial activity signal checks

Files:

- `src/services/firebase/providers.firebase.ts`
- `functions/src/engagement.ts`
- `functions/src/abuse.ts`
- `src/lib/ranking.ts`

Changes:

- Stop direct client profile-view increments from being the only activity input.
- Move profile view counting to a callable if profile views continue to affect ranking.
- Deduplicate profile views server-side by signed-in user/provider/day where practical.
- Exclude suspicious activity from `activityScore`.

Acceptance:

- Ranking cannot be meaningfully boosted by repeated client-side profile view updates.

#### 11.3.5 Define location spoofing scope

Files:

- Product decision note or SRS clarification.
- `src/types/provider.ts`
- `src/features/dashboard/pages/provider-dashboard-page.tsx`
- admin provider review UI.

Recommended v1 behavior:

- Treat location spoofing as false service-area claims.
- Require service-area expansion requests for new areas when paid expansion is involved.
- Let admins remove or penalize false areas.
- Defer GPS/address verification until Herafy has job/order address workflows.

Acceptance:

- The product has a clear v1 interpretation of `SAFETY-009`.

#### 11.3.6 Add duplicate or linked-account support

Files:

- `functions/src/abuse.ts`
- `src/types/admin.ts`
- `src/services/firebase/auth.firebase.ts`
- admin UI.

Signals:

- Same phone across multiple app users.
- Same provider WhatsApp number across multiple provider profiles.
- Same identity document metadata reused, if safe and allowed.
- Same email domain patterns should not be enough alone.

Acceptance:

- Duplicate account suspicion is visible to admins.
- No account is automatically banned from weak duplicate signals.

### Tests for 11.3

Run:

```bash
cd functions && npm test -- reviews.test.ts
cd functions && npm test -- engagement.test.ts
npm test -- src/lib/ranking.test.ts src/services/reviews.service.test.ts src/services/providers.service.test.ts
npm run test:rules
```

Expected:

- Fake-review gates still pass.
- Abuse signal creation tests pass.
- Ranking excludes or penalizes suspicious activity according to product decision.

## 11.4 Penalties

### Requirements Covered

- `SAFETY-011`: Admins MUST be able to apply account suspension or removal.
- `SAFETY-012`: The system SHOULD support ranking penalties for abuse.
- `SAFETY-013`: The system SHOULD support loss of paid benefits after abuse.

### Current Implementation Evidence

- `functions/src/providers.ts`
  - `suspendProvider` requires active admin.
  - `suspendProvider` sets `status: suspended` and `suspensionReason`.
  - `suspendProvider` writes an admin action.
- `src/features/admin/pages/providers-page.tsx`
  - Admins can suspend providers.
  - Admins can ban and unban provider accounts.
- `src/services/firebase/admin.firebase.ts`
  - `suspendProvider` uses callable.
  - `setUserBanned` directly updates user `status`, `banReason`, `bannedAt`, and `bannedBy`.
  - Ban/unban writes admin actions through direct client write.
- `src/services/admin.service.test.ts`
  - Demo tests cover provider account ban/unban and audit entries.
  - Demo tests cover audit coverage for suspend, hide review, ban, and unban.
- `src/services/firebase/search.firebase.ts`
  - Search filters to approved providers.
- `src/services/firebase/providers.firebase.ts`
  - Public profile reads return only approved providers.
- `firestore.rules`
  - Banned users cannot perform protected own-user updates.
  - Active-user checks block banned users from conversations, messages, reports through rules or callables.
  - Direct provider delete is denied.
- `src/lib/ranking.ts`
  - Paid visibility adds a ranking bonus when active.

### Remaining Gaps

- There is no provider removal path.
- There is no explicit product decision that removal is out of scope for v1.
- Account ban is direct client Firestore update rather than callable.
- Ranking has no trust penalty field.
- Paid visibility still appears active unless provider status prevents public visibility or ranking code ignores it indirectly.
- No automatic paid-benefit hold is applied on suspension or severe abuse.
- Penalty actions do not have expiry.
- Rules do not protect proposed penalty fields because they do not exist yet.
- Admin UI does not distinguish temporary penalty, suspension, ban, and removal.

### Work Items

#### 11.4.1 Define the v1 penalty ladder

Files:

- `docs/operations/admin-runbook.md`
- Product decision note or SRS clarification.
- locale files.

Recommended ladder:

1. Resolve report without action.
2. Hide review.
3. Apply temporary ranking penalty.
4. Apply paid-visibility hold.
5. Suspend provider listing.
6. Ban account.
7. Remove account/listing only if product/legal confirms hard deletion requirements.

Acceptance:

- Admins know which action to use and what customer/provider-visible effect it has.

#### 11.4.2 Add server-owned penalty fields

Files:

- `src/types/provider.ts`
- `src/firebase/converters.ts`
- `src/services/demo/seed-data.ts`
- `firestore.rules`
- `functions/src/providers.ts`

Fields:

- `trustPenaltyScore`
- `trustPenaltyReason`
- `trustPenaltyUntil`
- `visibilitySuspendedUntil`
- `visibilitySuspensionReason`

Rules:

- Provider owners cannot write these fields.
- Admin direct writes should be denied if the mutation moves to callables, or tightly constrained if direct admin writes remain accepted.

Acceptance:

- Penalty state is explicit, typed, and protected.

#### 11.4.3 Add penalty callables

Files:

- `functions/src/providers.ts` or `functions/src/penalties.ts`
- `functions/src/index.ts`
- `functions/test/providers.test.ts`

Callables:

- `applyProviderPenalty`
- `clearProviderPenalty`
- `suspendPaidVisibility`
- `restorePaidVisibility`
- `banUser`
- `unbanUser`

Behavior:

- Require active admin.
- Validate reason.
- Validate target exists.
- Write provider/user updates and admin action atomically.
- Optionally close a linked report.

Acceptance:

- Penalty actions are server-owned, audited, and testable.

#### 11.4.4 Apply penalties in ranking and search

Files:

- `src/lib/ranking.ts`
- `src/services/firebase/search.firebase.ts`
- `src/services/demo/search.demo.ts`
- `src/lib/ranking.test.ts`
- `src/services/search.service.test.ts`

Changes:

- Subtract `trustPenaltyScore` while penalty is active.
- Ignore paid bonus while `visibilitySuspendedUntil` is active.
- Exclude suspended providers from public search.
- Preserve paid history but remove ranking benefit during active hold.

Acceptance:

- Penalized providers rank lower.
- Paid benefit loss is visible in ranking behavior.
- Suspended providers do not appear publicly.

#### 11.4.5 Add admin UI for penalties

Files:

- `src/features/admin/pages/providers-page.tsx`
- `src/features/admin/pages/reports-page.tsx`
- `src/hooks/use-admin-actions.ts`
- `src/services/admin.service.ts`
- locale files.

Changes:

- Add actions for temporary ranking penalty and paid-visibility hold.
- Require an admin-entered reason.
- Show active penalty reason/expiry on provider rows.
- Show pending report context when applying a penalty from a report.

Acceptance:

- Admins can apply and clear penalties without manual Firestore edits.

#### 11.4.6 Decide and implement account removal policy

Files:

- Product decision note.
- `firestore.rules`
- Cloud Functions if removal is supported.

Recommended v1 decision:

- Account removal is not self-service in v1.
- Admin “removal” means permanent ban plus provider suspension unless legal deletion is required.
- True deletion/anonymization is a separate privacy/data-retention epic.

Acceptance:

- `SAFETY-011` is either satisfied with a removal path or explicitly scoped as suspension/ban for v1.

### Tests for 11.4

Run:

```bash
npm test -- src/lib/ranking.test.ts src/services/search.service.test.ts src/services/admin.service.test.ts
npm run test:rules
cd functions && npm test -- providers.test.ts
npm run e2e -- tests/e2e/app.spec.ts
```

Expected:

- Provider suspension, account ban, ranking penalty, paid-benefit hold, and admin audit paths pass.

## 11.5 Rate Limiting

### Requirements Covered

- `SAFETY-014`: The system MUST apply basic rate limits to sensitive actions.
- `SAFETY-015`: Rate-limited actions SHOULD include contact, messaging, reporting, and review submission.
- `SAFETY-016`: Rate limit failures MUST be handled with clear user feedback.

### Current Implementation Evidence

- `functions/src/engagement.ts`
  - `limits` sets daily caps for WhatsApp reveals, conversation starts, and reports.
  - `revealWhatsApp` limits new WhatsApp reveals per customer over the last day.
  - Repeated reveal for the same customer/provider does not create another contact or consume a new unique contact path.
  - `startConversation` limits new conversation starts per customer over the last day.
  - Existing conversations can receive follow-up messages through `startConversation` without the new-conversation cap.
  - `assertDailyReportLimit` limits reports per reporter over the last day.
  - Rate-limit failure uses `HttpsError('resource-exhausted', 'error.rateLimit.exceeded')`.
- `src/lib/rate-limits.ts`
  - Demo-side daily limits exist for reports, WhatsApp reveals, and conversation starts.
- `src/services/providers.service.test.ts`
  - Demo tests cover WhatsApp reveal limit.
  - Demo tests cover conversation start limit.
  - Demo tests cover provider report and message report limits.
- `src/services/reviews.service.test.ts`
  - Demo tests cover review report limits.
- `firestore.rules`
  - Direct contact creation is denied.
  - Direct report creation is denied.
  - Direct review creation is denied.
  - Conversation creation is denied.
  - Message creation is allowed for participants, which bypasses callable-level message-send rate limits.
- `src/services/firebase/messaging.firebase.ts`
  - `startConversation` uses a callable.
  - `sendMessage` writes direct Firestore transaction.
- `src/features/providers/pages/provider-profile-page.tsx`
  - Contact actions redirect unauthenticated users to login.
  - No visible try/catch feedback for rate-limit failures is evident.
- `src/features/messaging/pages/conversation-page.tsx`
  - Message send mutation does not show explicit rate-limit or failure UI.

### Remaining Gaps

- Message sends after the first conversation are not callable-owned and not rate-limited.
- Review submission has no explicit daily rate limit beyond contact gating and duplicate prevention.
- Profile view increments are client-side and can affect activity/ranking indirectly.
- Rate-limit constants are duplicated between demo and functions instead of shared or clearly synchronized.
- UI feedback for rate-limit failures is uneven.
- There are no functions tests for rate-limit behavior.
- Rate limits are query-based, not counter-based, which may become expensive at scale.

### Work Items

#### 11.5.1 Centralize rate-limit definitions

Files:

- `src/lib/rate-limits.ts`
- `functions/src/rateLimits.ts`
- `functions/src/engagement.ts`
- `functions/src/reviews.ts`
- demo services.

Changes:

- Define named limits for:
  - WhatsApp reveals per user per day.
  - New conversation starts per user per day.
  - Message sends per user per hour/day.
  - Reports per user per day.
  - Review submissions per user per day.
  - Profile view events per user/provider/day if server-owned.
- Keep demo and functions values aligned.

Acceptance:

- Rate limit values have one documented source per runtime.

#### 11.5.2 Move message sending to a callable

Files:

- `functions/src/engagement.ts` or new `functions/src/messaging.ts`
- `functions/src/index.ts`
- `src/services/firebase/messaging.firebase.ts`
- `firestore.rules`
- `functions/test/engagement.test.ts`

Changes:

- Add `sendMessage` callable.
- Require active signed-in participant.
- Validate text length.
- Rate-limit sends.
- Write message and conversation unread state in a transaction.
- Update client service to call the function.
- Change rules so client direct message create is denied or only used for emulator/testing if explicitly accepted.

Acceptance:

- Follow-up message sends are rate-limited and server-owned.

#### 11.5.3 Add review submission rate limit

Files:

- `functions/src/reviews.ts`
- `functions/test/reviews.test.ts`

Changes:

- Add daily review submission cap per customer.
- Keep contact-gated and one-review-per-provider checks.
- Return `resource-exhausted` with `error.rateLimit.exceeded`.

Acceptance:

- Review submission is explicitly covered by `SAFETY-015`.

#### 11.5.4 Add user-visible rate-limit feedback

Files:

- `src/features/providers/pages/provider-profile-page.tsx`
- `src/features/messaging/pages/conversation-page.tsx`
- `src/features/reviews/pages/new-review-page.tsx`
- locale files.

Changes:

- Catch mutation/callable errors.
- Map `resource-exhausted` and `error.rateLimit.exceeded` to localized copy.
- Disable buttons while pending.
- Keep entered message/review text after failure.

Acceptance:

- Contact, message, report, and review rate-limit failures are understandable and recoverable.

#### 11.5.5 Add functions rate-limit tests

Files:

- `functions/test/engagement.test.ts`
- `functions/test/reviews.test.ts`

Cases:

- WhatsApp reveal limit blocks new providers after cap.
- Repeated reveal for same provider is allowed or idempotent.
- New conversation start limit blocks new provider threads after cap.
- Existing conversation follow-up uses message limit, not new-conversation limit.
- Message-send limit blocks high-volume sends.
- Report limit blocks provider/review/message reports after cap.
- Review submission limit blocks after cap.
- Banned user gets permission denied before consuming rate limit.

Acceptance:

- Sensitive action limits are proven in server tests.

### Tests for 11.5

Run:

```bash
npm test -- src/services/providers.service.test.ts src/services/reviews.service.test.ts
cd functions && npm test
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
```

Expected:

- Server, demo, rules, and UI smoke prove limits and feedback paths.

## Cross-Cutting Implementation Order

1. Lock product decisions for dispute scope, penalty ladder, paid-benefit loss, and removal policy.
2. Add callable integration tests for existing implemented paths before changing behavior.
3. Move direct admin moderation writes to callables where needed.
4. Add penalty fields and protect them in rules.
5. Apply penalties in ranking/search and paid visibility.
6. Add abuse signal model and deterministic signal writers.
7. Move follow-up message sends to a callable.
8. Add review submission rate limit.
9. Add user/admin feedback states.
10. Run rules, functions, unit, build, and e2e verification.

## Verification Commands

Use targeted commands while implementing:

```bash
npm test -- src/services/admin.service.test.ts
npm test -- src/services/providers.service.test.ts
npm test -- src/services/reviews.service.test.ts
npm test -- src/lib/ranking.test.ts
npm run test:rules
cd functions && npm test
npm run lint
npm run build
npm run e2e -- tests/e2e/app.spec.ts
```

Use full release verification before marking Section 11 complete:

```bash
npm run release:check
```

## Effort Estimate

| Workstream | Estimate | Notes |
|---|---:|---|
| Product decisions and runbook updates | 0.5-1 day | Mostly scope decisions and admin policy language. |
| Existing-path callable/rules test coverage | 1-2 days | Approval, reports, hide review, rate limits, banned-user matrix. |
| Report resolution and ban/unban callables | 1-2 days | Moves direct admin writes to server-owned path. |
| Penalty model and ranking/paid visibility integration | 2-3 days | Requires types, seed data, rules, UI, ranking tests. |
| Abuse signal model and deterministic signal writers | 2-4 days | Scope can grow. Keep signals admin-reviewable. |
| Message-send callable and review rate limits | 1-2 days | Requires client adapter and rules changes. |
| UI feedback and admin queue polish | 1-2 days | Report filters, pending states, localized failures. |
| Final verification and e2e smoke | 0.5-1 day | Depends on emulator and Playwright stability. |

Total: **9-17 engineering days**, depending on whether abuse signals stay deterministic and v1 dispute scope stays inside reports.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| False-positive abuse signals punish legitimate providers. | High | Signals should feed admin review; do not auto-ban from weak signals. |
| Direct admin Firestore writes bypass server audit consistency. | Medium | Move report resolution, ban/unban, and penalty actions to callables. |
| Rate limits frustrate legitimate heavy users. | Medium | Use clear copy, conservative limits, and admin override paths only if needed. |
| Paid-benefit removal creates commercial disputes. | Medium | Preserve payment history and document refund/credit policy outside ranking code. |
| Location spoofing is underdefined. | Medium | Scope v1 to false service-area claims and admin enforcement. |
| Query-based rate limits become expensive. | Low for MVP, higher later | Add counter docs when traffic grows. |
| Security rules allow broad admin writes. | Medium | Prefer callables for moderation mutations and narrow direct writes over time. |

## Definition of Done

Section 11 is done when:

- All product decisions above are either accepted or replaced with documented alternatives.
- Manual provider verification has callable integration coverage.
- Public provider state never exposes pending/rejected/suspended providers.
- Report creation from provider, review, and message surfaces works and has user feedback.
- Report resolution and review hiding are server-owned or explicitly accepted as admin-client trusted paths.
- Resolution metadata is always stored.
- V1 dispute scope is documented.
- Fake-review defenses are callable-owned and tested.
- Abuse signal support exists for coordinated reviews, artificial activity, location mismatch, and linked-account suspicion, or each unsupported signal has an explicit v1 deferral.
- Admins can apply suspension/ban and at least one lower-severity ranking or paid-benefit penalty.
- Ranking and paid visibility honor active penalties.
- Sensitive action rate limits cover contact, messaging, reporting, and reviews.
- Rate-limit failures show localized user-readable feedback.
- Firestore and Storage rules deny direct bypasses.
- Functions, unit, rules, lint, build, and e2e verification pass or any non-pass has a documented blocker.

## Open Questions

1. Should v1 treat disputes as abuse report reasons, or should a separate `disputes` collection exist now?
2. Should provider/account removal be a real delete/anonymization workflow, or is suspension plus ban the v1 answer?
3. Should ranking penalties expire automatically after a set duration, or remain until admin clears them?
4. Should paid-benefit holds set `visibilityTier: organic`, or should ranking simply ignore paid bonus while the hold is active?
5. What exact rate limits should Herafy use for message sends and review submissions?
6. Should abuse signals ever auto-hide content, or only create admin-reviewable flags?
7. What data can Herafy collect for duplicate-account detection without overreaching on privacy?
