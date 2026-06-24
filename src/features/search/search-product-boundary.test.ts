// @vitest-environment node

import { readFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scanRoots = [
  'api',
  'functions/src',
  'src',
  'firestore.rules',
  'storage.rules',
];

const scannedExtensions = new Set(['.ts', '.tsx', '.json', '.rules']);

const forbiddenBoundaryPatterns = [
  { name: 'booking flow', pattern: /\bbook(?:ing)?\b/i },
  { name: 'scheduling flow', pattern: /\bschedul(?:e|ing)\b/i },
  { name: 'automatic assignment', pattern: /\bauto[-\s]?assign(?:ment)?\b/i },
  { name: 'job assignment', pattern: /\bjob[-\s]?assign(?:ment)?\b/i },
  { name: 'job dispatch', pattern: /\bjob[-\s]?dispatch\b/i },
  { name: 'job tracking', pattern: /\bjob[-\s]?tracking\b/i },
  { name: 'checkout', pattern: /\bcheckout\b/i },
  { name: 'customer payment', pattern: /\bcustomer[-\s]?payment\b/i },
  { name: 'fulfillment tracking', pattern: /\bfulfillment[-\s]?tracking\b/i },
  { name: 'commission charging', pattern: /\bcommission(?:s)?\b/i },
  { name: 'per lead charging', pattern: /\bper[-\s]?lead\b/i },
  { name: 'provider certification', pattern: /\bcertif(?:y|ied|ication|icate)\b/i },
  { name: 'multi-city launch scope', pattern: /\bmulti[-\s]?city\b/i },
  { name: 'escrow custody', pattern: /\bescrow\b|\bcustody\b/i },
  { name: 'native app scope', pattern: /\bnative[-\s]app\b/i },
];

const forbiddenReviewReplyPatterns = [
  { name: 'review reply API', pattern: /\breplyToReview\b/i },
  { name: 'provider reply field', pattern: /\bproviderReply\b/i },
  { name: 'review reply field', pattern: /\breviewReply\b/i },
  { name: 'reply text field', pattern: /\breplyText\b/i },
];

const reviewNoReplyFiles = [
  'src/types/review.ts',
  'src/services/contracts/reviews.contract.ts',
  'src/services/reviews.service.ts',
  'src/features/providers/pages/provider-profile-page.tsx',
];

const allowedBoundaryMentions = [
  {
    file: 'src/i18n/locales/en.json',
    pattern: /\bno commissions\b/i,
    reason: 'Customer-facing out-of-scope disclosure.',
  },
  {
    file: 'src/i18n/locales/en.json',
    pattern: /\bnot a skill certificate\b/i,
    reason: 'Provider-facing disclaimer that certification is out of scope.',
  },
  {
    file: 'src/i18n/locales/ar.json',
    pattern: /تأجيل الموعد/,
    reason: 'Abuse-report reason for post-contact behavior, not platform scheduling.',
  },
  {
    file: 'src/i18n/locales/en.json',
    pattern: /\brepeated rescheduling after contact\b/i,
    reason: 'Abuse-report reason for post-contact behavior, not platform scheduling.',
  },
  {
    file: 'src/lib/display.ts',
    pattern: /\bcustomer reported repeated rescheduling after contact\b/i,
    reason: 'Translation mapping for abuse-report reason.',
  },
  {
    file: 'src/lib/display.test.ts',
    pattern: /\bCustomer reported repeated rescheduling after contact\b/i,
    reason: 'Translation regression for abuse-report reason.',
  },
  {
    file: 'src/services/demo/seed-data.ts',
    pattern: /\brepeatedReschedulingAfterContact\b/,
    reason: 'Demo abuse-report fixture.',
  },
];

function isAllowed(file: string, line: string) {
  return allowedBoundaryMentions.some((allowed) => (
    allowed.file === file && allowed.pattern.test(line)
  ));
}

function extensionFor(file: string) {
  if (file.endsWith('.rules')) return '.rules';
  const match = file.match(/\.[^.]+$/);
  return match?.[0] ?? '';
}

function collectFiles(path: string): string[] {
  const fullPath = `${process.cwd()}/${path}`;
  const stat = statSync(fullPath);
  if (stat.isFile()) {
    if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return [];
    return scannedExtensions.has(extensionFor(path)) ? [path] : [];
  }
  return readdirSync(fullPath).flatMap((entry) => collectFiles(`${path}/${entry}`));
}

describe('product boundary guardrails', () => {
  it('does not add booking, scheduling, job-control, customer-payment, commission, or per-lead scope', () => {
    const violations: string[] = [];

    for (const file of scanRoots.flatMap(collectFiles)) {
      const lines = readFileSync(`${process.cwd()}/${file}`, 'utf8').split('\n');
      lines.forEach((line, index) => {
        for (const forbidden of forbiddenBoundaryPatterns) {
          if (forbidden.pattern.test(line) && !isAllowed(file, line)) {
            violations.push(`${file}:${index + 1} ${forbidden.name}: ${line.trim()}`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('keeps provider review replies out of the customer and review API surface', () => {
    const violations: string[] = [];

    for (const file of reviewNoReplyFiles) {
      const lines = readFileSync(`${process.cwd()}/${file}`, 'utf8').split('\n');
      lines.forEach((line, index) => {
        for (const forbidden of forbiddenReviewReplyPatterns) {
          if (forbidden.pattern.test(line)) {
            violations.push(`${file}:${index + 1} ${forbidden.name}: ${line.trim()}`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
