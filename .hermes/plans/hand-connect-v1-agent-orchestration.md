# Hand Connect / Herafy v1 Agent Orchestration

## Operating Model

Use one coordinator and multiple vertical-slice subagents. The coordinator owns shared contracts, tracker updates, final integration, and final verification. Subagents own isolated slices and return changed files, verification proof, assumptions, and risks.

## Coordination Rules

1. No two agents edit the same file at the same time.
2. Shared contracts and types require coordinator approval.
3. `firestore.rules` is owned by the security/rules agent.
4. Every implementation slice must include tests or explicit smoke proof.
5. Every slice must update the tracker before being marked complete.
6. If product behavior is ambiguous, stop and report instead of guessing.
7. A review agent should inspect completed slices before final release.

## High-Conflict Files

| File/Area | Owner |
|---|---|
| `src/services/contracts/*` | Coordinator |
| `src/types/*` | Coordinator |
| `firestore.rules` | Security agent |
| `tests/rules/firestore.rules.test.ts` | Security agent |
| `functions/src/index.ts` | Backend coordinator |
| `src/firebase/converters.ts` | Backend coordinator |
| `src/i18n/*` | Frontend coordinator |
| `src/services/firebase/admin.firebase.ts` | Admin/visibility coordination required |
| `docs/plans/*` | Coordinator |

## Agent Roles

| Agent | Scope | Primary Tasks |
|---|---|---|
| Coordinator | Decisions, tracker, shared contracts, integration, release gate | 0.1, 0.2, 4.2, 10.2 |
| Backend/Firebase | Firebase parity, callable functions, indexes | 1.1, 1.2, 1.4 |
| Security/Rules | Firestore rules, bans, rate limits | 1.3, 7.2, 8.1 |
| Reviews/Reputation | Callable reviews, aggregates, review reports | 4.1, 4.3 |
| Visibility | Paid visibility, area expansion, ranking cap | 6.1-6.4 |
| Contact/WhatsApp | WhatsApp visibility/redirect, contact counting | 3.1-3.3 |
| Admin Operations | Professions, reports, audit | 7.1, 7.3, 7.4 |
| Auth | Password registration, Google OAuth, phone deferral | 2.1-2.3 |
| Dashboard | Response metrics, reviews summary | 5.1, 5.2 |
| UX/Search | Search resilience, result limits, customer journey | 9.1-9.3 |
| QA/Review | E2E smoke, independent review | 10.1, review slices |

## Parallel Batches

### Batch 0 — Coordination Only

- Coordinator records decisions and tracker.
- No parallel implementation until tracker exists.

### Batch 1 — Backend-Critical Slices

Can run in parallel after Batch 0:

- Backend/Firebase: Firebase parity and callable scaffolding.
- Reviews: review aggregate correctness.
- Visibility: Firebase visibility request and admin processing.
- Contact/WhatsApp: WhatsApp visibility and redirect.

### Batch 2 — Admin, Security, Dashboard

Can run after Batch 1 contracts stabilize:

- Security: rules, bans, rate limits.
- Admin: professions, reports, audit.
- Dashboard: response metrics and review summary.
- Visibility: area expansion and paid expiry.

### Batch 3 — Auth, UX, QA

- Auth: registration password and Google OAuth.
- UX/Search: invalid params, limits, under-60-second flow.
- QA: E2E smoke tests.

### Batch 4 — Final Integration

- Coordinator resolves conflicts.
- QA reviews integrated behavior.
- Full release gate runs.

## Subagent Prompt Template

```md
You are working on Hand Connect / Herafy v1.

Task IDs:
[IDs]

Goal:
[One paragraph]

Allowed files:
[Exact files/directories]

Do not edit:
- `src/services/contracts/*` unless explicitly assigned
- `src/types/*` unless explicitly assigned
- `firestore.rules` unless you are the security agent
- unrelated files

Implementation requirements:
- Preserve PRD scope.
- Do not add booking, scheduling, service payments, escrow, job tracking, certifications, multi-city behavior, or native-only features.
- Keep Firebase and demo behavior aligned where applicable.
- Add or update tests.
- Return changed files, verification commands, results, and risks.

Verification required:
[Exact commands/browser/API checks]

Completion criteria:
[Acceptance criteria]
```

## First Recommended Batch

1. Reviews/Reputation: fix aggregate correctness first because it affects trust and ranking.
2. Paid Visibility: current UI exists but Firebase backend is missing.
3. Contact/WhatsApp: core customer contact journey.
4. Admin Operations: professions/reports/audit readiness.

Keep one coordinator active while those slices run.
