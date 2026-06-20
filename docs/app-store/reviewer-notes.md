# Herafy — App Review Notes Draft

## App summary
Herafy is a Cairo home-services directory and connection layer. Customers search for verified providers, view profiles, start contact, message providers, and submit reviews after contact.

## Important reviewer note
Herafy does not sell services in-app, process payments, assign providers, set prices, employ providers, or guarantee service outcomes. It helps users discover and contact providers directly.

## Moderation and safety
- Provider applications can be reviewed by an admin before public visibility.
- Users can report messages/content.
- Admins can review reports and take moderation action.
- Reviews are limited to users with a recorded contact.

## Test account
TODO: provide reviewer test credentials after Apple/App Store Connect setup.

Suggested accounts:

- Customer reviewer account: TODO
- Provider reviewer account: TODO
- Admin reviewer account: TODO, if admin console is included in iOS review flow

## Backend environment
Current iOS build uses Firebase project aliases configured in repo. Confirm final TestFlight target before submission:

- Staging/production Firebase decision: TODO
- Bundle ID: `com.herafy-eg.app`

## Native permissions
The app includes camera/photo-library usage strings for provider identity/profile photo upload flows.

## Known review caveats before submission
- Public privacy policy URL required.
- Public support URL required.
- Apple Developer signing and TestFlight upload still required.
- Real-device/TestFlight smoke test still required before submitting for review.
