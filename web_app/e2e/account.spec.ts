import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { TEST_USER, uniqueEmail } from './fixtures.ts';

// B-01 B4 + B7 against the real in-memory API: tour state per account, export, password, delete.
test('tour once per account, replay, export, change password, delete account', async ({ page }, info) => {
  const email = uniqueEmail(`account-${info.project.name}`);
  const newPassword = 'another-garden-password-456';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
  await page.getByLabel('Confirm password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await page.getByRole('button', { name: 'Take the tour' }).click();
  const step = page.getByRole('dialog', { name: 'Capture first' });
  await expect(step).toContainText('Step 1 of 7');
  if (!info.project.use.isMobile) {
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('[role="dialog"]')
      .analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  }
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  // Remembered on the account: a reload doesn't bring the welcome back.
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Welcome to your garden' })).toHaveCount(0);

  await page.goto('/settings/help');
  await page.getByRole('button', { name: 'Replay the tour' }).click();
  await expect(page.getByRole('dialog', { name: 'Capture first' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip tour' }).click();

  await page.goto('/settings/account');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export my data' }).click();
  expect((await download).suggestedFilename()).toMatch(/^niwa-export-\d{4}-\d{2}-\d{2}\.json$/);

  await page.getByLabel('Current password').fill(TEST_USER.password);
  await page.getByLabel('New password').fill(newPassword);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText(/Other devices have been signed out/)).toBeVisible();

  await page.getByRole('button', { name: 'Delete account…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  await dialog.getByLabel('Password').fill(newPassword);
  await dialog.getByRole('button', { name: 'Delete forever' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toContainText('Email or password is incorrect.');
});

test('public pages work signed out', async ({ page }) => {
  await page.goto('/cookies');
  await expect(page.getByRole('heading', { level: 1, name: 'Cookies' })).toBeVisible();
  await page.goto('/licenses');
  await expect(page.getByRole('table', { name: 'Open-source packages' })).toBeVisible();
  await page.goto('/this-does-not-exist');
  await expect(page.getByText('Nothing grows here')).toBeVisible();
  const robots = await page.request.get('/robots.txt');
  expect(await robots.text()).toContain('Disallow: /knowledge');
});
