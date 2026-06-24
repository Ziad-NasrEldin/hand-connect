# Section 11 Trust, Safety & Abuse Prevention Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-11-trust-safety-abuse.md`

Scope: complete SRS section 11 so trust, safety, abuse reporting, moderation, manipulation detection, penalties, and rate limits are fully implemented across UI, Firebase services, Cloud Functions, Firestore/Storage rules, admin workflows, and tests.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but gaps or tests remain.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Partially done | Product/Engineering | V1 dispute/review-challenge scope, paid-benefit expiry/loss direction, and banned-hidden policy are decided; penalty ladder, removal policy, and manipulation enforcement scope remain open. |
| Manual verification | Partially done | Engineering | Core identity review and approval flow exists; callable transaction tests and explicit public verification UX need completion. |
| Abuse reports and disputes | Partially done | Engineering/Product | Report creation/resolution exists; review challenges use reports/admin handling in v1; report resolution callable and better admin triage remain. |
| Manipulation detection | Partially done | Engineering | Contact-gated reviews exist; abuse signal model and coordinated/artificial/location/linked-account detection remain. |
| Penalties | Partially done | Engineering/Product | Suspension, ban/unban, hide review exist; banned profiles must be hidden publicly; ranking penalties, paid-benefit hold/expiry enforcement, removal policy, and callable ban path remain. |
| Rate limiting | Partially done | Engineering | Contact starts and reports have limits; message sends, review submissions, shared definitions, and UI feedback remain. |
| Rules and server authority | Partially done | Engineering | Many direct bypasses denied; direct admin writes and direct message sends remain to be moved or explicitly accepted. |
| Verification | Not started | Engineering | Run targeted unit, functions, rules, lint, build, and e2e commands. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| SAFETY-PD-001 | Decide whether v1 disputes are handled as abuse reports. | Done | Review challenges use report review/provider/message flows and admin review; no separate dispute system unless code exists. |
| SAFETY-PD-002 | Add v1 dispute scope note to product/admin docs. | Done | SRS documents review challenges as report/admin handling flows; payment/order disputes remain out of scope because booking/payment does not exist. |
| SAFETY-PD-003 | Decide penalty ladder. | Not started | Recommended: resolve, hide review, ranking penalty, paid hold, suspend provider, ban account, removal only if confirmed. |
| SAFETY-PD-004 | Decide account/listing removal policy. | Not started | Recommended: v1 removal means suspension plus ban; true deletion/anonymization is separate privacy epic. |
| SAFETY-PD-005 | Decide paid-benefit loss behavior after abuse. | Done | Banned or suspended profiles are not publicly visible, so paid benefits are not surfaced; paid history must be preserved. |
| SAFETY-PD-006 | Decide whether ranking penalties expire. | Not started | Recommended: support optional expiry and admin clear action. |
| SAFETY-PD-007 | Decide manipulation detection action policy. | Not started | Recommended: deterministic signals create admin review items; no automatic punishment from weak signals. |
| SAFETY-PD-008 | Decide location spoofing v1 meaning. | Not started | Recommended: false service-area claims, not GPS/address verification. |
| SAFETY-PD-009 | Decide duplicate-account detection data boundaries. | Not started | Use phone/WhatsApp/identity metadata only if privacy policy permits. |
| SAFETY-PD-010 | Decide exact message and review rate limits. | Not started | Must cover `SAFETY-015`. |

## 11.1 Manual Verification Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SAFETY-11.1-001 | Keep provider registration identity upload requirement. | Partially done | `register-page.tsx`, `auth.firebase.ts`, demo auth service | Provider registration cannot create pending provider without identity evidence. |
| SAFETY-11.1-002 | Keep pending provider default state. | Done | Auth services, provider types, seed data | New providers start as `pending`, not `approved`. |
| SAFETY-11.1-003 | Keep admin application identity review UI. | Done | `src/features/admin/pages/applications-page.tsx` | Admin can see identity document metadata and preview/download path. |
| SAFETY-11.1-004 | Keep approval callable identity-document precondition. | Partially done | `functions/src/providers.ts` | Callable checks `providerIdentityDocuments/{providerId}` before approval; needs integration tests. |
| SAFETY-11.1-005 | Add callable test: approve succeeds with identity document. | Not started | `functions/test/providers.test.ts` | Pending provider with identity doc becomes approved and verified. |
| SAFETY-11.1-006 | Add callable test: approve fails without identity document. | Not started | `functions/test/providers.test.ts` | Callable throws failed precondition and provider remains pending. |
| SAFETY-11.1-007 | Add callable test: non-admin/banned admin cannot approve. | Not started | `functions/test/providers.test.ts` | Unauthorized approval attempts fail. |
| SAFETY-11.1-008 | Keep provider owner blocked from verification/status writes. | Done | `firestore.rules`, `tests/rules/firestore.rules.test.ts` | Owner cannot set `status`, `nationalIdVerified`, or `visibilityTier`. |
| SAFETY-11.1-009 | Keep public reads approved-only. | Done | `providers.firebase.ts`, `firestore.rules`, rules tests | Pending/rejected/suspended providers are hidden from public search/profile. |
| SAFETY-11.1-010 | Keep identity documents private. | Done | `storage.rules`, `tests/rules/storage.rules.test.ts` | Only owner/admin can read identity documents. |
| SAFETY-11.1-011 | Add identity file type/size validation test. | Not started | Registration UI/service, storage tests | Unsupported or oversized identity file is rejected. |
| SAFETY-11.1-012 | Show public approved/verified state without exposing private data. | Not started | Provider profile/search UI, locale files | Approved verified providers have clear trust state; pending providers remain hidden. |
| SAFETY-11.1-013 | Add e2e smoke for provider join and admin identity review. | Not started | `tests/e2e/app.spec.ts` | Browser flow proves join, pending state, admin approval, public visibility. |

## 11.2 Abuse and Disputes Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SAFETY-11.2-001 | Keep provider report entry point. | Done | `provider-profile-page.tsx`, provider service | Signed-in user can report provider. |
| SAFETY-11.2-002 | Keep review report entry point. | Done | `provider-profile-page.tsx`, reviews service | Signed-in user can report visible review. |
| SAFETY-11.2-003 | Keep message report entry point. | Done | `conversation-page.tsx`, messaging service | Signed-in participant can report received message. |
| SAFETY-11.2-004 | Keep report callables active-user guarded. | Partially done | `functions/src/engagement.ts` | Callables require auth and reject banned users; needs functions tests. |
| SAFETY-11.2-005 | Keep direct report creation denied. | Done | `firestore.rules`, `tests/rules/firestore.rules.test.ts` | Client cannot create reports directly. |
| SAFETY-11.2-006 | Keep admin reports list. | Done | `reports-page.tsx`, `admin.firebase.ts` | Admin can view report target context and status. |
| SAFETY-11.2-007 | Keep report resolution metadata. | Partially done | `admin.firebase.ts`, demo admin service | Resolution stores resolver, timestamp, reason; Firebase path is direct client write. |
| SAFETY-11.2-008 | Move report resolution to callable. | Not started | Functions, `admin.firebase.ts`, functions tests | Active admin resolves report server-side with audit entry in transaction. |
| SAFETY-11.2-009 | Keep review hide callable and report closure. | Partially done | `functions/src/reviews.ts`, `reports-page.tsx` | Hide review removes review, closes linked report, writes admin action; needs integration tests. |
| SAFETY-11.2-010 | Add report callable tests for provider reports. | Not started | `functions/test/engagement.test.ts` | Auth, banned user, missing provider, success, and rate limit cases pass. |
| SAFETY-11.2-011 | Add report callable tests for review reports. | Not started | Functions tests | Only visible reviews can be reported. |
| SAFETY-11.2-012 | Add report callable tests for message reports. | Not started | Functions tests | Only conversation participant can report message. |
| SAFETY-11.2-013 | Add user-visible report success state. | Done | Provider profile, conversation page, i18n, component tests | Provider, review, and conversation report success feedback are visible. |
| SAFETY-11.2-014 | Add user-visible report failure state. | Done | Provider profile, conversation page, i18n, component tests | Provider, review, and conversation report failures are localized, including rate limits. |
| SAFETY-11.2-015 | Add admin report filters. | Not started | `reports-page.tsx` | Admin can filter by open/closed and target type. |
| SAFETY-11.2-016 | Add custom admin resolution reason input. | Not started | `reports-page.tsx`, hooks, service | Admin enters specific resolution reason. |
| SAFETY-11.2-017 | Document v1 dispute scope. | Done | Product/admin docs | SRS clarifies that review challenges use report/admin handling, not a separate dispute object. |
| SAFETY-11.2-018 | Add dispute-oriented report reasons. | Done | Locale files, report UI | Existing report reasons include admin-context review/dispute language and report entry points for provider/review/message. |

## 11.3 Manipulation Detection Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SAFETY-11.3-001 | Keep contact-gated review creation. | Partially done | `functions/src/reviews.ts`, review services | Callable requires unused contact; needs integration tests. |
| SAFETY-11.3-002 | Keep one review per customer/provider. | Partially done | `functions/src/reviews.ts`, review tests | Callable rejects duplicate; demo test exists; functions test needed. |
| SAFETY-11.3-003 | Keep direct review creation denied. | Done | `firestore.rules`, rules tests | Client cannot create reviews directly. |
| SAFETY-11.3-004 | Keep removed reviews excluded from aggregate. | Done | `functions/src/reviews.ts`, `functions/test/reviews.test.ts` | Removed reviews do not affect rating/review count. |
| SAFETY-11.3-005 | Define `AbuseSignal` type. | Not started | `src/types/admin.ts` or new type file | Signal model supports type, target, severity, evidence, status, and resolution metadata. |
| SAFETY-11.3-006 | Add abuse signal converter. | Not started | `src/firebase/converters.ts` | Firestore converter handles signal timestamps. |
| SAFETY-11.3-007 | Add abuse signal rules. | Not started | `firestore.rules`, rules tests | Admin can read; clients cannot create/update/delete. |
| SAFETY-11.3-008 | Add admin abuse signal list. | Not started | Admin UI, hooks, service | Admin can view open manipulation signals. |
| SAFETY-11.3-009 | Integrate lead-spam helper. | Not started | `functions/src/abuse.ts`, `engagement.ts` | High reveals/messages create `lead_spam` signal. |
| SAFETY-11.3-010 | Add review burst signal. | Not started | `functions/src/reviews.ts`, `abuse.ts` | Many reviews for one provider in short window create signal. |
| SAFETY-11.3-011 | Add duplicate-comment review signal. | Not started | Review callable/helper | Repeated identical or near-identical comments create signal. |
| SAFETY-11.3-012 | Add fresh-account review signal. | Not started | Review callable/helper | New account reviewing suspiciously fast creates signal. |
| SAFETY-11.3-013 | Move profile-view activity to server-owned or remove from ranking. | Not started | Providers service, functions, ranking | Client-side repeated views cannot inflate ranking. |
| SAFETY-11.3-014 | Add artificial activity signal. | Not started | Engagement/abuse functions | Burst profile/contact activity creates signal. |
| SAFETY-11.3-015 | Define location-spoofing v1 implementation. | Blocked | Product docs, provider/admin UI | Requires `SAFETY-PD-008`. |
| SAFETY-11.3-016 | Add false service-area claim handling. | Not started | Admin provider UI, penalties | Admin can flag or penalize false service area claims. |
| SAFETY-11.3-017 | Add linked-account signals. | Not started | Auth/provider registration, abuse helper | Shared phone/WhatsApp/identity metadata can create admin-reviewable signal. |
| SAFETY-11.3-018 | Add abuse signal functions tests. | Not started | Functions tests | Each deterministic signal has at least one positive and negative case. |

## 11.4 Penalties Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SAFETY-11.4-001 | Keep provider suspension callable. | Partially done | `functions/src/providers.ts`, admin UI | Admin can suspend provider; needs callable integration tests. |
| SAFETY-11.4-002 | Keep account ban/unban UI. | Partially done | `providers-page.tsx`, admin service | Admin can ban/unban; Firebase path is direct client write. |
| SAFETY-11.4-003 | Move ban/unban to callable. | Not started | Functions, admin Firebase adapter, tests | Active admin can ban/unban server-side with audit. |
| SAFETY-11.4-004 | Add suspension callable tests. | Not started | `functions/test/providers.test.ts` | Non-admin/banned admin fail; admin succeeds; audit written. |
| SAFETY-11.4-005 | Add ban/unban callable tests. | Not started | Functions tests | Active admin updates user status and writes audit. |
| SAFETY-11.4-006 | Define penalty fields on provider type. | Not started | `src/types/provider.ts` | Provider includes trust penalty and paid-visibility hold fields. |
| SAFETY-11.4-007 | Seed penalty defaults. | Not started | `seed-data.ts`, Firebase converters | Existing providers have null/zero safe defaults. |
| SAFETY-11.4-008 | Protect penalty fields in rules. | Not started | `firestore.rules`, rules tests | Provider owners cannot write penalty fields. |
| SAFETY-11.4-009 | Add apply/clear ranking penalty callables. | Not started | Functions, admin service | Admin can apply/clear penalty with reason and optional expiry. |
| SAFETY-11.4-010 | Apply ranking penalty in ranking score. | Not started | `src/lib/ranking.ts`, ranking tests | Active penalty lowers score predictably. |
| SAFETY-11.4-011 | Add paid-benefit hold or expiry callables. | Not started | Functions, admin service | Admin can suspend/restore paid visibility benefit with audit, and automatic expiry can clear paid benefit. |
| SAFETY-11.4-012 | Apply paid-benefit hold/expiry in ranking. | Not started | `ranking.ts`, search tests | Paid benefit ignored while hold is active or paid period is expired/past due. |
| SAFETY-11.4-013 | Add admin UI for ranking penalty. | Not started | `providers-page.tsx`, `reports-page.tsx` | Admin can apply/clear penalty with reason. |
| SAFETY-11.4-014 | Add admin UI for paid-benefit hold. | Not started | Admin pages, hooks, locale files | Admin can hold/restore paid benefit. |
| SAFETY-11.4-015 | Document provider removal policy. | Blocked | Product/admin docs | Requires `SAFETY-PD-004`. |
| SAFETY-11.4-016 | Implement removal path or explicit v1 non-removal scope. | Blocked | Functions/rules/docs | Either real removal exists or suspension+ban is documented as v1 answer. |
| SAFETY-11.4-017 | Add e2e/admin smoke for penalties. | Not started | `tests/e2e/app.spec.ts` | Admin penalty changes public search/ranking behavior. |

## 11.5 Rate Limiting Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SAFETY-11.5-001 | Keep WhatsApp reveal daily cap. | Partially done | `functions/src/engagement.ts`, demo tests | Server code exists; functions test needed. |
| SAFETY-11.5-002 | Keep conversation start daily cap. | Partially done | `functions/src/engagement.ts`, demo tests | Server code exists; functions test needed. |
| SAFETY-11.5-003 | Keep report daily cap. | Partially done | `functions/src/engagement.ts`, demo tests | Server code exists; functions test needed. |
| SAFETY-11.5-004 | Centralize rate-limit definitions. | Not started | `src/lib/rate-limits.ts`, functions helper | Demo and functions limits are aligned and documented. |
| SAFETY-11.5-005 | Add message-send callable. | Done | `functions/src/engagement.ts`, `functions/src/index.ts`, `messaging.firebase.ts` | Follow-up message sends go through callable; demo mode still uses local adapter. |
| SAFETY-11.5-006 | Add message-send rate limit. | Done | `functions/src/engagement.ts`, `functions/test/engagement.test.ts` | High-volume sends return `resource-exhausted` through the existing spam threshold helper. |
| SAFETY-11.5-007 | Deny direct message creation or document accepted exception. | Done | `firestore.rules`, `firestore.rules.test.ts` | Direct client messages cannot bypass rate limit; read-state updates remain allowed. |
| SAFETY-11.5-008 | Add review submission rate limit. | Done | `functions/src/reviews.ts`, `src/lib/rate-limits.ts`, `src/services/demo/reviews.demo.ts` | Review callable and demo adapter have daily cap in addition to contact gate. |
| SAFETY-11.5-009 | Add WhatsApp reveal functions tests. | Not started | Functions tests | New reveal cap and repeated reveal idempotence pass. |
| SAFETY-11.5-010 | Add conversation start functions tests. | Not started | Functions tests | New thread cap and existing thread behavior pass. |
| SAFETY-11.5-011 | Add message-send functions tests. | Partially done | Functions tests | Limit helper is covered; participant, non-participant, and banned-user callable integration cases remain open. |
| SAFETY-11.5-012 | Add report rate-limit functions tests. | Not started | Functions tests | Provider/review/message report caps pass. |
| SAFETY-11.5-013 | Add review rate-limit functions tests. | Done | `functions/test/reviews.test.ts` | Review cap helper returns the configured limit state. |
| SAFETY-11.5-014 | Add contact rate-limit UI feedback. | Done | Provider profile, i18n, `provider-profile-page.test.tsx` | WhatsApp/message start limit shows localized feedback through shared error-key mapping. |
| SAFETY-11.5-015 | Add message-send rate-limit UI feedback. | Done | Conversation page, i18n, `conversation-page.test.tsx` | Message text is preserved and localized error is visible. |
| SAFETY-11.5-016 | Add report rate-limit UI feedback. | Done | Provider profile, conversation page, i18n, component tests | Provider, review, and conversation report controls show localized limit failure. |
| SAFETY-11.5-017 | Add review rate-limit UI feedback. | Done | New review page, i18n, `new-review-page.test.tsx` | Review body is preserved and localized error is visible. |

## Security Rules Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| SAFETY-RULES-001 | Keep direct report creation denied. | Done | `firestore.rules` | Clients cannot write `reports` directly. |
| SAFETY-RULES-002 | Keep direct review creation denied. | Done | `firestore.rules` | Clients cannot create `reviews` directly. |
| SAFETY-RULES-003 | Keep direct contact creation denied. | Done | `firestore.rules` | Clients cannot create `contacts` directly. |
| SAFETY-RULES-004 | Keep direct provider delete denied. | Done | `firestore.rules` | Providers cannot be deleted by client writes. |
| SAFETY-RULES-005 | Keep owner blocked from protected provider fields. | Done | `firestore.rules`, rules tests | Owner cannot self-approve or self-verify. |
| SAFETY-RULES-006 | Add rules for penalty fields. | Not started | `firestore.rules`, rules tests | Owner cannot write penalty fields; admin/callable model is enforced. |
| SAFETY-RULES-007 | Add rules for abuse signals. | Not started | `firestore.rules`, rules tests | Admin read only; client writes denied. |
| SAFETY-RULES-008 | Revisit broad admin direct writes. | Not started | `firestore.rules` | Direct admin writes are either narrowed or explicitly accepted. |
| SAFETY-RULES-009 | Revisit direct message creates. | Not started | `firestore.rules`, messaging service | Direct message writes cannot bypass send rate limit. |
| SAFETY-RULES-010 | Keep identity document storage private. | Done | `storage.rules`, storage tests | Only owner/admin can read identity documents. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| SAFETY-V-001 | `npm test -- src/services/admin.service.test.ts` | Not started | Admin report, ban/unban, audit demo tests pass. |
| SAFETY-V-002 | `npm test -- src/services/providers.service.test.ts` | Done | Contact/report rate-limit demo tests pass. |
| SAFETY-V-003 | `npm test -- src/services/reviews.service.test.ts` | Done | Review gate/report demo tests pass. |
| SAFETY-V-004 | `npm test -- src/lib/ranking.test.ts` | Not started | Ranking penalty and paid-hold tests pass once added. |
| SAFETY-V-005 | `npm run test:rules` | Not started | Firestore and Storage safety rules pass under emulators. |
| SAFETY-V-006 | `cd functions && npm test` | Not started | Provider, review, engagement/report/penalty callable tests pass. |
| SAFETY-V-007 | `npm run lint` | Done | No lint failures. |
| SAFETY-V-008 | `npm run build` | Done | Production build passes. |
| SAFETY-V-009 | `npm run e2e -- tests/e2e/app.spec.ts` | Not started | Provider verification, report, admin moderation, and rate-limit smoke pass. |
| SAFETY-V-010 | `npm run release:check` | Not started | Full release verification passes before Section 11 is marked complete. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| SAFETY-DOD-001 | Provider manual identity verification is required before approval. | Partially done |
| SAFETY-DOD-002 | Approval callable has integration coverage with and without identity document. | Not started |
| SAFETY-DOD-003 | Public provider state reflects approval/verification and hides non-approved providers. | Partially done |
| SAFETY-DOD-004 | Provider, review, and message report entry points work. | Partially done |
| SAFETY-DOD-005 | Report callables have server-side tests. | Not started |
| SAFETY-DOD-006 | Admins can review and resolve reports. | Partially done |
| SAFETY-DOD-007 | Report resolution stores resolver, timestamp, and reason. | Partially done |
| SAFETY-DOD-008 | Report resolution is callable-owned or direct admin write is explicitly accepted. | Not started |
| SAFETY-DOD-009 | V1 dispute scope is documented. | Not started |
| SAFETY-DOD-010 | Fake review prevention is contact-gated, duplicate-guarded, and tested. | Partially done |
| SAFETY-DOD-011 | Coordinated review signal support exists or is explicitly deferred. | Not started |
| SAFETY-DOD-012 | Artificial activity signal support exists or is explicitly deferred. | Not started |
| SAFETY-DOD-013 | Location spoofing v1 scope is implemented or explicitly documented. | Not started |
| SAFETY-DOD-014 | Duplicate/linked-account signal support exists or is explicitly deferred. | Not started |
| SAFETY-DOD-015 | Admins can suspend providers. | Partially done |
| SAFETY-DOD-016 | Admins can ban/unban accounts through server-owned path or accepted direct admin write. | Partially done |
| SAFETY-DOD-017 | Account/listing removal policy is implemented or documented as out of v1. | Not started |
| SAFETY-DOD-018 | Ranking penalties are supported and tested. | Not started |
| SAFETY-DOD-019 | Paid benefits can be lost or held after abuse. | Not started |
| SAFETY-DOD-020 | Contact actions are rate-limited. | Partially done |
| SAFETY-DOD-021 | Messaging sends are rate-limited. | Not started |
| SAFETY-DOD-022 | Reports are rate-limited. | Partially done |
| SAFETY-DOD-023 | Review submissions are rate-limited. | Not started |
| SAFETY-DOD-024 | Rate-limit failures show clear localized user feedback. | Partially done - contact and all report surfaces show localized feedback; message-send and review-submit rate-limit UI remain open. |
| SAFETY-DOD-025 | Firestore and Storage rules deny direct safety bypasses. | Partially done |
| SAFETY-DOD-026 | Unit, functions, rules, lint, build, and e2e verification pass. | Partially done |

## Open Questions

1. Should v1 disputes be report reasons only, or should Herafy create a dedicated dispute workflow now?
2. Should account removal be true deletion/anonymization, or suspension plus ban for v1?
3. Should ranking penalties have fixed durations such as 7, 30, and 90 days?
4. Should paid visibility be downgraded by changing `visibilityTier`, or should ranking ignore paid status while a hold is active?
5. What are the exact hourly/daily limits for message sends and review submissions?
6. Should abuse signals ever auto-hide content, or should every signal require admin action?
7. What linked-account evidence is acceptable under the product privacy posture?
