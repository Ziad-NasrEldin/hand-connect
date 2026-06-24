# Section 3 Provider Profiles Implementation Checklist Tracker

Parent plan: `docs/product/implementation-plans/section-03-provider-profiles.md`

Scope: complete SRS section 3 so provider profiles are complete, approval-gated, and independent-provider safe across UI, Firebase/demo services, rules, functions, and tests.

Status legend:

- `Not started`: no implementation work done yet.
- `In progress`: code/docs/tests started but not fully verified.
- `Blocked`: requires product decision or external setup.
- `Done`: implemented and verified.
- `Partially done`: core behavior exists but needs gaps/tests completed.

## Tracker Summary

| Area | Status | Owner | Notes |
|---|---|---|---|
| Product decisions | Partially done | Product/Engineering | Coverage indicator and ban-to-visibility decisions are closed; self-edit and no-rating display decisions remain open. |
| Profile data | Partially done | Engineering | Name, profession, bio, areas, photos, reviews, rating, and contact options exist. Coverage indicator and render tests are missing. |
| Approval visibility | Partially done | Engineering | Approved-only search/profile/rules/contact gates exist. Needs rejected/suspended/banned/state-change browser/service coverage. |
| Provider independence | Partially done | Product/Engineering | Direct-contact/no-price/no-guarantee copy exists. Needs regression tests against pricing, booking, dispatch, assignment, and execution-control drift. |
| Provider edit safety | Partially done | Engineering | Edit UI exists, but service-area edit path and Firestore rules appear misaligned. |
| Verification | Not started | Engineering | Run provider/review/search tests, rules, e2e, lint, and build after implementation. |

## Product Decision Checklist

| ID | Item | Status | Acceptance / Notes |
|---|---|---|---|
| PROFILE-PD-001 | Decide coverage indicator field. | Done | Use platform-controlled coverage radius/equivalent coverage keys on `ProviderProfile`. |
| PROFILE-PD-002 | Decide default and max coverage radius. | Done | Radius policy is fixed by platform rules based on provider location, city, and profession. |
| PROFILE-PD-003 | Decide whether providers can edit coverage radius. | Done | Providers do not self-edit coverage radius; area expansion is the paid path for more public coverage. |
| PROFILE-PD-004 | Decide whether providers can self-edit service areas in v1. | Not started | Current edit UI allows it, but Firestore rules do not. Align one way. |
| PROFILE-PD-005 | Decide how banned provider accounts affect public visibility. | Done | Banned provider profiles are no longer publicly visible. |
| PROFILE-PD-006 | Decide no-rating display state. | Not started | Recommended: show "No reviews yet" instead of `0 / 5` where no visible reviews exist. |
| PROFILE-PD-007 | Decide whether structured specialties/services are needed in v1. | Not started | Recommended: keep `bio` only unless product needs chips; do not add pricing. |

## 3.1 Profile Data Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PROFILE-3.1-001 | Keep provider display name on profile. | Done | `src/features/providers/pages/provider-profile-page.tsx` | `provider.displayName` renders as profile heading. |
| PROFILE-3.1-002 | Keep localized profession on profile. | Done | `provider-profile-page.tsx`, `src/config/professions.ts` | `getProfessionName(provider.profession, language)` renders. |
| PROFILE-3.1-003 | Keep provider bio/description on profile. | Done | `provider-profile-page.tsx` | `provider.bio` renders as descriptive profile copy. |
| PROFILE-3.1-004 | Keep localized service-area chips on profile. | Done | `provider-profile-page.tsx`, `src/config/neighborhoods.ts` | `serviceAreaKeys` render as localized area chips. |
| PROFILE-3.1-005 | Add coverage indicator field. | Done | `src/types/provider.ts`, seed/auth/Firebase creation | Provider model includes `coverageRadiusKm` and `coverageAreaKeys`; targeted tests pass. |
| PROFILE-3.1-006 | Add coverage defaults/fallbacks. | Done | Demo seed, Firebase auth creation, converters | New and existing providers have valid finite coverage indicator through creation paths and converter fallback. |
| PROFILE-3.1-007 | Display coverage indicator on profile. | Done | `provider-profile-page.tsx`, locale files | Customers see radius/equivalent near service areas. |
| PROFILE-3.1-008 | Display coverage indicator on search cards. | Done | `src/features/search/pages/search-page.tsx`, locale files | Search cards provide compact coverage context. |
| PROFILE-3.1-009 | Keep profile photo display. | Done | `provider-profile-page.tsx` | First photo renders when present. |
| PROFILE-3.1-010 | Keep provider photo upload. | Done | `edit-provider-profile-page.tsx`, `providers.firebase.ts`, `storage.rules` | Owner can upload a profile photo and public can read it. |
| PROFILE-3.1-011 | Add photo upload validation/error UI. | Not started | `edit-provider-profile-page.tsx`, locale files | Invalid file type/size and upload failure show clear feedback. |
| PROFILE-3.1-012 | Add profile header rating summary. | Done | `provider-profile-page.tsx`, `provider-profile-page.test.tsx` | Rating appears when visible review data exists. |
| PROFILE-3.1-013 | Add profile/search review count display. | Done | `provider-profile-page.tsx`, `search-page.tsx`, `provider-profile-page.test.tsx` | Profile review count appears with rating and handles zero-review state; search count display existed before this slice. |
| PROFILE-3.1-014 | Keep visible review list. | Done | `provider-profile-page.tsx`, review services | Visible reviews render under Reviews. |
| PROFILE-3.1-015 | Add empty/no-review profile state. | Done | `provider-profile-page.tsx`, locale files, `provider-profile-page.test.tsx` | Provider with no visible reviews shows intentional empty copy and no misleading `0 / 5`. |
| PROFILE-3.1-016 | Keep WhatsApp reveal contact option. | Done | `provider-profile-page.tsx`, `functions/src/engagement.ts` | WhatsApp reveal appears only when `whatsappVisible` and requires auth. |
| PROFILE-3.1-017 | Keep in-app message contact option. | Done | `provider-profile-page.tsx`, messaging service/functions | Message action starts conversation only after explicit customer action. |
| PROFILE-3.1-018 | Add profile required-field render test. | Done | `provider-profile-page.test.tsx` | Name, profession, area, coverage, photo, bio, rating/reviews, contacts, and boundary copy are asserted. |
| PROFILE-3.1-019 | Add mobile profile layout smoke. | Not started | `tests/e2e/app.spec.ts` | Profile content and contact card remain readable/tappable on phone viewport. |

## 3.2 Approval Visibility Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PROFILE-3.2-001 | Keep Firebase direct profile approved-only gate. | Done | `src/services/firebase/providers.firebase.ts` | `getProviderById` returns only approved providers. |
| PROFILE-3.2-002 | Keep demo direct profile approved-only gate. | Done | `src/services/demo/providers.demo.ts` | Demo `getProviderById` returns only approved providers. |
| PROFILE-3.2-003 | Keep Firebase search approved-only gate. | Done | `src/services/firebase/search.firebase.ts` | Search query filters `status == approved`. |
| PROFILE-3.2-004 | Keep Firestore public read approval rule. | Done | `firestore.rules` | Public provider reads require `status == approved`. |
| PROFILE-3.2-005 | Keep owner/admin private access. | Done | `firestore.rules` | Owner/admin can read non-public provider docs. |
| PROFILE-3.2-006 | Keep provider owner status-change denial. | Done | `firestore.rules` | Owner cannot change `status`, `nationalIdVerified`, or `visibilityTier`. |
| PROFILE-3.2-007 | Keep admin approval callable. | Done | `functions/src/providers.ts` | Active admin can approve pending provider with identity document. |
| PROFILE-3.2-008 | Keep admin reject callable. | Done | `functions/src/providers.ts` | Active admin can reject pending provider with reason. |
| PROFILE-3.2-009 | Keep admin suspend callable. | Done | `functions/src/providers.ts` | Active admin can suspend provider with reason. |
| PROFILE-3.2-010 | Keep contact callables approved-only. | Done | `functions/src/engagement.ts` | WhatsApp reveal and conversation start reject non-approved provider. |
| PROFILE-3.2-011 | Keep review creation approved-only. | Done | `functions/src/reviews.ts` | Review creation rejects non-approved provider. |
| PROFILE-3.2-012 | Add rejected provider public read test. | Done | `tests/rules/firestore.rules.test.ts` | Anonymous/customer cannot read rejected provider; `npm run test:rules` passes. |
| PROFILE-3.2-013 | Add suspended provider public read test. | Done | `tests/rules/firestore.rules.test.ts` | Anonymous/customer cannot read suspended provider; `npm run test:rules` passes. |
| PROFILE-3.2-014 | Add search exclusion test for pending/rejected/suspended. | Not started | Search service/Firebase adapter/e2e | Only approved providers appear in customer search. |
| PROFILE-3.2-015 | Add direct profile unavailable smoke. | Not started | `tests/e2e/app.spec.ts` | Pending/rejected/suspended direct profile URL shows unavailable state. |
| PROFILE-3.2-016 | Implement ban-to-visibility behavior. | Partially done | Admin service/functions/search/profile/rules | Product decision is closed: banned provider account cannot remain discoverable; direct service/Firebase/browser proof still needed. |
| PROFILE-3.2-017 | Add ban visibility tests. | Not started | Admin/search/profile/contact tests | Banned provider account is hidden or automatically suspended. |
| PROFILE-3.2-018 | Add state-change visibility smoke. | Not started | E2E/functions tests | Pending absent, approved visible, suspended absent. |

## 3.3 Provider Independence Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PROFILE-3.3-001 | Keep direct-contact/no-price/no-guarantee copy. | Done | `provider-profile-page.tsx`, `src/locales/en.json`, `src/locales/ar.json` | Public profile states contact is direct and platform does not set price or guarantee the job. |
| PROFILE-3.3-002 | Add test for boundary copy visibility. | Done | `provider-profile-page.test.tsx` | Boundary copy is visible near contact actions in profile. |
| PROFILE-3.3-003 | Keep provider descriptive bio. | Done | `provider-profile-page.tsx`, edit page | Providers can describe services generally through `bio`. |
| PROFILE-3.3-004 | Keep service-area descriptions. | Done | Provider profile/search/edit pages | Providers can describe service areas through configured areas. |
| PROFILE-3.3-005 | Keep contact-method controls. | Done | Provider profile/edit pages | Providers can expose/hide WhatsApp and receive messages. |
| PROFILE-3.3-006 | Add forbidden pricing field regression. | Done | `src/features/search/search-product-boundary.test.ts` | Customer profile/search surfaces do not introduce platform-controlled price fields. |
| PROFILE-3.3-007 | Add forbidden booking/job/assignment regression. | Done | `src/features/search/search-product-boundary.test.ts` | Customer profile/search surfaces do not introduce booking, dispatch, job assignment, or work-order execution. |
| PROFILE-3.3-008 | Add explicit profile-open no-contact test. | Not started | E2E/service test | Opening profile does not create contact/conversation/job records. |
| PROFILE-3.3-009 | Add explicit contact-action-only test. | Not started | Providers/messaging tests | Contact records are created only after WhatsApp reveal or message send. |
| PROFILE-3.3-010 | Decide optional structured specialties. | Not started | Product/Engineering | If added, fields are descriptive only and exclude pricing/execution semantics. |

## Provider Edit Safety Tracker

| ID | Task | Status | Files / Areas | Acceptance Criteria |
|---|---|---|---|---|
| PROFILE-EDIT-001 | Align service-area edit UI with Firestore rules. | Done | `edit-provider-profile-page.tsx`, `firestore.rules`, provider services | Provider self-edit no longer sends coverage fields; area changes remain routed through visibility/expansion flow. |
| PROFILE-EDIT-002 | Validate profession edits. | Not started | Edit page/services/rules | Provider can select only active/valid profession unless admin policy says otherwise. |
| PROFILE-EDIT-003 | Validate bio length. | Not started | Edit page/services/rules | Empty/too-long bio is handled predictably. |
| PROFILE-EDIT-004 | Validate WhatsApp number. | Not started | Edit page/services/functions | Invalid number cannot be saved or revealed. |
| PROFILE-EDIT-005 | Protect admin-controlled fields. | Partially done | `firestore.rules`, services | Owner cannot mutate approval, rating, review count, visibility tier, or analytics fields. Add tests. |
| PROFILE-EDIT-006 | Add edit success/error states. | Not started | `edit-provider-profile-page.tsx`, locale files | Save success/failure is visible and does not silently fail. |

## Verification Tracker

| ID | Command / Check | Status | Expected Result |
|---|---|---|---|
| PROFILE-V-001 | `npm test -- src/services/providers.service.test.ts` | Not started | Passes. |
| PROFILE-V-002 | `npm test -- src/services/reviews.service.test.ts` | Done | Passed in targeted P4 test run. |
| PROFILE-V-003 | `npm test -- src/services/search.service.test.ts` | Done | Passes. |
| PROFILE-V-004 | `npm test -- src/features/providers/pages/provider-profile-page.test.tsx` if added | Done | Passed in targeted P4 test run. |
| PROFILE-V-005 | `npm test -- src/features/search/pages/search-page.test.tsx` if added | Not started | Passes. |
| PROFILE-V-006 | `npm test -- src/lib/provider-coverage.test.ts` if added | Done | Passes. |
| PROFILE-V-007 | `npm run test:rules` | Not started | Firestore/storage provider visibility and photo rules pass. |
| PROFILE-V-008 | `npm run e2e -- tests/e2e/app.spec.ts` | Not started | Provider profile/search/contact visibility smoke passes. |
| PROFILE-V-009 | `cd functions && npm test` if functions tests are added | Not started | Provider/review/engagement callable tests pass. |
| PROFILE-V-010 | `npm run lint` | Done | Passes. |
| PROFILE-V-011 | `npm run build` | Done | Passes. |

## Definition of Done Tracker

| ID | DoD Item | Status |
|---|---|---|
| PROFILE-DOD-001 | Provider name is visible on public profile. | Done |
| PROFILE-DOD-002 | Profession is visible and localized on public profile. | Done |
| PROFILE-DOD-003 | Service area is visible and localized on public profile. | Done |
| PROFILE-DOD-004 | Coverage radius or equivalent indicator is modeled. | Done |
| PROFILE-DOD-005 | Coverage radius or equivalent indicator is visible. | Done |
| PROFILE-DOD-006 | Provider photos are supported and displayed. | Done |
| PROFILE-DOD-007 | Provider photo storage rules protect writes. | Done |
| PROFILE-DOD-008 | Basic descriptive information is visible. | Done |
| PROFILE-DOD-009 | Rating is displayed when review data exists. | Done |
| PROFILE-DOD-010 | Review count is displayed consistently with rating. | Done |
| PROFILE-DOD-011 | Visible reviews render publicly. | Done |
| PROFILE-DOD-012 | Hidden/removed reviews do not render publicly. | Done |
| PROFILE-DOD-013 | Contact options are visible according to provider settings. | Done |
| PROFILE-DOD-014 | Contact actions require auth and explicit user action. | Partially done |
| PROFILE-DOD-015 | Pending providers are hidden from public discovery. | Done |
| PROFILE-DOD-016 | Rejected providers are hidden from public discovery. | Partially done |
| PROFILE-DOD-017 | Suspended providers are hidden from public discovery. | Partially done |
| PROFILE-DOD-018 | Banned provider accounts are hidden or auto-suspended. | Partially done |
| PROFILE-DOD-019 | Status changes immediately affect search/profile/contact visibility. | Partially done |
| PROFILE-DOD-020 | Provider owner edits cannot mutate admin-controlled fields. | Partially done |
| PROFILE-DOD-021 | Profile states direct contact and no platform-controlled price/guarantee. | Done |
| PROFILE-DOD-022 | No pricing, booking, dispatch, assignment, or platform execution flow exists on profile/search surfaces. | Done |
| PROFILE-DOD-023 | Product-boundary regression tests exist. | Done |
| PROFILE-DOD-024 | Profile render tests cover all Section 3 required public fields. | Done |
| PROFILE-DOD-025 | Targeted tests, rules/e2e where available, lint, and build pass. | Partially done |

## Open Questions

1. Should Section 3 implement `coverageRadiusKm` now, or should it accept current service-area chips as the temporary equivalent indicator?
2. If `coverageRadiusKm` is added, what default, minimum, and maximum values should Herafy use?
3. Can providers edit coverage radius and service areas themselves, or are these admin/paid-visibility controlled?
4. Should banning a provider user automatically suspend the provider profile?
5. Should provider profiles show `0 / 5`, "No reviews yet", or no rating summary when no visible reviews exist?
6. Do providers need structured `servicesOffered` or `specialties` in v1, or is `bio` sufficient?
7. Should profile-view tracking move to a trusted callable as part of Section 3, or remain scoped to Section 12 analytics?
