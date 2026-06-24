// @vitest-environment node

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboardSource = () =>
  readFileSync(
    `${process.cwd()}/src/features/dashboard/pages/provider-dashboard-page.tsx`,
    'utf8',
  );

const visibilitySources = () =>
  [
    'src/features/dashboard/pages/visibility-page.tsx',
    'src/features/admin/pages/visibility-requests-page.tsx',
  ]
    .map((file) => readFileSync(`${process.cwd()}/${file}`, 'utf8'))
    .join('\n');

describe('dashboard and visibility admin surface boundaries', () => {
  it('keeps ranking guidance qualitative and hides formula internals', () => {
    const source = dashboardSource();

    expect(source).toContain('dashboard.rankingGuidance');
    expect(source).toContain('dashboard.noPlacementGuarantee');
    expect(source).not.toMatch(/providerRankingScore|locationScore|paidBonus|activityScore\s*[*+]/);
  });

  it('shows paid product, payment, disclosure, and rejection context from visibility requests', () => {
    const source = visibilitySources();

    expect(source).toContain('productSnapshot');
    expect(source).toContain('paymentStatus');
    expect(source).toContain('paymentMethod');
    expect(source).toContain('disclosureVersion');
    expect(source).toContain('rejectionReason');
  });
});
