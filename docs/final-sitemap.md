# Hand Connect / Herafy Final Project Sitemap

Date: 2026-06-24

Status: Source-backed sitemap of the current repository state.

Scope: This document maps the implemented app, route tree, role access tree, UI/page design trees, backend/API trees, Firebase data trees, deployment trees, and product boundary trees for the Hand Connect / Herafy project.

## Source Of Truth

Primary source files inspected:

| Area | Source |
|---|---|
| App bootstrap | `index.html`, `src/main.tsx`, `src/App.tsx` |
| Canonical route tree | `src/router/app-router.tsx` |
| Redirects and guards | `src/router/route-guards.tsx`, `src/router/redirects.ts` |
| Public shell and role shells | `src/layouts/app-layout.tsx`, `src/layouts/auth-layout.tsx`, `src/layouts/provider-layout.tsx`, `src/layouts/admin-layout.tsx` |
| Page components | `src/features/**/pages/*.tsx` |
| Navigation links | `src/layouts/*.tsx`, page-level `Link` and `navigate(...)` calls |
| Design system | `src/styles/globals.css`, `tailwind.config.ts`, `src/components/ui/*` |
| Translation labels | `src/i18n/locales/en.json`, `src/i18n/locales/ar.json` |
| Domain config | `src/config/professions.ts`, `src/config/neighborhoods.ts`, `src/config/paid-products.ts` |
| Domain types | `src/types/*.ts` |
| Frontend services | `src/services/**/*.ts`, `src/hooks/*.ts` |
| Firebase functions | `functions/src/*.ts` |
| Vercel API endpoints | `api/**/*.ts` |
| Firebase rules/indexes/storage | `firestore.rules`, `firestore.indexes.json`, `storage.rules` |
| Product docs | `docs/product/herafy-feature-list.md`, `docs/product/herafy-srs-implementation-map.md`, `docs/superpowers/specs/2026-04-29-hand-connect-design.md`, `docs/app-store/listing.md` |
| Smoke coverage | `tests/e2e/app.spec.ts` |
| Platform/deploy config | `package.json`, `firebase.json`, `vercel.json`, `capacitor.config.ts` |

Naming note: the workspace/repo is `hand-connect`, the product copy/package/app identity use `Herafy`, and the product docs call it `Herafy / Hand Connect`.

## Product Definition Tree

```text
Hand Connect / Herafy
|-- Product type
|   |-- Cairo home-services directory
|   |-- Connection layer, not marketplace/operator
|   |-- Customers choose providers directly
|   |-- Platform does not assign jobs, set prices, process service payments, or guarantee outcomes
|-- Users
|   |-- Guest
|   |-- Customer
|   |-- Provider
|   |-- Admin
|-- Launch geography
|   |-- Cairo only
|   |-- Neighborhood-by-neighborhood service areas
|-- Initial professions
|   |-- Plumbing
|   |-- Electrical
|   |-- Carpentry
|   |-- Cleaning
|-- Core product jobs
|   |-- Find providers by profession and area
|   |-- Review provider profile, photos, rating, reviews, and coverage
|   |-- Contact through WhatsApp reveal or in-app messaging
|   |-- Review only after real contact
|   |-- Allow providers to manage profile and paid visibility requests
|   |-- Allow admins to approve providers, manage professions, moderate reports, and audit actions
```

## App Bootstrap Tree

```text
index.html
|-- html lang="ar" dir="rtl"
|-- meta viewport
|-- meta description: verified Cairo home-service professionals
|-- title: Herafy
|-- #root
|-- /src/main.tsx
    |-- imports React
    |-- imports i18n setup
    |-- imports global CSS
    |-- renders <App /> inside React.StrictMode
        |-- QueryClientProvider
            |-- <AppRouter />
```

## Canonical Frontend Route Sitemap

Source: `src/router/app-router.tsx`. This is the current route source of truth. `src/config/routes.ts` is a partial helper map and does not include every implemented path.

```text
BrowserRouter
|-- ErrorBoundary
    |-- AppLayout
        |-- /                         LandingPage                       public
        |-- /search                   SearchPage                        public
        |-- /providers/:id            ProviderProfilePage               public view, auth required for contact/report actions
        |-- PublicOnlyRoute
        |   |-- AuthLayout
        |       |-- /login             LoginPage                         guest only
        |       |-- /register          RegisterPage                      guest only
        |       |-- /join-provider     RegisterPage                      guest only, provider role preselected
        |-- /pending                  PendingProviderPage               route is public in router, content depends on auth providerStatus
        |-- ProtectedRoute
        |   |-- /messages             ConversationsPage                 any authenticated active user
        |   |-- /messages/:id         ConversationPage                  any authenticated active user
        |-- ProtectedRoute role=customer
        |   |-- /reviews/new/:providerId
        |       |-- NewReviewPage                                          customer only, contact eligibility checked in page/service
        |-- ProtectedRoute role=provider
        |   |-- providerStatus must be approved, else redirect /pending
        |   |-- ProviderLayout
        |       |-- /dashboard        ProviderDashboardPage              approved provider only
        |       |-- /profile/edit     EditProviderProfilePage            approved provider only
        |       |-- /visibility       VisibilityPage                     approved provider only
        |-- ProtectedRoute role=admin
        |   |-- /admin               AdminLayout                        admin only
        |       |-- /admin            AdminDashboardPage                 admin overview index
        |       |-- /admin/applications ApplicationsPage                 provider application review
        |       |-- /admin/providers  ProvidersPage                      provider moderation/account controls
        |       |-- /admin/professions ProfessionsPage                   profession CRUD/toggle
        |       |-- /admin/visibility VisibilityRequestsPage             paid visibility review
        |       |-- /admin/reports    ReportsPage                        abuse reports/moderation
        |       |-- /admin/actions    AuditLogPage                       admin action log
        |-- *                        Navigate to /                      fallback
```

## Route Access And Redirect Tree

Source: `src/router/route-guards.tsx`, `src/router/redirects.ts`.

```text
Initial app load
|-- AppRouter useEffect
|   |-- useUiStore.hydrateLanguage()
|   |-- useAuthStore.initialize()
|
PublicOnlyRoute
|-- If auth is not initialized
|   |-- LoadingState: common.sessionLoading
|-- If user exists
|   |-- admin -> /admin
|   |-- provider -> /dashboard
|   |-- customer -> /search
|-- Else
|   |-- render child auth route
|
ProtectedRoute optional role
|-- If auth is not initialized
|   |-- LoadingState: common.sessionLoading
|-- If no user
|   |-- /login with state.from = current path
|-- If role required and user role mismatches
|   |-- /
|-- If role=provider and providerStatus is not approved
|   |-- /pending
|-- Else
|   |-- render protected child route
|
Post-login redirect
|-- no user -> /login
|-- admin -> /admin
|-- provider approved -> /dashboard
|-- provider not approved -> /pending
|-- customer -> /search
```

## Top-Level Navigation Tree

Source: `src/layouts/app-layout.tsx`.

```text
AppLayout
|-- Sticky header
|   |-- Brand link: /, label app.name Herafy
|   |-- LanguageToggle: ar <-> en, updates html lang/dir and localStorage
|   |-- Auth action area
|   |   |-- Guest
|   |   |   |-- /join-provider: Join as provider
|   |   |   |-- /login: Login
|   |   |-- Authenticated user
|   |       |-- Logout button
|   |-- Horizontal top nav
|       |-- /search shown to everyone
|       |-- /messages shown to any authenticated user
|       |-- /dashboard shown only to providers
|       |-- /admin shown only to admins
|-- Main content
    |-- max width 7xl
    |-- route-motion wrapper keyed by pathname
    |-- nested route outlet
```

## Layout Design Trees

```text
AppLayout
|-- Global shell for all routed pages
|-- Sticky translucent header with brand, language, auth actions, role-aware nav
|-- Route animation wrapper
|-- Mobile: header stacks vertically, nav scrolls horizontally
|-- Desktop: header aligns horizontally, content max width 7xl

AuthLayout
|-- Two-column auth presentation on large screens
|-- Left brand-panel hidden on small screens
|-- Right centered auth form outlet
|-- Copy: trust, calm, direct search/contact

ProviderLayout
|-- Two-column provider workspace on large screens
|-- Sidebar/card navigation
|-- Links: /dashboard, /profile/edit, /visibility
|-- Mobile/tablet: horizontal scroll nav

AdminLayout
|-- Two-column admin workspace on large screens
|-- Sidebar/card navigation
|-- Links: /admin, /admin/applications, /admin/providers, /admin/professions, /admin/visibility, /admin/reports, /admin/actions
|-- Mobile/tablet: horizontal scroll nav
```

## Public Page Design Trees

### `/` LandingPage

```text
LandingPage
|-- Two-column hero section
|-- Left brand-panel
|   |-- brand-eyebrow
|   |-- section label: Cairo launch / direct discovery
|   |-- page title
|   |-- page lead
|   |-- CTA row
|   |   |-- /search: Start searching
|   |   |-- /join-provider: Join as a provider
|   |   |-- Direct contact explainer chip
|   |-- Feature cards
|       |-- Verified profiles
|       |-- Mobile-first
|-- Right visual panel
    |-- Unsplash home-service image
    |-- Secondary eyebrow/title/copy
    |-- Positioning: connection layer, not operator
```

Primary outbound links: `/search`, `/join-provider`.

### `/search` SearchPage

```text
SearchPage
|-- PageIntro
|   |-- eyebrow: Find trusted help
|   |-- title: Search providers
|   |-- lead: choose profession and area
|-- Filter card
|   |-- Profession select
|   |   |-- active professions from service or fallback config
|   |-- Area select
|   |   |-- neighborhoods config
|   |-- Use my location button
|   |   |-- geolocation unavailable state
|   |   |-- permission denied state
|   |   |-- nearest area selected state
|   |   |-- locating disabled state
|   |-- Profession-load error state
|-- Results states
|   |-- LoadingState while provider search loads
|   |-- EmptyState on search error with retry button
|   |-- EmptyState when zero results
|-- Provider result grid
    |-- ProviderResultCard per provider
        |-- optional photo
        |-- brand rule
        |-- display name
        |-- profession label
        |-- paid/featured badge if active paid visibility
        |-- short bio
        |-- service area list
        |-- coverage radius
        |-- average rating
        |-- /providers/:id link
```

Query params: `profession`, `neighborhood`.

Filter defaults/fallbacks: normalized via `normalizeSearchFilters`.

Configured professions: `plumbing`, `electrical`, `carpentry`, `cleaning`.

Configured neighborhoods: `new-cairo`, `nasr-city`, `maadi`, `heliopolis`, `zamalek`, `dokki`, `mohandessin`, `shorouk`.

### `/providers/:id` ProviderProfilePage

```text
ProviderProfilePage
|-- Data load
|   |-- provider profile by id
|   |-- visible provider reviews
|   |-- profile view increment side effect
|-- EmptyState
|   |-- provider unavailable when profile query has no data
|-- Main two-column layout
|-- Left content stack
|   |-- Provider hero card
|   |   |-- card variant highlight when paid visibility active
|   |   |-- optional primary photo
|   |   |-- provider name
|   |   |-- profession
|   |   |-- bio
|   |   |-- service area pills
|   |   |-- coverage radius
|   |   |-- no-guarantee copy
|   |   |-- WhatsApp reveal button if visible
|   |   |-- in-app message button
|   |   |-- report provider link for authenticated users
|   |-- Reviews card
|       |-- review list
|       |-- rating/customer/comment per review
|       |-- report review link for authenticated users
|       |-- Add review link for customers -> /reviews/new/:providerId
|-- Right sticky contact card
    |-- WhatsApp reveal button or unavailable copy
    |-- revealed phone number and external wa.me link after reveal
    |-- quick message form with default message
```

Action redirects: unauthenticated WhatsApp, message, report provider, and report review actions redirect to `/login`.

Action routes: successful quick message navigates to `/messages/:conversationId`.

External link: `wa.me` URL returned by contact service.

### `/pending` PendingProviderPage

```text
PendingProviderPage
|-- Card variant subtle
|-- brand-eyebrow
|-- section label: Application status
|-- title
|   |-- rejected title when providerStatus=rejected
|   |-- pending title otherwise
|-- copy
|   |-- manual identity verification only
|   |-- no skill certificate or guarantee
|-- current status note
```

Implementation note: the router exposes `/pending` without an explicit guard. Provider-protected routes redirect unapproved providers here, but guests can also load the page and see a status based on empty auth state.

## Auth Page Design Trees

### `/login` LoginPage

```text
LoginPage inside AuthLayout
|-- Card
|-- brand-eyebrow
|-- section label: Welcome back
|-- title: Login
|-- Form
|   |-- email input, default customer@hand.test in current demo UI
|   |-- password input, default password in current demo UI
|   |-- error text state
|   |-- login submit
|   |-- Google login button
|   |-- /register link
|-- Submit behavior
    |-- email/password login -> getPostLoginRedirect
    |-- Google login -> getPostLoginRedirect
```

### `/register` RegisterPage

```text
RegisterPage inside AuthLayout
|-- Card
|-- brand-eyebrow
|-- section label: Join Herafy
|-- title: Register
|-- Role toggle
|   |-- Register as customer
|   |-- Register as provider
|-- Shared fields
|   |-- name
|   |-- email
|   |-- password
|   |-- confirm password
|   |-- phone
|-- Provider-only fields
|   |-- profession select
|   |-- service area select
|   |-- WhatsApp number
|   |-- national ID file upload
|   |-- file size limit: 3 MB
|   |-- accepted file types: png, jpeg, webp, svg, pdf
|   |-- identity help text
|-- Error states
|   |-- identity required
|   |-- identity too large
|   |-- password too short
|   |-- password mismatch
|   |-- localized registration failure
|-- Submit behavior
    |-- customer registration -> session set -> /search
    |-- provider registration -> session set -> /pending
```

### `/join-provider` RegisterPage Alias

```text
Join-provider alias
|-- Same component as /register
|-- Provider role preselected when pathname is /join-provider
|-- Also preselects provider when query param role=provider is present
```

## Authenticated Messaging Design Trees

### `/messages` ConversationsPage

```text
ConversationsPage
|-- Card
|-- title: Messages
|-- EmptyState when conversation list length is 0
|-- Conversation link list
    |-- /messages/:id per conversation
    |-- conversation id label
    |-- unread count badge for current user
    |-- last message preview
```

### `/messages/:id` ConversationPage

```text
ConversationPage
|-- Card
|-- title: Messages
|-- Message panel
|   |-- min height chat area
|   |-- message bubbles
|   |-- current user bubble style
|   |-- other user bubble style
|   |-- report message action on messages sent by the other participant
|-- Compose form
    |-- message input
    |-- send button
```

## Customer Review Design Tree

### `/reviews/new/:providerId` NewReviewPage

```text
NewReviewPage
|-- Customer-only route guard
|-- Contact eligibility query
|-- If eligible=false
|   |-- subtle card with not-eligible copy
|-- Else
|   |-- Card
|   |-- brand-eyebrow
|   |-- section label: Share your experience
|   |-- title: Add review
|   |-- Form
|       |-- rating select 1 through 5, default 5
|       |-- comment textarea
|       |-- save button
|-- Submit behavior
    |-- createReview(customer, provider, rating, comment)
    |-- navigate back to /providers/:providerId
```

## Provider Workspace Design Trees

### `/dashboard` ProviderDashboardPage

```text
ProviderDashboardPage inside ProviderLayout
|-- PageIntro
|   |-- eyebrow: Provider insights
|   |-- title: Provider dashboard
|-- Stat tile grid
|   |-- profile views
|   |-- contacts
|   |-- rating
|   |-- conversations
|   |-- response rate
|   |-- average first response
|-- Activity chart card
|   |-- Recharts ResponsiveContainer
|   |-- BarChart over views, contacts, rating
|-- Latest reviews card
    |-- review list when available
    |-- no reviews soft note otherwise
```

### `/profile/edit` EditProviderProfilePage

```text
EditProviderProfilePage inside ProviderLayout
|-- Card
|-- brand-eyebrow
|-- section label: Provider settings
|-- title: Edit profile
|-- Form
|   |-- display name input, disabled
|   |-- bio textarea
|   |-- profession select
|   |-- service area select, disabled
|   |-- WhatsApp number input
|   |-- WhatsApp visibility select: active/inactive
|   |-- profile photo file input
|   |-- save button
|-- Submit behavior
    |-- updates bio/profession/WhatsApp visibility/photo
    |-- invalidates provider queries
```

### `/visibility` VisibilityPage

```text
VisibilityPage inside ProviderLayout
|-- Card
|-- title: Paid visibility
|-- Disclosure soft note
|   |-- payment gives exposure/tools only
|   |-- no guaranteed customers or jobs
|-- Area expansion eligibility note
|   |-- shown when selected area is outside current service areas
|   |-- eligible when review count >= 30
|   |-- locked when review count < 30
|-- Request form
|   |-- service area select
|   |-- manual payment notes textarea
|   |-- request paid visibility button
|-- Error state
|   |-- area expansion locked
|-- Request history list
    |-- service area
    |-- status label
    |-- optional note label
```

## Admin Workspace Design Trees

### `/admin` AdminDashboardPage

```text
AdminDashboardPage inside AdminLayout
|-- PageIntro
|   |-- eyebrow: Admin overview
|   |-- title: Admin dashboard
|-- Stat tile grid
    |-- pending applications
    |-- approved providers
    |-- suspended providers
    |-- pending visibility requests
    |-- reviews under review
```

### `/admin/applications` ApplicationsPage

```text
ApplicationsPage inside AdminLayout
|-- Card
|-- title: Applications
|-- Pending provider application list
    |-- display name
    |-- profession
    |-- service areas
    |-- identity document panel when present
    |   |-- filename
    |   |-- file size
    |   |-- uploaded timestamp
    |   |-- image preview for image files
    |   |-- external/open link for non-image downloadable files
    |   |-- secure-storage note when no preview/download URL
    |-- identity missing warning when absent
    |-- approve button
    |-- reject button
```

### `/admin/providers` ProvidersPage

```text
ProvidersPage inside AdminLayout
|-- Card
|-- title: Providers
|-- Provider list
    |-- display name
    |-- provider status label
    |-- account active/banned label
    |-- suspend button when provider is not already suspended
    |-- ban or unban account button
```

### `/admin/professions` ProfessionsPage

```text
ProfessionsPage inside AdminLayout
|-- Create profession card
|   |-- Arabic name input
|   |-- English name input
|   |-- slug input, fallback generated from English name
|   |-- icon name input, default Wrench
|   |-- save profession button
|-- Profession list card
    |-- Arabic / English name
    |-- slug
    |-- active/inactive status
    |-- toggle active/inactive button
```

### `/admin/visibility` VisibilityRequestsPage

```text
VisibilityRequestsPage inside AdminLayout
|-- Card
|-- title: Visibility requests
|-- Visibility request list
    |-- provider id
    |-- status label
    |-- optional note label
    |-- pending-only action row
        |-- confirm payment button
        |-- reject button
```

### `/admin/reports` ReportsPage

```text
ReportsPage inside AdminLayout
|-- Card
|-- title: Reports
|-- EmptyState when no open reports
|-- Report list
    |-- reason label
    |-- target type
    |-- target id
    |-- status
    |-- reporter label/id
    |-- optional target label
    |-- closed metadata when status=closed
    |-- open-report actions
        |-- hide review for review reports
        |-- resolve report
```

### `/admin/actions` AuditLogPage

```text
AuditLogPage inside AdminLayout
|-- Card
|-- title: Admin actions
|-- EmptyState when no actions
|-- Admin action list
    |-- localized action label
    |-- target type label
    |-- target id
    |-- reason label
```

## Page-to-Service Data Tree

```text
LandingPage
|-- static copy/images only

SearchPage
|-- useQuery listProfessions
|-- useSearchProviders
|-- search.service
|-- demo or firebase search adapter
|-- config neighborhoods/professions fallback

ProviderProfilePage
|-- useProviderProfile -> providers.service.getProviderById
|-- getProviderReviews -> reviews.service
|-- incrementProfileView -> analytics/providers service path
|-- revealWhatsApp -> engagement callable/service
|-- startConversation -> messaging service/callable
|-- reportProvider/reportReview -> admin/report service/callable

LoginPage
|-- useAuth.login
|-- useAuth.loginWithGoogle
|-- auth.service -> demo or firebase auth adapter

RegisterPage
|-- authService.registerCustomer
|-- authService.registerProvider
|-- provider identity file converted to preview data URL

PendingProviderPage
|-- useAuth providerStatus

ConversationsPage
|-- useConversations -> messaging.service

ConversationPage
|-- useConversation
|-- useSendMessage
|-- useReportMessage

NewReviewPage
|-- useContactCheck
|-- createReview

ProviderDashboardPage
|-- useOwnedProvider
|-- getProviderMetrics

EditProviderProfilePage
|-- useOwnedProvider
|-- updateProviderProfile

VisibilityPage
|-- useOwnedProvider
|-- createVisibilityRequest
|-- listProviderVisibilityRequests

Admin pages
|-- useAdminOverview
|-- useProviderApplications
|-- useAllProviders
|-- useVisibilityRequests
|-- useReports
|-- useAuditLog
|-- useSetUserBanned
|-- useHideReview
|-- useResolveReport
|-- admin.service
```

## Domain Data Model Tree

Types source: `src/types/*.ts`. Rules source: `firestore.rules`. Demo source: `src/services/demo/demo-db.ts`.

```text
users
|-- uid
|-- email
|-- role: customer | provider | admin
|-- status: active | banned
|-- ban metadata
|-- displayName
|-- phone
|-- language: ar | en
|-- createdAt

providers
|-- id
|-- userId
|-- displayName
|-- phone
|-- profession
|-- bio
|-- status: pending | approved | suspended | rejected
|-- nationalIdVerified
|-- rejectionReason
|-- serviceAreas: [{ neighborhood, city: cairo }]
|-- serviceAreaKeys
|-- initialServiceAreaKey
|-- coverageRadiusKm
|-- coverageAreaKeys
|-- whatsappNumber
|-- whatsappVisible
|-- visibilityTier: organic | paid
|-- visibilityPaidUntil
|-- paidVisibilityStartedAt
|-- activeVisibilityRequestId
|-- activeVisibilityProductId
|-- activeVisibilityProductVersion
|-- paidVisibilityHoldUntil
|-- rankingPenalty
|-- rankingPenaltyUntil
|-- verificationStatus
|-- verification reviewed metadata
|-- profileViews
|-- avgRating
|-- reviewCount
|-- activityScore
|-- photos
|-- createdAt
|-- approvedAt

providerIdentityDocuments
|-- providerId
|-- fileName
|-- fileType
|-- fileSize
|-- uploadedAt
|-- previewDataUrl

professions
|-- id
|-- nameAr
|-- nameEn
|-- slug
|-- icon
|-- active
|-- sortOrder

contacts
|-- id
|-- customerId
|-- providerId
|-- type: whatsapp_reveal | platform_message
|-- createdAt
|-- hasReview

conversations
|-- id
|-- participants
|-- providerId
|-- customerId
|-- lastMessage
|-- lastMessageAt
|-- unreadCount by user id
|-- messages subcollection
    |-- id
    |-- conversationId
    |-- senderId
    |-- text
    |-- createdAt
    |-- read

reviews
|-- id
|-- providerId
|-- customerId
|-- customerName
|-- contactId
|-- rating: 1..5
|-- comment
|-- status: visible | under_review | removed
|-- createdAt

visibilityRequests
|-- id
|-- providerId
|-- type: boost | area_expansion
|-- tier: paid
|-- serviceArea
|-- status: pending | approved | rejected
|-- paymentConfirmedBy
|-- paymentMethod: manual_cash | manual_wallet | manual_bank_transfer
|-- paymentStatus: pending | matched | rejected | expired
|-- paymentReference
|-- productSnapshot
|-- disclosureVersion
|-- disclosureAcceptedAt
|-- notes
|-- requestedAt
|-- processedAt
|-- rejectionReason

analyticsEvents
|-- server-owned analytics records
|-- admin-readable only

adminActions
|-- id
|-- adminId
|-- targetType: provider | profession | visibilityRequest | review | report | user
|-- targetId
|-- action
|-- reason
|-- createdAt

reports
|-- id
|-- targetType: provider | review | message
|-- targetId
|-- targetLabel
|-- reporterId
|-- reporterName
|-- reason
|-- status: open | closed
|-- resolvedBy
|-- resolvedAt
|-- resolutionReason
|-- createdAt
```

## Firebase Rules Access Tree

```text
Firestore rules
|-- users
|   |-- owner/admin read
|   |-- owner create as customer/provider active
|   |-- admin update or owner-safe profile update
|-- providers
|   |-- approved public read
|   |-- owner/admin read
|   |-- active owner create pending
|   |-- admin update or owner-limited profile fields update
|-- providerIdentityDocuments
|   |-- admin or owner read
|   |-- active owner create/update
|-- professions
|   |-- public read
|   |-- admin write
|-- contacts
|   |-- admin/customer/provider read
|   |-- direct create denied
|   |-- admin update only
|-- conversations
|   |-- participants read
|   |-- direct create denied
|   |-- participants can update lastMessage/lastMessageAt/unreadCount
|   |-- messages
|       |-- participants read
|       |-- sender participant create
|       |-- other participant can mark read
|-- reviews
|   |-- visible public read or admin read
|   |-- direct create denied
|   |-- admin update
|-- visibilityRequests
|   |-- admin or provider owner read
|   |-- provider owner create pending request
|   |-- boost requires area already in provider serviceAreaKeys
|   |-- area expansion requires area not currently owned and reviewCount >= 30
|   |-- update/delete denied
|-- analyticsEvents
|   |-- admin read
|   |-- direct writes denied
|-- adminActions
|   |-- admin read
|   |-- admin create with allowed target types
|-- reports
|   |-- admin read/update
|   |-- direct create/delete denied
```

```text
Storage rules
|-- providerPhotos/{providerId}/{fileName}
|   |-- public read
|   |-- provider owner write
|-- identityDocuments/{providerId}/{fileName}
|   |-- admin or provider owner read
|   |-- provider owner write
|-- all other paths
    |-- denied
```

## Paid Visibility And Monetization Tree

Source: `src/config/paid-products.ts`, `src/types/monetization.ts`, `src/types/visibility.ts`.

```text
Paid products
|-- visibility_boost_30_manual
|   |-- version 1
|   |-- type visibility_boost
|   |-- active true
|   |-- duration 30 days
|   |-- priceAmount null
|   |-- currency EGP
|   |-- billing one_time
|   |-- capPolicy standard_visibility_cap
|-- area_expansion_30_manual
    |-- version 1
    |-- type area_expansion
    |-- active true
    |-- duration 30 days
    |-- priceAmount null
    |-- currency EGP
    |-- billing recurring_manual
    |-- capPolicy coverage_only
```

Product boundary: monetization is provider visibility/coverage only. Customer charges, job commissions, per-lead charges, service payments, escrow, booking, and job tracking are out of scope in the current product docs and absent from the implemented route tree.

## Backend Function Tree

Source: `functions/src/index.ts` and `functions/src/*.ts`.

```text
Firebase callable/business exports
|-- providers.ts
|   |-- approveProvider
|   |-- rejectProvider
|   |-- suspendProvider
|   |-- helpers: isActiveAdmin, approvedProviderPatch, rejectedProviderPatch, suspendedProviderPatch
|-- reviews.ts
|   |-- createReview
|   |-- hideReview
|   |-- recalculateRating
|   |-- helpers: isActiveUser, isActiveAdmin
|-- analytics.ts
|   |-- trackProfileView
|   |-- writeAnalyticsEvent
|-- visibility.ts
|   |-- approveVisibility
|   |-- approveVisibilityRequest
|   |-- rejectVisibilityRequest
|   |-- expiredVisibilityPatch
|-- engagement.ts
|   |-- revealWhatsApp
|   |-- startConversation
|   |-- reportProvider
|   |-- reportReview
|   |-- reportMessage
|-- abuse.ts
|   |-- isPotentialLeadSpam
|-- audit.ts
    |-- writeAudit
```

## Vercel API Endpoint Tree

Source: `api/**/*.ts`.

```text
/api/health
|-- GET
|-- response: ok, service, provider, environment, region, timestamp

/api/abuse/check
|-- POST
|-- body: revealsInHour, messagesInHour
|-- response: isPotentialLeadSpam boolean

/api/admin/assert-reason
|-- POST
|-- body: reason
|-- validates admin reason helper

/api/reviews/recalculate
|-- POST
|-- body: reviews array
|-- returns recalculated rating aggregate

/api/visibility/approve
|-- POST
|-- body: optional now, optional days
|-- returns paidUntil from approveVisibility helper
```

## Frontend Service Architecture Tree

```text
Components
|-- call hooks
    |-- hooks call services
        |-- services choose data source
            |-- demo adapters use localStorage-backed demo DB
            |-- firebase adapters use Firebase SDK/functions/storage
```

```text
Data source selection
|-- VITE_HAND_CONNECT_DATA_SOURCE
|   |-- demo
|   |-- firebase
|-- development fallback: demo when env is unset
|-- production: env must be set to demo or firebase
|-- firebase mode also requires Firebase env config
```

Service modules:

| Service area | Contract / public service | Demo adapter | Firebase adapter |
|---|---|---|---|
| Auth | `auth.service.ts`, `contracts/auth.contract.ts` | `demo/auth.demo.ts` | `firebase/auth.firebase.ts` |
| Search | `search.service.ts`, `contracts/search.contract.ts` | `demo/search.demo.ts` | `firebase/search.firebase.ts` |
| Providers | `providers.service.ts`, `contracts/providers.contract.ts` | `demo/providers.demo.ts` | `firebase/providers.firebase.ts` |
| Messaging | `messaging.service.ts`, `contracts/messaging.contract.ts` | `demo/messaging.demo.ts` | `firebase/messaging.firebase.ts` |
| Reviews | `reviews.service.ts`, `contracts/reviews.contract.ts` | `demo/reviews.demo.ts` | `firebase/reviews.firebase.ts` |
| Visibility | `visibility.service.ts`, `contracts/visibility.contract.ts` | `demo/visibility.demo.ts` | `firebase/visibility.firebase.ts` |
| Admin | `admin.service.ts`, `contracts/admin.contract.ts` | `demo/admin.demo.ts` | `firebase/admin.firebase.ts` |
| Analytics | `analytics.service.ts` | demo/local path | Firebase/callable path |

## Design System Tree

Source: `src/styles/globals.css`, `tailwind.config.ts`, `src/components/ui/*.tsx`.

```text
Visual identity
|-- Arabic-first and RTL-first
|-- Warm paper/cream/orange palette
|-- Directory/trust tone, not marketplace/checkout tone
|-- Rounded cards, soft shadows, brand rules, subtle motion
|-- Mobile-first responsive layouts
```

```text
Tokens and foundations
|-- CSS variables
|   |-- background, foreground, card, primary, muted, border, destructive
|   |-- radius 16px
|   |-- Herafy colors: hc-orange, hc-orange-soft, hc-orange-ring, hc-ink, hc-paper, hc-paper-deep, hc-surface, hc-cream, hc-rule
|   |-- motion durations: fast, base, slow, route
|   |-- easing curves: out-quart, out-quint, out-expo
|-- Fonts
|   |-- Cairo for Arabic/default
|   |-- Source Sans 3 for Latin/body fallback
|   |-- Archivo Black for brand/display numerals
|-- Tailwind extension
|   |-- semantic colors mapped to CSS variables
|   |-- border radius mapped to CSS variable
|   |-- font families sans/display/latin
```

```text
Global utility classes
|-- brand-eyebrow
|-- brand-title
|-- brand-rule
|-- brand-panel
|-- brand-number
|-- page-title
|-- page-lead
|-- section-label
|-- soft-note
|-- top-nav-link
|-- sidebar-link
|-- soft-list-item
|-- stat-tile
|-- route-motion
|-- motion-header
|-- motion-surface
|-- motion-field
|-- motion-press
|-- motion-reveal
|-- motion-pop
|-- motion-pulse
|-- motion-shimmer
|-- motion-stagger
|-- message-bubble
|-- paid-badge
```

```text
Shared UI primitives
|-- Button
|   |-- variants: default, secondary, outline, ghost, destructive
|   |-- sizes: sm, md, lg
|   |-- asChild slot support
|-- Card
|   |-- variants: default, subtle, highlight, ghost
|   |-- CardHeader
|   |-- CardTitle
|   |-- CardContent
|-- Input
|-- Textarea
|-- Select
|-- Label
|-- EmptyState
|-- LoadingState
|-- ErrorBoundary
|-- PageIntro
|-- LanguageToggle
```

```text
Motion and accessibility tree
|-- Route enter animation through route-motion
|-- Header drop-in animation
|-- Card/list/tile hover lift on hover-capable devices
|-- Staggered children animations
|-- Message bubble animation
|-- Shimmer support
|-- Reduced motion media query
    |-- animation duration forced to 0.01ms
    |-- transition duration forced to 0.01ms
    |-- shimmer hidden
    |-- hover/active transforms disabled
```

## Internationalization And Direction Tree

```text
i18n
|-- Default language: ar
|-- Supported languages: ar, en
|-- LanguageToggle
|   |-- ar -> en
|   |-- en -> ar
|-- ui store
|   |-- localStorage key: herafy-language
|   |-- document.documentElement.lang updated
|   |-- document.documentElement.dir updated
|       |-- ar -> rtl
|       |-- en -> ltr
|-- Translation key groups
    |-- app
    |-- nav
    |-- common
    |-- home
    |-- auth
    |-- search
    |-- provider
    |-- messages
    |-- reviews
    |-- visibility
    |-- dashboard
    |-- admin
    |-- status
    |-- report
    |-- ui
    |-- error
    |-- validation
```

## Search And Ranking Design Tree

```text
Search inputs
|-- profession
|-- neighborhood
|-- optional geolocation-derived nearest neighborhood

Search eligibility
|-- profession must be selected
|-- neighborhood must be selected
|-- provider must be approved for public visibility

Search card ranking/display signals
|-- service area/coverage match
|-- rating
|-- review count
|-- activity score
|-- paid visibility active flag
|-- low-view fairness signal per implementation map

Search result display
|-- highlighted card for active paid visibility
|-- Featured badge for active paid visibility
|-- organic providers remain visible
|-- no exact ranking formula shown to users
```

## Customer Journey Tree

```text
Guest discovery
|-- / landing
|-- /search
|-- /providers/:id
|-- Attempts contact/report/review
    |-- redirected to /login or blocked by role/eligibility

Customer signup/login
|-- /register with customer role
|-- /login email/password or Google
|-- post-login /search

Customer contact
|-- /search selects profession and area
|-- /providers/:id opens profile
|-- reveal WhatsApp
|   |-- contact record created
|   |-- number displayed
|   |-- external WhatsApp link available
|-- message in app
|   |-- conversation/contact created
|   |-- redirect /messages/:id

Customer review
|-- /reviews/new/:providerId
|-- contact eligibility check
|-- create review
|-- redirect provider profile

Customer safety
|-- report provider from profile
|-- report review from profile
|-- report message from conversation
```

## Provider Journey Tree

```text
Provider signup
|-- /join-provider
|-- provider role preselected
|-- submit profile, profession, area, WhatsApp, identity document
|-- redirect /pending

Provider approval lifecycle
|-- pending provider cannot access provider workspace
|-- provider routes redirect unapproved status to /pending
|-- admin approves provider application
|-- approved provider post-login -> /dashboard

Provider workspace
|-- /dashboard
|   |-- metrics
|   |-- activity chart
|   |-- latest reviews
|-- /profile/edit
|   |-- update bio/profession/WhatsApp/photo
|   |-- initial service area currently disabled in edit UI
|-- /visibility
|   |-- request boost in existing service area
|   |-- request area expansion only when review threshold passes
|   |-- view request history
|-- /messages
    |-- shared messaging routes with customers
```

## Admin Journey Tree

```text
Admin login
|-- /login
|-- post-login /admin

Admin overview
|-- /admin
|-- review counts for pending applications, approved providers, suspended providers, pending visibility, reviews under review

Provider application moderation
|-- /admin/applications
|-- review identity document
|-- approve provider
|-- reject provider

Provider/account moderation
|-- /admin/providers
|-- suspend provider
|-- ban user account
|-- unban user account

Profession management
|-- /admin/professions
|-- create profession
|-- toggle profession active/inactive

Paid visibility moderation
|-- /admin/visibility
|-- confirm manual payment
|-- reject unmatched payment/request

Abuse moderation
|-- /admin/reports
|-- hide review for review report
|-- resolve report

Audit trail
|-- /admin/actions
|-- view localized action, target, reason
```

## Deployment And Platform Tree

```text
Web app
|-- Vite build
|-- React 19
|-- TypeScript
|-- Tailwind CSS
|-- React Router
|-- React Query
|-- Zustand
|-- Firebase SDK

Firebase Hosting
|-- site: hand-connect-cairo
|-- target: herafy-cairo
|-- public directory: dist
|-- rewrite all routes to /index.html

Vercel
|-- framework: vite
|-- buildCommand: npm run build
|-- outputDirectory: dist
|-- rewrite non-api routes to /index.html
|-- API routes under /api/*

Firebase backend
|-- Firestore rules
|-- Firestore indexes
|-- Storage rules
|-- Functions source: functions
|-- Emulators
    |-- auth 9099
    |-- firestore 8080
    |-- storage 9199
    |-- functions 5001
    |-- hosting 5000
    |-- emulator UI 4000

Capacitor iOS wrapper
|-- appId: com.herafy-eg.app
|-- appName: Herafy
|-- webDir: dist
|-- iOS contentInset automatic
```

## Test And Verification Tree

Source: `package.json`, `tests/e2e/app.spec.ts`.

```text
Scripts
|-- npm run dev
|-- npm run build
|-- npm run preview
|-- npm run lint
|-- npm run test
|-- npm run test:rules
|-- npm run e2e
|-- npm run release:check
|-- npm run cap:sync:ios
|-- npm run cap:open:ios
|-- npm run firebase:emulators
|-- npm run seed:dev
|-- npm run admin:create
```

```text
Playwright E2E coverage
|-- Arabic RTL landing and search flow
|-- customer login, WhatsApp reveal, and message after contact
|-- provider and admin protected routes operational
|-- provider join request stores identity document for admin review
|-- mobile auth and shell layout readability
|-- reduced motion route transitions
```

## Documentation-Only Or Partial Product Areas

The codebase substantially implements the v1 sitemap, but the docs and implementation map identify several areas that are only partial, config-only, or intentionally absent.

```text
Partial or still maturing
|-- Phone login/phone ownership verification
|-- OAuth role linking beyond default customer creation
|-- Geolocation/radius accuracy beyond nearest-neighborhood selection and coverage keys
|-- Ranking governance/configurable weights/admin policy controls
|-- Paid product pricing amounts, renewal, expiry jobs, recurring billing enforcement
|-- Analytics event pipeline hardening, especially trusted profile views/paid/ranking events
|-- Server-side ownership of all privileged admin/payment-like mutations
|-- UI tests for many role/edge states
|-- Error states on some mutation flows

Explicitly out of scope in v1
|-- Booking
|-- Scheduling
|-- Service payments
|-- Escrow
|-- Customer charges
|-- Job assignment
|-- Job tracking
|-- Provider certifications
|-- Public provider replies to reviews
|-- Multi-city support beyond Cairo
```

## Docs Versus Current Implementation Notes

These are not defects in the sitemap, but they matter when using older docs as design authority.

| Topic | Docs mention | Current source-backed state |
|---|---|---|
| Public auth routes | `/login`, `/register` | Also has `/join-provider` alias with provider role preselected |
| `/pending` | Listed under provider routes in design doc | Router exposes it publicly, but provider guards redirect unapproved providers there |
| Phone OTP | Original design spec lists Firebase phone OTP | Current auth UI/source uses email/password and Google, with phone as profile/contact field |
| Infinite scroll | Original search flow mentions `useInfiniteQuery` | Current search uses standard `useQuery` and mapped result grid |
| shadcn/ui | Original design spec mentions shadcn/ui | Current primitives are local `components/ui` built with CVA/Radix Slot where needed |
| Inter font | Original design spec mentions Inter | Current CSS uses Cairo, Source Sans 3, and Archivo Black |
| Mobile native scope | Older feature list says native apps out of scope for v1 | Repo now includes Capacitor iOS wrapper and App Store docs, still web-first |

## Final Implemented Route Inventory

| Path | Page/component | Guard | Primary users | Primary purpose |
|---|---|---|---|---|
| `/` | `LandingPage` | public | guest/customer/provider/admin | brand/product entry and CTAs |
| `/search` | `SearchPage` | public | guest/customer | search approved providers by profession and area |
| `/providers/:id` | `ProviderProfilePage` | public view | guest/customer | provider profile, reviews, contact actions |
| `/login` | `LoginPage` | guest only | guest | email/password and Google login |
| `/register` | `RegisterPage` | guest only | guest | customer or provider registration |
| `/join-provider` | `RegisterPage` | guest only | guest/provider applicant | provider registration alias |
| `/pending` | `PendingProviderPage` | public route | provider applicant | provider review status |
| `/messages` | `ConversationsPage` | authenticated | customer/provider/admin if authenticated | conversation list |
| `/messages/:id` | `ConversationPage` | authenticated | conversation participants | chat thread |
| `/reviews/new/:providerId` | `NewReviewPage` | customer | customer | contact-gated review form |
| `/dashboard` | `ProviderDashboardPage` | approved provider | provider | metrics dashboard |
| `/profile/edit` | `EditProviderProfilePage` | approved provider | provider | profile settings |
| `/visibility` | `VisibilityPage` | approved provider | provider | paid visibility and area expansion request |
| `/admin` | `AdminDashboardPage` | admin | admin | admin overview |
| `/admin/applications` | `ApplicationsPage` | admin | admin | provider application review |
| `/admin/providers` | `ProvidersPage` | admin | admin | provider/account moderation |
| `/admin/professions` | `ProfessionsPage` | admin | admin | profession management |
| `/admin/visibility` | `VisibilityRequestsPage` | admin | admin | paid visibility moderation |
| `/admin/reports` | `ReportsPage` | admin | admin | abuse report moderation |
| `/admin/actions` | `AuditLogPage` | admin | admin | audit log |
| `*` | `Navigate to /` | fallback | all | unknown route fallback |
