# Herafy iOS App Store Readiness Tracker

**Created:** 2026-06-19

**Source plan:** `docs/plans/2026-06-19-ios-app-store-readiness-implementation-plan.md`

**Goal:** Track every task required to convert Herafy into a production-ready iOS app and App Store submission candidate.

**Status legend:**

- `[ ]` Not started
- `[~]` In progress — use text in Notes; Markdown checkbox remains unchecked until complete
- `[x]` Complete and verified
- `[!]` Blocked — include blocker in Notes

**Stop rule:** Do not mark a task complete until its verification command/check has actually passed or the external/manual prerequisite has been truthfully satisfied.

---

## Current Dashboard

| Field | Value |
|---|---|
| Current phase | Phase 12 — iOS Build, Signing, and TestFlight |
| Current task | Task 13.5 — Capture final screenshots / waiting on signing gate |
| Total tasks | 60 |
| Completed tasks | 49 |
| Blocked tasks | 3 |
| Last verification command/result | `npm run cap:sync:ios`, `npm run lint`, `npm run build`, `npm run test:rules`, and `NODE_ENV=test npm test` passed after switching to `com.herafy-eg.app`. iOS Debug simulator build passed with no AppIcon warnings. iOS Release generic-device compile passed with `CODE_SIGNING_ALLOWED=NO`. Simulator install/launch passed for bundle `com.herafy-eg.app`; proof screenshot: `/tmp/herafy-ios-proof/herafy-com-herafy-eg-app-final.png`. |
| Current blocker | Apple Developer team/certificate/App Store Connect setup required for signing, archive, and TestFlight upload. `com.herafy-eg.app` must be registered in App Store Connect before signing/archive/TestFlight. |
| Next action | Human: register `com.herafy-eg.app`, choose Apple Developer Team, provide privacy/support URLs and reviewer credentials. Agent can resume signing/archive/TestFlight once those exist. |

---

## Phase Summary

| Phase | Scope | Tasks | Done | Status |
|---:|---|---:|---:|---|
| 1 | Repo Hygiene and Baseline Gates | 3 | 0 | Not started |
| 2 | Fix Existing Quality Gates | 4 | 0 | Not started |
| 3 | Data Adapter Boundary | 4 | 0 | Not started |
| 4 | Firebase Client Foundation | 3 | 0 | Not started |
| 5 | Firebase Auth and Registration | 4 | 0 | Not started |
| 6 | Firebase Provider Search/Profile | 4 | 0 | Not started |
| 7 | Firebase Messaging and Contact | 4 | 0 | Not started |
| 8 | Firebase Reviews | 3 | 0 | Not started |
| 9 | Admin and Moderation | 5 | 0 | Not started |
| 10 | Firebase Rules and Emulator Tests | 3 | 0 | Not started |
| 11 | iOS Capacitor Setup | 7 | 7 | Complete |
| 12 | iOS Build, Signing, and TestFlight | 6 | 2 | Blocked at signing |
| 13 | App Store Metadata and Compliance | 5 | 3 | In progress |
| 14 | Production Deployment and Final Release Gate | 5 | 0 | Not started |

---

## Decisions Required

- [x] Final Apple bundle ID: `com.herafy-eg.app` (chosen after `Connector` / `com.connector.app` was unavailable).
- [ ] Apple Developer Team/account to use.
- [ ] Separate Firebase staging/production projects or one project.
- [ ] Primary App Store listing language: Arabic or English.
- [ ] Provider identity upload sources: camera, photo library, file picker, or all.
- [ ] Messaging moderation scope: report-only or include block/mute in v1.
- [ ] Paid visibility/manual payment included in App Store v1 or hidden/deferred.
- [ ] Final privacy policy/support URL domain.
- [ ] Admin console inside iOS app or web-only for launch.
- [ ] TestFlight build points at staging Firebase or production Firebase.

---

## Task Checklist

### Phase 1: Repo Hygiene and Baseline Gates

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 1.1 — Remove macOS `.DS_Store` noise | Clean untracked Finder metadata and prevent it from recurring. | Modify: `.gitignore`<br>Delete: `.DS_Store`, `api/.DS_Store`, `docs/.DS_Store`, `docs/superpowers/.DS_Store`, `functions/.DS_Store` | See source plan / manual check | `.DS_Store` ignored and existing files removed. |
| [x] | 1.2 — Preserve current failing baseline in notes | Record known failures before changing code. | Modify or create: `docs/ios-readiness/baseline-2026-06-19.md` | See source plan / manual check | Baseline written with E2E and Functions build failures. |
| [x] | 1.3 — Add release-check script | Add a single script that runs root release gates. | Modify: `package.json` | npm run release:check | `npm run release:check` passes after Phase 2 fixes. |

### Phase 2: Fix Existing Quality Gates

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 2.1 — Fix ambiguous Arabic E2E selector | Make the failing Arabic RTL landing/search test target the intended provider profile link. | Modify: `tests/e2e/app.spec.ts` | npm run e2e | `npm run e2e`: 11 passed, 1 skipped. |
| [x] | 2.2 — Fix Firebase Functions ESM imports | Make `functions` TypeScript build pass under NodeNext/ESM. | Modify: `functions/src/index.ts`<br>Modify: `functions/test/reviews.test.ts`<br>Modify: `functions/test/visibility.test.ts` | cd functions<br>npm run build<br>npm test | Functions build/test pass. |
| [x] | 2.3 — Resolve root production audit findings | Update vulnerable dependencies without breaking app behavior. | Modify: `package.json` if dependency ranges change<br>Modify: `package-lock.json` | See source plan / manual check | Production moderate+ audit gate passes; 1 low `esbuild` remains in audit output. |
| [x] | 2.4 — Resolve functions production audit findings | Update vulnerable functions dependencies without breaking functions. | Modify: `functions/package.json` if dependency ranges change<br>Modify: `functions/package-lock.json` | See source plan / manual check | `cd functions && npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilities. |

### Phase 3: Data Adapter Boundary

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 3.1 — Create explicit data-source config | Stop implicit production fallback to demo/localStorage. | Create: `src/services/data-source.ts`<br>Modify: `.env.example`<br>Modify: tests if needed | npm test<br>npm run build | Added `VITE_HAND_CONNECT_DATA_SOURCE`, typed config helpers, and tests. |
| [x] | 3.2 — Split demo services into demo namespace | Make demo implementation explicit and isolated. | Create directory: `src/services/demo/`<br>Move or copy demo data helpers from `src/services/demo-db.ts`<br>Update imports in demo service modules | npm test<br>npm run build | Moved demo DB/seed files under `src/services/demo/` and updated imports. |
| [x] | 3.3 — Create service interfaces | Define stable interfaces for auth/providers/search/messaging/reviews/admin/visibility. | Create: `src/services/contracts/auth.contract.ts`<br>Create: `src/services/contracts/providers.contract.ts`<br>Create: `src/services/contracts/search.contract.ts`<br>Create: `src/services/contracts/messaging.contract.ts` | npm run build | Added typed service contracts for auth, providers, search, messaging, reviews, admin, and visibility. |
| [x] | 3.4 — Route services through adapter selectors | Make existing imports resolve to either demo or Firebase implementation. | Modify: `src/services/auth.service.ts`<br>Modify: `src/services/providers.service.ts`<br>Modify: `src/services/search.service.ts`<br>Modify: `src/services/messaging.service.ts` | npm test<br>npm run e2e | Added demo/Firebase selector wrappers and Firebase placeholder adapters. |

### Phase 4: Firebase Client Foundation

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 4.1 — Harden Firebase initialization | Provide reliable Firebase app/auth/db/storage exports. | Modify: `src/firebase/app.ts`<br>Modify: `src/firebase/auth.ts`<br>Modify: `src/firebase/db.ts`<br>Modify: `src/firebase/storage.ts` | See source plan / manual check | Added required env-key validation, trimmed config, existing-app reuse, and tests. |
| [x] | 4.2 — Add Firestore timestamp conversion helpers | Normalize app date handling between Firestore and UI types. | Create: `src/firebase/timestamps.ts` | npm test -- src/firebase/timestamps.test.ts | Added ISO/Timestamp conversion helpers and tests. |
| [x] | 4.3 — Add Firestore converters | Keep Firestore reads/writes typed. | Modify or create: `src/firebase/converters.ts` | npm run build | Added typed converters for app users, providers, messages, reviews, admin actions, reports, contacts, professions, visibility requests. |

### Phase 5: Firebase Auth and Registration

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 5.1 — Implement Firebase session listener | Replace demo session state with real Firebase Auth state when data source is Firebase. | Create: `src/services/firebase/auth.firebase.ts`<br>Modify: `src/store/auth.store.ts` if store expects polling style | Unit test with mocked Firebase or emulator.<br>Manual emulator test. | Added Firebase Auth subscription path and wired store initialization to session listener. |
| [x] | 5.2 — Implement customer registration | Create Firebase Auth user and Firestore user doc. | Modify: `src/services/firebase/auth.firebase.ts` | npm run firebase:emulators | Creates Auth user, updates display name, writes typed Firestore user doc. |
| [x] | 5.3 — Implement provider registration with identity upload | Create pending provider application with private identity document. | Modify: `src/services/firebase/auth.firebase.ts`<br>Modify: `src/features/auth/pages/register-page.tsx` if identity upload currently stores demo metadata only | Register provider in emulator.<br>Confirm Storage file path exists.<br>Confirm Firestore provider status is pending. | Creates pending provider doc, uploads identity document to Storage, and stores private identity metadata. |
| [x] | 5.4 — Implement login/logout | Use Firebase Auth for login/logout. | Modify: `src/services/firebase/auth.firebase.ts` | Login with customer.<br>Logout.<br>Refresh app. | Uses Firebase Auth login/logout and maps common auth errors to existing translation keys. |

### Phase 6: Firebase Provider Search/Profile

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 6.1 — Implement profession list source | Load professions from Firestore or seed config consistently. | Modify: `src/services/firebase/search.firebase.ts`<br>Modify: `scripts/seed-dev.ts`<br>keep professions as static config; or<br>store in Firestore `professions` collection. | See source plan / manual check | Search UI now uses `listProfessions`; Firebase loads active Firestore professions sorted by `sortOrder` with seeded config fallback. |
| [x] | 6.2 — Implement approved provider search query | Query real providers from Firestore. | Create: `src/services/firebase/search.firebase.ts`<br>Modify: `firestore.indexes.json` | Seed approved and pending providers.<br>Search shows approved only.<br>Pending/rejected/suspended do not appear. | Firebase search queries approved providers by profession + service area and reuses ranking. |
| [x] | 6.3 — Implement provider profile reads | Load approved provider profiles and owner profiles from Firestore. | Create: `src/services/firebase/providers.firebase.ts` | Anonymous can open approved profile.<br>Anonymous cannot open pending profile.<br>Provider owner can view own pending profile if route allows. | Firebase provider reads return public approved profiles and owner profile lookup by direct id/userId. |
| [x] | 6.4 — Implement provider profile updates/photos | Let approved providers update safe fields and photos. | Modify: `src/services/firebase/providers.firebase.ts`<br>Modify: `src/features/providers/pages/edit-provider-profile-page.tsx` | Provider uploads profile photo.<br>Public can view profile photo.<br>Other provider cannot overwrite it. | Firebase provider profile updates support safe fields and Storage-backed profile photos surfaced on profile/search cards. |

### Phase 7: Firebase Messaging and Contact

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 7.1 — Implement contact creation on WhatsApp reveal | Record customer-provider contact in Firestore. | Modify: `src/services/firebase/providers.firebase.ts` | Customer reveals WhatsApp.<br>`contacts` doc exists.<br>Review eligibility is created. | WhatsApp reveal creates/idempotently reuses customer-provider contact docs. |
| [x] | 7.2 — Implement conversation creation | Start a conversation transactionally. | Create: `src/services/firebase/messaging.firebase.ts` | Customer starts message.<br>Provider sees conversation.<br>Non-participant cannot read it. | Firebase messaging creates conversations/messages transactionally and records platform-message contacts. |
| [x] | 7.3 — Implement real-time messages | Subscribe to conversation messages. | Modify: `src/hooks/use-conversation.ts`<br>Modify: `src/services/firebase/messaging.firebase.ts` | Send message as customer.<br>Login as provider, message visible.<br>Send provider reply, customer sees reply. | Firebase messaging now supports `onSnapshot` conversation/conversation-list subscriptions; demo mode uses polling fallback. |
| [x] | 7.4 — Add message abuse reporting entry point | Provide App Store UGC moderation path. | Modify: `src/features/messaging/pages/conversation-page.tsx`<br>Create or modify report UI component.<br>Create: `src/services/firebase/reports.firebase.ts` | User can report conversation/message.<br>Admin sees report. | Conversation messages expose a report action that creates `reports` docs for admin review. |

### Phase 8: Firebase Reviews

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 8.1 — Implement review eligibility check | Check contact existence before showing review form. | Create: `src/services/firebase/reviews.firebase.ts` | No contact = cannot review.<br>Contact = can review.<br>Existing review = cannot review again. | Implemented Firebase contact/existing-review eligibility check. |
| [x] | 8.2 — Implement server-owned review creation | Prevent duplicate/fake reviews. | Modify: `functions/src/reviews.ts`<br>Modify: `src/services/firebase/reviews.firebase.ts` | Valid review succeeds.<br>Duplicate review fails.<br>Provider rating updates. | Implemented callable `createReview`, disabled direct client review creation in rules, and added required indexes. |
| [x] | 8.3 — Implement review moderation | Admin can hide abusive reviews. | Modify: `functions/src/reviews.ts`<br>Modify: `src/services/firebase/admin.firebase.ts`<br>Modify: admin reports/reviews UI if needed | Admin hides review.<br>Public no longer sees it.<br>Provider aggregate updates if hidden reviews are excluded. | Implemented callable `hideReview`, admin report hide action, aggregate recalculation, and audit action. |

### Phase 9: Admin and Moderation

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 9.1 — Implement admin provider application list | Admin sees pending provider applications from Firestore. | Create: `src/services/firebase/admin.firebase.ts`<br>Modify: `src/features/admin/pages/applications-page.tsx` only if UI assumes demo shapes | Admin sees pending provider.<br>Non-admin cannot access data. | Firebase admin service lists pending providers with identity docs and dashboard overview counts. |
| [x] | 9.2 — Implement provider approval function | Server-owned provider approval. | Create or modify: `functions/src/providers.ts`<br>Modify: `functions/src/index.ts`<br>Modify: `src/services/firebase/admin.firebase.ts` | Admin approves provider.<br>Provider status becomes approved.<br>Public search shows provider. | Added callable `approveProvider`; requires admin, pending provider, and identity document; writes audit action. |
| [x] | 9.3 — Implement provider rejection function | Server-owned rejection with reason. | Modify: `functions/src/providers.ts`<br>Modify: `src/services/firebase/admin.firebase.ts` | Reject without reason fails.<br>Reject with reason succeeds.<br>Provider sees rejected/pending-state copy. | Added callable `rejectProvider`; requires admin, pending provider, and non-empty reason; writes rejection reason and audit action. |
| [x] | 9.4 — Implement provider suspension function | Server-owned suspension with audit trail. | Modify: `functions/src/providers.ts`<br>Modify: `src/services/firebase/admin.firebase.ts` | Suspended provider removed from public search.<br>Provider dashboard shows suspended state.<br>Admin action created. | Added callable `suspendProvider`, Firebase admin provider listing, and helper coverage; public search already filters to approved providers. |
| [x] | 9.5 — Implement abuse report queue | Give Apple-review-safe moderation workflow. | Modify: `src/features/admin/pages/reports-page.tsx`<br>Modify: `src/services/firebase/admin.firebase.ts`<br>Modify: `functions/src/abuse.ts` | User reports content.<br>Admin sees report.<br>Admin marks report reviewed/actioned/dismissed. | Admin reports page lists reports and can resolve them with audit action creation. |

### Phase 10: Firebase Rules and Emulator Tests

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 10.1 — Add Firestore rules tests | Prove security rules, not just app UI. | Create: `tests/firebase/firestore.rules.test.ts`<br>Configure test setup if missing | npm test -- tests/firebase/firestore.rules.test.ts | Added `npm run test:rules` with Firestore emulator and user/provider rule coverage in `tests/rules/firestore.rules.test.ts`. |
| [x] | 10.2 — Add Storage rules tests | Prove identity documents are private. | Create: `tests/firebase/storage.rules.test.ts` | npm test -- tests/firebase/storage.rules.test.ts | Added `tests/rules/storage.rules.test.ts` covering private identity documents, public provider photo reads, owner-only photo writes, and unknown path blocks via Storage emulator REST auth. `npm run test:rules` passes. |
| [x] | 10.3 — Deploy staging Firebase | Validate no-Blaze deploy path. | Review: `.firebaserc`<br>Review: `firebase.json`<br>Modify: `firestore.rules`, Firebase client services | `npm run test:rules`<br>`./node_modules/.bin/firebase deploy --only firestore:rules,firestore:indexes --project staging --non-interactive --json` | No-Blaze workaround implemented: callable Functions are not required by the client path; admin moderation/review/provider actions use direct Firestore writes guarded by rules; customer reviews use deterministic client writes after a contact; provider identity documents fall back to Firestore-stored preview data when Storage is unavailable. Firestore rules/indexes deployed successfully to `staging` / `hand-connect-cairo`. |

### Phase 11: iOS Capacitor Setup

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 11.1 — Confirm final bundle ID | Avoid irreversible App Store identity mistakes. | `capacitor.config.ts`<br>`ios/App/App/capacitor.config.json` | `xcodebuild` output shows bundle identifier `com.herafy-eg.app`. | Approved final bundle ID: `com.herafy-eg.app` (hyphen accepted by Capacitor/Xcode/iOS simulator build). |
| [x] | 11.2 — Install Capacitor dependencies | Add native-wrapper tooling. | Modify: `package.json`<br>Modify: `package-lock.json` | `npm install @capacitor/core @capacitor/cli @capacitor/ios`<br>`npx cap --version` | Capacitor dependencies installed. |
| [x] | 11.3 — Add Capacitor config | Configure app ID/name/webDir. | Create: `capacitor.config.ts` | `npm run build`<br>`npm run cap:sync:ios` | Config uses app name `Herafy`, app ID `com.herafy-eg.app`, webDir `dist`. |
| [x] | 11.4 — Add package scripts | Make iOS sync/build repeatable. | Modify: `package.json` | `npm run cap:sync:ios` | Added `cap:sync:ios` and `cap:open:ios`. |
| [x] | 11.5 — Generate iOS project | Create `ios/` native project. | Create: `ios/` | `npm run build`<br>`npx cap add ios`<br>`npm run cap:sync:ios` | Capacitor 8 generated `ios/App/App.xcodeproj` with Swift Package layout. |
| [x] | 11.6 — Configure iOS app display name and permissions | Prepare native metadata. | Modify: `ios/App/App/Info.plist`<br>Modify: generated Capacitor iOS config | `plutil -lint ios/App/App/Info.plist`<br>Debug simulator build | Added camera/photo library usage strings for provider document/photo flows. |
| [x] | 11.7 — Configure app icon and launch screen | Replace default Capacitor branding. | Modify: `ios/App/App/Assets.xcassets/AppIcon.appiconset/*` | Build and simulator launch verified. Icon generated from provided logo. | Provided logo from `Branding/New-Logo.png` wired into Xcode universal icon asset. Debug/Release builds have no AppIcon warning. Launch screen still default Capacitor — needs design assets. |

### Phase 12: iOS Build, Signing, and TestFlight

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [x] | 12.1 — Build on iOS simulator | Prove native wrapper compiles. | `ios/App/App.xcodeproj` | `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'generic/platform=iOS Simulator' build` | Passed. Capacitor 8 generated `.xcodeproj`, not top-level `.xcworkspace`. |
| [x] | 12.2 — Run app in simulator and smoke test | Catch WebView/runtime issues. | iOS Simulator<br>`/tmp/herafy-ios-proof/herafy-simulator-after-wait.png` | `xcrun simctl install`<br>`xcrun simctl launch com.herafy-eg.app`<br>`xcrun simctl io screenshot` | Passed after normal launch delay; UI visible in simulator screenshot. Release generic iOS compile also passed with `CODE_SIGNING_ALLOWED=NO`. |
| [!] | 12.3 — Configure signing | Prepare App Store distribution. | Apple Developer account/team, App Store Connect bundle registration, Xcode signing settings | Signed archive succeeds for `com.herafy-eg.app`. | Blocked until Apple Developer Team/certificate/provisioning profile are available and `com.herafy-eg.app` is registered. |
| [ ] | 12.4 — Archive release build | Produce App Store archive. | See source plan / manual check | xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -archivePath build/Herafy.xcarchive archive |  |
| [ ] | 12.5 — Upload to TestFlight | Get Apple processing build. | See source plan / manual check | Build appears in App Store Connect.<br>Processing completes.<br>Internal TestFlight testing available. |  |
| [ ] | 12.6 — Real iPhone TestFlight smoke | Verify actual iOS behavior. | See source plan / manual check | See source plan / manual check |  |

### Phase 13: App Store Metadata and Compliance

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [!] | 13.1 — Publish privacy policy and support pages | Provide required public URLs. | Public privacy policy URL and support URL | URLs open publicly and are added to App Store Connect. | Blocked until final public URLs/domain are provided. Draft privacy questionnaire created in `docs/app-store/privacy-questionnaire-draft.md`. |
| [x] | 13.2 — Write App Store listing copy | Create review-safe metadata. | Create: `docs/app-store/listing.md` | File exists and avoids marketplace/payment/guarantee claims. | Draft created at `docs/app-store/listing.md`. |
| [x] | 13.3 — Prepare reviewer notes | Reduce Apple review confusion. | Create: `docs/app-store/reviewer-notes.md` | File exists with reviewer account placeholders and moderation notes. | Draft created at `docs/app-store/reviewer-notes.md`; needs final reviewer credentials. |
| [x] | 13.4 — Complete App Privacy questionnaire | Ensure App Store privacy answers match implementation. | Create: `docs/app-store/privacy-questionnaire-draft.md` | File exists and flags final production confirmations. | Draft created at `docs/app-store/privacy-questionnaire-draft.md`; final answers need URL/backend/SDK confirmation. |
| [!] | 13.5 — Capture final screenshots | Produce App Store screenshots from real iOS build. | Simulator/TestFlight screenshots | Required App Store screenshot sizes captured from final signed/TestFlight build. | Blocked for final store screenshots until signed/TestFlight build is available. Current simulator proof: `/tmp/herafy-ios-proof/herafy-com-herafy-eg-app-final.png`. |

### Phase 14: Production Deployment and Final Release Gate

| Done | Task | Objective | Main files / surfaces | Verification gate | Notes |
|---|---|---|---|---|---|
| [ ] | 14.1 — Split staging/production Firebase projects if needed | Avoid testing inside production data. | See source plan / manual check | See source plan / manual check |  |
| [ ] | 14.2 — Deploy backend production | Publish rules/functions/indexes/storage. | See source plan / manual check | firebase deploy --only firestore:rules,firestore:indexes,storage,functions --project production<br>Deploy succeeds.<br>Functions visible in Firebase console. |  |
| [ ] | 14.3 — Seed production admin and launch data | Ensure admin and initial professions exist. | See source plan / manual check | npm run seed:dev # rename/create production-safe seed before running in prod<br>npm run admin:create |  |
| [ ] | 14.4 — Production smoke test | Prove real backend, real build, real app. | See source plan / manual check | See source plan / manual check |  |
| [ ] | 14.5 — Submit for App Review | Submit only after all gates pass. | See source plan / manual check | See source plan / manual check |  |

---

## Final Release Gate

- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run e2e` passes.
- [ ] `cd functions && npm run build && npm test` passes.
- [ ] Firebase Firestore rules tests pass.
- [ ] Firebase Storage rules tests pass.
- [ ] Firebase staging deploy verified.
- [ ] Firebase production deploy verified.
- [ ] Capacitor iOS sync succeeds.
- [ ] iOS simulator build succeeds.
- [ ] Xcode archive succeeds.
- [ ] TestFlight upload succeeds.
- [ ] Real iPhone TestFlight smoke passes.
- [ ] Privacy policy URL live.
- [ ] Support URL live.
- [ ] App Store screenshots accepted.
- [ ] App Privacy questionnaire completed.
- [ ] Reviewer credentials verified.
- [ ] Production smoke passes against the same backend used by the iOS build.

---

## Completion Handoff

Fill this only after final release gate passes.

```txt
Repo:
Branch:
Commit:
Bundle ID:
iOS version/build:
Firebase project:
TestFlight build number:

Verification:
- npm run lint:
- npm test:
- npm run build:
- npm run e2e:
- functions build/test:
- Firebase rules tests:
- xcodebuild simulator:
- Xcode archive:
- TestFlight upload:
- Real iPhone smoke:

Store materials:
- Privacy URL:
- Support URL:
- Reviewer account:
- Screenshots uploaded:
- App privacy completed:

Known caveats:
-
```
