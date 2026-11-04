import { expect, test } from '@playwright/test';

/**
 * The landing page's playground (NIWA-PLAN-B-02 V11): the real app on an in-memory example garden.
 * It must work without an account and without a single API request.
 */
test('try NIWA on the landing page: tick, capture, switch lens and theme — all offline', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).pathname.startsWith('/api/') && r.frame() !== page.mainFrame())
      apiCalls.push(r.url());
  });

  await page.goto('/');
  const region = page.getByRole('region', { name: 'Interactive example' });
  await region.scrollIntoViewIfNeeded();
  const app = page.frameLocator('iframe[title^="NIWA with an example garden"]');

  // Tick a task in Focus: it's marked done and leaves the open sections.
  await expect(app.getByRole('heading', { name: 'Focus' })).toBeVisible({ timeout: 20_000 });
  await app.getByRole('checkbox', { name: 'Complete Book the train tickets' }).click();
  await expect(app.getByText('Completed “Book the train tickets”')).toBeVisible();
  await expect(app.getByRole('region', { name: 'Overdue' })).toHaveCount(0);

  // Capture an idea; it lands in the Inbox.
  await app.locator('body').press('c');
  const dialog = app.getByRole('dialog');
  await dialog.getByLabel('Capture title').fill('Plant tulips in autumn');
  await dialog.getByRole('button', { name: 'Capture', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await app.getByRole('link', { name: /Inbox/ }).first().click();
  await expect(app.getByRole('list', { name: 'Inbox items' })).toContainText('Plant tulips in autumn');

  // Switch lens.
  await app.getByRole('link', { name: 'Knowledge' }).first().click();
  await expect(app.getByRole('tree', { name: 'Knowledge items' })).toBeVisible();

  // Customise: only the preview changes.
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole('radio', { name: 'Lavender' }).click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(app.locator('html')).toHaveAttribute('data-dark', '');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(before);

  // Start fresh: the example comes back.
  await region.getByRole('button', { name: 'Start fresh' }).click();
  await expect(app.getByRole('checkbox', { name: 'Complete Book the train tickets' })).toBeVisible({
    timeout: 20_000,
  });

  expect(apiCalls).toEqual([]);
});
