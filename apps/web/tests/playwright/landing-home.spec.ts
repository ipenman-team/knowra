import { expect, test } from '@playwright/test';

test('landing nav uses dedicated pages with locale persistence', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section#positioning')).toBeVisible();
  await expect(page.locator('section#pain-points')).toBeVisible();
  await expect(page.locator('section#usage-flow')).toBeVisible();
  await expect(page.getByRole('link', { name: '产品定位' })).toHaveClass(/h-11/);

  await page.getByRole('link', { name: '架构' }).click();
  await expect(page).toHaveURL(/\/architecture\?lang=zh$/);
  await expect(page.locator('section#architecture')).toBeVisible();

  await page.getByRole('link', { name: '安全' }).click();
  await expect(page).toHaveURL(/\/security\?lang=zh$/);
  await expect(page.locator('section#security')).toBeVisible();

  await page.getByRole('link', { name: '定价' }).click();
  await expect(page).toHaveURL(/\/pricing\?lang=zh$/);
  await expect(page.locator('section#pricing')).toBeVisible();

  await page.getByRole('link', { name: '联系官方' }).click();
  await expect(page).toHaveURL(/\/contact\?lang=zh$/);
  await expect(page.locator('section#contact')).toBeVisible();
});

test('landing locale switch is independent and switches to English', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'EN' }).click();

  await expect(page).toHaveURL(/\?lang=en$/);
  await expect(page.getByRole('heading', { name: 'An Intelligent Knowledge Base That Closes Work Faster' })).toBeVisible();

  await page.getByRole('link', { name: 'Pricing' }).click();
  await expect(page).toHaveURL(/\/pricing\?lang=en$/);
  await expect(page.getByText('¥468/year')).toBeVisible();
});

test('pricing page shows annual plans, card benefits and comparison table', async ({ page }) => {
  await page.goto('/pricing?lang=zh');

  await expect(page.getByText('¥0')).toBeVisible();
  await expect(page.getByText('¥99/年')).toBeVisible();
  await expect(page.getByText('¥99/人/年')).toBeVisible();
  await expect(page.getByText('付费套餐按年订阅，支持按席位扩展。')).toBeVisible();

  const proCard = page.locator('section#pricing article').filter({ hasText: 'Pro' });
  await expect(proCard.getByText('空间共享高级设置')).toBeVisible();

  await expect(page.getByRole('cell', { name: '空间共享高级设置' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '团队协作成员管理' })).toBeVisible();
});

test('landing cta routes to login', async ({ page }) => {
  await page.goto('/');
  await page.locator('section#hero').getByRole('link', { name: '开始使用' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/pricing?lang=zh');
  const proCard = page.locator('section#pricing article').filter({ hasText: 'Pro' });
  await proCard.getByRole('link', { name: '升级到 Pro' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('contact page includes qr, mailto and centered footer', async ({ page }) => {
  await page.goto('/contact?lang=zh');

  const qrImage = page.locator('img[alt="Knowra community QR code"]');
  await expect(qrImage).toBeVisible();
  await expect(qrImage).toHaveAttribute('src', /placehold\.co\/360x360/);

  await expect(page.locator('a[href="mailto:support@knowra.ai"]')).toBeVisible();
  await expect(page.locator('footer > div')).toHaveClass(/text-center/);
});

test.describe('landing mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pricing page keeps content readable on mobile', async ({ page }) => {
    await page.goto('/pricing?lang=zh');

    const overflowWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });

    expect(overflowWidth).toBeLessThanOrEqual(4);
    await expect(page.locator('section#pricing')).toBeVisible();
  });
});
