# Herafy / Hand Connect Feature List

This feature list merges the Product & Platform Overview, Ranking & Visibility Principles, Monetization Strategy, and PRD into the actual implementation scope for Herafy / Hand Connect v1.

## 1. Authentication

- Email and/or phone login.
- OAuth login.
- Require login before contacting providers.
- Role support: customer, provider, admin.

## 2. Customer Search & Discovery

- Search providers by profession.
- Search by customer-selected or current location.
- Show nearby providers based on service area and coverage radius.
- Directory-first browsing: users choose who to contact.
- Fast, mobile-first search experience.

## 3. Provider Profiles

- Provider profile with:
  - name
  - profession
  - service area
  - coverage radius
  - photos
  - basic information
  - rating
  - reviews
  - contact options
- Hide profiles until admin approval.
- Keep providers independent; the platform does not control pricing, work, or fulfillment.

## 4. Contact System

- In-app text chat.
- Optional WhatsApp redirection.
- Count WhatsApp reveal as a contact.
- Count chat initiation as a contact.
- No booking, scheduling, confirmation, payment, or job tracking.

## 5. Reviews & Reputation

- Reviews allowed only after contact.
- One review per contact.
- Providers cannot publicly reply to reviews.
- Reviews affect reputation and visibility.
- Store ratings and reviews on provider profiles.

## 6. Ranking & Visibility

- Weighted ranking using:
  - distance / location relevance
  - reviews / reputation
  - provider activity / responsiveness
  - paid visibility
  - geographic fairness
- Dynamic recalculation from current signals.
- No single factor guarantees top placement.
- Providers cannot negotiate placement.
- Exact ranking formula stays hidden; high-level factors may be shown.

## 7. Paid Visibility

- Optional paid visibility boosts.
- No separate paid visibility cap policy.
- Paid listings are clearly labeled.
- Payment does not guarantee leads, jobs, or top placement.
- High-quality organic providers can outrank paid providers.
- Free providers remain visible.

## 8. Geographic Expansion

- Provider starts with one service area.
- Additional service areas require:
  - reputation and activity gate
  - minimum review threshold; PRD target is 30 reviews
  - recurring fee
  - admin approval if needed

## 9. Provider Dashboard

- Show:
  - profile views
  - contacts received
  - response behavior
  - reviews and ratings
  - paid visibility / coverage controls
- Do not expose ranking logic.

## 10. Admin Panel

- Approve or reject provider applications.
- Manual provider identity verification.
- Manage reviews.
- Flag abuse.
- Ban or suspend accounts.
- Manage professions.
- Manage platform policies.
- Manage pricing tiers, visibility caps, and paid products.
- Log all admin actions.

## 11. Trust, Safety & Abuse Prevention

- Manual identity verification.
- Abuse and dispute handling.
- Detect and enforce against:
  - fake reviews
  - coordinated reviews
  - artificial activity signals
  - location spoofing
  - duplicate or linked accounts
- Penalties may include:
  - ranking penalty
  - loss of paid benefits
  - suspension or removal
- Basic rate limiting.

## 12. Analytics & Tracking

- Track:
  - provider profile views
  - contacts
  - WhatsApp reveals
  - chat initiations
  - response behavior
  - reviews
  - ranking / visibility signals
  - admin actions
  - paid visibility usage

## 13. Monetization

- Monetize provider visibility, not transactions.
- No customer charges.
- No job commissions.
- No per-lead charges.
- No payment processing between customers and providers.
- Simple transparent recurring tiers.
- Equal pricing visibility for providers.
- No hidden fees.
- Providers are never forced to pay to remain listed.

## 14. Platform Requirements

- Mobile-responsive web UI.
- Fast search performance.
- Stable admin operations.
- High availability during peak hours.
- Clear product boundaries.

## Explicitly Out of Scope

- Booking or scheduling.
- Service payments.
- Escrow.
- Guarantees.
- Job assignment.
- Job tracking.
- Provider certifications.
- Multi-city support for v1.
- Native mobile apps for v1.
