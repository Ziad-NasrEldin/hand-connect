# Section 4 Contact System Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-04-contact-system.md`

Scope: keep SRS section 4 fully implemented across in-app chat, WhatsApp reveal, contact-event tracking, security rules, e2e proof, and explicit product boundaries.

Status legend:
- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists, but proof or hardening is incomplete.

## Tracker Summary

| Area | Status | Owner | Notes |
| --- | --- | --- | --- |
| Product decisions | Partially done | Product/Engineering | Current implementation implies deterministic contact identity and chat/WhatsApp-only boundaries; WhatsApp validation and post-start message trust boundary need explicit confirmation. |
| In-app chat | Partially done | Engineering | Feature works through UI/callable/rules/demo/e2e, but callable transaction tests and provider-side e2e smoke are missing. |
| WhatsApp reveal | Partially done | Engineering | Feature works through UI/callable/demo/e2e, but malformed number handling and callable tests are missing. |
| Contact event dedupe | Partially done | Engineering | Demo tests prove dedupe; emulator/callable proof is missing. |
| Message views | Partially done | Engineering | Customer conversation page and list exist; provider/customer browser proof is shallow. |
| Contact boundaries | Partially done | Product/Engineering | No prohibited flow found; automated boundary regression is missing. |
| UI error states | Not started | Engineering | Chat start, reveal, and follow-up send failures need visible localized feedback. |
| Verification | Not started | Engineering | Need targeted test run, functions tests, rules tests, e2e, lint, and build after hardening. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
| --- | --- | --- | --- |
| CONTACT-PD-001 | Confirm deterministic contact identity for v1. | Partially done | Recommended: one `contacts` doc per customer/provider/channel relationship. |
| CONTACT-PD-002 | Confirm repeated contact behavior. | Partially done | Recommended: repeated chat starts and WhatsApp reveals do not create duplicate contact events. |
| CONTACT-PD-003 | Confirm whether repeated contact should update `lastContactedAt`. | Not started | Optional analytics field; not required for current SRS. |
| CONTACT-PD-004 | Confirm post-start message trust boundary. | Not started | Recommended: accept current participant-rule writes for Section 4 and move server-side `sendMessage` to Section 11. |
| CONTACT-PD-005 | Confirm WhatsApp validation policy. | Not started | Recommended: valid digit-bearing international-compatible number, preferably E.164. |
| CONTACT-PD-006 | Confirm boundary-test enforcement location. | Not started | Decide whether product-boundary scan runs in `npm test`, `release:check`, or a separate audit command. |
| CONTACT-PD-007 | Confirm login return behavior after anonymous contact click. | Not started | Current behavior navigates to `/login`; preservation of intended provider path is a UX enhancement. |

## 4.1 In-App Chat Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| CONTACT-4.1-001 | Keep profile chat action customer-gated. | Partially done | `src/features/providers/pages/provider-profile-page.tsx` | Anonymous users go to login; non-customers cannot start chat; add regression proof. |
| CONTACT-4.1-002 | Keep initial chat start behind callable. | Done | `src/services/firebase/messaging.firebase.ts`, `functions/src/engagement.ts` | Firebase adapter calls `startConversation` callable for initial conversation. |
| CONTACT-4.1-003 | Validate initial message before callable call. | Done | `functions/src/engagement.ts`, `provider-profile-page.tsx`, locale files | Callable trims and validates text; UI blocks empty text and shows localized error. |
| CONTACT-4.1-004 | Reject unauthenticated `startConversation`. | Partially done | `functions/src/engagement.ts`, functions tests | Callable requires auth; add direct callable test. |
| CONTACT-4.1-005 | Reject banned customer for chat start. | Partially done | `functions/src/engagement.ts`, functions tests | `requireActiveUser` rejects banned users; add direct callable test. |
| CONTACT-4.1-006 | Reject ineligible provider for chat start. | Partially done | `functions/src/engagement.ts`, functions tests | Missing, pending, rejected, and suspended providers reject; add direct callable tests. |
| CONTACT-4.1-007 | Create conversation transactionally. | Partially done | `functions/src/engagement.ts` | Success creates deterministic conversation with expected participants and unread state; add callable test. |
| CONTACT-4.1-008 | Create first message with chat start. | Partially done | `functions/src/engagement.ts` | Success writes message under the conversation; add callable test. |
| CONTACT-4.1-009 | Create chat contact event. | Partially done | `functions/src/engagement.ts` | Success creates `platform_message` contact; add callable test. |
| CONTACT-4.1-010 | Deduplicate repeated chat contact events. | Partially done | `functions/src/engagement.ts`, `src/services/providers.service.test.ts` | Demo test exists; add callable test that repeated starts leave one contact doc. |
| CONTACT-4.1-011 | Preserve multiple messages on repeated starts. | Partially done | `functions/src/engagement.ts`, demo tests | Demo proves multiple messages; add callable transaction test. |
| CONTACT-4.1-012 | Rate-limit only new conversation starts. | Partially done | `functions/src/engagement.ts`, demo tests | Demo proves behavior; add callable test. |
| CONTACT-4.1-013 | List conversations for customer/provider participants. | Partially done | `src/features/messaging/pages/conversations-page.tsx`, `src/hooks/use-conversation.ts` | UI exists; add customer/provider e2e proof. |
| CONTACT-4.1-014 | Open conversation and show ordered messages. | Partially done | `src/features/messaging/pages/conversation-page.tsx`, `src/services/firebase/messaging.firebase.ts` | UI exists; add e2e proof for both sides. |
| CONTACT-4.1-015 | Send follow-up message in active conversation. | Partially done | `conversation-page.tsx`, `messaging.firebase.ts`, Firestore rules | Direct client write works under participant rules; add visible error state and consider future callable. |
| CONTACT-4.1-016 | Mark incoming messages read only. | Partially done | `messaging.firebase.ts`, `firestore.rules`, rules tests | Rules test exists; add UI/service regression if needed. |
| CONTACT-4.1-017 | Block non-participant conversation access. | Partially done | `firestore.rules`, rules tests | Rules enforce participant reads; add explicit non-participant read test if missing. |
| CONTACT-4.1-018 | Show chat-start mutation errors. | Done | `provider-profile-page.tsx`, i18n, `provider-profile-page.test.tsx` | Failed chat start shows localized feedback and leaves user on profile. |
| CONTACT-4.1-019 | Disable chat buttons while pending. | Done | `provider-profile-page.tsx` | Duplicate clicks do not fire parallel starts. |
| CONTACT-4.1-020 | Add provider-side chat e2e smoke. | Not started | `tests/e2e/app.spec.ts` | Provider can login, see messages, open a conversation, and reply. |

## 4.2 WhatsApp Redirection Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| CONTACT-4.2-001 | Keep provider WhatsApp visibility editable. | Done | `src/services/firebase/providers.firebase.ts`, provider edit surfaces | `whatsappVisible` is provider-owned safe patch data. |
| CONTACT-4.2-002 | Hide WhatsApp action when disabled. | Partially done | `provider-profile-page.tsx` | UI renders unavailable copy; add browser test for disabled provider. |
| CONTACT-4.2-003 | Reject unauthenticated WhatsApp reveal. | Partially done | `functions/src/engagement.ts`, functions tests | Callable requires auth; add direct callable test. |
| CONTACT-4.2-004 | Reject banned customer for WhatsApp reveal. | Partially done | `functions/src/engagement.ts`, functions tests | `requireActiveUser` rejects banned users; add direct callable test. |
| CONTACT-4.2-005 | Reject ineligible provider reveal. | Partially done | `functions/src/engagement.ts`, functions tests | Missing, pending, rejected, and suspended providers reject; add direct callable tests. |
| CONTACT-4.2-006 | Reject hidden WhatsApp reveal. | Partially done | `functions/src/engagement.ts`, functions tests | Callable checks `whatsappVisible`; add direct callable test. |
| CONTACT-4.2-007 | Create WhatsApp contact event. | Partially done | `functions/src/engagement.ts` | Success creates `whatsapp_reveal` contact; add callable test. |
| CONTACT-4.2-008 | Deduplicate repeated WhatsApp contact events. | Partially done | `functions/src/engagement.ts`, `providers.service.test.ts` | Demo test exists; add callable test. |
| CONTACT-4.2-009 | Rate-limit only new WhatsApp reveals. | Partially done | `functions/src/engagement.ts`, demo tests | Demo test exists; add callable test. |
| CONTACT-4.2-010 | Generate valid WhatsApp URL for formatted numbers. | Partially done | `functions/src/engagement.ts` | Current helper strips non-digits; add direct test. |
| CONTACT-4.2-011 | Reject empty or malformed WhatsApp number. | Done | `functions/src/engagement.ts`, demo provider service, provider forms, `edit-provider-profile-page.test.tsx` | Callable rejects malformed numbers before returning `wa.me`; provider form validates malformed input before save. |
| CONTACT-4.2-012 | Show reveal mutation errors. | Done | `provider-profile-page.tsx`, i18n, `provider-profile-page.test.tsx` | Failed reveal shows localized feedback and loading clears. |
| CONTACT-4.2-013 | Disable WhatsApp buttons while pending. | Done | `provider-profile-page.tsx` | Duplicate clicks do not fire parallel reveals. |
| CONTACT-4.2-014 | Add hidden-WhatsApp e2e or component test. | Not started | `tests/e2e/app.spec.ts` or component test | Hidden provider does not show reveal action and shows unavailable state. |
| CONTACT-4.2-015 | Add malformed-number callable test. | Not started | `functions/test/engagement.test.ts` | Malformed stored provider number rejects with stable error. |

## 4.3 Contact Boundaries Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| CONTACT-4.3-001 | Preserve chat/WhatsApp-only contact model. | Done | Provider profile, messaging pages | Current UI exposes no booking, scheduling, job confirmation, customer-provider payment, or fulfillment flow. |
| CONTACT-4.3-002 | Keep search directory-first. | Done | Search cards and provider profile links | Customers choose provider profiles; no auto-assignment path exists. |
| CONTACT-4.3-003 | Keep provider independence copy visible. | Done | `provider-profile-page.tsx`, locale files | Contact note states platform does not set price or guarantee work. |
| CONTACT-4.3-004 | Add product-boundary static scan. | Done | `src/features/search/search-product-boundary.test.ts` | Fails on prohibited booking/scheduling/job/payment/fulfillment route/service/callable/type/copy additions. |
| CONTACT-4.3-005 | Add allowlist for paid visibility/admin payment terms. | Done | `src/features/search/search-product-boundary.test.ts` | Visibility payment fields do not create false positives for `CONTACT-012`. |
| CONTACT-4.3-006 | Add route-level negative e2e assertions. | Not started | `tests/e2e/app.spec.ts` | Navigation/profile/search do not expose prohibited flow actions. |
| CONTACT-4.3-007 | Add callable export boundary assertion. | Done | `src/features/search/search-product-boundary.test.ts`, `functions/src/index.ts` | New prohibited callables are caught by the broad static scan. |
| CONTACT-4.3-008 | Add Firestore collection boundary assertion. | Done | `src/features/search/search-product-boundary.test.ts`, `firestore.rules`, types | Prohibited collections like bookings, jobs, appointments, payments, fulfillment are caught by the broad static scan. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
| --- | --- | --- | --- |
| CONTACT-V-001 | `npm test -- src/services/providers.service.test.ts` | Done | Demo contact dedupe and rate-limit tests pass. |
| CONTACT-V-002 | `cd functions && npm test` | Done | Passed via `npm --prefix functions test`. |
| CONTACT-V-003 | `npm run test:rules` | Done | Passed. |
| CONTACT-V-004 | `npm run e2e -- tests/e2e/app.spec.ts` | Not started | Browser contact smoke passes. |
| CONTACT-V-005 | Product-boundary check command | Done | `npm test -- src/features/search/search-product-boundary.test.ts` passed. |
| CONTACT-V-006 | `npm run lint` | Done | Passed. |
| CONTACT-V-007 | `npm test` | Done | Passed. |
| CONTACT-V-008 | `npm run build` | Done | Passed. |
| CONTACT-V-009 | `npm run e2e` | Not started | Full Playwright suite passes. |
| CONTACT-V-010 | `npm run release:check` | Not started | Full release gate passes. |

## Completion Checklist

| ID | Done When | Status |
| --- | --- | --- |
| CONTACT-DOD-001 | Logged-in customers can start chat with approved providers. | Done |
| CONTACT-DOD-002 | Anonymous users cannot start chat without login. | Partially done |
| CONTACT-DOD-003 | Banned users cannot start chat. | Partially done |
| CONTACT-DOD-004 | Ineligible providers cannot receive new chat starts. | Partially done |
| CONTACT-DOD-005 | Chat start creates conversation, first message, and contact event. | Partially done |
| CONTACT-DOD-006 | Repeated chat starts do not duplicate contact events. | Partially done |
| CONTACT-DOD-007 | Customer and provider can view active conversations. | Partially done |
| CONTACT-DOD-008 | Customer and provider can send and view messages. | Partially done |
| CONTACT-DOD-009 | Non-participants cannot read or mutate conversations/messages. | Partially done |
| CONTACT-DOD-010 | Direct client creation of contacts and conversations is denied. | Done |
| CONTACT-DOD-011 | Providers can enable/disable WhatsApp visibility. | Done |
| CONTACT-DOD-012 | Customers only see WhatsApp action when enabled. | Partially done |
| CONTACT-DOD-013 | WhatsApp reveal requires login, active account, approved provider, and enabled visibility. | Partially done |
| CONTACT-DOD-014 | WhatsApp reveal creates and deduplicates contact events. | Partially done |
| CONTACT-DOD-015 | WhatsApp reveal returns a valid WhatsApp-compatible URL. | Partially done |
| CONTACT-DOD-016 | Malformed WhatsApp numbers fail clearly. | Done |
| CONTACT-DOD-017 | Contact mutation failures show localized UI feedback. | Done |
| CONTACT-DOD-018 | No booking functionality exists. | Done |
| CONTACT-DOD-019 | No scheduling functionality exists. | Done |
| CONTACT-DOD-020 | No job confirmation functionality exists. | Done |
| CONTACT-DOD-021 | No customer-provider payment processing exists. | Done |
| CONTACT-DOD-022 | No job fulfillment tracking exists. | Done |
| CONTACT-DOD-023 | Product-boundary static or e2e regression exists. | Done |
| CONTACT-DOD-024 | Targeted tests, rules tests, functions tests, e2e, lint, and build pass. | Partially done |

## Risk Tracker

| ID | Risk | Status | Mitigation |
| --- | --- | --- | --- |
| CONTACT-RISK-001 | Invalid stored WhatsApp number produces unusable `wa.me` URL. | Mitigated | Callable validation exists and provider-form validation blocks malformed input. |
| CONTACT-RISK-002 | Callable behavior is under-tested. | Open | Add engagement callable integration tests. |
| CONTACT-RISK-003 | Follow-up messages bypass server-side rate limiting. | Open | Move to Section 11 `sendMessage` callable hardening. |
| CONTACT-RISK-004 | Contact mutation errors are silent. | Mitigated | Profile contact actions now show localized failure and pending states. |
| CONTACT-RISK-005 | Product boundaries regress through future marketplace features. | Mitigated | Static boundary check scans app, API, functions, and rules; route-level e2e remains future hardening. |
| CONTACT-RISK-006 | Rules tests skip when emulator is unavailable. | Open | Keep `npm run test:rules` in release gate and CI with emulator available. |

## Open Questions

1. Should message send rate limiting be implemented now under Section 4 or deferred to Section 11?
2. Should WhatsApp validation require strict E.164 or accept any international-compatible 10-plus digit mobile number?
3. Should repeated contact events store `lastContactedAt`, or should unique event dedupe remain enough for v1?
4. Should anonymous contact attempts return the customer to the provider after login?
5. Should the product-boundary test scan docs and locale copy, or only executable source and route/callable surfaces?
