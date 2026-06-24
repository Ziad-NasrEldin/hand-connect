# Section 4 Implementation Plan - Contact System

Source documents:
- SRS: `docs/product/herafy-software-requirements.md`, section 4.
- Implementation map: `docs/product/herafy-srs-implementation-map.md`, rows 4.1-4.3.

Goal: keep SRS section 4 fully implemented for Herafy v1 by proving that customers can contact eligible providers through in-app chat and WhatsApp only, that contact events are stored and deduplicated, and that no booking, scheduling, job confirmation, customer-provider payment, or fulfillment tracking flow slips into the product.

## Current Status

| SRS area | Current status | Reason |
| --- | --- | --- |
| 4.1 In-App Chat | Implemented | Provider profile can start a conversation, the `startConversation` callable creates conversations, messages, and contact events, Firestore rules block direct conversation creation, and customer/provider message views exist. |
| 4.2 WhatsApp Redirection | Implemented | Provider profile shows WhatsApp only when enabled, `revealWhatsApp` checks auth, active user, approved provider, and provider visibility, stores a `whatsapp_reveal` contact event, and returns a `wa.me` URL. |
| 4.3 Contact Boundaries | Implemented | The product exposes chat and WhatsApp contact only, and current static evidence shows no booking, scheduling, job confirmation, customer-provider payment, or fulfillment tracking implementation. |

## Product Decisions Needed Before Implementation

### Decision A - Contact Event Identity

Recommended v1 decision: **one contact event per customer/provider/channel relationship**.

The current implementation uses deterministic IDs:
- WhatsApp reveal: `${customerId}_${providerId}_whatsapp_reveal`.
- Platform message: `${customerId}_${providerId}_platform_message`.

This satisfies `CONTACT-003` because repeated contact starts do not inflate unique contact counts.

The event can still support later analytics by updating aggregate metrics from the first event and by reading subsequent messages from the conversation timeline.

Implementation implication:
- Keep deterministic contact IDs.
- Do not create a new contact event for every message or repeated WhatsApp reveal.
- Track later engagement in `conversations/{id}/messages` or a future analytics event collection, not in duplicate `contacts` docs.

### Decision B - Message Send Trust Boundary

Recommended v1 decision: **initial conversation creation remains callable-gated, while post-start message sends may stay direct Firestore writes until Section 11 rate-limit hardening moves them server-side**.

The current Section 4 requirement only requires active message views for existing conversations.

Direct client writes are guarded by Firestore participant rules, but they are not server-rate-limited.

The implementation map already tracks this gap in Section 11.5.

Implementation implication:
- Do not block Section 4 completion on server-side post-start sends.
- Add the future `sendMessage` callable to the Section 11 backlog, then update this section's regression checklist when it lands.
- Keep Section 4 tests focused on conversation start, participant access, read state, and visible message flow.

### Decision C - WhatsApp Number Validity

Recommended v1 decision: **WhatsApp reveal should only return a URL when the approved provider has a non-empty digit-bearing WhatsApp number**.

The callable currently builds `https://wa.me/${number.replace(/\D/g, '')}`.

That safely removes formatting, but malformed or empty provider data can still produce an unusable `https://wa.me/` URL.

Implementation implication:
- Add explicit digit validation before returning the URL.
- Store provider WhatsApp numbers in E.164-style format during provider registration and edit.
- Add tests for formatted Egyptian mobile numbers, empty strings, letters-only input, and hidden WhatsApp visibility.

### Decision D - Boundary Enforcement Strategy

Recommended v1 decision: **use negative tests and static scans to keep contact boundaries explicit**.

The best way to enforce `CONTACT-009` through `CONTACT-013` is to make the absence of prohibited flows testable.

Implementation implication:
- Add a product-boundary test or script that fails if route names, service names, callable exports, or visible copy introduce booking, scheduling, job confirmation, customer-provider payment, checkout, escrow, or fulfillment concepts outside explicitly allowed paid-visibility/admin contexts.
- Keep manual visibility payment language separate from customer-provider payment language.
- Keep profile copy direct about provider independence and platform non-involvement in work execution.

## Target End State

Section 4 is complete when:
1. Logged-in customers can start an in-app conversation from an approved provider profile.
2. Anonymous users cannot start chat and are redirected or prompted to log in before contact.
3. Providers that are pending, rejected, suspended, missing, or otherwise ineligible cannot be contacted by chat.
4. Starting the first conversation creates one conversation, one first message, and one `platform_message` contact event.
5. Starting the same customer/provider conversation again does not create a duplicate contact event.
6. Customers and providers can list active conversations.
7. Customers and providers can open active conversations and view ordered messages.
8. Conversation participants can send messages after a conversation exists.
9. Non-participants cannot read conversations or messages.
10. Participants can mark incoming messages read without mutating message text or sender identity.
11. Providers can enable or disable WhatsApp visibility.
12. Customers only see WhatsApp contact actions when visibility is enabled.
13. WhatsApp reveal requires login, active account status, approved provider status, and enabled visibility.
14. WhatsApp reveal creates one `whatsapp_reveal` contact event and repeated reveals do not duplicate it.
15. WhatsApp reveal returns a valid WhatsApp-compatible URL when provider data is valid.
16. Malformed or empty WhatsApp numbers fail clearly instead of returning an invalid URL.
17. The UI shows clear error states for failed chat start or WhatsApp reveal.
18. The product includes no booking, scheduling, job confirmation, customer-provider payment, or job fulfillment tracking flow.
19. Demo tests, rules tests, callable tests, e2e smoke, lint, and build all pass.

## Detailed Implementation Plan

## 4.1 In-App Chat

### Requirements Covered

- `CONTACT-001`: Logged-in customers MUST be able to start an in-app text conversation with eligible providers.
- `CONTACT-002`: The system MUST store chat initiation as a contact event.
- `CONTACT-003`: The system MUST prevent duplicate contact counts for repeated starts of the same eligible contact relationship where applicable.
- `CONTACT-004`: The system MUST support provider/customer message views for active conversations.

### Current Implementation Evidence

- `src/features/providers/pages/provider-profile-page.tsx`
- The profile page imports `startConversation` and calls it from `sendQuickMessage`.
- Anonymous users are navigated to `/login` before chat start.
- Non-customer roles return before chat start.
- Successful chat start navigates to `/messages/${conversation.id}`.
- `functions/src/engagement.ts`
- `startConversation` is exported as a callable.
- It requires auth and an active non-banned user.
- It reads `providerId` and initial `text` with trimming and length validation.
- It rejects missing or non-approved providers.
- It uses a deterministic conversation ID `${customerId}_${providerId}`.
- It applies a daily new-conversation limit only when the conversation does not already exist.
- It creates or updates the conversation in a transaction.
- It writes the first or latest message under `conversations/{conversationId}/messages`.
- It creates a deterministic `contacts/{customerId}_{providerId}_platform_message` doc only if it does not already exist.
- `src/services/firebase/messaging.firebase.ts`
- Firebase `startConversation` calls the callable instead of writing the initial conversation directly.
- `sendMessage` currently writes follow-up messages through a Firestore transaction.
- Conversation list and detail queries are filtered by `participants`.
- `src/features/messaging/pages/conversations-page.tsx`
- Users can view their conversation list.
- Empty conversation state exists.
- Unread count is shown for the active user.
- `src/features/messaging/pages/conversation-page.tsx`
- Users can view ordered messages in a conversation.
- Users can send a new message.
- Incoming messages can be reported.
- `firestore.rules`
- Direct `contacts` creation is denied.
- Direct `conversations` creation is denied.
- Conversation reads require active participant status.
- Conversation updates are limited to `lastMessage`, `lastMessageAt`, and `unreadCount`.
- Message reads require active participant status.
- Message creates require the sender to be the authenticated participant.
- Message updates are limited to marking incoming messages read.
- `src/services/providers.service.test.ts`
- Demo coverage proves platform-message contacts dedupe while allowing multiple messages.
- Demo coverage proves new conversation starts are rate-limited without blocking existing conversations.
- `tests/rules/firestore.rules.test.ts`
- Rules coverage proves direct conversation mutation is constrained and participants are protected.
- `tests/e2e/app.spec.ts`
- Browser smoke proves a customer can login, open a provider profile, click in-app message, land on `/messages/customer-demo_provider-demo`, and see the seeded message.

### Work Items

#### 4.1.1 Add callable integration tests for `startConversation`

Files:
- `functions/test/engagement.test.ts` or equivalent.
- `functions/src/engagement.ts` if helper exports are needed for testability.

Changes:
- Test unauthenticated request rejects with `unauthenticated`.
- Test banned customer rejects with `permission-denied`.
- Test missing provider rejects.
- Test pending, rejected, or suspended provider rejects.
- Test approved provider succeeds.
- Test success creates a conversation with expected participants, customer ID, provider ID, last message, timestamp, and unread count.
- Test success creates exactly one first message.
- Test success creates exactly one `platform_message` contact event.
- Test repeated start updates the conversation and creates another message without duplicating the contact event.
- Test new-conversation daily cap rejects only new conversations, not existing conversations.

Acceptance criteria:
- Callable behavior is proven against Firebase-shaped data and transaction semantics.
- Tests do not rely only on the demo database.
- Error codes are stable enough for UI localization.

#### 4.1.2 Add e2e chat access smoke for both customer and provider views

Files:
- `tests/e2e/app.spec.ts`.

Changes:
- Extend the existing customer contact test or add a separate test.
- Customer logs in, starts a conversation, sends a follow-up message, and sees it in the conversation.
- Provider logs in, opens the messages list, opens the same conversation, and sees the customer message.
- Provider sends a reply and the customer can see the reply.
- Use existing demo accounts and seeded conversation IDs where possible.

Acceptance criteria:
- Browser smoke proves both sides of `CONTACT-004`.
- Mobile project remains readable if the flow is included in mobile smoke.

#### 4.1.3 Add UI error handling for chat start and message send

Files:
- `src/features/providers/pages/provider-profile-page.tsx`.
- `src/features/messaging/pages/conversation-page.tsx`.
- Locale files under `src/i18n/locales/`.

Changes:
- Show a localized error if `startConversation` fails.
- Disable contact buttons while the chat start request is pending.
- Prevent empty or whitespace-only quick messages before hitting the callable.
- Show a localized error if follow-up `sendMessage` fails.
- Keep the user on the current page after a failed mutation.

Acceptance criteria:
- Failed contact never appears successful.
- Loading state clears after failure.
- Errors do not leak raw Firebase or callable internals.

#### 4.1.4 Harden follow-up message writes as a future Section 11 dependency

Files:
- Future: `functions/src/engagement.ts`.
- Future: `src/services/firebase/messaging.firebase.ts`.
- Future: `firestore.rules`.

Changes:
- Add `sendMessage` callable with participant, active-user, text length, and rate-limit checks.
- Move client `sendMessage` from direct Firestore transaction to callable.
- Tighten rules so client message creation can be disabled or kept only for emulator/demo fallback.

Acceptance criteria:
- Section 4 remains implemented before this work.
- Section 11 rate-limit completion should update this plan and checklist.

### Tests for 4.1

Unit and service tests:
- `npm test -- src/services/providers.service.test.ts`.
- Add focused tests if chat UI error handling is component-tested.

Functions tests:
- `cd functions && npm test`.
- Add `functions/test/engagement.test.ts` for callable transaction behavior.

Rules tests:
- `npm run test:rules`.

E2E tests:
- `npm run e2e -- tests/e2e/app.spec.ts`.

## 4.2 WhatsApp Redirection

### Requirements Covered

- `CONTACT-005`: Providers MAY enable or disable WhatsApp contact visibility.
- `CONTACT-006`: Customers MUST only see WhatsApp contact actions when the provider has enabled them.
- `CONTACT-007`: WhatsApp reveal/open MUST be tracked as a contact event.
- `CONTACT-008`: WhatsApp contact MUST redirect to a valid WhatsApp-compatible link when available.

### Current Implementation Evidence

- `src/features/providers/pages/provider-profile-page.tsx`
- WhatsApp buttons render only when `provider.whatsappVisible` is truthy.
- The contact card renders `provider.whatsappUnavailable` when visibility is disabled.
- Anonymous users are navigated to `/login` before reveal.
- Successful reveal stores `number` and `url` in local state.
- The UI renders the revealed number and an external link to the returned URL.
- `src/services/firebase/providers.firebase.ts`
- Firebase `revealWhatsApp` calls the callable.
- `functions/src/engagement.ts`
- `revealWhatsApp` requires auth.
- It rejects banned or missing users.
- It rejects missing or non-approved providers.
- It rejects providers with `whatsappVisible` disabled.
- It creates a deterministic `contacts/{customerId}_{providerId}_whatsapp_reveal` doc only when it does not already exist.
- It rate-limits only first-time daily WhatsApp reveals, not repeated reveals of the same provider.
- It returns provider data, contact data, and a generated `https://wa.me/{digits}` URL.
- `src/services/demo/providers.demo.ts`
- Demo behavior mirrors WhatsApp visibility, contact creation, dedupe, and rate limits.
- `src/services/providers.service.test.ts`
- Demo coverage proves repeated WhatsApp reveals dedupe.
- Demo coverage proves new WhatsApp reveals are rate-limited without blocking repeated reveals.
- `tests/e2e/app.spec.ts`
- Browser smoke proves a logged-in customer can reveal WhatsApp and see the seeded number.

### Work Items

#### 4.2.1 Validate WhatsApp number before returning a URL

Files:
- `functions/src/engagement.ts`.
- `src/services/demo/providers.demo.ts`.
- Possibly provider registration/edit validation files.
- Locale files under `src/i18n/locales/`.

Changes:
- Add a helper such as `whatsappUrl(number: string)` that strips non-digits and rejects an empty or too-short result.
- Require a valid digit payload before returning the URL.
- Prefer E.164-style Egyptian mobile numbers in provider forms.
- Map invalid stored numbers to a clear failed-precondition error.

Acceptance criteria:
- `+20 101 111 3333` returns a valid `https://wa.me/201011113333` link.
- Empty string, letters-only values, and too-short values do not return `https://wa.me/`.
- The UI shows a localized unavailable/contact-error message.

#### 4.2.2 Add callable tests for `revealWhatsApp`

Files:
- `functions/test/engagement.test.ts`.

Changes:
- Test unauthenticated request rejects.
- Test banned customer rejects.
- Test missing provider rejects.
- Test pending, rejected, or suspended provider rejects.
- Test hidden WhatsApp rejects with failed precondition.
- Test approved visible provider succeeds.
- Test success creates exactly one `whatsapp_reveal` contact event.
- Test repeated reveal returns the same contact relationship without duplicating the event.
- Test daily cap rejects a new reveal but not repeated reveal.
- Test malformed WhatsApp number rejects once validation is added.

Acceptance criteria:
- WhatsApp behavior is proven at the callable boundary.
- URL generation is covered directly.

#### 4.2.3 Add hidden-WhatsApp and failed-reveal UI tests

Files:
- `tests/e2e/app.spec.ts` or component tests if the project adds a React test pattern.

Changes:
- Seed or select a provider with `whatsappVisible: false`.
- Assert WhatsApp action is absent from the main profile action row and the contact card shows unavailable copy.
- Simulate a failed reveal and assert visible localized feedback.

Acceptance criteria:
- `CONTACT-006` is visible in browser-level proof.
- Failed reveal is not silent.

### Tests for 4.2

Unit and service tests:
- `npm test -- src/services/providers.service.test.ts`.

Functions tests:
- `cd functions && npm test`.

Rules tests:
- `npm run test:rules`.

E2E tests:
- `npm run e2e -- tests/e2e/app.spec.ts`.

## 4.3 Contact Boundaries

### Requirements Covered

- `CONTACT-009`: The system MUST NOT include booking functionality.
- `CONTACT-010`: The system MUST NOT include scheduling functionality.
- `CONTACT-011`: The system MUST NOT include job confirmations.
- `CONTACT-012`: The system MUST NOT process customer-provider payments.
- `CONTACT-013`: The system MUST NOT track job fulfillment.

### Current Implementation Evidence

- Public provider profiles expose only WhatsApp reveal, in-app message, reviews, and provider report actions.
- Messaging pages expose conversations, messages, read state, and message reports only.
- Search cards link customers to provider profiles and do not assign work.
- Firestore rules define `contacts`, `conversations`, `messages`, `reviews`, `reports`, `visibilityRequests`, and admin audit records, but no booking, schedule, job confirmation, customer-provider payment, checkout, escrow, or fulfillment records.
- Static search finds paid visibility and admin payment-review language, but not a customer-provider service payment flow.
- Product copy states that contact is directly between customer and provider and that the platform does not set price or guarantee work.

### Work Items

#### 4.3.1 Add a product-boundary regression test

Files:
- New `scripts/check-product-boundaries.ts` or a focused Vitest test under `src/lib/product-boundaries.test.ts`.
- `package.json` if a script is added.

Changes:
- Scan source routes, service exports, callable exports, type names, and visible locale keys for prohibited terms.
- Prohibited concepts include booking, scheduling, appointment, job confirmation, customer-provider payment, checkout, escrow, fulfillment, and completion tracking.
- Allowlisted concepts include admin visibility-request payment confirmation, paid visibility copy, and report reasons that describe off-platform behavior after contact.

Acceptance criteria:
- The check fails if a new booking or customer-provider payment flow is introduced accidentally.
- Legitimate paid visibility and admin review copy remains allowed.

#### 4.3.2 Add route-level negative e2e assertions

Files:
- `tests/e2e/app.spec.ts`.

Changes:
- Assert primary customer navigation does not include booking, schedule, checkout, payment, or job tracking links.
- Assert provider profile contact area only exposes WhatsApp/message/report/review actions.
- Assert search result cards do not expose auto-assignment or booking actions.

Acceptance criteria:
- Contact boundaries are proven in the user-facing shell.

#### 4.3.3 Preserve boundary language in contact UI

Files:
- `src/i18n/locales/en.json`.
- `src/i18n/locales/ar.json`.
- `src/features/providers/pages/provider-profile-page.tsx`.

Changes:
- Keep `provider.noGuarantee` visible near contact actions.
- Avoid adding copy that implies platform-managed scheduling, provider acceptance, job status, payment safety, escrow, or completion.

Acceptance criteria:
- The contact area remains a directory/contact product, not a marketplace operations product.

### Tests for 4.3

Static checks:
- `npm test -- src/lib/product-boundaries.test.ts` if implemented as Vitest.
- Or `npm run check:product-boundaries` if implemented as a script.

E2E tests:
- `npm run e2e -- tests/e2e/app.spec.ts`.

Release checks:
- `npm run release:check`.

## Effort Estimate

| Workstream | Estimate | Notes |
| --- | --- | --- |
| Callable tests for chat and WhatsApp | 1.5 to 2.5 days | Main complexity is test harness shape for callable-like Firebase Admin interactions. |
| WhatsApp validation hardening | 0.5 to 1 day | Small code change, but should include provider-form and callable tests. |
| UI mutation error states | 0.5 to 1 day | Requires localized copy and component or e2e coverage. |
| Customer/provider chat e2e smoke | 0.5 to 1 day | Depends on stable seeded demo state. |
| Product-boundary static check | 0.5 to 1 day | Needs careful allowlist for paid visibility/admin payment terms. |
| Final verification and cleanup | 0.5 day | Run targeted tests, rules tests, e2e, lint, build. |

Total expected effort: **3.5 to 7 days**.

The low end assumes existing Firebase callable tests can be added with minimal harness work.

The high end assumes the team first builds a reusable callable integration-test harness.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Callable tests become too mocked | False confidence in transaction/contact behavior | Prefer Firebase emulator or an Admin Firestore test harness over pure unit mocks. |
| Message sends remain client-written | Rate limiting and abuse controls are incomplete | Track in Section 11 and move follow-up sends to a callable before high-scale launch. |
| WhatsApp number data is dirty | Invalid `wa.me` links can appear to customers | Validate on provider registration/edit and again in the callable. |
| Boundary static scans create noise | Tests fail on legitimate paid visibility/admin copy | Maintain a small explicit allowlist with comments. |
| E2E relies on fragile Arabic labels | Tests can break during copy updates | Prefer stable roles, URLs, and seeded account flows where possible, while still checking key visible Arabic strings. |
| Contact mutation failures are silent | Users believe contact worked when it failed | Add localized error states and loading states for reveal/start/send. |

## Verification Commands

Run targeted checks first:

```bash
npm test -- src/services/providers.service.test.ts
cd functions && npm test
npm run test:rules
npm run e2e -- tests/e2e/app.spec.ts
```

Run release checks before marking the section complete:

```bash
npm run lint
npm test
npm run test:rules
npm run build
npm run e2e
```

Or use the project release gate:

```bash
npm run release:check
```

## Definition of Done

Section 4 can be marked complete when:
- `startConversation` callable behavior is covered for auth, active-user, provider eligibility, transaction writes, contact dedupe, and rate limits.
- `revealWhatsApp` callable behavior is covered for auth, active-user, provider eligibility, visibility, contact dedupe, rate limits, and URL validity.
- Browser e2e proves customer chat start and provider/customer message views.
- Browser or component coverage proves hidden WhatsApp is not offered and reveal failures are visible.
- Rules tests continue to deny direct contact and conversation creation and protect participant access.
- Product-boundary regression tests prevent booking, scheduling, job confirmation, customer-provider payment, and fulfillment tracking.
- UI contact mutation failures show localized user-readable messages.
- `npm run release:check` passes or each command in the release gate is run and recorded.

## Open Questions

1. Should Section 4 own the future `sendMessage` callable, or should it stay entirely under Section 11 rate limiting?
2. What exact WhatsApp number validation rule should Herafy use for v1, E.164 only or any 10-plus digit international-compatible mobile number?
3. Should repeated WhatsApp reveal update `lastRevealedAt` on the existing contact event, or should analytics remain derived from one unique contact event plus separate future interaction events?
4. Should anonymous contact attempts preserve the intended provider profile after login, or is the current generic login redirect acceptable?
5. Should the product-boundary check live in normal `npm test`, `release:check`, or a separate product audit command?
