# Herafy — App Privacy Questionnaire Draft

This is a draft for App Store Connect App Privacy. Confirm against the final production build, privacy policy, analytics stack, and Firebase configuration before submission.

## Data collected

### Contact Info
Likely collected:

- Name
- Email address
- Phone number, if used for WhatsApp/contact/provider profile flows

Purpose:

- App functionality
- Account management
- User-to-provider contact

Linked to user: Yes.

### User Content
Likely collected:

- Messages
- Reviews
- Provider profile details
- Provider identity/application information
- Uploaded provider/profile images, if enabled
- Abuse reports

Purpose:

- App functionality
- Safety/moderation
- Provider verification

Linked to user: Yes.

### Identifiers
Likely collected:

- Firebase Auth user ID
- Device/session identifiers created by Firebase SDKs, if enabled by final configuration

Purpose:

- App functionality
- Authentication
- Security/fraud prevention

Linked to user: Yes, for Auth UID.

### Diagnostics
Possible depending on final Firebase/hosting setup:

- Crash data: TODO confirm if Crashlytics is included. Current codebase does not appear to include Crashlytics.
- Performance diagnostics: TODO confirm.

## Data not used for tracking
Draft answer: Herafy should not use collected data for third-party advertising or cross-app tracking unless a new analytics/ads SDK is added.

## Sensitive data
Provider identity documents or identity-preview metadata may be collected for verification. Treat as sensitive user content. Confirm exact storage path/fallback behavior before privacy submission.

## User-generated content controls
- Message/content reporting exists.
- Admin review queue exists.
- Review eligibility is contact-based.

## Required public docs before submission
- Privacy policy URL: TODO
- Support URL: TODO
- Account deletion/help instructions: TODO, if not in-app.

## Final verification before answering App Privacy
Run and inspect:

```bash
npm run lint
npm run build
npm run test:rules
NODE_ENV=test npm test
npm ls firebase
```

Also confirm no analytics, ads, crash, or tracking SDK was added after this draft.
