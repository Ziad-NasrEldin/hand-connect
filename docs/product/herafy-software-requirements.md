# Herafy / Hand Connect Software Requirements Specification

This SRS expands `docs/product/herafy-feature-list.md` into clear software requirements for Herafy / Hand Connect v1.

Requirement keywords:

- **MUST**: required for v1.
- **SHOULD**: strongly recommended for v1 quality.
- **MUST NOT**: explicitly excluded or forbidden.

## 1. Authentication

### 1.1 Email and/or Phone Login

- **AUTH-001**: The system MUST allow users to authenticate with email credentials.
- **AUTH-002**: The system SHOULD support phone number as profile/contact data and as an alternate login identifier when paired with the account password.
- **AUTH-003**: Phone login MUST NOT use passwordless SMS in v1.
- **AUTH-003A**: If phone is used as a login identifier, the system MUST resolve the stored phone to the account email and authenticate with the normal password.
- **AUTH-003B**: Email registration SHOULD send an email verification message when the active auth provider supports it.
- **AUTH-004**: The system MUST validate required authentication fields before submission.
- **AUTH-005**: The system MUST show a clear error when login fails.

### 1.2 OAuth Login

- **AUTH-006**: The system MUST support OAuth login for approved providers, with Google OAuth as the default v1 provider.
- **AUTH-007**: OAuth login MUST create or link a user account without bypassing provider verification.
- **AUTH-008**: OAuth login MUST assign the correct user role after account resolution.

### 1.3 Login Required Before Contact

- **AUTH-009**: The system MUST require users to be logged in before initiating in-app chat.
- **AUTH-010**: The system MUST require users to be logged in before revealing or opening a WhatsApp contact action.
- **AUTH-011**: Unauthenticated users who attempt contact MUST be redirected or prompted to log in.

### 1.4 Role Support

- **AUTH-012**: The system MUST support at least three roles: customer, provider, and admin.
- **AUTH-013**: Role-based access MUST prevent customers from accessing provider-only dashboard features.
- **AUTH-014**: Role-based access MUST prevent non-admin users from accessing admin features.
- **AUTH-015**: Provider role access MUST NOT make the provider publicly visible before approval.

## 2. Customer Search & Discovery

### 2.1 Search by Profession

- **SEARCH-001**: Customers MUST be able to search providers by profession/category.
- **SEARCH-002**: The system MUST only expose active professions in customer search filters.
- **SEARCH-003**: Invalid profession filters MUST resolve safely without crashing the page.

### 2.2 Search by Location

- **SEARCH-004**: Customers MUST be able to search using a selected location.
- **SEARCH-005**: The system SHOULD support current-location search when location permission is available.
- **SEARCH-006**: The system MUST handle denied or unavailable location permission gracefully.

### 2.3 Nearby Provider Results

- **SEARCH-007**: Search results MUST consider provider service area and platform-derived coverage radius.
- **SEARCH-008**: Providers outside fixed platform coverage rules SHOULD NOT be prioritized as nearby matches.
- **SEARCH-009**: Search results MUST only include publicly approved providers.

### 2.4 Directory-First Browsing

- **SEARCH-010**: The system MUST present providers as selectable directory listings.
- **SEARCH-011**: Customers MUST choose which provider to contact.
- **SEARCH-012**: The system MUST NOT assign jobs to providers automatically.

### 2.5 Search Experience

- **SEARCH-013**: Search UI MUST be usable on mobile screens.
- **SEARCH-014**: Search requests MUST use bounded limits or pagination.
- **SEARCH-015**: Search failure states MUST show user-readable feedback.

## 3. Provider Profiles

### 3.1 Profile Data

- **PROFILE-001**: Provider profiles MUST include provider name.
- **PROFILE-002**: Provider profiles MUST include profession.
- **PROFILE-003**: Provider profiles MUST include service area.
- **PROFILE-004**: Provider profiles MUST include platform-derived coverage radius or equivalent coverage indicator.
- **PROFILE-005**: Provider profiles MUST support photos.
- **PROFILE-006**: Provider profiles MUST include basic descriptive information.
- **PROFILE-007**: Provider profiles MUST display rating when available.
- **PROFILE-008**: Provider profiles MUST display reviews when available.
- **PROFILE-009**: Provider profiles MUST display available contact options.

### 3.2 Approval Visibility

- **PROFILE-010**: Provider profiles MUST be hidden from public search until admin approval.
- **PROFILE-011**: Rejected, suspended, banned, owner-banned, or unapproved providers MUST NOT appear in public customer discovery.
- **PROFILE-012**: Provider profile state changes MUST be reflected in search visibility.

### 3.3 Provider Independence

- **PROFILE-013**: Provider profiles MAY describe services, areas, and contact methods.
- **PROFILE-014**: The system MUST NOT require providers to publish platform-controlled pricing.
- **PROFILE-015**: The system MUST NOT imply platform control over provider work execution.

## 4. Contact System

### 4.1 In-App Chat

- **CONTACT-001**: Logged-in customers MUST be able to start an in-app text conversation with eligible providers.
- **CONTACT-002**: The system MUST store chat initiation as a contact event.
- **CONTACT-003**: The system MUST prevent duplicate contact counts for repeated starts of the same eligible contact relationship where applicable.
- **CONTACT-004**: The system MUST support provider/customer message views for active conversations.

### 4.2 WhatsApp Redirection

- **CONTACT-005**: Providers MAY enable or disable WhatsApp contact visibility.
- **CONTACT-006**: Customers MUST only see WhatsApp contact actions when the provider has enabled them.
- **CONTACT-007**: WhatsApp reveal/open MUST be tracked as a contact event.
- **CONTACT-008**: WhatsApp contact MUST redirect to a valid WhatsApp-compatible link when available.

### 4.3 Contact Boundaries

- **CONTACT-009**: The system MUST NOT include booking functionality.
- **CONTACT-010**: The system MUST NOT include scheduling functionality.
- **CONTACT-011**: The system MUST NOT include job confirmations.
- **CONTACT-012**: The system MUST NOT process customer-provider payments.
- **CONTACT-013**: The system MUST NOT track job fulfillment.

## 5. Reviews & Reputation

### 5.1 Review Eligibility

- **REVIEW-001**: Customers MUST only be allowed to review a provider after a contact event.
- **REVIEW-002**: The system MUST enforce one review per eligible customer-provider contact relationship as defined for v1.
- **REVIEW-003**: The system MUST reject reviews from users who have not contacted the provider.

### 5.2 Review Display

- **REVIEW-004**: Provider profiles MUST display visible reviews.
- **REVIEW-005**: Provider profiles MUST display aggregate rating when review data exists.
- **REVIEW-006**: Hidden or moderated reviews MUST NOT appear publicly.

### 5.3 Provider Reply Restriction

- **REVIEW-007**: Providers MUST NOT be able to publicly reply to reviews in v1.
- **REVIEW-008**: The UI MUST NOT expose provider public-reply controls.

### 5.4 Reputation Impact

- **REVIEW-009**: Reviews MUST contribute to provider reputation signals.
- **REVIEW-010**: Reputation signals MUST be available to ranking/visibility logic.
- **REVIEW-011**: Review influence MUST NOT guarantee a specific ranking position.

## 6. Ranking & Visibility

### 6.1 Weighted Ranking

- **RANK-001**: Search results MUST be ordered by ranking rules.
- **RANK-002**: Ranking MUST consider distance/location relevance.
- **RANK-003**: Ranking MUST consider review/reputation signals.
- **RANK-004**: Ranking MUST consider provider activity/responsiveness signals.
- **RANK-005**: Ranking MUST consider active paid visibility status according to the active paid product rules.
- **RANK-006**: Ranking SHOULD consider geographic fairness adjustments.

### 6.2 Dynamic Recalculation

- **RANK-007**: Ranking MUST recalculate from current provider and search signals.
- **RANK-008**: Expired paid visibility MUST NOT continue to affect ranking.
- **RANK-009**: Suspended, banned, rejected, or unapproved providers MUST be excluded from public ranking.

### 6.3 Guardrails

- **RANK-010**: No single ranking factor MUST guarantee top placement.
- **RANK-011**: The platform MUST NOT apply a separate visibility cap policy.
- **RANK-012**: Paid visibility MUST NOT guarantee top placement.
- **RANK-013**: Organic high-quality providers MUST remain able to outrank paid providers.

### 6.4 Ranking Governance

- **RANK-014**: Providers MUST NOT be able to negotiate placement manually.
- **RANK-015**: Admin ranking controls MUST apply platform-wide or by configured product rules, not ad-hoc favoritism.
- **RANK-016**: Exact ranking formulas MUST NOT be exposed publicly.
- **RANK-017**: The system MAY expose high-level ranking factors for transparency.

## 7. Paid Visibility

### 7.1 Visibility Boosts

- **PAID-001**: Providers MUST be able to request or purchase optional paid visibility boosts.
- **PAID-002**: Paid visibility MUST increase exposure according to the active paid product rules without a separate visibility cap policy.
- **PAID-003**: Paid benefits MUST have start and end/expiry handling.
- **PAID-004**: Paid benefits MUST expire automatically when the paid period ends or payment state is no longer active.

### 7.2 Paid Labels

- **PAID-005**: Paid listings MUST be clearly labeled in customer-facing search results.
- **PAID-006**: The label MUST distinguish promoted listings from organic listings.

### 7.3 No Guarantees

- **PAID-007**: The system MUST NOT guarantee leads from payment.
- **PAID-008**: The system MUST NOT guarantee jobs from payment.
- **PAID-009**: The system MUST NOT guarantee top placement from payment.

### 7.4 Free Provider Visibility

- **PAID-010**: Free providers MUST remain eligible for public search visibility if approved.
- **PAID-011**: Providers MUST NOT be forced to pay to remain listed.

## 8. Geographic Expansion

### 8.1 Initial Service Area

- **GEO-001**: Each provider MUST have one initial service area for v1 operation.
- **GEO-002**: Provider search visibility MUST respect the provider's approved service areas.

### 8.2 Additional Service Areas

- **GEO-003**: Providers MUST be able to request additional service areas.
- **GEO-004**: Area expansion MUST require eligibility checks before approval.
- **GEO-005**: Area expansion eligibility MUST include reputation and activity gates.
- **GEO-006**: Area expansion eligibility MUST require at least 30 reviews for the PRD v1 target unless explicitly changed.
- **GEO-007**: Approved additional areas MUST affect discovery coverage.
- **GEO-008**: Coverage radius policy MUST be fixed by platform rules based on provider location, city, and profession.
- **GEO-009**: Providers MUST NOT self-expand coverage radius outside those platform rules.

### 8.3 Fees and Approval

- **GEO-010**: Additional service areas MUST cost 250 EGP per month.
- **GEO-011**: Area expansion billing MUST auto-renew monthly by Visa/card on file through Paymob.
- **GEO-012**: Admins SHOULD approve or reject area expansion requests.
- **GEO-013**: Rejected, unpaid, expired, canceled, or past-due expansion areas MUST NOT affect public search coverage.

## 9. Provider Dashboard

### 9.1 Performance Metrics

- **DASH-001**: Providers MUST be able to view profile views.
- **DASH-002**: Providers MUST be able to view contacts received.
- **DASH-003**: Providers MUST be able to view response behavior metrics.
- **DASH-004**: Providers MUST be able to view reviews and ratings.

### 9.2 Paid/Coverage Controls

- **DASH-005**: Providers SHOULD be able to view active paid visibility status.
- **DASH-006**: Providers SHOULD be able to request/manage service-area expansion.
- **DASH-007**: Providers SHOULD be able to understand current coverage without seeing hidden ranking logic.
- **DASH-008**: Providers SHOULD be able to see paid benefit expiry, renewal, and payment status.

### 9.3 Ranking Logic Privacy

- **DASH-008**: Provider dashboard MUST NOT expose exact ranking formulas.
- **DASH-009**: Provider dashboard MAY show general guidance such as profile completeness, responsiveness, reviews, and activity.

## 10. Admin Panel

### 10.1 Provider Applications

- **ADMIN-001**: Admins MUST be able to review provider applications.
- **ADMIN-002**: Admins MUST be able to approve provider applications.
- **ADMIN-003**: Admins MUST be able to reject provider applications.
- **ADMIN-004**: Provider approval decisions MUST update public visibility.

### 10.2 Identity Verification

- **ADMIN-005**: Admins MUST be able to perform manual provider identity verification.
- **ADMIN-006**: Verification state MUST be stored for each provider.
- **ADMIN-007**: Unverified providers MUST NOT become publicly visible unless explicitly approved by policy.

### 10.3 Reviews, Abuse, and Accounts

- **ADMIN-008**: Admins MUST be able to manage or hide reviews.
- **ADMIN-009**: Admins MUST be able to view abuse reports.
- **ADMIN-010**: Admins MUST be able to flag abuse cases.
- **ADMIN-011**: Admins MUST be able to ban or suspend accounts.
- **ADMIN-012**: Ban/suspension state MUST prevent protected user actions.

### 10.4 Professions and Policies

- **ADMIN-013**: Admins MUST be able to manage professions/categories.
- **ADMIN-014**: Admins SHOULD be able to activate or deactivate professions.
- **ADMIN-015**: Admins SHOULD be able to manage platform policy settings used by product flows.

### 10.5 Paid Product Controls

- **ADMIN-016**: Admins MUST be able to manage paid visibility products or tiers.
- **ADMIN-017**: Admins MUST be able to manage paid product pricing, expiry, renewal, and payment policy.
- **ADMIN-018**: Admins MUST be able to review paid visibility and area expansion requests.

### 10.6 Audit Logging

- **ADMIN-019**: All admin mutation actions MUST be logged.
- **ADMIN-020**: Audit logs MUST include actor, action, target, and timestamp where available.
- **ADMIN-021**: Audit logs SHOULD be reviewable by admins.

## 11. Trust, Safety & Abuse Prevention

### 11.1 Manual Verification

- **SAFETY-001**: Provider trust flow MUST include manual identity verification.
- **SAFETY-002**: Public provider state MUST reflect verification/approval status.

### 11.2 Abuse and Disputes

- **SAFETY-003**: Users MUST be able to report abuse from supported surfaces.
- **SAFETY-004**: Admins MUST be able to review and resolve abuse reports.
- **SAFETY-005**: Resolution outcomes SHOULD be stored with reason and resolver metadata.
- **SAFETY-006**: Review challenges in v1 MUST use report review, report provider, report message, and admin report handling flows.
- **SAFETY-007**: The system MUST NOT require a separate dispute object or dispute workflow for review challenges unless that workflow is explicitly implemented.

### 11.3 Manipulation Detection

- **SAFETY-008**: The system SHOULD detect or support enforcement against fake reviews.
- **SAFETY-009**: The system SHOULD detect or support enforcement against coordinated reviews.
- **SAFETY-010**: The system SHOULD detect or support enforcement against artificial activity signals.
- **SAFETY-011**: The system SHOULD detect or support enforcement against location spoofing.
- **SAFETY-012**: The system SHOULD detect or support enforcement against duplicate or linked accounts.

### 11.4 Penalties

- **SAFETY-013**: Admins MUST be able to apply account suspension or removal.
- **SAFETY-014**: Banned profiles MUST NOT be visible in public customer discovery, public provider profiles, or public ranking.
- **SAFETY-015**: The system SHOULD support ranking penalties for abuse.
- **SAFETY-016**: The system SHOULD support loss of paid benefits after abuse.

### 11.5 Rate Limiting

- **SAFETY-017**: The system MUST apply basic rate limits to sensitive actions.
- **SAFETY-018**: Rate-limited actions SHOULD include contact, messaging, reporting, and review submission.
- **SAFETY-019**: Rate limit failures MUST be handled with clear user feedback.

## 12. Analytics & Tracking

### 12.1 Customer/Provider Interaction Events

- **ANALYTICS-001**: The system MUST track provider profile views.
- **ANALYTICS-002**: The system MUST track contact events.
- **ANALYTICS-003**: The system MUST track WhatsApp reveals.
- **ANALYTICS-004**: The system MUST track chat initiations.
- **ANALYTICS-005**: The system SHOULD track response behavior.

### 12.2 Trust and Reputation Events

- **ANALYTICS-006**: The system MUST track review creation.
- **ANALYTICS-007**: The system SHOULD track review moderation actions.
- **ANALYTICS-008**: The system SHOULD expose aggregated reviews and ratings to provider dashboards.

### 12.3 Ranking, Admin, and Paid Events

- **ANALYTICS-009**: The system SHOULD track ranking/visibility-relevant signals.
- **ANALYTICS-010**: The system MUST track admin actions through audit logs.
- **ANALYTICS-011**: The system SHOULD track paid visibility usage and expiry.
- **ANALYTICS-012**: The system SHOULD track paid area expansion renewal, payment failure, and expiry events.

## 13. Monetization

### 13.1 Visibility-Based Monetization

- **MONEY-001**: The platform MUST monetize provider visibility, not customer transactions.
- **MONEY-002**: The system MUST support paid visibility tiers or products.
- **MONEY-003**: Visibility monetization MUST be pay-as-you-go.
- **MONEY-004**: Eligible geographic expansion MUST cost 250 EGP per month and auto-renew by Visa/card on file through Paymob.
- **MONEY-005**: Paid benefits MUST expire automatically when the paid period ends or payment fails, expires, is canceled, or becomes past due.

### 13.2 Customer Pricing Boundaries

- **MONEY-006**: Customers MUST NOT be charged to use the platform.
- **MONEY-007**: The platform MUST NOT charge customers for contacting providers.

### 13.3 Provider Transaction Boundaries

- **MONEY-008**: The platform MUST NOT take commissions on provider jobs.
- **MONEY-009**: The platform MUST NOT charge per lead in v1.
- **MONEY-010**: The platform MUST NOT process payments between customers and providers.
- **MONEY-011**: The platform MUST NOT guarantee outcomes in exchange for payment.

### 13.4 Pricing Transparency

- **MONEY-012**: Provider pricing tiers MUST be simple and transparent.
- **MONEY-013**: Provider pricing MUST avoid hidden fees.
- **MONEY-014**: Pricing visibility MUST be equal for providers.
- **MONEY-015**: Providers MUST NOT be forced to pay to remain publicly listed.

## 14. Platform Requirements

### 14.1 Mobile Responsiveness

- **PLATFORM-001**: The web UI MUST be mobile-responsive.
- **PLATFORM-002**: Core customer contact flow MUST be usable on mobile.
- **PLATFORM-003**: Core provider dashboard screens SHOULD be usable on mobile.
- **PLATFORM-004**: Core admin screens SHOULD be usable on desktop and tablet at minimum.

### 14.2 Performance

- **PLATFORM-005**: Search SHOULD return results fast enough to support contact in under 60 seconds from entry to provider contact.
- **PLATFORM-006**: Search queries MUST use bounded limits or pagination to protect performance.
- **PLATFORM-007**: The system SHOULD avoid unnecessary blocking operations on customer search/contact paths.

### 14.3 Stability

- **PLATFORM-008**: Admin operations MUST be stable enough for approval, moderation, profession, and paid visibility workflows.
- **PLATFORM-009**: The system SHOULD maintain availability during expected peak usage.
- **PLATFORM-010**: Critical mutation failures MUST show clear errors and avoid partial inconsistent UI states where possible.

### 14.4 Product Boundaries

- **PLATFORM-011**: The system MUST keep clear boundaries between directory discovery and service delivery.
- **PLATFORM-012**: The system MUST NOT introduce marketplace operations outside approved v1 scope.

## 15. Explicitly Out of Scope

- **OOS-001**: The system MUST NOT implement booking or scheduling in v1.
- **OOS-002**: The system MUST NOT implement service payments in v1.
- **OOS-003**: The system MUST NOT implement escrow in v1.
- **OOS-004**: The system MUST NOT guarantee service outcomes in v1.
- **OOS-005**: The system MUST NOT assign jobs in v1.
- **OOS-006**: The system MUST NOT implement job tracking in v1.
- **OOS-007**: The system MUST NOT implement provider certifications in v1.
- **OOS-008**: The system MUST NOT implement multi-city support in v1 unless explicitly approved.
- **OOS-009**: The system MUST NOT implement new native mobile apps in v1; existing wrapper support may remain if already present.
- **OOS-010**: Existing Capacitor iOS support is a native wrapper for the approved web app only.
- **OOS-011**: The iOS wrapper MUST NOT add a separate native marketplace, native payments, native booking, native dispatch, or native job-management scope unless explicitly approved in product requirements.
