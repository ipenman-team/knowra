import { expect, test } from '@playwright/test';

test('landing nav routes to dedicated pages and keeps active state', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('section#product-focus')).toBeVisible();
  await expect(page.locator('section#pain-points')).toBeVisible();
  await expect(page.locator('section#entry-loop')).toBeVisible();
  await expect(page.locator('section#core-capabilities')).toBeVisible();
  await expect(page.locator('section#scene-showcase')).toBeVisible();
  await expect(page.getByRole('link', { name: '产品重点' })).toHaveClass(/bg-blue-50/);

  await page.locator('header a[href=\"/architecture\"]').first().click();
  await expect(page).toHaveURL('/architecture');
  await expect(page.locator('section#architecture')).toBeVisible();

  await page.locator('header a[href=\"/security\"]').first().click();
  await expect(page).toHaveURL('/security');
  await expect(page.locator('section#security')).toBeVisible();

  await page.locator('header a[href=\"/pricing\"]').first().click();
  await expect(page).toHaveURL('/pricing');
  await expect(page.locator('section#pricing')).toBeVisible();

  await page.locator('header a[href=\"/contact\"]').first().click();
  await expect(page).toHaveURL('/contact');
  await expect(page.locator('section#contact')).toBeVisible();
});

test('landing hides EN switch and cta routes to login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'EN' })).toHaveCount(0);

  await page.locator('section#product-focus').getByRole('link', { name: '免费开始' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
});

test('scene section loads screenshot image and supports placeholder fallback path', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('section#product-focus [aria-roledescription=\"carousel\"]')).toBeVisible();

  const heroImage = page.locator('section#product-focus img[alt=\"Knowra AI conversation using internet-only mode\"]');
  await expect(heroImage).toBeVisible();
  await expect(heroImage).toHaveAttribute('src', /landing%2F(scenes|placeholders)%2Fai-question-internet/);

  const sceneImage = page.locator(
    'section#scene-showcase img[alt=\"Knowra AI conversation with all knowledge bases enabled\"]',
  );
  await expect(sceneImage).toBeVisible();
  await expect(sceneImage).toHaveAttribute('src', /landing%2F(scenes|placeholders)%2Fai-search-all-knowledge/);
});

test('pricing page shows annual plans and comparison table', async ({ page }) => {
  await page.goto('/pricing');

  await expect(page.getByText('¥0')).toBeVisible();
  await expect(page.getByText('¥99/年')).toBeVisible();
  await expect(page.getByText('¥99/人/年')).toBeVisible();
  await expect(page.getByText('付费套餐按年订阅，支持按席位扩展')).toBeVisible();

  const proCard = page.locator('section#pricing article').filter({ hasText: 'Pro' });
  await expect(proCard.getByText('空间共享高级设置')).toBeVisible();
  await expect(page.getByRole('cell', { name: '空间共享高级设置' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '团队协作成员管理' })).toBeVisible();
});

test('contact page includes qr, mailto and enterprise card', async ({ page }) => {
  await page.goto('/contact');

  const qrImage = page.locator('img[alt="Knowra community QR code"]');
  await expect(qrImage).toBeVisible();
  await expect(qrImage).toHaveAttribute('src', /placehold\.co\/360x360/);

  await expect(page.locator('a[href="mailto:support@knowra.ai"]').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '企业合作沟通' })).toBeVisible();
});

test.describe('landing mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobile menu and page width remain usable', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: '导航菜单' })).toBeVisible();

    const overflowWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });

    expect(overflowWidth).toBeLessThanOrEqual(4);
  });
});
