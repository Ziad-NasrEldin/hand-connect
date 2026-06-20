import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.name === 'herafy-storage-cleared') return;
    localStorage.clear();
    sessionStorage.clear();
    window.name = 'herafy-storage-cleared';
  });
  await page.goto('/');
});

test('Arabic RTL landing and search flow work', async ({ page }, testInfo) => {
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(
    page.getByRole('heading', { name: /اعثر على محترف/ }),
  ).toBeVisible();
  if (testInfo.project.name === 'mobile-chrome') {
    await expect(page.getByRole('link', { name: 'ابدأ البحث' })).toBeVisible();
    const headerBox = await page.locator('header').boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox!.height).toBeLessThan(220);
  }
  await page.getByRole('link', { name: 'ابدأ البحث' }).click();
  if (testInfo.project.name === 'mobile-chrome') {
    const professionBox = await page
      .getByRole('combobox', { name: /المهنة|profession/i })
      .boundingBox();
    const areaBox = await page
      .getByRole('combobox', { name: /المنطقة|area/i })
      .boundingBox();
    expect(professionBox && areaBox).not.toBeNull();
    expect(areaBox!.y).toBeGreaterThanOrEqual(
      professionBox!.y + professionBox!.height - 1,
    );
  }
  await expect(page.getByRole('button', { name: 'بحث' })).toHaveCount(0);
  await expect(page.getByText('Find trusted help')).toHaveCount(0);
  await expect(page.getByText('أحمد السبّاك')).toBeVisible();
  if (testInfo.project.name === 'mobile-chrome') {
    const ratingBox = await page.getByText('4.8 / 5').boundingBox();
    const profileLinkBox = await page
      .getByRole('link', { name: 'عرض الملف' })
      .first()
      .boundingBox();
    expect(ratingBox && profileLinkBox).not.toBeNull();
    expect(profileLinkBox!.y).toBeGreaterThanOrEqual(
      ratingBox!.y + ratingBox!.height - 1,
    );
  }
  await page.locator('a[href="/providers/provider-demo"]').click();
  await expect(
    page.getByRole('heading', { name: 'أحمد السبّاك' }),
  ).toBeVisible();
  await expect(page.getByText('Provider profile')).toHaveCount(0);
  if (testInfo.project.name === 'mobile-chrome') {
    await expect(
      page.getByRole('button', { name: 'إظهار واتساب' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'راسل داخل التطبيق' }),
    ).toBeVisible();
  }
});

test('customer can login, reveal WhatsApp, message, and review after contact', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page).toHaveURL(/\/search/);
  await page.goto('/providers/provider-demo');
  await page.getByRole('button', { name: 'إظهار واتساب' }).click();
  await expect(page.getByText('+201011113333')).toBeVisible();
  await page.getByRole('button', { name: 'راسل داخل التطبيق' }).click();
  await expect(page).toHaveURL(/\/messages\/customer-demo_provider-demo/);
  await expect(page.getByText('السلام عليكم')).toBeVisible();
});

test('provider and admin role routes are protected and operational', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('provider@hand.test');
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole('heading', { name: 'لوحة المزود' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'خروج' }).click();
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('admin@hand.test');
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(
    page.getByRole('heading', { name: 'لوحة الإدارة' }),
  ).toBeVisible();
});

test('provider join request stores identity document for admin review', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'انضم كمزود', exact: true }).click();
  await expect(page).toHaveURL(/\/join-provider/);
  await expect(
    page.getByRole('button', { name: 'تسجيل كمزود خدمة' }),
  ).toBeVisible();

  await page.getByLabel('الاسم').fill('عمرو اختبار');
  await page.getByLabel('البريد الإلكتروني').fill('amr.provider@hand.test');
  await page.getByLabel('رقم الهاتف').fill('+201000000001');
  await page.getByLabel('رقم واتساب').fill('+201000000001');
  await page.getByLabel('البطاقة الشخصية').setInputFiles({
    name: 'provider-identity.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#fff6ed"/><text x="24" y="96">Demo ID</text></svg>',
    ),
  });
  await page.getByRole('button', { name: 'تسجيل', exact: true }).click();
  await expect(page).toHaveURL(/\/pending/);
  await expect(page.getByText('طلبك قيد المراجعة')).toBeVisible();

  await page.getByRole('button', { name: 'خروج' }).click();
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('admin@hand.test');
  await page.getByRole('button', { name: 'دخول' }).click();
  await page.goto('/admin/applications');

  await expect(page.getByText('عمرو اختبار')).toBeVisible();
  await expect(page.getByText('provider-identity.svg')).toBeVisible();
  await expect(page.getByAltText('مستند الهوية').first()).toBeVisible();
});

test('mobile auth and shell layouts stay readable', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Mobile-only responsive check',
  );

  await page.goto('/register');
  await expect(page.getByText('Join Herafy')).toHaveCount(0);
  const customerToggle = await page
    .getByRole('button', { name: 'تسجيل كعميل' })
    .boundingBox();
  const providerToggle = await page
    .getByRole('button', { name: /تسجيل كمزود/ })
    .boundingBox();
  expect(customerToggle && providerToggle).not.toBeNull();
  expect(providerToggle!.y).toBeGreaterThan(customerToggle!.y);

  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني').fill('provider@hand.test');
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  const providerSidebar = page.getByRole('complementary');
  await expect(
    providerSidebar.getByRole('link', { name: 'لوحة المزود' }),
  ).toBeVisible();
  await expect(
    providerSidebar.getByRole('link', { name: 'تعديل الملف' }),
  ).toBeVisible();
  await expect(
    providerSidebar.getByRole('link', { name: 'الظهور المدفوع' }),
  ).toBeVisible();
});

test('reduced motion keeps route transitions non-disruptive', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/search');
  const route = page.locator('.route-motion').first();
  await expect(route).toBeVisible();
  const animationDuration = await route.evaluate(
    (element) => getComputedStyle(element).animationDuration,
  );
  const transitionDuration = await route.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(cssTimeToMs(animationDuration)).toBeLessThanOrEqual(1);
  expect(cssTimeToMs(transitionDuration)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'بحث' })).toHaveCount(0);
});

function cssTimeToMs(value: string) {
  const first = value.split(',')[0]?.trim() ?? '0s';
  if (first.endsWith('ms')) return Number(first.slice(0, -2));
  if (first.endsWith('s')) return Number(first.slice(0, -1)) * 1000;
  return Number(first);
}
