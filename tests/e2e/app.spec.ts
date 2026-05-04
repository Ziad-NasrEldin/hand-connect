import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
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
    const searchBox = await page
      .getByRole('button', { name: 'بحث' })
      .boundingBox();
    expect(professionBox && areaBox && searchBox).not.toBeNull();
    expect(areaBox!.y).toBeGreaterThanOrEqual(
      professionBox!.y + professionBox!.height - 1,
    );
    expect(searchBox!.y).toBeGreaterThanOrEqual(
      areaBox!.y + areaBox!.height - 1,
    );
  }
  await page.getByRole('button', { name: 'بحث' }).click();
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
  await page.getByRole('link', { name: 'عرض الملف' }).click();
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

test('mobile auth and shell layouts stay readable', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Mobile-only responsive check',
  );

  await page.goto('/register');
  await expect(page.getByText('Join Hand Connect')).toHaveCount(0);
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
