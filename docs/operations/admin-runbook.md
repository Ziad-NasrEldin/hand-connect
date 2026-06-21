# Herafy Admin Runbook

Admins manually verify provider identity, manage professions, moderate abuse, and confirm paid visibility payments.

- Provider approval confirms identity only; it is not skill certification.
- Paid visibility gives exposure only; it does not guarantee leads, jobs, ranking, or revenue.
- Providers cannot create professions.
- Providers cannot publicly respond to reviews.
- Identity documents must stay private and admin-only.
- Every negative admin action needs a clear reason in the audit log.

## Provider Applications

1. Open `Admin > Applications`.
2. Review the provider profile details and identity document preview/link.
3. Approve only when the identity document is present and readable.
4. Reject unreadable or incomplete applications with a clear reason.

Approval means identity reviewed only. It must not be described as skill certification.

## Professions

1. Open `Admin > Professions`.
2. Create or update the Arabic name, English name, slug, icon, active state, and sort order.
3. Deactivate professions instead of deleting them when hiding them from new search/register flows.

Profession create/update/activate/deactivate actions are recorded in the audit log.

## Visibility Requests

1. Open `Admin > Visibility requests`.
2. Confirm manual payment outside the app before approving paid visibility.
3. Reject requests when payment cannot be matched.
4. For area-expansion requests, approve only after the app has accepted the provider as eligible.

Approval sets paid visibility for standard boost requests. Area-expansion approval adds the requested service area instead.

## Abuse Reports

1. Open `Admin > Reports`.
2. Review the reporter, target type, target label, reason, and current status.
3. For review reports, use `Hide review` when the review should be removed from public display.
4. Use `Resolve report` when no additional moderation action is needed.
5. Use provider account ban/unban from `Admin > Providers` when abuse requires account-level action.

Resolved reports store `resolvedBy`, `resolvedAt`, and `resolutionReason` for auditability.

## Account Bans

1. Open `Admin > Providers`.
2. Use `Ban account` to block a provider user from protected writes and future login/session use.
3. Use `Unban account` only after the moderation issue is resolved.

Banned users are blocked by service checks and Firestore rules from protected writes such as contacts, reports, conversations, reviews, and provider changes.

## Audit Log

1. Open `Admin > Admin actions`.
2. Confirm every admin mutation has a readable target type, action label, reason, target id, and timestamp.
3. Investigate missing or raw action labels before release.

Covered admin mutations include provider approval/rejection/suspension, visibility approval/rejection, report resolution, review hiding, account ban/unban, and profession management.

## Release Check

Run the full release gate before deployment:

```bash
npm run release:check
```

This runs lint, the full Vitest suite, Firestore/Storage rules tests, build, and Playwright E2E. Known non-blocking build warnings may appear for the auth service dynamic/static import and large bundle size.
