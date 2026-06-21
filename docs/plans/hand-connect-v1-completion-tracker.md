# Hand Connect / Herafy v1 Completion Tracker

## Status Legend

| Status | Meaning |
|---|---|
| Not Started | No implementation started. |
| In Progress | Actively being changed. |
| Blocked | Waiting on decision or dependency. |
| Needs Review | Implementation complete, awaiting review. |
| Changes Requested | Review found required fixes. |
| Verified | Implementation and verification passed. |
| Deferred | Explicitly approved out of this release. |

## Product Decisions

| Decision | Current Value | Status |
|---|---|---|
| Public name | Herafy public UI; repo remains `hand-connect` | Defaulted |
| OAuth | Google OAuth only | Defaulted |
| Phone auth | Deferred; phone remains profile/contact data | Defaulted |
| Review cardinality | One review per customer-provider after contact | Defaulted |
| Paid visibility payment | Manual admin confirmation only | Defaulted |
| Native scope | Existing Capacitor wrapper only | Defaulted |

## Task Tracker

| ID | Task | Owner | Status | Depends On | Verification Proof | Notes |
|---|---|---|---|---|---|---|
| 0.1 | Lock product decisions | Coordinator | Verified | None | Defaults recorded above | Update if user overrides. |
| 0.2 | Create tracker and plan docs | Coordinator | Verified | 0.1 | Files created: `.hermes/plans/hand-connect-v1-completion-plan.md`, `.hermes/plans/hand-connect-v1-agent-orchestration.md`, `docs/plans/hand-connect-v1-completion-tracker.md` | Plan/tracker/orchestration docs. |
| 1.1 | Remove Firebase not-implemented gaps | Backend | Verified | 0.1 | Source audit found no `not implemented` / `firebaseNotImplemented` service gaps; `npm run release:check` passed | Visibility/admin Firebase paths have implementations. |
| 1.2 | Standardize callable mutations | Backend | Verified | 1.1 | `npm --prefix functions test` passed; `npm --prefix functions run build` passed; `npm run release:check` passed | Existing callables are used for provider approve/reject/suspend, review creation, and review hiding; callables now reject banned users/admins. Config/report/account-ban admin writes remain rules-guarded direct writes. |
| 1.3 | Harden Firestore rules | Security | Verified | 1.1, 1.2 | Emulator-backed `npm run test:rules` passed; `npm run release:check` passed | Rules now block owner mutation of protected provider fields, direct review/contact aggregate writes, direct area-expansion request forgery, spoofed/closed reports, banned identity-doc updates, broad conversation mutation, and cover users, providers, contacts, messages, reports, visibility, professions, and audit writes. Plain `npm test` skips emulator-dependent rules cases by design; release proof comes from `npm run test:rules`. |
| 1.4 | Add Firestore indexes | Backend | Verified | 1.1 | `firestore.indexes.json` JSON validation passed; `npm run release:check` passed | Added composite indexes for search, conversations, reviews, contacts, professions, and visibility request queries. |
| 2.1 | Fix registration password | Auth | Verified | 0.1 | `npm test -- src/services/auth.service.test.ts` passed; `npm run build` passed | Removed hardcoded password; registration now collects password and confirmation. |
| 2.2 | Add Google OAuth | Auth | Verified | 2.1 | `npm test -- src/services/auth.service.test.ts` passed; `npm run build` passed | Customer OAuth implemented; provider verification cannot be bypassed. |
| 2.3 | Resolve phone auth scope | Auth | Deferred | 0.1 | Default decision recorded | Implement only if decision changes. |
| 3.1 | Respect WhatsApp visibility | Contact | Verified | 1.1 | `npm run build` passed; `npm test -- src/firebase/converters.test.ts src/lib/ranking.test.ts` passed | Service rejects hidden WhatsApp; UI hides unavailable contact. |
| 3.2 | Add WhatsApp redirect | Contact | Verified | 3.1 | `npm run build` passed | Reveal now shows number and `wa.me` open link. |
| 3.3 | Normalize contact counting | Contact | Verified | 3.1 | `npm test -- src/services/providers.service.test.ts` passed; `npm run build` passed | Repeated WhatsApp reveals and first-message starts do not duplicate contacts. |
| 4.1 | Use callable review creation | Reviews | Verified | 1.2 | `npm run build` passed; `npm test -- src/services/reviews.service.test.ts` passed; `npm --prefix functions test` passed | Firebase adapter now calls review callable for aggregate correctness. |
| 4.2 | Finalize review cardinality | Reviews | Verified | 0.1 | Default decision recorded | One per customer-provider. |
| 4.3 | Add review reporting | Reviews/Admin | Verified | 4.1 | `npm test -- src/services/reviews.service.test.ts` passed; `npm run build` passed | Customers can report visible reviews into admin reports. |
| 5.1 | Add response metrics | Dashboard | Verified | 3.3 | `npm test -- src/services/analytics.service.test.ts` passed; `npm run build` passed | Computes conversations, response rate, and average first response from existing messages. |
| 5.2 | Add dashboard reviews summary | Dashboard | Verified | 4.1 | `npm test -- src/services/analytics.service.test.ts` passed; `npm run build` passed | Shows latest reviews and rating. |
| 6.1 | Firebase visibility request creation | Visibility | Verified | 1.1 | `npm run build` passed; `npm run test:rules` passed | Firebase provider request creation/listing implemented. |
| 6.2 | Admin visibility approval/rejection | Visibility | Verified | 6.1, 1.2 | `npm run build` passed; `npm test -- src/services/data-source.test.ts src/services/auth.service.test.ts` passed after rejection path | Admin approval and rejection implemented. |
| 6.3 | 30-review area expansion | Visibility | Verified | 4.1, 6.2 | `npm test -- src/services/visibility.service.test.ts` passed; `npm run build` passed | Rejects below 30 reviews; admin approval adds eligible new service area. |
| 6.4 | Paid expiry/ranking cap | Visibility/Search | Verified | 6.2 | `npm test -- src/lib/ranking.test.ts` passed; `npm run build` passed | Expired paid visibility is treated as organic for ranking and labels. |
| 7.1 | Profession management | Admin | Verified | 1.2 | `npm test -- src/services/admin.service.test.ts` passed; `npm run build` passed | Admin can create/update and activate/deactivate professions. |
| 7.2 | Account ban | Admin/Security | Verified | 1.3 | `npm test -- src/services/admin.service.test.ts src/services/auth.service.test.ts` passed; `npm run test:rules` passed; `npm run build` passed | Admin can ban/unban user accounts; provider list exposes account status; banned users are blocked from protected Firestore writes. |
| 7.3 | Improve reports workflow | Admin | Verified | 4.3, 7.2 | `npm test -- src/services/admin.service.test.ts` passed; `npm test -- src/services/reviews.service.test.ts` passed; `npm run build` passed | Reports include reporter/target context where available; resolution stores `resolvedBy`, `resolvedAt`, and `resolutionReason`. |
| 7.4 | Complete audit coverage | Admin/Security | Verified | 6.2, 7.1, 7.2 | `npm test -- src/services/admin.service.test.ts src/lib/display.test.ts` passed; `npm run test:rules` passed; `npm run build` passed | Every admin mutation path has an audit row regression; audit UI labels cover report resolution, review hiding, and user ban/unban actions. |
| 8.1 | Rate limit contact/messaging | Security | Verified | 3.3, 1.2 | `npm run release:check` passed; `npm --prefix functions test` passed; `npm --prefix functions run build` passed | Firebase contact/conversation/report creation now goes through callables with server-side daily caps; direct Firestore creates for contacts, conversations, reports, direct reviews, and contact review flags are denied; conversation updates are limited to send/read state. Demo adapter keeps local caps for offline mode. |
| 8.2 | Provider/review/message report entry points | Abuse | Verified | 7.3 | `npm test -- src/services/providers.service.test.ts src/services/reviews.service.test.ts` passed; `npm run build` passed | Provider, review, and message report entry points are reachable; provider reports include target/reporter context and share report rate limiting. |
| 9.1 | Harden search params/errors | Frontend | Verified | 1.1 | `npm test -- src/lib/search-filters.test.ts src/services/search.service.test.ts` passed; `npm run build` passed | Invalid profession/neighborhood params normalize to safe active defaults at service and search-page boundaries. |
| 9.2 | Search limits/pagination | Search | Verified | 9.1 | `npm test -- src/lib/search-filters.test.ts src/services/search.service.test.ts` passed; `npm run build` passed | Search filters include bounded result limits; Firebase reads cap at a hard max and ranked results slice to requested/default size. |
| 9.3 | Under-60-second contact journey | Frontend | Verified | 2.1, 3.2 | `npm test -- src/services/providers.service.test.ts src/services/search.service.test.ts` passed; `npm run build` passed; `npm run e2e` passed with customer contact flow in 2.4s desktop / 2.9s mobile | Primary WhatsApp/message CTAs are in the provider profile card; automated E2E verifies customer login, WhatsApp reveal, message start, and mobile contact buttons. |
| 10.1 | Add E2E smoke tests | QA | Verified | Product slices complete | `npm run e2e` passed: 11 passed, 1 expected mobile-only skip | Playwright covers customer contact flow, provider/admin route access, provider application identity review, mobile layout, and reduced motion smoke. |
| 10.2 | Full release gate | Verified | 10.1 | `npm run release:check` passed after adding emulator-backed `npm run test:rules` to the script; command ran lint, full Vitest suite, rules tests, build, and Playwright E2E | Build still emits known Vite dynamic/static auth import and large chunk warnings. |
| 10.3 | Update operations docs | Docs | Verified | Admin flows complete | Updated `docs/operations/admin-runbook.md`; `npm run release:check` passed before docs update | Admin runbook now covers provider applications, professions, visibility requests, abuse reports, account bans, audit log review, and release-check command. |

## Milestones

| Milestone | Included Tasks | Status | Exit Criteria |
|---|---|---|---|
| M0 Decisions And Tracker | 0.1, 0.2 | Verified | Tracker and docs committed/accepted. |
| M1 Firebase Production Safe | 1.1-1.4 | Verified | No not-implemented Firebase route; rules, indexes, callable-backed sensitive paths, and release gate pass. |
| M2 Core Contact Trust | 3.1-3.3, 4.1-4.3 | Verified | WhatsApp visibility/redirect, contact counting, callable review aggregate path, and review reports verified. |
| M3 Paid Visibility | 6.1-6.4 | Verified | Provider request, admin approval/rejection, 30-review area expansion, and expiry/ranking verified. |
| M4 Admin Complete | 7.1-7.4 | Verified | Profession management, account bans, report workflow improvements, and audit coverage verified. |
| M5 Provider Dashboard | 5.1-5.2 | Verified | Response behavior and reviews visible. |
| M6 Auth Complete | 2.1-2.3 | Verified | Password registration and Google OAuth verified; phone OTP deferred by default decision. |
| M7 Abuse Prevention | 8.1-8.2 | Verified | Rate limits and provider/review/message report surfaces verified with callable-backed Firebase enforcement. |
| M8 Release Ready | 9.1-10.3 | Verified | Search hardening/limits, contact journey, E2E smoke, full release gate, and operations docs verified. |

## Running Notes

- Preserve user or parallel-agent changes; do not revert unrelated work.
- Do not mark tasks verified without command/browser/API proof.
- Keep shared contract/type/rules changes coordinated.
